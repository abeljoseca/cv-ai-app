import { CVUserData } from '../types/user-data'

// High-frequency function words by language — reliable discriminators
const MARKERS: Record<string, string[]> = {
  es: ['de', 'en', 'con', 'la', 'el', 'los', 'las', 'un', 'una', 'por', 'para', 'que', 'como', 'del', 'al', 'se', 'su', 'son', 'fue', 'para'],
  en: ['the', 'and', 'with', 'for', 'in', 'of', 'at', 'to', 'on', 'as', 'from', 'by', 'an', 'was', 'were', 'has', 'have'],
  pt: ['do', 'da', 'dos', 'das', 'em', 'com', 'uma', 'pelo', 'pela', 'que', 'como', 'para', 'foi', 'são', 'tem'],
  fr: ['de', 'le', 'la', 'les', 'du', 'des', 'en', 'et', 'un', 'une', 'pour', 'dans', 'avec', 'sur', 'par'],
}

function scoreLanguage(text: string, markers: string[]): number {
  const words = text.toLowerCase().replace(/[^a-záéíóúàèìòùâêîôûäëïöüñç\s]/g, ' ').split(/\s+/)
  const total = words.length
  if (total === 0) return 0
  const hits = words.filter(w => markers.includes(w)).length
  return hits / total
}

export function detectLanguage(userData: CVUserData): string {
  const samples = [
    userData.resumen_profesional,
    userData.profesion_perfil,
    ...userData.experiencias.map(e => e.descripcion).filter(Boolean),
    ...userData.experiencias.map(e => e.cargo),
    ...userData.educaciones.map(e => e.titulo),
    ...userData.logros,
  ]
    .filter(Boolean)
    .join(' ')

  return detectLanguageFromText(samples)
}

// Same heuristic on any text sample (used by style backends with their own data shape).
export function detectLanguageFromText(samples: string): string {
  if (!samples || samples.trim().length < 30) return 'es'

  const scores = Object.entries(MARKERS).map(([lang, markers]) => ({
    lang,
    score: scoreLanguage(samples, markers),
  }))

  scores.sort((a, b) => b.score - a.score)

  const top = scores[0]
  const runner = scores[1]

  // Require meaningful margin to avoid ambiguity (es/pt share many words)
  if (top.score === 0) return 'es'
  if (top.score - runner.score < 0.02 && top.lang !== 'en') {
    // Tie between es/pt — prefer es unless pt is clearly ahead
    return top.lang === 'pt' && top.score > runner.score * 1.3 ? 'pt' : 'es'
  }

  return top.lang
}
