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

// What an AI may see of a CV when it only needs the professional content (vacancy match
// explanation — Europass spec change 28, all styles). ALLOWLIST: only fields known to be
// professional pass; name, contact data, photo, identity data and anything unknown don't.
export function professionalView(content: unknown): Record<string, unknown> {
  if (!content || typeof content !== 'object') return {}
  if (isEuropassV2(content)) {
    const c = content
    return {
      titulo_profesional: c.informacion_personal?.titulo_profesional ?? null,
      sobre_mi: c.sobre_mi?.texto ?? null,
      experiencia: (c.experiencia_laboral ?? []).map(e => ({
        cargo: e.cargo, empleador: e.empleador, fecha_inicio: e.fecha_inicio, fecha_fin: e.fecha_fin,
        bullets: (e.bullets ?? []).map(b => b.texto),
      })),
      educacion: (c.educacion_formacion ?? []).map(e => ({
        titulo: e.titulo, institucion: e.institucion, area: e.area, fecha_inicio: e.fecha_inicio, fecha_fin: e.fecha_fin,
      })),
      idiomas: [
        ...(c.competencias_linguisticas?.lenguas_maternas ?? []).map(idioma => ({ idioma, nivel: 'Nativo' })),
        ...(c.competencias_linguisticas?.otras_lenguas ?? []).map(l => ({ idioma: l.idioma, niveles: l.niveles })),
      ],
      herramientas: c.competencias_digitales?.herramientas ?? [],
      otras_competencias: c.otras_competencias ?? [],
    }
  }
  const src = content as Record<string, unknown>
  const PROFESSIONAL_KEYS = [
    'titulo', 'resumen', 'resumen_ejecutivo', 'experiencias', 'educacion', 'habilidades',
    'habilidades_tecnicas', 'habilidades_blandas', 'idiomas', 'logros', 'proyectos',
    'tech_stack', 'areas_expertise', 'certificaciones',
  ]
  return Object.fromEntries(PROFESSIONAL_KEYS.filter(k => src[k] !== undefined).map(k => [k, src[k]]))
}
