import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const techWriting: StyleWritingConfig = {
  id: 'tech',

  tone: `Technically credible and business-aware. More conventional than Silicon Valley —
the audience includes both technical reviewers and HR/recruitment coordinators.
Demonstrates depth without alienating non-technical readers. Balanced: neither
pure engineering jargon nor vague corporate language.`,

  voice: `Implicit subject, first-person suppressed. Active voice throughout.
Can alternate between technical specificity and business framing within the same CV.
The reader should see both "this person can build it" and "this person understands why".`,

  verbTense: `Past simple for completed roles. Present simple for current active role.
No progressive tenses.`,

  bulletFormula: `[Action verb] + [technology/system + context] + [measurable outcome for the team or business]`,

  bulletFormulaExample: `"Developed automated testing pipeline (Playwright + GitHub Actions) reducing regression detection time from 3 days to 4 hours and cutting QA costs by $45K/year."`,

  bulletCountRule: `Most recent role: 4–5 bullets. Prior roles: 3–4 bullets. Older roles: 2–3 bullets.
Every bullet names at least one technology. Every bullet has a measurable outcome.
Mix technical metrics (latency, uptime) with business metrics (cost, time saved, user growth).
In vacancy mode: prioritize technologies and outcomes explicitly mentioned in the job description.`,

  verbCategories: {
    development: ['Developed', 'Built', 'Implemented', 'Created', 'Wrote', 'Integrated', 'Configured'],
    improvement: ['Optimized', 'Refactored', 'Automated', 'Migrated', 'Upgraded', 'Streamlined', 'Reduced'],
    leadership:  ['Led', 'Mentored', 'Coordinated', 'Reviewed', 'Onboarded', 'Managed'],
    delivery:    ['Shipped', 'Deployed', 'Released', 'Delivered', 'Launched', 'Published'],
    analysis:    ['Analyzed', 'Investigated', 'Profiled', 'Benchmarked', 'Monitored', 'Audited'],
  },

  metricsRule: `Every bullet requires a quantified outcome. Acceptable metric categories:
Performance: latency (ms), throughput (req/s), uptime (%), error rate reduction.
Business value: cost savings ($), time saved (hours/week, days/sprint), revenue impacted.
Team productivity: deployment frequency, code review cycle time, onboarding time.
Scale: users served, data volume (GB/TB/events), integrations delivered.
A bullet that ends with "improving the user experience" without a number is incomplete.`,

  metricsExamples: [
    'Built CI/CD pipeline (GitHub Actions + Docker), reducing deployment time from 2 hours to 12 minutes and eliminating manual deployment errors.',
    'Implemented Redis caching layer reducing average API response time from 420ms to 65ms, supporting 10K concurrent users.',
    'Migrated legacy PHP application to Node.js + TypeScript, reducing bug reports by 60% and improving team velocity by 35%.',
    'Developed internal dashboards (React + D3.js) used by 80 analysts daily, eliminating $12K/month in third-party BI tool licenses.',
    'Automated monthly reporting process (Python + pandas), freeing 24 analyst hours per month.',
  ],

  summaryRule: `Professional Summary: optional for junior/mid profiles, recommended for senior.
If included: 2–3 lines. Cover (1) primary domain and seniority, (2) key technology areas,
(3) one defining metric or achievement.
No adjectives about personality. No "passionate about code". Must be factual and specific.`,

  sectionOrder: [
    'header',
    'summary',             // optional
    'tech-stack',          // MANDATORY — placed before experience
    'experience',
    'projects',            // recommended if notable side projects or open source exist
    'education',
    'certifications',      // include if relevant (AWS, GCP, Azure, CompTIA, etc.)
  ],

  mandatorySections: ['header', 'tech-stack', 'experience', 'education'],

  sectionFallbacks: {
    logros: `Tech-style achievements belong in experience bullets. If the user has logros that don't fit
a role (e.g., hackathon wins, publications, open source projects), include them in Projects or Certifications.`,
    educacion: `Always include. CS/engineering degrees are weight-bearing in tech hiring.
Bootcamp graduates: include bootcamp name and graduation year as a legitimate credential.`,
    habilidades: `Becomes the Tech Stack section. Organize by category:
Programming Languages / Frameworks & Libraries / Databases / Cloud & Infrastructure / Tools.
Maximum 6 items per category. No skill bars. No levels.`,
    resumen: `For junior candidates (<3 years), omit summary — let tech stack and experience speak.
For senior candidates, a 2-line summary anchors the recruiter's first impression.`,
    idiomas: `Include if the candidate works in international teams or the posting is from a multinational.
Format: "English (C1)", "French (B2)". CEFR or equivalent.`,
  },

  prohibitions: [
    'Passive voice: "was responsible for", "was assigned to", "helped with"',
    'First person: "I built", "I managed"',
    'Adjectives about character: "passionate", "dedicated", "results-driven"',
    'Bullets without a named technology',
    'Bullets without a measurable outcome',
    'Tech Stack section omitted — it is mandatory',
    'Listing non-technical tools in the primary tech stack (e.g., Slack, Word, Outlook)',
    'Photo',
    'Skill bars or visual progress indicators',
    'Objective Statement',
    'Certifications that expired more than 3 years ago',
  ],
}

export const techDesign: StyleDesignConfig = {
  id: 'tech',
  layout: 'single-column',
  hasPhoto: false,
  hasIcons: true,
  accentColorOptions: ['#1F3A5F', '#0F766E', '#2563EB', '#374151'],
  defaultAccentColor: '#1F3A5F',
  primaryTextColor: '#111827',
  secondaryTextColor: '#6B7280',
  typography: {
    recommended: ['Inter', 'Roboto', 'Source Sans Pro', 'Lato', 'Open Sans'],
    nameSize: '18–20pt semibold',
    sectionHeaderSize: '11–12pt uppercase tracking-wide',
    bodySize: '10–11pt',
  },
  sectionHeaderStyle: 'uppercase with accent color underline',
  bulletCharacter: '•',
  dateFormat: 'Mon YYYY',
  numberFormat: 'us',
}

export const techMeta: StyleMetadata = {
  id: 'tech',
  displayName: 'Tech',
  tagline: 'Técnico y legible para reclutadores. El estándar para ingenieros en empresas mainstream.',
  industriasAltas: [
    'Software development en empresas tech',
    'DevOps, SRE, y cloud engineering',
    'Data science y análisis de datos',
    'Ciberseguridad',
    'IT management y sistemas',
    'QA y testing engineering',
  ],
  industriasMedias: [
    'Technical project management',
    'Business intelligence y analytics',
    'Startups early-stage',
  ],
  perfilIdeal: 'Ingenieros y técnicos de cualquier nivel que postulan a empresas con procesos de selección mixtos (técnico + HR).',
  atsScore: '90–96/100',
  longitudRecomendada: '1 página para <7 años. 1–2 páginas para experiencia extensa.',
}
