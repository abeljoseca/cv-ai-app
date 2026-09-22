import { VacancyProfile } from '../types/pipeline'

/**
 * Builds the prompt for Haiku to analyze a vacancy posting.
 * Returns a structured VacancyProfile JSON — no generation, pure extraction.
 */
export function buildAnalyzeVacancyPrompt(vacancyText: string): { system: string; user: string } {
  const system = `You are a structured information extractor. Your only job is to parse a job posting
and extract specific structured data from it. You do NOT generate content. You do NOT add information
that is not present in the text. You respond with a single valid JSON object — nothing else.`

  const user = `Parse the following job posting and extract the structured data below.
Return ONLY a valid JSON object with exactly these fields.

REQUIRED JSON STRUCTURE:
{
  "cargo_objetivo": "exact job title as written in the posting",
  "seniority": "junior" | "mid" | "senior" | "lead" | "executive",
  "industria": "primary industry or sector (1 concise phrase)",
  "skills_requeridas": ["must-have skills explicitly stated as required"],
  "skills_deseadas": ["nice-to-have skills, 'preferred', 'plus', 'desirable'"],
  "keywords_ats": ["exact strings from the posting that an ATS would match — include both acronyms and full forms"],
  "responsabilidades": ["key responsibilities extracted verbatim or near-verbatim, max 8 items"]
}

RULES:
- cargo_objetivo: use the exact job title from the posting, not a paraphrase.
- seniority: infer from years-of-experience requirements, title qualifiers (Junior/Senior/Lead/Director/VP), and responsibility level.
- skills_requeridas: only skills the posting explicitly marks as required, mandatory, or essential.
- skills_deseadas: skills described as preferred, a plus, nice to have, or desirable.
- keywords_ats: include BOTH forms when both exist — e.g., ["JavaScript", "JS", "React.js", "React", "CI/CD", "continuous integration"].
- responsabilidades: maximum 8. Pick the most substantive duties. Keep them concise (under 15 words each).
- If a field has no data available, return an empty array [] for arrays, and your best inference for string fields.

JOB POSTING:
---
${vacancyText}
---`

  return { system, user }
}

export function parseVacancyResponse(rawResponse: string): VacancyProfile {
  const cleaned = rawResponse.trim()
  try {
    return JSON.parse(cleaned) as VacancyProfile
  } catch {
    // Try to extract JSON if the model wrapped it in markdown
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as VacancyProfile
    throw new Error('VacancyProfile parse failed: invalid JSON from vacancy analysis step')
  }
}
