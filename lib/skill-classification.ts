// Shared técnica/blanda skill classification — extracted from app/(app)/profile/page.tsx
// so the same heuristic backs both the profile editor and CV generation.
const SOFT_KEYWORDS = [
  'liderazgo', 'comunicación', 'comunicacion', 'trabajo en equipo', 'adaptabilidad',
  'creatividad', 'resolución', 'mentoría', 'empatía', 'negociación', 'proactividad',
  'organización', 'gestión de tiempo', 'gestión del tiempo', 'colaboración', 'iniciativa',
  'flexibilidad', 'responsabilidad', 'compromiso', 'motivación', 'actitud', 'disciplina',
  'puntualidad', 'honestidad', 'integridad', 'ética', 'perseverancia', 'resiliencia',
  'tolerancia', 'persuasión', 'influencia', 'relaciones interpersonales', 'servicio al cliente',
  'orientación al cliente', 'pensamiento crítico', 'innovación', 'multitarea', 'planificación',
  'priorización', 'aprendizaje', 'curiosidad', 'coaching', 'feedback', 'toma de decisiones',
  'gestión de conflictos', 'trabajo bajo presión', 'atención al detalle', 'empoderamiento',
  'visión estratégica', 'pensamiento estratégico', 'orientación a resultados', 'impacto',
  'inteligencia emocional', 'asertividad', 'autogestión', 'autonomía', 'proactividad',
  'creatividad', 'resolución de problemas', 'trabajo bajo estrés', 'escucha activa',
  'paciencia', 'tenacidad', 'ética profesional', 'sentido de urgencia', 'confianza',
  'apertura', 'empatia', 'gestion', 'liderazgo situacional', 'trabajo en equipo',
]

export function isLikelySoft(skill: string): boolean {
  const lower = skill.toLowerCase()
  return SOFT_KEYWORDS.some(k => lower.includes(k))
}

export type SkillTipo = 'tecnica' | 'blanda'

/**
 * Splits a flat skill list into técnicas/blandas. Prefers the real classification
 * from `tiposMap` (keyed by lowercased skill name, e.g. from the user's saved
 * `habilidades.tipo` column) and falls back to the keyword heuristic only for
 * skills with no known type — same precedence rule as /profile's isDisplaySoft.
 */
export function splitSkills(
  habilidades: string[],
  tiposMap?: Record<string, SkillTipo> | null
): { tecnicas: string[]; blandas: string[] } {
  const tecnicas: string[] = []
  const blandas: string[] = []
  for (const h of habilidades) {
    const known = tiposMap?.[h.toLowerCase().trim()]
    const isSoft = known ? known === 'blanda' : isLikelySoft(h)
    if (isSoft) blandas.push(h)
    else tecnicas.push(h)
  }
  return { tecnicas, blandas }
}
