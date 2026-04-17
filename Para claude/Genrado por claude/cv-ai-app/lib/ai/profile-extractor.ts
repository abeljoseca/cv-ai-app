export interface ProfileUpdate {
  cambios: Record<string, unknown>
  campos_actualizados: string[]
  nueva_pregunta_hecha: string | null
}

export function extractProfileUpdate(rawResponse: string): {
  visibleText: string
  profileUpdate: ProfileUpdate | null
} {
  const blockRegex = /\[PROFILE_UPDATE\]([\s\S]*?)\[\/PROFILE_UPDATE\]/

  const match = rawResponse.match(blockRegex)

  if (!match) {
    // Fallback: si el bloque está incompleto (cortado por max_tokens), eliminar desde [PROFILE_UPDATE] en adelante
    const incompleteIdx = rawResponse.indexOf('[PROFILE_UPDATE]')
    if (incompleteIdx !== -1) {
      return { visibleText: rawResponse.slice(0, incompleteIdx).trim(), profileUpdate: null }
    }
    return { visibleText: rawResponse.trim(), profileUpdate: null }
  }

  const visibleText = rawResponse.replace(blockRegex, '').trim()

  try {
    const profileUpdate: ProfileUpdate = JSON.parse(match[1].trim())
    return { visibleText, profileUpdate }
  } catch {
    return { visibleText, profileUpdate: null }
  }
}

export function mergeProfileData(
  current: Record<string, unknown>,
  cambios: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...current }

  for (const [key, value] of Object.entries(cambios)) {
    if (value === null || value === undefined) continue

    if (Array.isArray(value) && Array.isArray(merged[key])) {
      merged[key] = [...(merged[key] as unknown[]), ...value]
    } else {
      merged[key] = value
    }
  }

  return merged
}