import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const executiveWriting: StyleWritingConfig = {
  id: 'executive',

  tone: `Strategic, P&L-aware, and board-room caliber. Every statement should reflect
enterprise-level thinking: revenue, markets, organizations, and capital allocation.
Never operational detail for its own sake — only when it demonstrates strategic impact.
The document reads as a brief from a CEO to the Board.`,

  voice: `Implicit subject, first-person suppressed. Strong active voice throughout.
Concise and declarative: no hedge words ("attempted to", "sought to", "tried to").
Every sentence assumes the reader is a C-suite peer or board member.`,

  verbTense: `Past simple for previous roles. Present simple for current active role.
No progressive tenses. No perfect tense in executive summary or bullets.`,

  bulletFormula: `[Strategic action verb] + [initiative or organizational scope] + [P&L or strategic outcome] + [scale context]`,

  bulletFormulaExample: `"Restructured EMEA commercial organization across 6 markets, doubling enterprise pipeline to $420M ARR and reducing CAC by 38% within 18 months."`,

  bulletCountRule: `Most recent role: 4–6 bullets focused on strategic initiatives, not tasks.
Prior roles: 3–4 bullets each, only the highest-impact P&L and organizational stories.
Older roles beyond 15 years: 2 bullets maximum — landmark decisions only.
Executive CVs are typically 2 pages; prioritize scope and impact over volume.
In vacancy mode, weight bullets toward board priorities mentioned in the posting.`,

  verbCategories: {
    leadership:   ['Led', 'Chaired', 'Directed', 'Transformed', 'Championed', 'Spearheaded', 'Orchestrated', 'Built'],
    growth:       ['Scaled', 'Expanded', 'Grew', 'Launched', 'Entered', 'Captured', 'Penetrated', 'Repositioned'],
    financial:    ['Generated', 'Delivered', 'Secured', 'Raised', 'Negotiated', 'Allocated', 'Recovered', 'Increased'],
    operational:  ['Restructured', 'Optimized', 'Streamlined', 'Centralized', 'Consolidated', 'Transformed', 'Migrated'],
    strategic:    ['Formulated', 'Defined', 'Architected', 'Designed', 'Established', 'Executed', 'Implemented'],
  },

  metricsRule: `Executive metrics must reflect P&L and organizational scope. Required categories:
Revenue (ARR, total revenue, growth %), margin (EBITDA, gross margin improvement), organizational
scale (headcount, budget, # of markets/BUs), capital events (M&A value, Series raised, capex),
and performance benchmarks (TSR, market share %, NPS at enterprise scale).
Every bullet in the Experience section must carry at least one of these metric types.`,

  metricsExamples: [
    'Orchestrated $180M acquisition of ServeMetrics Inc., integrating 340 employees across 3 countries and reaching revenue synergy of $22M within first year.',
    'Grew enterprise segment from $12M to $87M ARR over 36 months, expanding gross margin from 61% to 74%.',
    'Led Series C fundraising of $65M from Sequoia and General Atlantic, closing at 4.2× previous round valuation.',
    'Restructured North America operations, reducing headcount by 18% while increasing EBITDA from 9% to 23% in 2 fiscal years.',
    'Delivered 212% TSR over 5-year tenure versus 84% for S&P500 peer group.',
    'Negotiated $34M government contract renewal, extending partnership by 5 years and adding 2 new service lines.',
  ],

  summaryRule: `Executive Summary is MANDATORY for this style — it is the most important section.
Length: 4–7 lines. Structure: (1) total years + domain, (2) 2–3 defining transformations with metrics,
(3) expertise areas that differentiate this candidate, (4) optional: board/advisory/PE context.
No first person. No adjectives describing character. No platitudes ("visionary leader").
The summary must make a board reader want to continue to the experience section immediately.`,

  sectionOrder: [
    'header',
    'executive-summary',      // MANDATORY, replaces standard resumen
    'areas-of-expertise',     // keyword grid, 8-15 competencies
    'experience',
    'board-advisory',         // optional: board seats, advisory roles
    'education',
    'external-recognition',   // optional: awards, press, publications
  ],

  mandatorySections: ['header', 'executive-summary', 'areas-of-expertise', 'experience', 'education'],

  sectionFallbacks: {
    logros: `In executive style, standalone logros are integrated into experience bullets as peak achievements.
Do not create a separate "Achievements" section unless the posting specifically requests it.`,
    educacion: `Always include. For executives with 20+ years, education appears at the bottom.
Only include degree, institution, and graduation year — no GPA unless specifically noteworthy.`,
    habilidades: `Transform skills into the Areas of Expertise grid: 8–15 concise noun phrases
(e.g., "P&L Management", "Enterprise Sales", "M&A Integration", "Board Relations").
No skill bars. No levels. Noun phrases only.`,
    resumen: `Executive Summary is mandatory. If the user's profile lacks sufficient data for a strong summary,
use what exists to build around their most senior role and years of experience.
Do not omit — a blank summary space disqualifies this style.`,
    idiomas: `Include in header or education section if the candidate has professional-level fluency
in a second language relevant to their target market. Omit if native only.`,
  },

  prohibitions: [
    'Adjectives describing personal character: "visionary", "passionate", "dynamic", "servant leader"',
    'Passive voice: "was responsible for", "tasked with", "helped to"',
    'First person: "I led", "I grew", "my team", "my results"',
    'Operational micro-detail: specific tool names, minor process steps that belong in a manager CV',
    'Generic phrases: "team player", "cross-functional collaboration", "strong communication skills"',
    'Skill bars, progress indicators, or visual competency ratings',
    'Personal information: age, photo (unless Europass context), marital status',
    'References or "References available upon request"',
    'Bullets without P&L or organizational scope metric',
    'Executive Summary shorter than 4 lines or longer than 7 lines',
    'Areas of Expertise section with fewer than 8 or more than 15 items',
    'More than 2 pages (standard is exactly 2)',
  ],
}

