import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const siliconValleyWriting: StyleWritingConfig = {
  id: 'silicon-valley',

  tone: `Builder ethos: concise, specific, and technically credible. The document signals
"I ship things and I can prove it". Confident without arrogance. No corporate filler.
Every word earns its place. Brevity is not laziness — it is precision.`,

  voice: `Implicit subject, first-person suppressed. Active voice, always.
Short declarative sentences. Tech vocabulary is required — vague language signals
someone who hasn't actually built the thing. Specificity is credibility.`,

  verbTense: `Past simple for completed roles. Present simple for current active role.
No progressive tenses.`,

  bulletFormula: `[Action verb] + [technology or system name + scale/metric] + [outcome with user or business impact]`,

  bulletFormulaExample: `"Rebuilt recommendation engine (PyTorch + Apache Kafka, 2M events/day), reducing latency from 850ms to 140ms and lifting CTR by 22%."`,

  bulletCountRule: `Most recent role: 3–5 bullets. Each bullet must reference a specific technology with a scale metric.
Prior roles: 2–3 bullets each. Older roles: 1–2 bullets, landmark systems only.
In vacancy mode: prioritize bullets that name technologies listed in the job posting.
Never generic bullets — if a bullet could describe anyone, it belongs to no one.`,

  verbCategories: {
    built:      ['Built', 'Shipped', 'Implemented', 'Developed', 'Deployed', 'Architected', 'Engineered', 'Created'],
    scaled:     ['Scaled', 'Optimized', 'Reduced', 'Improved', 'Accelerated', 'Migrated', 'Refactored', 'Ported'],
    launched:   ['Launched', 'Released', 'Rolled out', 'Open-sourced', 'Delivered', 'Onboarded'],
    led:        ['Led', 'Mentored', 'Hired', 'Grew', 'Coordinated', 'Partnered'],
    designed:   ['Designed', 'Modeled', 'Defined', 'Prototyped', 'A/B tested', 'Instrumented'],
  },

  metricsRule: `Every bullet requires a technology specificity metric AND an outcome metric.
Technology specificity: exact tool name + scale (e.g., "Redis cache, 50K RPS", "Go, 400ms p99 latency").
Outcome metrics: latency (ms/s), throughput (RPS, TPS, events/day), reliability (%uptime, # incidents reduced),
user scale (DAU, MAU), revenue/cost ($, %, basis points), engineer productivity (deploy frequency, MTTR).
A bullet with generic "improved performance" is invalid — must specify what improved and by how much.`,

  metricsExamples: [
    'Built event ingestion pipeline (Go + Kafka, 800K msgs/sec), achieving 99.98% uptime over 12 months.',
    'Migrated 3-year-old Rails monolith to microservices (Node.js + gRPC), reducing p95 latency from 2.1s to 340ms.',
    'Implemented ML-powered fraud detection (XGBoost, 15M daily transactions), reducing chargebacks by $2.3M/month.',
    'Shipped iOS SDK update (Swift 5.9) adopted by 220 third-party apps, improving crash-free session rate from 96.1% to 99.3%.',
    'Led Postgres → Aurora migration (12TB, zero downtime), saving $180K/year in infrastructure costs.',
  ],

  summaryRule: `Summary is optional — Silicon Valley CVs frequently omit it. If included:
Maximum 2 lines. State: (1) what you build (e.g., "distributed backend systems"), and (2) one defining metric.
No personal adjectives. No "passionate about technology". If the user has <3 years experience, omit entirely.
Example: "Backend engineer with 7 years in distributed systems. Led infrastructure for products at 50M+ MAU scale."`,

  sectionOrder: [
    'header',               // name + title + GitHub + email + location
    'summary',              // optional, max 2 lines
    'tech-stack',           // independent prominent section — mandatory
    'experience',
    'projects',             // selected projects or open source contributions
    'education',
  ],

  mandatorySections: ['header', 'tech-stack', 'experience', 'education'],

  sectionFallbacks: {
    logros: `In Silicon Valley style, achievements are embedded in experience bullets. Do not create
a standalone achievements section. If the user has notable open-source contributions, GitHub stars,
or conference talks in their logros, include them in the Projects section.`,
    educacion: `Include institution and degree. For candidates with notable bootcamp or self-taught paths,
include it here with the credential name. CS degree from top school carries weight but is not required.`,
    habilidades: `Transformed into the Tech Stack section — the most visually prominent section after experience.
Organize by category: Languages / Frameworks / Infrastructure / Data / Tools.
Example: "Languages: Go, Python, TypeScript | Frameworks: React, FastAPI, gRPC | Infra: AWS, k8s, Terraform".
No skill bars. No levels. Stack names only.`,
    resumen: `If the user has no memorable single-line hook, omit the summary entirely.
Do not generate a placeholder. The tech stack speaks louder.`,
    idiomas: `Include only if directly relevant (e.g., working in a bilingual team or remote-first global company).
Keep it brief: language + level.`,
  },

  prohibitions: [
    'Passive voice: "was responsible for", "was tasked with"',
    'First person: "I built", "I led"',
    'Generic adjectives: "passionate", "innovative", "team player", "detail-oriented"',
    'Bullets without a specific technology name',
    'Bullets without a quantified outcome or scale metric',
    'Objective Statement',
    'Skill bars, visual ratings, or progress indicators',
    'Photo',
    'Corporate buzzwords without technical grounding: "digital transformation", "synergy", "leverage"',
    'Listing every technology ever touched — include only technologies used in the last 5 years and in which the candidate is proficient',
    'Summary longer than 2 lines',
  ],
}

export const siliconValleyDesign: StyleDesignConfig = {
  id: 'silicon-valley',
  layout: 'single-column',
  hasPhoto: false,
  hasIcons: true,
  accentColorOptions: ['#0A0A0A', '#2563EB', '#16A34A', '#7C3AED'],
  defaultAccentColor: '#2563EB',
  primaryTextColor: '#0A0A0A',
  secondaryTextColor: '#6B7280',
  typography: {
    recommended: ['Inter', 'SF Pro Text', 'Roboto', 'Source Sans Pro', 'DM Sans'],
    nameSize: '20–22pt semibold',
    sectionHeaderSize: '11–12pt uppercase tracking-wide',
    bodySize: '10–11pt',
  },
  sectionHeaderStyle: 'uppercase with thin underline',
  bulletCharacter: '–',
  dateFormat: 'Mon YYYY',
  numberFormat: 'us',
}

export const siliconValleyMeta: StyleMetadata = {
  id: 'silicon-valley',
  displayName: 'Silicon Valley',
  tagline: 'Para ingenieros y builders de alto rendimiento. Específico, técnico y sin relleno.',
  industriasAltas: [
    'Software engineering en tech companies (FAANG, unicorns, scaleups)',
    'Backend, frontend, and full-stack engineering',
    'Infrastructure, SRE, DevOps, platform engineering',
    'Data engineering and ML engineering',
    'Mobile development (iOS, Android)',
  ],
  industriasMedias: [
    'Technical product management',
    'Security engineering',
    'Developer advocacy and DX',
  ],
  perfilIdeal: 'Ingenieros de software con 2+ años de experiencia. Cuanto más técnico el rol, mejor se adapta este estilo.',
  atsScore: '88–95/100',
  longitudRecomendada: '1 página para <8 años de experiencia. 2 páginas solo con contribuciones técnicas sustanciales.',
}
