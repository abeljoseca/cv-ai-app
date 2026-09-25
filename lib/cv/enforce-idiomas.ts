import type { CVContent } from './types/cv-content'
import type { CVIdioma } from './types/user-data'

// Language levels in a generated CV are never taken from the AI output. They are
// overwritten with the profile's CEFR code (A1–C2 or "Nativo") — or no level when the
// user hasn't confirmed one — so the CV can only ever show the code the user chose.
// Languages that aren't in the profile are dropped, and any per-skill CEFR breakdown the
// AI produced is discarded (it can only come from the user's own profile data).
export function enforceIdiomaLevels(content: CVContent, profileIdiomas: CVIdioma[]): void {
  const byName = new Map(profileIdiomas.map(i => [i.nombre.toLowerCase().trim(), i]))
  content.idiomas = (content.idiomas ?? []).flatMap(l => {
    const src = byName.get(l.nombre?.toLowerCase().trim() ?? '')
    if (!src) return []
    return [{ ...l, nombre: src.nombre, nivel: src.nivel, nivel_cefr: null }]
  })
}
