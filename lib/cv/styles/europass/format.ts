// Europass presentation formats. Always applied by code, never by the AI (spec §6).

import { formatProfileDate } from '@/lib/profile-date'
import type { DigCompNivel } from './schema'

// Profile dates ('AAAA' | 'AAAA-MM') → 'MM/AAAA', or 'AAAA' when the month is unknown.
export function formatEuropassDate(value: string | null | undefined): string | null {
  const out = formatProfileDate(value)
  return out || null
}

// Birth date (DB `date`, 'AAAA-MM-DD') → 'DD/MM/AAAA'. The only Europass date with a day.
export function formatBirthDate(value: string | null | undefined): string | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null
}

// CINE/ISCED 2011 levels (official Spanish names) — for the selection list in the editor.
export const ISCED_LABELS: Record<number, string> = {
  0: 'Educación de la primera infancia',
  1: 'Educación primaria',
  2: 'Educación secundaria baja',
  3: 'Educación secundaria alta',
  4: 'Educación postsecundaria no terciaria',
  5: 'Educación terciaria de ciclo corto',
  6: 'Grado o nivel equivalente',
  7: 'Máster o nivel equivalente',
  8: 'Doctorado o nivel equivalente',
}

// Short names printed in the CV (spec §5: "Grado", "Máster"…; reference: "7 (Máster)").
export const ISCED_CV_LABELS: Record<number, string> = {
  0: 'Educación infantil',
  1: 'Primaria',
  2: 'Secundaria baja',
  3: 'Secundaria alta',
  4: 'Postsecundaria no terciaria',
  5: 'Terciaria de ciclo corto',
  6: 'Grado',
  7: 'Máster',
  8: 'Doctorado',
}

export function iscedLabel(level: number | null | undefined): string | null {
  return level != null && level in ISCED_CV_LABELS ? `${level} (${ISCED_CV_LABELS[level]})` : null
}

export const DRIVING_LICENCE_CATEGORIES = ['AM', 'A1', 'A2', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE'] as const

// "Categoría B" — never the bare letter (spec §4.2).
export function drivingLicenceLabel(category: string): string {
  return `Categoría ${category}`
}

export const DIGCOMP_LEVELS: DigCompNivel[] = ['Básico', 'Intermedio', 'Avanzado', 'Altamente especializado']

export const DIGCOMP_AREA_LABELS = {
  informacion_datos: 'Información y datos',
  comunicacion_colaboracion: 'Comunicación y colaboración',
  creacion_contenido: 'Creación de contenido digital',
  seguridad: 'Seguridad',
  resolucion_problemas: 'Resolución de problemas',
} as const

export const CEFR_SKILL_LABELS = {
  comprension_auditiva: 'Comprensión auditiva',
  comprension_lectora: 'Comprensión lectora',
  interaccion_oral: 'Interacción oral',
  expresion_oral: 'Expresión oral',
  expresion_escrita: 'Expresión escrita',
} as const
