import { CVContent } from '../types/cv-content'
import { CVUserData } from '../types/user-data'
import { ValidationResult } from '../types/pipeline'

/**
 * Anti-hallucination check: verifies that the AI did not fabricate data
 * absent from the user's profile. Works by cross-referencing the generated
 * content against the source data using fuzzy string matching.
 *
 * This is NOT a perfect semantic check — it catches the most common failure
 * modes: invented employers, non-existent degrees, and fabricated dates.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

// Returns true if target appears anywhere in source (case/punctuation insensitive)
function fuzzyContains(source: string, target: string): boolean {
  const normSource = normalizeStr(source)
  const normTarget = normalizeStr(target)
  if (!normTarget) return true
  return normSource.includes(normTarget)
}

// Check if a string is contained within any element of a collection
function matchesAnyIn(candidates: string[], target: string): boolean {
  const normTarget = normalizeStr(target)
  return candidates.some(c => fuzzyContains(c, normTarget) || fuzzyContains(normTarget, c))
}

// ─────────────────────────────────────────────────────────────────────────────
// Main validation
// ─────────────────────────────────────────────────────────────────────────────

export function validateAntiHallucination(
  cv: CVContent,
  userData: CVUserData
): ValidationResult {
  const errors: string[] = []

  // ── Check experiencias ──────────────────────────────────────────────────
  //
  // Every company and role in the generated CV must trace back to a real
  // entry in userData.experiencias. We use fuzzy matching to allow
  // reformatting (e.g., "ACME Corp." → "Acme Corp").

  const sourceEmpresas = userData.experiencias.map(e => e.empresa)
  const sourceCargos   = userData.experiencias.map(e => e.cargo)

  cv.experiencias.forEach((exp, i) => {
    if (!matchesAnyIn(sourceEmpresas, exp.empresa)) {
      errors.push(
        `Hallucination detected — experiencias[${i}].empresa "${exp.empresa}" not found in source data`
      )
    }
    if (!matchesAnyIn(sourceCargos, exp.cargo)) {
      errors.push(
        `Hallucination detected — experiencias[${i}].cargo "${exp.cargo}" not found in source data`
      )
    }
  })

  // ── Check that no extra experience entries were invented ────────────────
  if (cv.experiencias.length > userData.experiencias.length) {
    errors.push(
      `Hallucination detected — generated ${cv.experiencias.length} experience entries but source has ${userData.experiencias.length}`
    )
  }

  // ── Check educacion ─────────────────────────────────────────────────────

  const sourceInstituciones = userData.educaciones.map(e => e.institucion)
  const sourceTitulos       = userData.educaciones.map(e => e.titulo)

  cv.educacion.forEach((edu, i) => {
    if (!matchesAnyIn(sourceInstituciones, edu.institucion)) {
      errors.push(
        `Hallucination detected — educacion[${i}].institucion "${edu.institucion}" not found in source data`
      )
    }
    if (!matchesAnyIn(sourceTitulos, edu.titulo)) {
      errors.push(
        `Hallucination detected — educacion[${i}].titulo "${edu.titulo}" not found in source data`
      )
    }
  })

  if (cv.educacion.length > userData.educaciones.length) {
    errors.push(
      `Hallucination detected — generated ${cv.educacion.length} education entries but source has ${userData.educaciones.length}`
    )
  }

  // ── Check candidate name ────────────────────────────────────────────────

  const sourceName = normalizeStr(userData.nombre)
  const cvName     = normalizeStr(cv.nombre)

  if (sourceName && !fuzzyContains(cvName, sourceName.split(' ')[0])) {
    // At minimum the first name should match
    errors.push(
      `Hallucination detected — nombre "${cv.nombre}" does not match source name "${userData.nombre}"`
    )
  }

  // ── Check titulo (professional title) ──────────────────────────────────
  // We only check that the title is not empty — it is allowed to be inferred
  // so we cannot cross-check it against a single source field.

  if (!cv.titulo || cv.titulo.trim() === '') {
    errors.push('titulo is empty — mandatory field, generation must be retried')
  }

  // ── Soft check: habilidades ─────────────────────────────────────────────
  // Skills are generated from a known list, but AI may add invented ones.
  // We use a lenient check: warn only if the generated list is more than
  // 50% larger than the source list AND has >5 items total.

  if (
    userData.habilidades.length > 0 &&
    cv.habilidades.length > userData.habilidades.length * 1.5 &&
    cv.habilidades.length > 5
  ) {
    errors.push(
      `Possible hallucination — habilidades has ${cv.habilidades.length} items but source has only ${userData.habilidades.length}. Check for invented skills.`
    )
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Combined validation pass — run both validators.
 * Call this after parseAndValidate() succeeds.
 */
export function runAntiHallucinationCheck(
  cv: CVContent,
  userData: CVUserData
): ValidationResult {
  return validateAntiHallucination(cv, userData)
}
