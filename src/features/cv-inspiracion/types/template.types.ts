import type { Layer } from './layer.types'
import type { CanvasState } from './canvas.types'

export interface SupabaseTemplate {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  canvas_state: CanvasState
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface FontConfig {
  family: string
  weight?: number | string
  style?: string
  url: string
}

export interface CVTemplate {
  id: string
  name: string
  description: string
  thumbnail?: string
  canvasWidth: number
  canvasHeight: number
  layers: Layer[]
  fonts?: FontConfig[]
}

export interface TemplateDataMarkers {
  USUARIO_NOMBRE?: string
  USUARIO_APELLIDO?: string
  USUARIO_PROFESION?: string
  USUARIO_EMAIL?: string
  USUARIO_TELEFONO?: string
  USUARIO_CIUDAD?: string
  USUARIO_PAIS?: string
  USUARIO_FOTO?: string
  USUARIO_RESUMEN?: string
  // Education
  USUARIO_EDU1_INSTITUCION?: string
  USUARIO_EDU1_TITULO?: string
  USUARIO_EDU1_FECHAS?: string
  USUARIO_EDU2_INSTITUCION?: string
  USUARIO_EDU2_TITULO?: string
  USUARIO_EDU2_FECHAS?: string
  // Experience 1
  USUARIO_EXP1_EMPRESA?: string
  USUARIO_EXP1_CARGO?: string
  USUARIO_EXP1_FECHAS?: string
  USUARIO_EXP1_FECHA_FIN?: string
  USUARIO_EXP1_DESC1?: string
  USUARIO_EXP1_DESC2?: string
  USUARIO_EXP1_DESC3?: string
  USUARIO_EXP1_DESC4?: string
  USUARIO_EXP1_DESC5?: string
  // Experience 2
  USUARIO_EXP2_EMPRESA?: string
  USUARIO_EXP2_CARGO?: string
  USUARIO_EXP2_FECHAS?: string
  USUARIO_EXP2_FECHA_FIN?: string
  USUARIO_EXP2_DESC1?: string
  USUARIO_EXP2_DESC2?: string
  USUARIO_EXP2_DESC3?: string
  USUARIO_EXP2_DESC4?: string
  USUARIO_EXP2_DESC5?: string
  // Experience 3
  USUARIO_EXP3_EMPRESA?: string
  USUARIO_EXP3_CARGO?: string
  USUARIO_EXP3_FECHAS?: string
  USUARIO_EXP3_FECHA_FIN?: string
  USUARIO_EXP3_DESC1?: string
  USUARIO_EXP3_DESC2?: string
  USUARIO_EXP3_DESC3?: string
  USUARIO_EXP3_DESC4?: string
  USUARIO_EXP3_DESC5?: string
  // Skills (all)
  USUARIO_HABILIDAD_1?: string
  USUARIO_HABILIDAD_2?: string
  USUARIO_HABILIDAD_3?: string
  USUARIO_HABILIDAD_4?: string
  USUARIO_HABILIDAD_5?: string
  USUARIO_HABILIDAD_6?: string
  // Skills technical (requires tipo='tecnica' column in habilidades table)
  USUARIO_HABILIDAD_TECNICA_1?: string
  USUARIO_HABILIDAD_TECNICA_2?: string
  USUARIO_HABILIDAD_TECNICA_3?: string
  USUARIO_HABILIDAD_TECNICA_4?: string
  USUARIO_HABILIDAD_TECNICA_5?: string
  USUARIO_HABILIDAD_TECNICA_6?: string
  // Skills soft (requires tipo='blanda' column in habilidades table)
  USUARIO_HABILIDAD_BLANDA_1?: string
  USUARIO_HABILIDAD_BLANDA_2?: string
  USUARIO_HABILIDAD_BLANDA_3?: string
  USUARIO_HABILIDAD_BLANDA_4?: string
  USUARIO_HABILIDAD_BLANDA_5?: string
  USUARIO_HABILIDAD_BLANDA_6?: string
  // Languages
  USUARIO_IDIOMA_1?: string
  USUARIO_IDIOMA_2?: string
  USUARIO_IDIOMA_3?: string
  USUARIO_IDIOMA_4?: string
  USUARIO_IDIOMA_5?: string
  USUARIO_IDIOMA_6?: string
  // Logros
  USUARIO_LOGRO_1?: string
  USUARIO_LOGRO_2?: string
  USUARIO_LOGRO_3?: string
  USUARIO_LOGRO_4?: string
  USUARIO_LOGRO_5?: string
  USUARIO_LOGRO_6?: string
  // References
  USUARIO_REF1_NOMBRE?: string
  USUARIO_REF1_CARGO?: string
  USUARIO_REF1_CONTACTO?: string
  // Experience 4 (optional)
  USUARIO_EXP4_EMPRESA?: string
  USUARIO_EXP4_CARGO?: string
  USUARIO_EXP4_FECHAS?: string
  USUARIO_EXP4_FECHA_FIN?: string
  USUARIO_EXP4_DESC1?: string
  USUARIO_EXP4_DESC2?: string
  USUARIO_EXP4_DESC3?: string
  // Experience 5 (optional)
  USUARIO_EXP5_EMPRESA?: string
  USUARIO_EXP5_CARGO?: string
  USUARIO_EXP5_FECHAS?: string
  USUARIO_EXP5_FECHA_FIN?: string
  USUARIO_EXP5_DESC1?: string
  USUARIO_EXP5_DESC2?: string
  USUARIO_EXP5_DESC3?: string
}