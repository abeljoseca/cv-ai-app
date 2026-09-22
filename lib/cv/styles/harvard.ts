import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const harvardWriting: StyleWritingConfig = {
  id: 'harvard',

  tone: `Formal, factual, dispassionate. No adjectives that describe the candidate's character.
No enthusiasm markers. No first person. The document reads as a record of verified facts,
not as self-promotion. Every sentence is a defensible claim.`,

  voice: `Implicit subject — the pronoun "I" is grammatically suppressed throughout.
Active voice is mandatory. Passive constructions are prohibited.
Never: "was responsible for", "was tasked with", "duties included", "helped to".
Always: the verb is the actor, the candidate is implied.`,

  verbTense: `Past simple for all completed roles. Present simple only for the candidate's current active role.
No progressive tenses. No perfect tenses in bullet points.`,

  bulletFormula: `[Action verb — past simple] + [specific action or system] + [quantified result] + [context, tool, or scale when relevant]`,

  bulletFormulaExample: `"Restructured working capital model across 14 entities, reducing reconciliation cycle from 12 to 4 days and recovering $2.3M in trapped cash within Q1."`,

  bulletCountRule: `Most recent role: 4–5 bullets. Roles 2–3 years prior: 3–4 bullets. Older roles: 2–3 bullets.
When the user has more achievements than the limit, rank by magnitude of quantified impact and include
only the highest-impact bullets. For CV Vacancy mode: rank by relevance to the target role first,
then by impact magnitude. Never cut an achievement arbitrarily — cut by informed priority.`,

  verbCategories: {
    leadership:  ['Led', 'Directed', 'Orchestrated', 'Championed', 'Spearheaded', 'Oversaw', 'Supervised', 'Chaired'],
    analytical:  ['Analyzed', 'Modeled', 'Evaluated', 'Quantified', 'Benchmarked', 'Forecasted', 'Assessed', 'Audited'],
    execution:   ['Implemented', 'Delivered', 'Deployed', 'Executed', 'Launched', 'Scaled', 'Managed', 'Administered'],
    improvement: ['Optimized', 'Streamlined', 'Restructured', 'Transformed', 'Accelerated', 'Automated', 'Reduced', 'Increased'],
    financial:   ['Negotiated', 'Secured', 'Raised', 'Generated', 'Recovered', 'Allocated', 'Budgeted'],
  },

  metricsRule: `Every bullet point must contain at least one quantified metric. Acceptable metric types:
absolute values ($, €, transactions, countries, team size), relative values (%, multiples, percentiles),
time-based improvements (days, hours, months reduced), or ranking/scale indicators.
A bullet without a metric is incomplete and must be revised or replaced.`,

  metricsExamples: [
    'Increased regional sales by 34% through restructured customer acquisition process, from $4.2M to $5.6M annually.',
    'Reduced supplier onboarding cycle from 21 to 8 days, cutting procurement overhead by $180K/year.',
    'Led team of 14 analysts across 3 markets; delivered 99.7% reporting accuracy over 18-month engagement.',
    'Negotiated $2.1M contract renewal at 12% margin improvement over prior year terms.',
    'Implemented ERP migration for 6 business units, completing 3 weeks ahead of schedule with zero data loss.',
  ],

  summaryRule: `Professional Summary is optional in Harvard style. Most strong Harvard CVs omit it entirely
and let the experience speak. If included: maximum 3 lines, value-oriented phrasing only,
no adjectives describing personal character, no first person ("I", "my"), no enthusiasm qualifiers.
Example of acceptable summary: "Finance professional with 8 years in investment banking and private equity.
Track record of $3B+ in executed transactions across healthcare and industrials. CFA charterholder."`,

  sectionOrder: [
    'header',
    'education',        // before experience for <5 years post-graduation
    'experience',
    'leadership',       // especially for students and early-career
    'skills',
  ],

  mandatorySections: ['header', 'experience', 'education', 'skills'],

  sectionFallbacks: {
    logros: `If the logros array is empty but experiencias contain rich descriptions,
extract 2–3 achievement statements from the experience descriptions and populate logros.
If no source exists, omit the section entirely.`,
    educacion: `Always include. If dates are missing, include institution and degree without dates.`,
    habilidades: `Always include. If minimal, list technical tools, languages, and certifications only.`,
    resumen: `Omit the summary if the user has fewer than 3 years of experience or if no strong narrative exists.
Do not generate a generic summary — omit rather than produce filler.`,
    idiomas: `Include only if the user has at least one language with a real level indicated. Do not invent levels.`,
  },

  prohibitions: [
    'Passive voice: "was responsible for", "was tasked with", "duties included", "helped to", "assisted with"',
    'First person: "I led", "I managed", "my role was", "I was part of"',
    'Adjectives describing character: "innovative", "passionate", "dynamic", "results-driven", "dedicated", "motivated"',
    'Filler phrases: "team player", "strong communication skills", "detail-oriented", "fast learner", "go-getter"',
    'Repeating the same action verb more than once across the entire CV',
    'Objective Statement — Harvard CVs do not include this section',
    'Photo or personal image of any kind',
    'Personal information: age, marital status, religion, nationality (unless work authorization relevant)',
    'References or "References available upon request"',
    'Skill bars, progress indicators, or any visual competency rating',
    'Multiple columns or sidebar layouts',
    'Bullets that contain no quantified metric',
  ],
}

export const harvardDesign: StyleDesignConfig = {
  id: 'harvard',
  layout: 'single-column',
  hasPhoto: false,
  hasIcons: false,
  accentColorOptions: ['#000000', '#595959', '#1F3A5F'],
  defaultAccentColor: '#1F3A5F',   // navy accent for name and section headers
  primaryTextColor: '#000000',
  secondaryTextColor: '#595959',   // dates, locations
  typography: {
    recommended: ['Times New Roman', 'Garamond', 'Cambria', 'Calibri', 'Arial'],
    nameSize: '16–18pt bold',
    sectionHeaderSize: '12–13pt uppercase bold',
    bodySize: '11pt',
  },
  sectionHeaderStyle: 'uppercase with horizontal rule below',
  bulletCharacter: '•',
  dateFormat: 'Mon YYYY',
  numberFormat: 'us',
}

export const harvardMeta: StyleMetadata = {
  id: 'harvard',
  displayName: 'Harvard',
  tagline: 'El formato más influyente del mundo profesional. Clásico, estructurado y enfocado en logros medibles.',
  industriasAltas: [
    'Banca de inversión y mercados de capitales',
    'Consultoría estratégica top-tier',
    'Private equity y hedge funds',
    'Derecho corporativo de élite',
    'Organismos multilaterales y think tanks',
    'Government affairs y policy',
  ],
  industriasMedias: [
    'Corporate strategy en Fortune 500',
    'Healthcare administration',
    'Education leadership',
  ],
  perfilIdeal: 'Candidatos orientados a logros cuantificables que postulan a industrias de alta exigencia institucional.',
  atsScore: '97–99/100',
  longitudRecomendada: '1 página estricta (hasta 10 años de experiencia). 2 páginas solo con 15+ años sustantivos.',
}
