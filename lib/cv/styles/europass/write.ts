// Europass AI writing step (4b): asks the model for "Sobre mí" + experience bullets with
// source citations, then enforces the structure in code. Content verification (exact
// check, sense check, fallback to the user's own text) is step 4c.

import type Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'
import { detectLanguageFromText } from '@/lib/cv/data/detect-language'
import { EUROPASS_AI_LIMITS } from './contract'
import { EUROPASS_OUTPUT_SCHEMA, EUROPASS_SYSTEM_PROMPT, buildEuropassUserMessage, type EuropassVacancyFocus } from './prompt'
import type { EuropassAISources, EuropassBullet, EuropassContent } from './schema'

// CEO decision 2026-09-25 after a live side-by-side test: Sonnet 5 matched Opus 5 on factual
// accuracy (0 unsupported figures, 0 invalid citations), did not pad bullets, at ~45% of the cost.
export const EUROPASS_WRITER_MODEL = 'claude-sonnet-5'

export interface EuropassRawWriting {
  sobre_mi: { texto: string; fuentes: string[] }
  experiencias: Array<{ ref: string; bullets: Array<{ texto: string; fuentes: string[] }> }>
}

export interface EuropassWriting {
  sobreMi: { texto: string | null; fuentes: string[] }
  // Keyed by experience ref ("exp:<id>")
  bullets: Map<string, EuropassBullet[]>
}

export class EuropassWritingError extends Error {}

export function sourcesLanguage(sources: EuropassAISources): string {
  return detectLanguageFromText([
    sources.resumen?.texto,
    ...sources.experiencias.flatMap(e => [e.cargo, e.descripcion?.texto, ...e.logros.map(l => l.texto)]),
  ].filter(Boolean).join(' '))
}

export async function requestEuropassWriting(
  anthropic: Anthropic,
  sources: EuropassAISources,
  model: string = EUROPASS_WRITER_MODEL,
  feedback?: string,
  focus?: EuropassVacancyFocus,
): Promise<EuropassRawWriting & { usage: Anthropic.Usage }> {
  const response = await anthropic.messages.parse({
    model,
    max_tokens: 16000,
    system: [{ type: 'text', text: EUROPASS_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: buildEuropassUserMessage(sources, sourcesLanguage(sources), feedback, focus) }],
    output_config: { format: jsonSchemaOutputFormat(EUROPASS_OUTPUT_SCHEMA) },
  })
  // A refusal or a truncated answer is a failure, never a partial CV.
  if (response.stop_reason !== 'end_turn' || !response.parsed_output) {
    throw new EuropassWritingError(`Europass writing failed (stop_reason: ${response.stop_reason})`)
  }
  return { ...(response.parsed_output as EuropassRawWriting), usage: response.usage }
}

// Structural guarantees on the model output — pure, tested:
// - only jobs that exist in the sources are accepted;
// - a sentence may only cite refs it is allowed to (its own job's sources; any for Sobre mí);
// - a sentence left with no valid citation is dropped (it can't be traced);
// - at most N bullets per job; blank texts dropped.
export function sanitizeEuropassWriting(raw: EuropassRawWriting, sources: EuropassAISources): EuropassWriting {
  const jobRefs = new Map(sources.experiencias.map(e => [
    e.ref,
    new Set([e.ref, ...(e.descripcion ? [e.descripcion.ref] : []), ...e.logros.map(l => l.ref)]),
  ]))
  const allRefs = new Set<string>([
    ...(sources.resumen ? [sources.resumen.ref] : []),
    ...sources.hechos.map(h => h.ref),
    ...[...jobRefs.values()].flatMap(set => [...set]),
  ])
  const keep = (refs: string[], allowed: Set<string>) => [...new Set(refs.filter(r => allowed.has(r)))]

  const texto = raw.sobre_mi?.texto?.trim() ?? ''
  const sobreMiFuentes = keep(raw.sobre_mi?.fuentes ?? [], allRefs)
  const sobreMi = texto && sobreMiFuentes.length > 0 ? { texto, fuentes: sobreMiFuentes } : { texto: null, fuentes: [] }

  const bullets = new Map<string, EuropassBullet[]>()
  for (const exp of raw.experiencias ?? []) {
    const allowed = jobRefs.get(exp.ref)
    if (!allowed || bullets.has(exp.ref)) continue
    const clean = (exp.bullets ?? []).flatMap(b => {
      const t = b.texto?.trim()
      const f = keep(b.fuentes ?? [], allowed)
      return t && f.length > 0 ? [{ texto: t, _fuentes: f, _origen: 'ia' as const }] : []
    })
    bullets.set(exp.ref, clean.slice(0, EUROPASS_AI_LIMITS.bulletsPorPuesto.max))
  }
  return { sobreMi, bullets }
}

// Places the (verified) writing into the objective content produced by the mapper.
export function applyEuropassWriting(content: EuropassContent, writing: EuropassWriting): EuropassContent {
  return {
    ...content,
    sobre_mi: { texto: writing.sobreMi.texto, _fuentes: writing.sobreMi.fuentes, _origen: writing.sobreMi.texto ? 'ia' : undefined },
    experiencia_laboral: content.experiencia_laboral.map(e => ({ ...e, bullets: writing.bullets.get(`exp:${e._id}`) ?? [] })),
  }
}
