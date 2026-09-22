import { CVUserData } from '../types/user-data'
import { StyleWritingConfig } from '../types/style-config'
import { VacancyProfile } from '../types/pipeline'
import { buildGlobalRules } from './global-rules'

// ─────────────────────────────────────────────────────────────────────────────
// CV Generation prompt builder
// Two modes: general (no vacancy) and job (vacancy profile injected)
// ─────────────────────────────────────────────────────────────────────────────

export function buildGenerateCVPrompt(
  userData: CVUserData,
  writing: StyleWritingConfig,
  vacancyProfile?: VacancyProfile
): { system: string; user: string } {
  const globalRules = buildGlobalRules(userData)
  const mode: 'general' | 'job' = vacancyProfile ? 'job' : 'general'

  const system = buildSystemPrompt(writing, globalRules, mode)
  const user = buildUserMessage(userData, writing, vacancyProfile)

  return { system, user }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt — style instructions + global rules
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(
  writing: StyleWritingConfig,
  globalRules: string,
  mode: 'general' | 'job'
): string {
  const verbList = Object.entries(writing.verbCategories)
    .map(([cat, verbs]) => `  ${cat}: ${verbs.join(', ')}`)
    .join('\n')

  const prohibitionList = writing.prohibitions
    .map((p, i) => `  ${i + 1}. ${p}`)
    .join('\n')

  const vacancySection = mode === 'job'
    ? `\nVACANCY MODE ACTIVE:
- Prioritize bullets and sections that align with the vacancy's required skills and responsibilities.
- Incorporate ATS keywords naturally — do not stuff them unnaturally.
- Use the vacancy's exact job title as the candidate's professional title (line 2 of header).
- Reorder habilidades to surface vacancy-relevant skills first.
- Do NOT invent experience, skills, or achievements to match the vacancy.\n`
    : `\nGENERAL MODE: Create the strongest possible CV from the candidate's actual data.
- Lead with the candidate's most impactful experience and achievements.
- Use profesion_perfil as the professional title if provided.\n`

  return `${globalRules}

=== STYLE: ${writing.id.toUpperCase()} ===

TONE: ${writing.tone}

VOICE AND GRAMMAR: ${writing.voice}

VERB TENSE: ${writing.verbTense}

BULLET FORMULA: ${writing.bulletFormula}
EXAMPLE: ${writing.bulletFormulaExample}

BULLET COUNT RULES: ${writing.bulletCountRule}

APPROVED VERBS BY CATEGORY:
${verbList}

METRICS REQUIREMENTS: ${writing.metricsRule}

METRICS EXAMPLES:
${writing.metricsExamples.map(e => `  - ${e}`).join('\n')}

SUMMARY/PROFILE SECTION: ${writing.summaryRule}

SECTION ORDER: ${writing.sectionOrder.join(' → ')}
MANDATORY SECTIONS: ${writing.mandatorySections.join(', ')}

SECTION FALLBACKS:
${Object.entries(writing.sectionFallbacks).map(([k, v]) => `  ${k}: ${v}`).join('\n\n')}

PROHIBITIONS — violating any of these invalidates the output:
${prohibitionList}
${vacancySection}
=== OUTPUT SCHEMA ===
Return a single JSON object with this exact structure.
Optional fields that have no data MUST be null (not omitted, not empty string).
Empty arrays are allowed — null is not allowed for array fields.

{
  "nombre": "string — full name",
  "titulo": "string — professional title (line 2 of header)",
  "contacto": {
    "email": "string | null",
    "telefono": "string | null",
    "ubicacion": "string | null",
    "linkedin": "string | null",
    "github": "string | null",
    "web": "string | null"
  },
  "resumen": "string | null — 2-3 sentence professional summary, null if style omits it",
  "experiencias": [
    {
      "empresa": "string",
      "cargo": "string",
      "fecha_inicio": "string",
      "fecha_fin": "string",
      "bullets": ["string — one achievement per bullet, following the style's formula"],
      "descripcion": "string | null — paragraph form if style uses paragraphs instead of bullets"
    }
  ],
  "educacion": [
    {
      "institucion": "string",
      "titulo": "string",
      "area": "string | null",
      "fecha_inicio": "string | null",
      "fecha_fin": "string | null",
      "descripcion": "string | null"
    }
  ],
  "habilidades": ["string"],
  "idiomas": [
    {
      "nombre": "string",
      "nivel": "string | null",
      "nivel_cefr": {
        "comprension_auditiva": "string",
        "comprension_lectora": "string",
        "interaccion_oral": "string",
        "expresion_oral": "string",
        "expresion_escrita": "string"
      } | null
    }
  ],
  "logros": ["string"],
  "proyectos": [
    {
      "nombre": "string",
      "descripcion": "string",
      "tecnologias": ["string"],
      "url": "string | null",
      "fecha": "string | null"
    }
  ] | null,
  "tech_stack": {
    "categoryName": ["tool1", "tool2"]
  } | null,
  "resumen_ejecutivo": "string | null — executive styles only, replaces resumen",
  "areas_expertise": ["string"] | null,
  "certificaciones": ["string"] | null,
  "permiso_conduccion": "string | null"
}`
}

// ─────────────────────────────────────────────────────────────────────────────
// User message — raw data payload
// ─────────────────────────────────────────────────────────────────────────────

function buildUserMessage(
  userData: CVUserData,
  writing: StyleWritingConfig,
  vacancyProfile?: VacancyProfile
): string {
  const dataPayload = JSON.stringify(
    {
      nombre: userData.nombre,
      profesion_perfil: userData.profesion_perfil,
      email: userData.email,
      telefono: userData.telefono,
      ubicacion: userData.ubicacion,
      resumen_profesional: userData.resumen_profesional,
      experiencias: userData.experiencias,
      educaciones: userData.educaciones,
      habilidades: userData.habilidades,
      idiomas: userData.idiomas,
      logros: userData.logros,
    },
    null,
    2
  )

  const vacancyBlock = vacancyProfile
    ? `\n=== VACANCY TARGET ===
Use this structured vacancy data to tailor the CV. Do NOT invent experience to match it.
${JSON.stringify(vacancyProfile, null, 2)}
=== END VACANCY ===\n`
    : ''

  return `Generate a ${writing.id} style CV for the following candidate.
Apply all style rules from the system prompt exactly.
${vacancyBlock}
=== CANDIDATE DATA ===
${dataPayload}
=== END CANDIDATE DATA ===

Respond with a single valid JSON object following the output schema. No other text.`
}
