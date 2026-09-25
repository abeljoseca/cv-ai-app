// Europass end-to-end: generate (generate.ts) → persist → vacancy match score.
// Called by the shared pipelines (general.ts / vacancy.ts) when the style is 'europass',
// so the API route and its limits stay the same for every style.

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeMatchScoreFromText } from '@/lib/cv/match-score'
import type { GeneratedCVRecord, VacancyProfile } from '@/lib/cv/types/pipeline'
import { generateEuropassContent } from './generate'
import type { EuropassVacancyFocus } from './prompt'
import type { EuropassContent } from './schema'

const MAX_REQUISITOS = 25

// What the writer gets from the posting: its title and requirements, only to prioritise.
export function vacancyFocus(profile: VacancyProfile): EuropassVacancyFocus {
  const requisitos = [...new Set([
    ...profile.skills_requeridas,
    ...profile.responsabilidades,
    ...profile.keywords_ats,
    ...profile.skills_deseadas,
  ].map(s => s?.trim()).filter((s): s is string => !!s))].slice(0, MAX_REQUISITOS)
  return { cargo: profile.cargo_objetivo?.trim() ?? '', requisitos }
}

// Searchable text for the shared, deterministic match score (same fields the other styles
// feed it: skills, jobs, bullets, summary).
export function europassMatchText(c: EuropassContent): string {
  return [
    ...c.competencias_digitales.herramientas,
    ...c.otras_competencias,
    ...c.experiencia_laboral.flatMap(e => [...e.bullets.map(b => b.texto), e.cargo, e.empleador]),
    c.sobre_mi.texto ?? '',
  ].join(' ').toLowerCase()
}

export async function runEuropassPipeline(params: {
  userId: string
  supabase: SupabaseClient
  anthropic: Anthropic
  vacancy?: { text: string; profile: VacancyProfile }
}): Promise<{ success: true; cv: GeneratedCVRecord; content: EuropassContent; matchPorcentaje: number | null }> {
  const { userId, supabase, anthropic, vacancy } = params
  const focus = vacancy ? vacancyFocus(vacancy.profile) : null

  // An empty posting title falls back to the profile's title (mapper), but the
  // requirements still steer the writer.
  const { content, report, source } = await generateEuropassContent({ supabase, anthropic, userId, vacancy: focus })
  // Server log only: how many sentences were approved / replaced by the user's text.
  console.info('[europass] verification', JSON.stringify({ ...report, rechazos: report.rechazos.length }))

  const matchPorcentaje = vacancy
    ? computeMatchScoreFromText(europassMatchText(content), source.experiencias, vacancy.profile)
    : null

  const { data: cvRecord, error } = await supabase
    .from('cvs')
    .insert({
      user_id: userId,
      titulo: content.informacion_personal.titulo_profesional,
      intencion: vacancy ? 'job' : 'general',
      estilo: 'europass',
      contenido_json: content,
      descripcion_vacante: vacancy?.text ?? null,
      match_porcentaje: matchPorcentaje,
    })
    .select()
    .single()

  if (error || !cvRecord) throw new Error(`Failed to save CV to database: ${error?.message}`)

  return { success: true, cv: cvRecord as GeneratedCVRecord, content, matchPorcentaje }
}
