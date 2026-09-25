// Europass generation pipeline: profile → objective data (no AI) → AI writing with
// citations → anti-invention controls → final content. Persisted by pipeline.ts.

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { anthropicSenseJudge, type SenseJudge } from '@/lib/cv/verify/sense'
import { loadEuropassSource, mapEuropassObjective, type EuropassProfileSource } from './mapper'
import type { EuropassVacancyFocus } from './prompt'
import { figures } from '@/lib/cv/verify/exact'
import { applyEuropassWriting, requestEuropassWriting, sanitizeEuropassWriting, type EuropassWriting } from './write'
import { userTextWriting, verifyEuropassWriting, type VerificationReport } from './verify'
import type { EuropassAISources, EuropassContent } from './schema'

export type RepeticionCifras = 'no' | 'corregida' | 'sin_corregir'

export interface EuropassGenerationResult {
  content: EuropassContent
  report: VerificationReport & { escritor_fallo: boolean; sobre_mi_cifras_repetidas?: RepeticionCifras }
}

// CEO decision 2026-09-25: "Sobre mí" gives the overview and the results live in the
// bullets, so a figure already in a bullet is not repeated in "Sobre mí" (a 7% shown three
// times). Code-computed facts (years of experience) are allowed. Returns the repeated figures.
export function repeatedSobreMiFigures(content: EuropassContent, sources: EuropassAISources): string[] {
  const texto = content.sobre_mi.texto
  if (!texto) return []
  const allowed = new Set(sources.hechos.flatMap(h => figures(h.texto)))
  const inBullets = new Set(content.experiencia_laboral.flatMap(e => e.bullets.flatMap(b => figures(b.texto))))
  return [...new Set(figures(texto))].filter(f => inBullets.has(f) && !allowed.has(f))
}

// One targeted rewrite of "Sobre mí" when it repeats bullet figures. The new text must pass
// the same exact + sense checks; if it doesn't (or still repeats), the previous verified
// text is kept — a style rule never makes the CV worse.
async function avoidRepeatedFigures(
  content: EuropassContent,
  sources: EuropassAISources,
  deps: { write: (feedback?: string) => Promise<EuropassWriting>; judge: SenseJudge },
): Promise<{ content: EuropassContent; estado: RepeticionCifras }> {
  if (content.sobre_mi._origen !== 'ia') return { content, estado: 'no' }
  const repeated = repeatedSobreMiFigures(content, sources)
  if (repeated.length === 0) return { content, estado: 'no' }
  try {
    const again = await deps.write(`- "${content.sobre_mi.texto}" → "Sobre mí" repeats figures that already appear in the job bullets (${repeated.join(', ')}). Rewrite only "Sobre mí" without them: specialisation, years of experience and main domains; the results stay in the bullets.`)
    if (!again.sobreMi.texto) return { content, estado: 'sin_corregir' }
    const { writing, report } = await verifyEuropassWriting({
      writing: { sobreMi: again.sobreMi, bullets: new Map() },
      sources, judge: deps.judge,
      rewrite: async () => { throw new Error('single attempt') },
    })
    const candidate: EuropassContent = {
      ...content,
      sobre_mi: { texto: writing.sobreMi.texto, _fuentes: writing.sobreMi.fuentes, _origen: 'ia' },
    }
    if (report.aprobadas === 1 && report.respaldo_usuario === 0 && repeatedSobreMiFigures(candidate, sources).length === 0) {
      return { content: candidate, estado: 'corregida' }
    }
  } catch (err) { console.error('[europass] Sobre mí rewrite failed', err) }
  return { content, estado: 'sin_corregir' }
}

// Testable core: the writer and the judge are injected.
export async function writeAndVerifyEuropass(
  content: EuropassContent,
  sources: EuropassAISources,
  deps: { write: (feedback?: string) => Promise<EuropassWriting>; judge: SenseJudge },
): Promise<EuropassGenerationResult> {
  const hasSource = !!sources.resumen || sources.experiencias.some(e => e.descripcion || e.logros.length > 0)
  if (!hasSource) {
    return { content, report: { aprobadas: 0, respaldo_usuario: 0, descartadas: 0, rechazos: [], escritor_fallo: false } }
  }

  let first: EuropassWriting | null = null
  try { first = await deps.write() } catch (err) { console.error('[europass] writer failed', err) }

  // If the writer itself fails, the CV is still produced — from the user's own text.
  if (!first) {
    const own = userTextWriting(sources)
    const n = (own.sobreMi.texto ? 1 : 0) + [...own.bullets.values()].reduce((k, b) => k + b.length, 0)
    return { content: applyEuropassWriting(content, own), report: { aprobadas: 0, respaldo_usuario: n, descartadas: 0, rechazos: [], escritor_fallo: true } }
  }

  const { writing, report } = await verifyEuropassWriting({ writing: first, sources, judge: deps.judge, rewrite: fb => deps.write(fb) })
  const checked = await avoidRepeatedFigures(applyEuropassWriting(content, writing), sources, deps)
  return { content: checked.content, report: { ...report, escritor_fallo: false, sobre_mi_cifras_repetidas: checked.estado } }
}

export async function generateEuropassContent(params: {
  supabase: SupabaseClient
  anthropic: Anthropic
  userId: string
  // Vacancy mode: the title becomes the posting's exact job title, and the posting steers
  // which facts the writer puts first (never what the facts are).
  vacancy?: EuropassVacancyFocus | null
}): Promise<EuropassGenerationResult & { source: EuropassProfileSource }> {
  const source = await loadEuropassSource(params.supabase, params.userId)
  const focus = params.vacancy ?? undefined
  const { content, aiSources } = mapEuropassObjective(source, { tituloProfesional: focus?.cargo })
  const result = await writeAndVerifyEuropass(content, aiSources, {
    write: async feedback => sanitizeEuropassWriting(await requestEuropassWriting(params.anthropic, aiSources, undefined, feedback, focus), aiSources),
    judge: anthropicSenseJudge(params.anthropic),
  })
  return { ...result, source }
}
