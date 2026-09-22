// JSON structure produced by the AI — consumed by React components and stored in DB

export interface CVContacto {
  email: string
  telefono: string | null
  ubicacion: string | null
  linkedin?: string | null
  github?: string | null
  web?: string | null
}

export interface CVExperienciaContent {
  empresa: string
  cargo: string
  fecha_inicio: string
  fecha_fin: string | null
  // Bullet-based styles (Harvard, Stanford, SV, Tech, Executive, Minimalist)
  bullets?: string[]
  // Paragraph-based styles (Europass) or fallback
  descripcion?: string | null
}

export interface CVEducacionContent {
  institucion: string
  titulo: string
  area: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
}

export interface CVIdiomaContent {
  nombre: string
  nivel: string | null
  // Populated only for Europass style
  nivel_cefr?: {
    comprension_auditiva: string  // A1–C2
    comprension_lectora: string
    interaccion_oral: string
    expresion_oral: string
    expresion_escrita: string
  } | null
}

export interface CVProyectoContent {
  nombre: string
  descripcion: string
  tecnologias: string[]
  url: string | null
  fecha?: string | null
}

export interface CVContent {
  // ── Universal fields ──────────────────────────────────────────────
  nombre: string
  titulo: string             // profesion_perfil (General) or cargo objetivo (Vacancy)
  contacto: CVContacto

  // Professional summary — most styles use this
  // Executive uses resumen_ejecutivo instead; this field is null for that style
  resumen: string | null

  experiencias: CVExperienciaContent[]
  educacion: CVEducacionContent[]
  habilidades: string[]
  // Optional técnica/blanda split of `habilidades`, computed at generation time from
  // the user's real skill classification (see lib/skill-classification.ts). Absent on
  // CVs generated before this field existed — components must fall back to rendering
  // the flat `habilidades` list when these are undefined.
  habilidades_tecnicas?: string[]
  habilidades_blandas?: string[]
  idiomas: CVIdiomaContent[]
  logros: string[]

  // ── Style-specific optional fields ───────────────────────────────
  // Stanford, Silicon Valley, Tech, Minimalist
  proyectos?: CVProyectoContent[]

  // Silicon Valley, Tech — categorized tech stack
  tech_stack?: Record<string, string[]>

  // Executive — replaces resumen, prominent 4-7 line section
  resumen_ejecutivo?: string | null

  // Executive — 8-15 keywords in grid format
  areas_expertise?: string[]

  // Europass
  certificaciones?: string[]
  permiso_conduccion?: string | null
}
