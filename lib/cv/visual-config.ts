// Per-CV visual settings, stored in cvs.visual_config (jsonb) — never inside
// contenido_json, which the AI review step rewrites.
//
// Values read from the DB are untrusted: parseVisualConfig drops anything invalid
// so a corrupt row falls back to the style's default instead of breaking the render.

import { EUROPASS_DENSITIES, EUROPASS_PHOTO_SIZES, type EuropassDensity, type EuropassPhotoSize } from '@/lib/cv/styles/europass/contract'

export interface VisualConfig {
  // null/absent = the template's default accent color
  accent_color?: string | null
  // Europass presets (spec §2.3 / §3); absent = the style's default.
  densidad?: EuropassDensity
  foto_tam?: EuropassPhotoSize
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

const isKeyOf = <T extends object>(obj: T, v: unknown): v is keyof T =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v)

export function parseVisualConfig(raw: unknown): VisualConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const config: VisualConfig = {}
  if (isValidHexColor(src.accent_color)) config.accent_color = src.accent_color.toUpperCase()
  if (isKeyOf(EUROPASS_DENSITIES, src.densidad)) config.densidad = src.densidad
  if (isKeyOf(EUROPASS_PHOTO_SIZES, src.foto_tam)) config.foto_tam = src.foto_tam
  return config
}
