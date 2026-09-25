// Language levels on the CEFR scale (MCER), stored in idiomas.nivel_cefr.
// The legacy free-text idiomas.nivel ("Básico/Intermedio/Avanzado") is kept but is
// never converted to a CEFR level automatically — there is no official equivalence,
// so the user confirms their level once in the profile.

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Nativo'] as const
export type CefrLevel = typeof CEFR_LEVELS[number]

// The five CEFR skills (Europass language table).
export const CEFR_SKILLS = [
  'comprension_auditiva',
  'comprension_lectora',
  'interaccion_oral',
  'expresion_oral',
  'expresion_escrita',
] as const
export type CefrSkill = typeof CEFR_SKILLS[number]
export type CefrBreakdown = Record<CefrSkill, Exclude<CefrLevel, 'Nativo'>>

export const CEFR_LABELS: Record<CefrLevel, string> = {
  A1: 'A1 · Principiante',
  A2: 'A2 · Básico',
  B1: 'B1 · Intermedio',
  B2: 'B2 · Intermedio alto',
  C1: 'C1 · Avanzado',
  C2: 'C2 · Dominio',
  Nativo: 'Nativo',
}

export const CEFR_HINTS: Record<CefrLevel, string> = {
  A1: 'Entiendo y uso frases muy básicas.',
  A2: 'Me comunico en situaciones sencillas y habituales.',
  B1: 'Me desenvuelvo en viajes y temas conocidos.',
  B2: 'Puedo trabajar en este idioma con fluidez.',
  C1: 'Me expreso con fluidez en contextos profesionales y académicos.',
  C2: 'Lo domino prácticamente como un nativo.',
  Nativo: 'Es mi lengua materna.',
}

// Accepts only values that already ARE a CEFR level or a native marker.
// Anything else (e.g. "Avanzado", "Advanced") returns null on purpose.
export function normalizeCefr(input: string | null | undefined): CefrLevel | null {
  if (!input) return null
  const v = input.trim()
  const upper = v.toUpperCase()
  if ((['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as string[]).includes(upper)) return upper as CefrLevel
  const lower = v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (['nativo', 'nativa', 'lengua materna', 'native', 'mother tongue'].includes(lower)) return 'Nativo'
  return null
}

export function isCefrBreakdown(value: unknown): value is CefrBreakdown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return CEFR_SKILLS.every(s => typeof v[s] === 'string' && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(v[s] as string))
}
