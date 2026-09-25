// Vacancy match score — deterministic, no AI.

import type { VacancyProfile } from './types/pipeline'

// Same score for every CV format: styles with their own schema (Europass) build their
// own searchable text and call this directly.
export function computeMatchScoreFromText(
  cvText: string,
  experiencias: { cargo: string; descripcion: string | null }[],
  vacancy: VacancyProfile
): number {
  let score = 0
  const maxScore = 100
  const userData = { experiencias }

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  // Required skills match (0–40 points)
  const requiredSkills = vacancy.skills_requeridas
  if (requiredSkills.length > 0) {
    const matched = requiredSkills.filter(skill =>
      cvText.includes(normalize(skill))
    ).length
    score += Math.round((matched / requiredSkills.length) * 40)
  } else {
    score += 20  // no required skills listed — give partial credit
  }

  // ATS keywords match (0–30 points)
  const atsKeywords = vacancy.keywords_ats
  if (atsKeywords.length > 0) {
    const matched = atsKeywords.filter(kw =>
      cvText.includes(normalize(kw))
    ).length
    score += Math.round((matched / atsKeywords.length) * 30)
  } else {
    score += 15
  }

  // Desired skills match (0–15 points)
  const desiredSkills = vacancy.skills_deseadas
  if (desiredSkills.length > 0) {
    const matched = desiredSkills.filter(skill =>
      cvText.includes(normalize(skill))
    ).length
    score += Math.round((matched / desiredSkills.length) * 15)
  } else {
    score += 8
  }

  // Has relevant experience (0–15 points)
  const cargoTarget = normalize(vacancy.cargo_objetivo)
  const industria = normalize(vacancy.industria)
  const expText = userData.experiencias
    .map(e => `${normalize(e.cargo)} ${normalize(e.descripcion || '')}`)
    .join(' ')

  const titleTerms = cargoTarget.split(' ').filter(w => w.length > 3)
  const titleMatch = titleTerms.length > 0
    ? titleTerms.filter(t => expText.includes(t)).length / titleTerms.length
    : 0

  const industryMatch = industria.split(' ').filter(w => w.length > 3)
    .some(t => expText.includes(t)) ? 1 : 0

  score += Math.round((titleMatch * 0.7 + industryMatch * 0.3) * 15)

  return Math.min(Math.max(score, 0), maxScore)
}
