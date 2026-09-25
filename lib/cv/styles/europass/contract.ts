// Europass template contract (spec §2–§4). Pure data: the template (4d) and the editor
// panel (step 5) read it, so the section order, slot types and visual presets live in
// exactly one place.

export type SlotKind = 'nucleo' | 'activable' | 'recomendada'

export interface SlotDef {
  key: string
  label: string
  kind: SlotKind
}

export interface SectionDef extends SlotDef {
  // Per-item or header sub-fields that can be switched on/off individually.
  fields?: SlotDef[]
}

// Fixed order — never reorderable by the user (spec §4).
export const EUROPASS_SECTIONS: SectionDef[] = [
  {
    key: 'informacion_personal', label: 'Información personal', kind: 'nucleo',
    fields: [
      { key: 'foto', label: 'Foto', kind: 'activable' },
      { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', kind: 'activable' },
      { key: 'nacionalidad', label: 'Nacionalidad', kind: 'recomendada' },
      { key: 'direccion', label: 'Dirección completa', kind: 'activable' },
      { key: 'linkedin', label: 'LinkedIn', kind: 'activable' },
      { key: 'orcid', label: 'ORCID', kind: 'activable' },
      { key: 'researchgate', label: 'ResearchGate', kind: 'activable' },
    ],
  },
  { key: 'sobre_mi', label: 'Sobre mí', kind: 'nucleo' },
  {
    key: 'experiencia_laboral', label: 'Experiencia laboral', kind: 'nucleo',
    fields: [
      { key: 'lugar', label: 'Ciudad y país del puesto', kind: 'activable' },
      { key: 'sector_nace', label: 'Sector de actividad (NACE)', kind: 'activable' },
    ],
  },
  {
    key: 'educacion_formacion', label: 'Educación y formación', kind: 'nucleo',
    fields: [
      { key: 'nivel_isced', label: 'Nivel CINE/ISCED', kind: 'recomendada' },
      { key: 'lugar', label: 'Ciudad y país', kind: 'activable' },
      { key: 'materias', label: 'Materias principales', kind: 'activable' },
    ],
  },
  {
    key: 'competencias_linguisticas', label: 'Competencias lingüísticas', kind: 'nucleo',
    fields: [{ key: 'certificacion', label: 'Certificación oficial', kind: 'activable' }],
  },
  {
    key: 'competencias_digitales', label: 'Competencias digitales', kind: 'nucleo',
    fields: [{ key: 'digcomp', label: 'Marco DigComp', kind: 'recomendada' }],
  },
  { key: 'otras_competencias', label: 'Otras competencias', kind: 'nucleo' },
  { key: 'permiso_conducir', label: 'Permiso de conducir', kind: 'activable' },
  {
    key: 'informacion_adicional', label: 'Información adicional', kind: 'activable',
    fields: [
      { key: 'logros_destacados', label: 'Logros destacados', kind: 'activable' },
      { key: 'publicaciones', label: 'Publicaciones', kind: 'activable' },
      { key: 'ponencias', label: 'Ponencias', kind: 'activable' },
      { key: 'voluntariado', label: 'Voluntariado', kind: 'activable' },
      { key: 'premios_becas', label: 'Premios y becas', kind: 'activable' },
      { key: 'afiliaciones', label: 'Afiliaciones', kind: 'activable' },
    ],
  },
  { key: 'anexos', label: 'Anexos', kind: 'activable' },
]

// Header personal-data grid order (spec §4.1). Off/empty fields are skipped, no gaps.
export const EUROPASS_HEADER_ORDER = [
  'fecha_nacimiento', 'nacionalidad', 'direccion_o_ciudad', 'telefono', 'email', 'linkedin', 'orcid', 'researchgate',
] as const

// Visual presets (spec §2). The user picks among these, never free values.
export const EUROPASS_ACCENTS = ['#003399', '#1A2B4C', '#006EBF', '#1A1A1A'] as const
export const EUROPASS_DEFAULT_ACCENT = '#003399'

export const EUROPASS_DENSITIES = {
  compacto: { lineHeight: 1.1, entreSecciones: '10.5pt', bajoTitulo: '6pt', entreItems: '4.5pt' },
  estandar: { lineHeight: 1.2, entreSecciones: '14pt', bajoTitulo: '8pt', entreItems: '6pt' },
  amplio: { lineHeight: 1.35, entreSecciones: '17pt', bajoTitulo: '10pt', entreItems: '7pt' },
} as const
export type EuropassDensity = keyof typeof EUROPASS_DENSITIES
export const EUROPASS_DEFAULT_DENSITY: EuropassDensity = 'estandar'

export const EUROPASS_PHOTO_SIZES = {
  pequena: { width: '24mm', height: '32mm' },
  mediana: { width: '30mm', height: '40mm' },
  grande: { width: '33mm', height: '44mm' },
} as const
export type EuropassPhotoSize = keyof typeof EUROPASS_PHOTO_SIZES
export const EUROPASS_DEFAULT_PHOTO_SIZE: EuropassPhotoSize = 'mediana'

// AI writing limits (spec §8.2).
export const EUROPASS_AI_LIMITS = {
  sobreMiLineas: { min: 3, max: 5 },
  bulletsPorPuesto: { min: 3, max: 5 },
} as const
