// Per-CV visual settings, stored in cvs.visual_config (jsonb) — never inside
// contenido_json, which the AI review step rewrites.
//
// Values read from the DB are untrusted: parseVisualConfig drops anything invalid
// so a corrupt row falls back to the style's default instead of breaking the render.

export interface VisualConfig {
  // null/absent = the template's default accent color
  accent_color?: string | null
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

export function parseVisualConfig(raw: unknown): VisualConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const config: VisualConfig = {}
  if (isValidHexColor(src.accent_color)) config.accent_color = src.accent_color.toUpperCase()
  return config
}
