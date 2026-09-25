// Europass generation pipeline: profile → objective data (no AI) → AI writing with
// citations → anti-invention controls → final content. Wiring into the API route and
// the new template is step 4d.

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { anthropicSenseJudge, type SenseJudge } from '@/lib/cv/verify/sense'
import { loadEuropassSource, mapEuropassObjective } from './mapper'
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
  // Vacancy mode: the exact job title of the posting.
  tituloProfesional?: string | null
}): Promise<EuropassGenerationResult> {
  const src = await loadEuropassSource(params.supabase, params.userId)
  const { content, aiSources } = mapEuropassObjective(src, { tituloProfesional: params.tituloProfesional })
  return writeAndVerifyEuropass(content, aiSources, {
    write: async feedback => sanitizeEuropassWriting(await requestEuropassWriting(params.anthropic, aiSources, undefined, feedback), aiSources),
    judge: anthropicSenseJudge(params.anthropic),
  })
}
