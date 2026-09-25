// Europass edits in the CV preview (CEO decision 2026-09-25, until the step-5 panel):
// only the texts the AI writes — "Sobre mí" and the job bullets — are editable. Objective
// data is edited in the profile. An edited sentence is the user's own text from then on
// (_origen 'usuario'); it is saved as typed, with no AI pass over it.

import type { EuropassContent } from './schema'

const SOBRE_MI = /^sobre_mi\.texto$/
const BULLET = /^experiencia_laboral\.(\d+)\.bullets\.(\d+)\.texto$/

export function isEuropassEditablePath(path: string): boolean {
  return SOBRE_MI.test(path) || BULLET.test(path)
}

// Returns the same object when nothing changes (unknown path, same text).
export function applyEuropassTextEdit(content: EuropassContent, path: string, value: string): EuropassContent {
  const texto = value.replace(/\s+/g, ' ').trim()

  if (SOBRE_MI.test(path)) {
    if (texto === (content.sobre_mi.texto ?? '')) return content
    return { ...content, sobre_mi: { ...content.sobre_mi, texto: texto || null, _origen: 'usuario' } }
  }

  const m = path.match(BULLET)
  if (!m) return content
  const i = Number(m[1]), j = Number(m[2])
  const exp = content.experiencia_laboral[i]
  const bullet = exp?.bullets[j]
  if (!bullet || bullet.texto === texto) return content
  const experiencia_laboral = content.experiencia_laboral.map((e, k) => k !== i ? e : {
    ...e,
    bullets: e.bullets.map((b, n) => n !== j ? b : { ...b, texto, _origen: 'usuario' as const }),
  })
  return { ...content, experiencia_laboral }
}
