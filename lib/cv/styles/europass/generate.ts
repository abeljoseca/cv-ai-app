// Europass generation pipeline: profile → objective data (no AI) → AI writing with
// citations → anti-invention controls → final content. Persisted by pipeline.ts.

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { anthropicSenseJudge, type SenseJudge } from '@/lib/cv/verify/sense'
import { loadEuropassSource, mapEuropassObjective, type EuropassProfileSource } from './mapper'
import type { EuropassVacancyFocus } from './prompt'
import { applyEuropassWriting, requestEuropassWriting, sanitizeEuropassWriting, type EuropassWriting } from './write'
import { userTextWriting, verifyEuropassWriting, type VerificationReport } from './verify'
import type { EuropassAISources, EuropassContent } from './schema'

export interface EuropassGenerationResult {
  content: EuropassContent
  report: VerificationReport & { escritor_fallo: boolean }
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
  return { content: applyEuropassWriting(content, writing), report: { ...report, escritor_fallo: false } }
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
