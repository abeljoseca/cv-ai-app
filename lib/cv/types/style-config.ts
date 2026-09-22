// StyleWritingConfig  — governs how the AI writes
// StyleDesignConfig   — governs how the React component renders
// StyleMetadata       — governs recommendations and UI copy

export type LayoutType = 'single-column' | 'two-column-sidebar'
export type DateFormat = 'Mon YYYY' | 'MM/YYYY' | 'DD/MM/YYYY'
export type NumberFormat = 'us' | 'eu'

// ─────────────────────────────────────────────────────────────────────────────
// Writing Config — injected into every generation prompt
// ─────────────────────────────────────────────────────────────────────────────

export interface StyleWritingConfig {
  id: string

  // Voice and tone
  tone: string              // precise description of the required tone
  voice: string             // person, active/passive, tense rules
  verbTense: string         // explicit: "past simple for previous roles, present for current"

  // Bullet construction
  bulletFormula: string            // formula as plain instruction
  bulletFormulaExample: string     // one real example matching the formula
  bulletCountRule: string          // how many per role and how to prioritize

  // Verb vocabulary by semantic category
  verbCategories: Record<string, string[]>

  // Metrics
  metricsRule: string        // what qualifies as a required metric
  metricsExamples: string[]  // 4-6 real examples of correctly formatted metrics

  // Summary / Profile section
  summaryRule: string        // how long, what to include, when to omit

  // Section control
  sectionOrder: string[]       // canonical order for this style
  mandatorySections: string[]  // sections that cannot be absent if data exists
  sectionFallbacks: Record<string, string>  // what to do when section data is missing

  // Prohibitions — things that disqualify the output for this style
  prohibitions: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Design Config — used by React components
// ─────────────────────────────────────────────────────────────────────────────

export interface StyleDesignConfig {
  id: string
  layout: LayoutType
  hasPhoto: boolean            // true only for Europass
  hasIcons: boolean            // contact icons in header
  accentColorOptions: string[] // palette from research
  defaultAccentColor: string
  primaryTextColor: string
  secondaryTextColor: string   // dates, locations, metadata
  typography: {
    recommended: string[]
    nameSize: string
    sectionHeaderSize: string
    bodySize: string
  }
  sectionHeaderStyle: string   // 'uppercase' | 'small-caps' | 'bold-underline'
  bulletCharacter: string      // '•' | '–' | '' (none)
  dateFormat: DateFormat
  numberFormat: NumberFormat
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata — used by style selector UI and recommendation engine
// ─────────────────────────────────────────────────────────────────────────────

export interface StyleMetadata {
  id: string
  displayName: string
  tagline: string
  industriasAltas: string[]
  industriasMedias: string[]
  perfilIdeal: string
  atsScore: string           // e.g. '95-99/100'
  longitudRecomendada: string
}
