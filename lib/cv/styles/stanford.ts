import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const stanfordWriting: StyleWritingConfig = {
  id: 'stanford',

  tone: `Hybrid: Harvard rigor with tech-industry vocabulary and speed.
Formal enough for McKinsey or Goldman, accessible enough for Google or Stripe.
Achievement-oriented like Harvard but can acknowledge product metrics (DAU, MAU, NPS)
alongside traditional financial metrics. No fluff, no personality clichés.`,

  voice: `Implicit subject, first-person suppressed. Strong active voice.
Can use product/tech vocabulary: "shipped", "scaled", "launched", "grew".
Avoid purely corporate jargon OR purely hacker slang — blend is the signal.`,

  verbTense: `Past simple for completed roles. Present simple for current active role.
No progressive tenses.`,

  bulletFormula: `[Action verb] + [what was built/changed + scale or scope] + [business or user outcome with metric]`,

  bulletFormulaExample: `"Designed and shipped dynamic pricing algorithm across 8 markets, increasing average booking value by 17% and contributing $14M in incremental ARR."`,

  bulletCountRule: `Most recent role: 4–5 bullets. Prior roles: 3 bullets. Older roles: 2 bullets.
Stanford CVs include a Selected Projects section which is MANDATORY if any notable project exists.
When choosing between a project bullet and an experience bullet, prefer the one with higher measurable impact.
In vacancy mode, weight bullets toward the intersection of the candidate's strongest results and the role's priorities.`,

  verbCategories: {
    built:     ['Built', 'Shipped', 'Designed', 'Architected', 'Developed', 'Launched', 'Implemented'],
    led:       ['Led', 'Managed', 'Mentored', 'Grew', 'Hired', 'Directed', 'Coordinated'],
    impact:    ['Increased', 'Reduced', 'Generated', 'Delivered', 'Improved', 'Accelerated', 'Expanded'],
    strategic: ['Defined', 'Established', 'Formulated', 'Drove', 'Spearheaded', 'Championed', 'Secured'],
    research:  ['Researched', 'Analyzed', 'Modeled', 'Quantified', 'Evaluated', 'Benchmarked'],
  },

  metricsRule: `Every bullet requires at least one metric. Stanford accepts a wider range than pure Harvard:
Financial: $, ARR, revenue, cost savings, GMV.
Product: DAU/MAU, NPS, retention %, conversion %, engagement rate.
Engineering: latency, uptime, deploy frequency, test coverage.
Organizational: headcount, team growth %, time-to-hire.
The metric should be the most compelling number available for the achievement.`,

  metricsExamples: [
    'Shipped redesigned onboarding flow (Figma + React), improving D7 retention from 31% to 49% and reducing support tickets by 28%.',
    'Led 0→1 launch of enterprise tier: closed first 12 enterprise contracts totaling $2.4M ARR within 6 months.',
    'Grew iOS user base from 80K to 1.4M DAU by redesigning core feed algorithm and iterating on 6 A/B tests.',
    'Built internal ML platform serving 14 teams, reducing model deployment time from 3 weeks to 2 days.',
    'Negotiated $18M Series A extension with Y Combinator Continuity; extended runway by 22 months.',
    'Defined and launched API monetization strategy, converting 3,200 free-tier users to paid at $120 ARPU.',
  ],

  summaryRule: `Summary is optional for early-career (<5 years). Appropriate for mid-to-senior profiles.
If included: 2–3 lines maximum. Structure: (1) domain + seniority, (2) 1-2 defining achievements with metrics,
(3) current focus or career direction.
No adjectives. No "passionate". Must read like a fast elevator pitch to a top-tier recruiter.`,

  sectionOrder: [
    'header',
    'education',           // before experience for grad school + recent grads
    'experience',
    'projects',            // MANDATORY if notable project exists
    'skills',
    'activities',          // optional: clubs, fellowships, competitive achievements
  ],

  mandatorySections: ['header', 'education', 'experience', 'skills'],

  sectionFallbacks: {
    logros: `Stanford style integrates achievements as the experience bullets themselves.
If the user has notable standalone achievements (patents, publications, awards, competition wins),
include them in a "Honors & Awards" or "Activities" section at the bottom.`,
    educacion: `Always include. For Stanford-style CVs, education is often listed FIRST, especially for grad school.
If the user has an MBA or top-program degree, it leads the document.`,
    habilidades: `Keep skills section concise. Format: category + tool list.
Acceptable categories: Programming / ML & Data / Tools / Languages.
No skill bars. No levels for programming languages (implied proficiency).`,
    resumen: `If the user is early-career (<5 years), omit summary. Let education and experience lead.
If omitted, jump directly to Education or Experience based on career stage.`,
    idiomas: `Include if the candidate has professional-level fluency. Format: "Spanish (native), English (C2)".
CEFR levels are acceptable but not required in Stanford style.`,
  },

  prohibitions: [
    'Passive voice throughout: "was responsible for", "was tasked with", "helped to"',
    'First person: "I led", "I built"',
    'Adjectives about character: "passionate", "innovative", "dynamic", "motivated"',
    'Generic phrases: "team player", "excellent communication", "fast learner"',
    'Bullets without a numeric or clearly specified outcome',
    'Objective Statement',
    'Skill bars or visual competency ratings',
    'Photo',
    'Projects section being omitted when notable work exists',
    'Mixing Harvard formality with Silicon Valley slang in the same bullet',
  ],
}

export const stanfordDesign: StyleDesignConfig = {
  id: 'stanford',
  layout: 'single-column',
  hasPhoto: false,
  hasIcons: false,
  accentColorOptions: ['#8C1515', '#000000', '#1F3A5F', '#2D5016'],
  defaultAccentColor: '#8C1515',   // Stanford cardinal
  primaryTextColor: '#000000',
  secondaryTextColor: '#525252',
  typography: {
    recommended: ['Times New Roman', 'Garamond', 'Cambria', 'Arial', 'Helvetica'],
    nameSize: '16–18pt bold',
    sectionHeaderSize: '12pt uppercase bold',
    bodySize: '11pt',
  },
  sectionHeaderStyle: 'uppercase with full-width horizontal rule',
  bulletCharacter: '•',
  dateFormat: 'Mon YYYY',
  numberFormat: 'us',
}

export const stanfordMeta: StyleMetadata = {
  id: 'stanford',
  displayName: 'Stanford',
  tagline: 'El puente entre Harvard y Silicon Valley. Rigor institucional con mentalidad de producto.',
  industriasAltas: [
    'Product management en tech companies',
    'Investment banking y capital markets',
    'Consultoría de gestión (MBB y Tier 2)',
    'Venture capital y growth equity',
    'MBA y programas ejecutivos de élite',
    'Tech startups en stage B+ y scaleups',
  ],
  industriasMedias: [
    'Corporate strategy en Fortune 500',
    'Healthcare technology',
    'Fintech y insurtech',
  ],
  perfilIdeal: 'Profesionales de 5–15 años que operan en la intersección de negocio y tecnología.',
  atsScore: '95–98/100',
  longitudRecomendada: '1 página para <8 años. 2 páginas solo con sustanciales logros académicos o proyectos.',
}
