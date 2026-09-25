// Stored CV content comes in more than one schema: the shared CVContent (legacy and the
// styles not standardized yet) and each standardized style's own (Europass: 'europass@2').
// Anything that reads contenido_json outside a template goes through these helpers.

import { EUROPASS_SCHEMA, type EuropassContent } from '@/lib/cv/styles/europass/schema'

export function isEuropassV2(content: unknown): content is EuropassContent {
  return !!content && typeof content === 'object' && (content as { schema?: unknown }).schema === EUROPASS_SCHEMA
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

export function cvContentName(content: unknown): string | null {
  if (isEuropassV2(content)) return str(content.informacion_personal?.nombre_completo)
  return str((content as { nombre?: unknown } | null)?.nombre)
}

export function cvContentTitle(content: unknown): string | null {
  if (isEuropassV2(content)) return str(content.informacion_personal?.titulo_profesional)
  return str((content as { titulo?: unknown } | null)?.titulo)
}

// Europass fields prefixed with "_" are internal (source tracing): never shown or sent out.
export function withoutInternalFields<T>(content: T): T {
  return JSON.parse(JSON.stringify(content, (k, v) => (k.startsWith('_') ? undefined : v)))
}
