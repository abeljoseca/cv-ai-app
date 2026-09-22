import { CVContent } from './cv-content'

// ─────────────────────────────────────────────────────────────────────────────
// Vacancy analysis — output of the Haiku analysis step
// ─────────────────────────────────────────────────────────────────────────────

export interface VacancyProfile {
  cargo_objetivo: string
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'executive'
  industria: string
  skills_requeridas: string[]   // must-have
  skills_deseadas: string[]     // nice-to-have
  keywords_ats: string[]        // exact strings to incorporate naturally
  responsabilidades: string[]   // key job duties from the posting
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]  // human-readable descriptions of what failed
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline request and result
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateCVRequest {
  mode: 'general' | 'job'
  estilo: string
  descripcion_vacante?: string
}

export interface GeneratedCVRecord {
  id: string
  user_id: string
  titulo: string | null
  intencion: 'general' | 'job'
  estilo: string
  contenido_json: CVContent
  descripcion_vacante: string | null
  match_porcentaje: number | null
  created_at: string
}

export interface GenerateCVResult {
  success: true
  cv: GeneratedCVRecord
  content: CVContent
}
