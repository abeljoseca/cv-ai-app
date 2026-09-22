// Clean user data passed to the AI — no DB metadata, normalized fields

export interface CVExperiencia {
  empresa: string
  cargo: string
  fecha_inicio: string
  fecha_fin: string          // 'Presente' if activo=true or fecha_fin=null
  descripcion: string | null
}

export interface CVEducacion {
  institucion: string
  titulo: string
  area: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
}

export interface CVIdioma {
  nombre: string
  nivel: string | null
}

export interface CVUserData {
  nombre: string
  profesion_perfil: string | null
  email: string
  telefono: string | null
  ubicacion: string | null   // ciudad + país joined, or null
  foto_url: string | null
  resumen_profesional: string | null
  experiencias: CVExperiencia[]
  educaciones: CVEducacion[]
  habilidades: string[]
  // Real técnica/blanda classification from the habilidades table, keyed by
  // lowercased skill name — not sent to the AI, used to categorize the Skills
  // section at generation time (see lib/skill-classification.ts).
  habilidadesTipos: Record<string, 'tecnica' | 'blanda'>
  idiomas: CVIdioma[]
  logros: string[]
  // Section flags — computed, not sent to AI, used by pipeline logic
  hasExperience: boolean
  hasEducation: boolean
  hasHabilidades: boolean
  hasIdiomas: boolean
  hasLogros: boolean
  hasResumen: boolean
  hasFoto: boolean
}
