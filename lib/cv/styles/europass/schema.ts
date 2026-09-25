// Europass CV content — the style's OWN schema (spec: estilos-de-cv/specs/europass-spec-v2.md §5.1).
// It does not reuse the shared CVContent: the AI can never produce fields of other styles.
// Fields prefixed with "_" are internal (source tracing) and are never rendered.

import type { CefrBreakdown } from '@/lib/cefr'

export const EUROPASS_SCHEMA = 'europass@2' as const

export interface Toggle<T> {
  activo: boolean
  valor: T | null
}

export interface ToggleList {
  activo: boolean
  items: string[]
}

export type PerfilTipo = 'linkedin' | 'orcid' | 'researchgate'

export interface EuropassBullet {
  texto: string
  // References to the profile fields the sentence was written from (e.g. "exp:<id>:descripcion").
  _fuentes: string[]
  // "ia" = written by the AI and verified; "usuario" = the user's own text (fallback).
  _origen: 'ia' | 'usuario'
}

export interface EuropassExperiencia {
  // Profile row id — internal, used to trace bullets back to their source.
  _id: string
  cargo: string
  empleador: string
  // 'MM/AAAA', or 'AAAA' when the month is unknown (never invented). null when missing.
  fecha_inicio: string | null
  fecha_fin: string | 'actualidad' | null
  bullets: EuropassBullet[]
  lugar: Toggle<string>
  sector_nace: Toggle<string>
}

export interface EuropassEducacion {
  _id: string
  // Profile "Cursos y Certificaciones" are listed here too, as Europass does (CEO 2026-09-25).
  origen: 'educacion' | 'certificacion'
  titulo: string
  institucion: string
  // Field of study — shown as a gray line under the title (CEO 2026-09-25).
  area: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  nivel_isced: Toggle<number>
  lugar: Toggle<string>
  materias: Toggle<string>
}

export interface EuropassIdioma {
  idioma: string
  // null when the user has not confirmed a CEFR level yet: the CV only ever shows CEFR codes.
  niveles: CefrBreakdown | null
  // false = pre-filled from the user's general level (§7.3) or not confirmed at all.
  niveles_confirmados: boolean
  certificacion: Toggle<string>
}

export type DigCompNivel = 'Básico' | 'Intermedio' | 'Avanzado' | 'Altamente especializado'
export const DIGCOMP_AREAS = [
  'informacion_datos',
  'comunicacion_colaboracion',
  'creacion_contenido',
  'seguridad',
  'resolucion_problemas',
] as const
export type DigCompArea = typeof DIGCOMP_AREAS[number]

export interface EuropassContent {
  schema: typeof EUROPASS_SCHEMA
  informacion_personal: {
    nombre_completo: string
    titulo_profesional: string | null
    telefono: string | null
    email: string | null
    ciudad_pais: string | null
    foto: { activo: boolean; url: string | null }
    fecha_nacimiento: Toggle<string>
    nacionalidad: Toggle<string>
    direccion: Toggle<string>
    perfiles: Array<{ tipo: PerfilTipo; url: string; activo: boolean }>
  }
  sobre_mi: { texto: string | null; _fuentes: string[]; _origen?: 'ia' | 'usuario' }
  experiencia_laboral: EuropassExperiencia[]
  educacion_formacion: EuropassEducacion[]
  competencias_linguisticas: {
    lenguas_maternas: string[]
    otras_lenguas: EuropassIdioma[]
  }
  competencias_digitales: {
    herramientas: string[]
    digcomp: { activo: boolean } & Record<DigCompArea, DigCompNivel | null>
  }
  otras_competencias: string[]
  permiso_conducir: { activo: boolean; categorias: string[] }
  informacion_adicional: {
    activo: boolean
    logros_destacados: ToggleList
    publicaciones: ToggleList
    ponencias: ToggleList
    voluntariado: ToggleList
    premios_becas: ToggleList
    afiliaciones: ToggleList
  }
  anexos: ToggleList
}

// Source texts the AI step (4b) is allowed to write from, with stable references.
export interface EuropassAISources {
  resumen: { ref: string; texto: string } | null
  experiencias: Array<{
    ref: string
    cargo: string
    empleador: string
    descripcion: { ref: string; texto: string } | null
    logros: Array<{ ref: string; texto: string }>
  }>
}
