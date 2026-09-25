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
