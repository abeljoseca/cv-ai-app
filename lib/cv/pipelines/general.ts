import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { CVContent } from '../types/cv-content'
import { GenerateCVResult } from '../types/pipeline'
import { prepareUserData } from '../data/prepare-user-data'
import { getWritingConfig, isValidStyleId } from '../styles/index'
import { buildGenerateCVPrompt } from '../prompts/generate-cv'
import { parseAndValidate } from '../validation/structure'
import { runAntiHallucinationCheck } from '../validation/anti-hallucination'
import { splitSkills } from '../../skill-classification'
import { enforceIdiomaLevels } from '../enforce-idiomas'

const MAX_TOKENS = 4000
const MAX_RETRIES = 1

export async function runGeneralPipeline(
  userId: string,
  styleId: string,
  supabase: SupabaseClient,
  anthropic: Anthropic
): Promise<GenerateCVResult> {

  // ── 1. Validate style ────────────────────────────────────────────────────
  if (!isValidStyleId(styleId)) {
    throw new Error(`Invalid style ID: "${styleId}"`)
  }

  // ── 2. Fetch and clean user data ─────────────────────────────────────────
  const userData = await prepareUserData(userId, supabase)

  // ── 3. Build prompt ──────────────────────────────────────────────────────
  const writing = getWritingConfig(styleId)
  const { system, user } = buildGenerateCVPrompt(userData, writing)

  // ── 4. Call Sonnet with retry ────────────────────────────────────────────
  let content: CVContent | null = null
  let lastErrors: string[] = []

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
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

    // ── 5. Anti-hallucination check ──────────────────────────────────────
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

  // ── 5b. Categorize skills (técnica/blanda) using the user's real classification ──
  const { tecnicas, blandas } = splitSkills(content.habilidades, userData.habilidadesTipos)
  content.habilidades_tecnicas = tecnicas
  content.habilidades_blandas = blandas
  enforceIdiomaLevels(content, userData.idiomas)

  // ── 6. Persist to DB ─────────────────────────────────────────────────────
  const titulo = content.titulo || userData.profesion_perfil || null

  const { data: cvRecord, error: insertError } = await supabase
    .from('cvs')
    .insert({
      user_id: userId,
      titulo,
      intencion: 'general',
      estilo: styleId,
      contenido_json: content,
      descripcion_vacante: null,
      match_porcentaje: null,
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
  }
}
