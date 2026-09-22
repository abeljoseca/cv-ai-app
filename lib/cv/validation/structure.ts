import { CVContent } from '../types/cv-content'
import { ValidationResult } from '../types/pipeline'

/**
 * Structural validation: checks that the JSON produced by the AI conforms
 * to the required shape before any DB insert or component render.
 * Returns a ValidationResult with all errors found (not fail-fast).
 */
export function validateStructure(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Response is not a JSON object'] }
  }

  const cv = data as Record<string, unknown>

  // ── Required top-level string fields ────────────────────────────────────

  if (!cv.nombre || typeof cv.nombre !== 'string' || cv.nombre.trim() === '') {
    errors.push('Missing or empty: nombre')
  }

  if (!cv.titulo || typeof cv.titulo !== 'string' || cv.titulo.trim() === '') {
    errors.push('Missing or empty: titulo (professional title line is mandatory)')
  }

  // ── contacto ────────────────────────────────────────────────────────────

  if (!cv.contacto || typeof cv.contacto !== 'object' || Array.isArray(cv.contacto)) {
    errors.push('Missing or invalid: contacto (must be an object)')
  } else {
    const c = cv.contacto as Record<string, unknown>
    const contactFields = ['email', 'telefono', 'ubicacion', 'linkedin', 'github', 'web']
    for (const f of contactFields) {
      if (f in c && c[f] !== null && typeof c[f] !== 'string') {
        errors.push(`contacto.${f} must be a string or null`)
      }
    }
  }

  // ── resumen ─────────────────────────────────────────────────────────────

  if ('resumen' in cv && cv.resumen !== null && typeof cv.resumen !== 'string') {
    errors.push('resumen must be a string or null')
  }

  // ── experiencias ────────────────────────────────────────────────────────

  if (!Array.isArray(cv.experiencias)) {
    errors.push('experiencias must be an array')
  } else {
    cv.experiencias.forEach((exp: unknown, i: number) => {
      if (!exp || typeof exp !== 'object' || Array.isArray(exp)) {
        errors.push(`experiencias[${i}] must be an object`)
        return
      }
      const e = exp as Record<string, unknown>
      if (!e.empresa || typeof e.empresa !== 'string') errors.push(`experiencias[${i}].empresa missing`)
      if (!e.cargo || typeof e.cargo !== 'string')   errors.push(`experiencias[${i}].cargo missing`)
      if (!e.fecha_inicio || typeof e.fecha_inicio !== 'string') errors.push(`experiencias[${i}].fecha_inicio missing`)
      if (!e.fecha_fin || typeof e.fecha_fin !== 'string')       errors.push(`experiencias[${i}].fecha_fin missing`)

      const hasBullets = Array.isArray(e.bullets) && (e.bullets as unknown[]).length > 0
      const hasDescripcion = typeof e.descripcion === 'string' && (e.descripcion as string).trim().length > 0
      if (!hasBullets && !hasDescripcion) {
        errors.push(`experiencias[${i}] must have either bullets[] or descripcion`)
      }
      if (Array.isArray(e.bullets)) {
        (e.bullets as unknown[]).forEach((b, j) => {
          if (typeof b !== 'string' || (b as string).trim() === '') {
            errors.push(`experiencias[${i}].bullets[${j}] must be a non-empty string`)
          }
        })
      }
    })
  }

  // ── educacion ───────────────────────────────────────────────────────────

  if (!Array.isArray(cv.educacion)) {
    errors.push('educacion must be an array')
  } else {
    cv.educacion.forEach((edu: unknown, i: number) => {
      if (!edu || typeof edu !== 'object' || Array.isArray(edu)) {
        errors.push(`educacion[${i}] must be an object`)
        return
      }
      const e = edu as Record<string, unknown>
      if (!e.institucion || typeof e.institucion !== 'string') errors.push(`educacion[${i}].institucion missing`)
      if (!e.titulo || typeof e.titulo !== 'string')           errors.push(`educacion[${i}].titulo missing`)
    })
  }

  // ── habilidades ─────────────────────────────────────────────────────────

  if (!Array.isArray(cv.habilidades)) {
    errors.push('habilidades must be an array')
  } else {
    cv.habilidades.forEach((h: unknown, i: number) => {
      if (typeof h !== 'string') errors.push(`habilidades[${i}] must be a string`)
    })
  }

  // ── idiomas ─────────────────────────────────────────────────────────────

  if (!Array.isArray(cv.idiomas)) {
    errors.push('idiomas must be an array')
  } else {
    cv.idiomas.forEach((lang: unknown, i: number) => {
      if (!lang || typeof lang !== 'object' || Array.isArray(lang)) {
        errors.push(`idiomas[${i}] must be an object`)
        return
      }
      const l = lang as Record<string, unknown>
      if (!l.nombre || typeof l.nombre !== 'string') errors.push(`idiomas[${i}].nombre missing`)
    })
  }

  // ── logros ──────────────────────────────────────────────────────────────

  if (!Array.isArray(cv.logros)) {
    errors.push('logros must be an array')
  } else {
    cv.logros.forEach((l: unknown, i: number) => {
      if (typeof l !== 'string') errors.push(`logros[${i}] must be a string`)
    })
  }

  // ── Optional array fields: type-check if present ────────────────────────

  if (cv.proyectos !== null && cv.proyectos !== undefined && !Array.isArray(cv.proyectos)) {
    errors.push('proyectos must be an array or null')
  }

  if (cv.areas_expertise !== null && cv.areas_expertise !== undefined && !Array.isArray(cv.areas_expertise)) {
    errors.push('areas_expertise must be an array or null')
  }

  if (cv.certificaciones !== null && cv.certificaciones !== undefined && !Array.isArray(cv.certificaciones)) {
    errors.push('certificaciones must be an array or null')
  }

  if (cv.tech_stack !== null && cv.tech_stack !== undefined) {
    if (typeof cv.tech_stack !== 'object' || Array.isArray(cv.tech_stack)) {
      errors.push('tech_stack must be an object (Record<string, string[]>) or null')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Parse raw string response to JSON and validate structure.
 * Returns { parsed, result } — caller decides whether to retry or throw.
 */
export function parseAndValidate(raw: string): { parsed: CVContent | null; result: ValidationResult } {
  let parsed: unknown = null

  const cleaned = raw.trim()

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Try to extract JSON if wrapped in markdown fences
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try {
        parsed = JSON.parse(match[1].trim())
      } catch {
        return {
          parsed: null,
          result: { valid: false, errors: ['Response is not valid JSON'] },
        }
      }
    } else {
      // Try bare JSON extraction
      const objMatch = cleaned.match(/\{[\s\S]*\}/)
      if (objMatch) {
        try {
          parsed = JSON.parse(objMatch[0])
        } catch {
          return {
            parsed: null,
            result: { valid: false, errors: ['Response is not valid JSON'] },
          }
        }
      } else {
        return {
          parsed: null,
          result: { valid: false, errors: ['Response is not valid JSON'] },
        }
      }
    }
  }

  const result = validateStructure(parsed)
  return { parsed: result.valid ? (parsed as CVContent) : null, result }
}
