import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { CVContent } from '../types/cv-content'
import { VacancyProfile, GenerateCVResult } from '../types/pipeline'
import { prepareUserData } from '../data/prepare-user-data'
import { getWritingConfig, isValidStyleId } from '../styles/index'
import { buildGenerateCVPrompt } from '../prompts/generate-cv'
import { buildAnalyzeVacancyPrompt, parseVacancyResponse } from '../prompts/analyze-vacancy'
import { parseAndValidate } from '../validation/structure'
import { runAntiHallucinationCheck } from '../validation/anti-hallucination'
import { splitSkills } from '../../skill-classification'
import { enforceIdiomaLevels } from '../enforce-idiomas'

const SONNET_MODEL   = 'claude-sonnet-4-6'
const HAIKU_MODEL    = 'claude-haiku-4-5-20251001'
const MAX_TOKENS     = 4000
const MAX_RETRIES    = 1

export async function runVacancyPipeline(
  userId: string,
  styleId: string,
  vacancyText: string,
  supabase: SupabaseClient,
  anthropic: Anthropic
): Promise<GenerateCVResult & { vacancyProfile: VacancyProfile; matchPorcentaje: number | null }> {

  // ── 1. Validate style ────────────────────────────────────────────────────
  if (!isValidStyleId(styleId)) {
    throw new Error(`Invalid style ID: "${styleId}"`)
  }

  if (!vacancyText || vacancyText.trim().length < 50) {
    throw new Error('Vacancy description is too short or empty')
  }

  // ── 2. Fetch user data + analyze vacancy in parallel ─────────────────────
  const [userData, vacancyProfile] = await Promise.all([
    prepareUserData(userId, supabase),
    analyzeVacancy(vacancyText, anthropic),
  ])

  // ── 3. Build generation prompt with vacancy profile ───────────────────────
  const writing = getWritingConfig(styleId)
  const { system, user } = buildGenerateCVPrompt(userData, writing, vacancyProfile)

  // ── 4. Generate CV with Sonnet + retry ────────────────────────────────────
  let content: CVContent | null = null
  let lastErrors: string[] = []

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await anthropic.messages.create({
      model: SONNET_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const { parsed, result } = parseAndValidate(rawText)

    if (!result.valid || !parsed) {
      lastErrors = result.errors
      if (attempt < MAX_RETRIES) continue
      throw new Error(`CV generation failed after ${MAX_RETRIES + 1} attempts. Errors: ${lastErrors.join('; ')}`)
    }

    const hallucinationResult = runAntiHallucinationCheck(parsed, userData)
    if (!hallucinationResult.valid) {
      lastErrors = hallucinationResult.errors
      if (attempt < MAX_RETRIES) continue
      throw new Error(`CV generation failed hallucination check. Errors: ${lastErrors.join('; ')}`)
    }

    content = parsed
    break
  }

  if (!content) {
    throw new Error(`CV generation produced no valid content. Last errors: ${lastErrors.join('; ')}`)
  }

  // ── 4b. Categorize skills (técnica/blanda) using the user's real classification ──
  const { tecnicas, blandas } = splitSkills(content.habilidades, userData.habilidadesTipos)
  content.habilidades_tecnicas = tecnicas
  content.habilidades_blandas = blandas
  enforceIdiomaLevels(content, userData.idiomas)

  // ── 5. Compute match percentage ──────────────────────────────────────────
  const matchPorcentaje = computeMatchScore(content, userData, vacancyProfile)

  // ── 6. Persist to DB ─────────────────────────────────────────────────────
  const titulo = vacancyProfile.cargo_objetivo || content.titulo || null

  const { data: cvRecord, error: insertError } = await supabase
    .from('cvs')
    .insert({
      user_id: userId,
      titulo,
      intencion: 'job',
      estilo: styleId,
      contenido_json: content,
      descripcion_vacante: vacancyText,
      match_porcentaje: matchPorcentaje,
    })
    .select()
    .single()

  if (insertError || !cvRecord) {
    throw new Error(`Failed to save CV to database: ${insertError?.message}`)
  }

  return {
    success: true,
    cv: cvRecord,
    content,
    vacancyProfile,
    matchPorcentaje,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vacancy analysis step — Haiku
// ─────────────────────────────────────────────────────────────────────────────

async function analyzeVacancy(
  vacancyText: string,
  anthropic: Anthropic
): Promise<VacancyProfile> {
  const { system, user } = buildAnalyzeVacancyPrompt(vacancyText)

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 800,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const rawText = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  return parseVacancyResponse(rawText)
}

// ─────────────────────────────────────────────────────────────────────────────
// Match score computation — deterministic, no AI
// ─────────────────────────────────────────────────────────────────────────────

function computeMatchScore(
  cv: CVContent,
  userData: { habilidades: string[]; experiencias: { cargo: string; descripcion: string | null }[] },
  vacancy: VacancyProfile
): number {
  let score = 0
  const maxScore = 100

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  // Build a searchable blob from the CV content
  const cvText = [
    ...cv.habilidades,
    ...cv.experiencias.flatMap(e => [...(e.bullets || []), e.cargo, e.empresa]),
    ...(cv.tech_stack ? Object.values(cv.tech_stack).flat() : []),
    cv.resumen || '',
    cv.resumen_ejecutivo || '',
  ]
    .join(' ')
    .toLowerCase()

  // Required skills match (0–40 points)
  const requiredSkills = vacancy.skills_requeridas
  if (requiredSkills.length > 0) {
    const matched = requiredSkills.filter(skill =>
      cvText.includes(normalize(skill))
    ).length
    score += Math.round((matched / requiredSkills.length) * 40)
  } else {
    score += 20  // no required skills listed — give partial credit
  }

  // ATS keywords match (0–30 points)
  const atsKeywords = vacancy.keywords_ats
  if (atsKeywords.length > 0) {
    const matched = atsKeywords.filter(kw =>
      cvText.includes(normalize(kw))
    ).length
    score += Math.round((matched / atsKeywords.length) * 30)
  } else {
    score += 15
  }

  // Desired skills match (0–15 points)
  const desiredSkills = vacancy.skills_deseadas
  if (desiredSkills.length > 0) {
    const matched = desiredSkills.filter(skill =>
      cvText.includes(normalize(skill))
    ).length
    score += Math.round((matched / desiredSkills.length) * 15)
  } else {
    score += 8
  }

  // Has relevant experience (0–15 points)
  const cargoTarget = normalize(vacancy.cargo_objetivo)
  const industria = normalize(vacancy.industria)
  const expText = userData.experiencias
    .map(e => `${normalize(e.cargo)} ${normalize(e.descripcion || '')}`)
    .join(' ')

  const titleTerms = cargoTarget.split(' ').filter(w => w.length > 3)
  const titleMatch = titleTerms.length > 0
    ? titleTerms.filter(t => expText.includes(t)).length / titleTerms.length
    : 0

  const industryMatch = industria.split(' ').filter(w => w.length > 3)
    .some(t => expText.includes(t)) ? 1 : 0

  score += Math.round((titleMatch * 0.7 + industryMatch * 0.3) * 15)

  return Math.min(Math.max(score, 0), maxScore)
}
