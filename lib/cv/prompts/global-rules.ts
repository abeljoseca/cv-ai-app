import { CVUserData } from '../types/user-data'
import { detectLanguage } from '../data/detect-language'

/**
 * Global rules injected at the top of EVERY generation prompt.
 * These override all style-specific instructions when there is a conflict.
 */
export function buildGlobalRules(userData: CVUserData): string {
  const lang = detectLanguage(userData)

  const languageDirective = lang === 'es'
    ? 'LANGUAGE DIRECTIVE: Write ALL output content in Spanish. Keep all JSON field names in English exactly as specified.'
    : lang === 'en'
    ? 'LANGUAGE DIRECTIVE: Write ALL output content in English. Keep all JSON field names in English exactly as specified.'
    : lang === 'pt'
    ? 'LANGUAGE DIRECTIVE: Write ALL output content in Portuguese. Keep all JSON field names in English exactly as specified.'
    : lang === 'fr'
    ? 'LANGUAGE DIRECTIVE: Write ALL output content in French. Keep all JSON field names in English exactly as specified.'
    : 'LANGUAGE DIRECTIVE: Write ALL output content in Spanish. Keep all JSON field names in English exactly as specified.'

  // Grammatical person is language-specific — "implicit subject, active voice" (the
  // convention every style's `voice` field describes) is an English-only pattern.
  // English doesn't conjugate past-tense verbs for person, so it's naturally ambiguous.
  // Spanish and Portuguese DO conjugate for person, and are pro-drop languages — without
  // an explicit rule here, models default to third person ("Redujo", "Reduziu"), which in
  // a CV reads as describing someone ELSE's actions, not the candidate's own. This is the
  // single highest-severity content bug found in real CV output — do not remove this block.
  const personDirective = lang === 'es'
    ? `GRAMMATICAL PERSON (Spanish): Conjugate every action verb in first person singular, with the
subject pronoun omitted (Spanish is pro-drop) — "Reduje", "Implementé", "Lideré", "Gestioné".
NEVER third person ("Redujo", "Implementó", "Gestionó") — that reads as describing someone else's
work, not the candidate's own. NEVER the explicit pronoun "Yo" before the verb.`
    : lang === 'pt'
    ? `GRAMMATICAL PERSON (Portuguese): Conjugate every action verb in first person singular, with the
subject pronoun omitted (Portuguese is pro-drop) — "Reduzi", "Implementei", "Liderei", "Geri".
NEVER third person ("Reduziu", "Implementou", "Geriu").`
    : lang === 'fr'
    ? `GRAMMATICAL PERSON (French): First person singular with the elided pronoun — "J'ai réduit",
"J'ai dirigé" (French is not pro-drop; "J'ai" is required, unlike Spanish/Portuguese).
NEVER third person ("Il/Elle a réduit").`
    : `GRAMMATICAL PERSON: Use the implicit-subject, active-voice convention standard in English
resumes — the verb opens the bullet with no subject pronoun ("Reduced", "Led", "Implemented").`

  return `
=== GLOBAL RULES — HIGHEST PRIORITY ===
These rules override every style-specific instruction without exception.

${languageDirective}

${personDirective}

DATA INTEGRITY — ABSOLUTE:
- You MUST NOT invent, fabricate, or extrapolate any data not present in the user's profile.
- If a field is empty or null, either omit the section or output null for that field.
- Do NOT generate placeholder text. Do NOT write "N/A", "Not specified", or similar.
- You may REORGANIZE, SUMMARIZE, and REPHRASE the user's data — but never create new facts.

CURRENT / ACTIVE ROLE — SAME RIGOR AS PAST ROLES:
- A role marked as current ("Presente"/ongoing) follows the exact same bullet requirements as any
  past role: it must state accomplishments and outcomes achieved so far, not a description of the
  job's functions or responsibilities. "Evaluates products in the department" is a job description,
  not an achievement — it has no place in a bullet regardless of tense.
- Use present-tense action verbs for the current role, past-tense for completed roles — but the
  underlying content must be an achievement with a result, in both cases.

QUANTIFICATION — A STRONG QUALITATIVE RESULT BEATS A WEAK FORCED NUMBER:
- Every bullet needs a concrete result, but "concrete" does not mean "must contain a digit at any cost."
- When the source data genuinely has no real number to quantify, do NOT manufacture a technically-true
  but trivial or awkward-sounding quantifier just to satisfy a metric requirement — things like "at least
  1 product line," "some clients," or "a few requests" are worse than no number at all: they read as
  padding, not as evidence. This is a common failure mode — watch for it specifically.
- Instead, close the bullet with a strong, specific, qualitative outcome — what changed, what became
  possible, what was delivered — using precise language, not vague filler adjectives. Examples of the
  right shape: "manteniendo trazabilidad completa en los registros de evaluación," "hasta su cierre,"
  "consolidando el proceso para todo el equipo de revisión."
- Only include a number when it is genuine and meaningfully strengthens the claim. A real metric always
  wins when the data supports it — this rule only governs what to do when it doesn't.

THE QUALITATIVE OUTCOME ITSELF MUST NEVER BE INVENTED:
- This is the single most common way DATA INTEGRITY gets violated, because the instruction above (find
  a strong outcome) is in direct tension with it whenever the source is purely task-descriptive. When
  that tension exists, DATA INTEGRITY always wins.
- A closing outcome is only valid if it is (a) stated in the source somewhere — even in different words
  — or (b) a near-tautological restatement of the action itself, not a separate claim requiring its own
  evidence.
- Concrete real failure caught in production — source said: "control de renovaciones y recordatorios de
  pago; soporte a AP." The model wrote: "...consolidando el ciclo de renovaciones contractuales sin
  interrupción operativa." Nothing in the source claims zero operational interruption — that is a
  fabricated result, not a rephrasing, even though it sounds plausible and professional.
- Same failure, different bullet — source said: "Preparación de investigaciones/briefs para decisiones
  operativas y comerciales." The model wrote: "...reduciendo el tiempo de análisis previo a reuniones
  ejecutivas." No time reduction is stated or implied anywhere in the source.
- The test to apply before writing a closer: could this exact outcome be false without contradicting
  anything the source says? If yes, it is an invented claim, not a valid inference — do not write it.
- When no closer passes that test, end the bullet on a faithful, specific description of the scope or
  method instead of a result — e.g., "gestionando el ciclo completo de renovaciones de servicios y
  pagos" (scope, not outcome) rather than inventing "sin interrupción operativa." A precise, honest
  description of what was done is always preferable to a fabricated result, no matter how plausible.

ACHIEVEMENTS SECTION — NO DUPLICATION WITH EXPERIENCE:
- Before writing the "logros" array, check every bullet already written in "experiencias".
- Never restate, rephrase, or lightly reword an accomplishment that is already captured in an
  experience bullet — that is filler, not new information, and reads as padding to a recruiter.
- Only include an entry in "logros" if it describes something genuinely not already covered above
  (e.g., a cross-role achievement, a certification-linked result, something outside any single job).
- If every real achievement is already covered inside "experiencias", output "logros": [] — an
  empty achievements section (which the renderer omits entirely) is correct and expected; do not
  invent a restatement just to avoid an empty array.

SKILLS — PREFER EVIDENCED ONES:
- "habilidades" reflects the candidate's real, user-declared skills — never remove a real skill
  just because it lacks a bullet mentioning it explicitly.
- When ordering the list, put skills that are demonstrated somewhere in "experiencias" or "logros"
  first, followed by declared skills without direct textual evidence (e.g., certifications, tools
  learned outside a listed job). Do not fabricate a bullet mention just to justify a skill's position.
- Example: declared skills are ["Excel", "Power BI", "SQL", "Scrum"]. An experience bullet says
  "Automaticé reportes semanales en Power BI" and another says "Lideré ceremonias ágiles bajo Scrum".
  Neither bullet mentions Excel or SQL. Correct order: ["Power BI", "Scrum", "Excel", "SQL"] — the
  two evidenced skills first, in the order their evidence appears, then the rest in their original
  declared order. Do not reorder the un-evidenced skills among themselves, and do not drop them.

TITLE LINE — MANDATORY:
- Line 1: candidate's full name (from nombre field).
- Line 2: professional title — EXACTLY ONE of these rules, in order of priority:
  a. In VACANCY mode: use the target job title from the vacancy description.
  b. If profesion_perfil is not null/empty: use it verbatim.
  c. Otherwise: infer the most appropriate title from the most recent role in experiencias.
  d. If no experience exists: infer from the most recent educacion.titulo.
- NEVER leave the title line blank or output the candidate's name again on line 2.

OUTPUT FORMAT — STRICT:
- Respond with a single valid JSON object. Nothing before it. Nothing after it.
- No markdown code fences (no \`\`\`json). No explanatory text. Just the JSON.
- All string values must be properly escaped (no unescaped quotes, newlines, or special chars).
- Arrays that are empty should be [] not null. Optional string fields absent from data should be null.
=== END GLOBAL RULES ===
`.trim()
}