export const executiveDesign: StyleDesignConfig = {
  id: 'executive',
  layout: 'single-column',
  hasPhoto: false,
  hasIcons: true,
  accentColorOptions: ['#1F3A5F', '#8B0000', '#1A1A1A', '#2C5F2E'],
  defaultAccentColor: '#1F3A5F',
  primaryTextColor: '#1A1A1A',
  secondaryTextColor: '#4A4A4A',
  typography: {
    recommended: ['Garamond', 'Cambria', 'Times New Roman', 'Georgia', 'Palatino'],
    nameSize: '18–20pt bold',
    sectionHeaderSize: '12–13pt uppercase small-caps',
    bodySize: '11pt',
  },
  sectionHeaderStyle: 'uppercase small-caps with heavy horizontal rule',
  bulletCharacter: '•',
  dateFormat: 'Mon YYYY',
  numberFormat: 'us',
}

export const executiveMeta: StyleMetadata = {
  id: 'executive',
  displayName: 'Ejecutivo',
  tagline: 'Para directivos C-suite y senior leadership. Enfocado en impacto estratégico y P&L.',
  industriasAltas: [
    'CEO / COO / CFO / CTO / CHRO',
    'Private equity portfolio management',
    'Investment banking MD / Partner',
    'Management consulting Partner / Principal',
    'Board member / Independent director',
    'Gobierno corporativo y regulación',
  ],
  industriasMedias: [
    'VP-level corporate leadership',
    'General management in multinationals',
    'Nonprofit executive director',
  ],
  perfilIdeal: 'Directivos con 15+ años de experiencia que compiten por roles C-suite o de dirección general.',
  atsScore: '85–92/100',
  longitudRecomendada: '2 páginas estándar. Solo 1 página si la carrera es menor de 12 años.',
}
