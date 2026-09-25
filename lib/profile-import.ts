// Shared date rules for the routes that write AI-extracted data into the profile
// (/api/chat, /api/parse-document, /api/profile/hydrate). Dates must reach the DB in
// the canonical form of lib/profile-date.ts ('AAAA' or 'AAAA-MM').

const PRESENT = /^(presente|actualidad|actual|present|current|hoy|en curso)$/i

export function isPresentMarker(value: string | null | undefined): boolean {
  return !!value && PRESENT.test(value.trim())
}

// Prompt fragment so every extraction prompt asks for dates the same way.
export const PROFILE_DATE_RULES = `FECHAS (fecha_inicio / fecha_fin):
- "AAAA-MM" si la fuente da mes y año (ej. "2021-03"); "AAAA" si solo da el año (ej. "2021").
- null si no aparece. NUNCA inventes el mes ni el año.
- Trabajo actual ("Presente", "Actualidad") → fecha_fin null.`

// Logro → job link (logros.experiencia_id). The AI only reports the company it read in
// the source; the link is made here, and only when that company matches exactly one of
// the user's experiences. Otherwise it stays empty for the user to fill in manually.
export function findExperienciaIdByEmpresa(
  experiencias: Array<{ id: string; empresa: string | null }>,
  empresa: string | null | undefined,
): string | null {
  const target = empresa?.toLowerCase().trim()
  if (!target) return null
  const matches = experiencias.filter(e => e.empresa?.toLowerCase().trim() === target)
  return matches.length === 1 ? matches[0].id : null
}

export const LOGRO_EMPRESA_RULE = `- empresa: nombre de la empresa donde se logró, SOLO si la fuente lo indica claramente
  (ej. el logro aparece en la descripción de ese empleo). Si no está claro → null. Nunca lo adivines.`
