import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const minimalistWriting: StyleWritingConfig = {
  id: 'minimalist',

  tone: `Design-aware, intentional, and considered. Every word is deliberate — this style
treats language the way good design treats whitespace: absence is meaningful.
No filler, no padding, no explaining the obvious.
The document itself demonstrates the candidate's sense of craft.`,

  voice: `Implicit subject, first-person suppressed. Active voice.
Short, elegant sentences. Design and creative vocabulary is appropriate:
"crafted", "shaped", "prototyped", "iterated". Avoid both corporate buzzwords
and engineering jargon. The tone is that of a thoughtful practitioner.`,

  verbTense: `Past simple for completed roles. Present simple for current active role.`,

  bulletFormula: `[Design/creative verb] + [work + medium or constraint] + [observable outcome or impact]`,

  bulletFormulaExample: `"Crafted end-to-end checkout experience for 3M users — reduced abandonment by 34% and increased mobile conversion by 18%."`,

  bulletCountRule: `Most recent role: 3–4 bullets maximum — quality over quantity is the rule here.
Prior roles: 2–3 bullets. Older roles: 1–2 bullets, definitive projects only.
In minimalist style, a shorter CV is NOT a weakness — it is a design choice.
Omitting a mediocre achievement signals discernment. Never pad to fill space.
In vacancy mode: select the bullets most aligned with the creative or functional domain of the role.`,

  verbCategories: {
    craft:    ['Crafted', 'Designed', 'Shaped', 'Prototyped', 'Illustrated', 'Composed', 'Refined'],
    built:    ['Built', 'Developed', 'Implemented', 'Shipped', 'Coded', 'Engineered'],
    led:      ['Led', 'Directed', 'Facilitated', 'Guided', 'Mentored', 'Partnered'],
    defined:  ['Defined', 'Established', 'Created', 'Introduced', 'Researched', 'Evaluated'],
    impact:   ['Reduced', 'Increased', 'Improved', 'Streamlined', 'Accelerated', 'Transformed'],
  },

  metricsRule: `Metrics are required but can be lighter than Harvard or Silicon Valley.
Acceptable: user-facing outcomes (conversion %, retention %, NPS), business impact ($, %),
scale (users, sessions), or production context (number of pages, editorial cycles).
A single clear metric per bullet is sufficient — do not force multiple metrics into one bullet.
When metrics are genuinely unavailable (brand work, editorial), describe the scope and reach instead.`,

  metricsExamples: [
    'Designed brand identity for Series A fintech (Figma) — adopted across 4 product surfaces and 12 marketing channels.',
    'Prototyped and shipped mobile onboarding (React Native) — improved Day-1 activation from 42% to 67%.',
    'Crafted 60-page editorial brand guide used by 8 in-house teams and 3 external agencies.',
    'Redesigned information architecture for SaaS dashboard — reduced support requests by 28% in 90 days.',
    'Led UX research across 120 user interviews, synthesized into redesign that increased task completion by 23%.',
  ],

  summaryRule: `Positioning Line instead of traditional Summary. Length: exactly 1 sentence.
Not a list of skills. Not "I am X years experienced".
It is a positioning statement: who you are professionally in one precise, memorable line.
Examples:
"Brand designer specializing in consumer tech at the intersection of motion and systems."
"Product designer with 9 years shaping B2B SaaS experiences at Series A through IPO."
"UX researcher and strategist focused on emerging markets and accessibility-first design."
Omit the positioning line entirely rather than write a generic one.`,

  sectionOrder: [
    'header',              // name + title + minimal contact
    'positioning',         // 1-sentence positioning line, replaces summary
    'experience',
    'projects',            // optional but recommended for portfolio
    'education',
    'skills',              // kept very brief — tools and competencies only
  ],

  mandatorySections: ['header', 'experience', 'education'],

  sectionFallbacks: {
    logros: `In minimalist style, notable standalone achievements (awards, publications, exhibitions)
belong in a slim "Recognition" or "Selected Work" section at the bottom. 2–3 lines maximum.
If no truly standout achievement exists, omit the section — empty recognition is worse than none.`,
    educacion: `Always include. For this style, institution and degree are enough — no extra description.`,
    habilidades: `List only tools and software used professionally, separated by commas or slashes.
No categories, no bars, no levels. Maximum 12 items.
Example: "Figma / Adobe CC / Framer / Webflow / React / Notion / Linear"`,
    resumen: `The Positioning Line (1 sentence) replaces the traditional summary.
If the user's profile doesn't support a meaningful positioning statement, omit this section entirely.
Never write a placeholder line.`,
    idiomas: `Include briefly if relevant. Format: "Spanish · English · French" — no levels unless requested.`,
  },

  prohibitions: [
    'Passive voice: "was responsible for", "was part of"',
    'First person: "I designed", "I led"',
    'Adjectives describing personal traits: "creative", "passionate", "innovative", "detail-oriented"',
    'More than 4 bullets in any single role',
    'Multi-paragraph summary — positioning line is 1 sentence maximum',
    'Listing generic tools that everyone uses (Word, PowerPoint, Slack)',
    'Skill bars or visual competency indicators — they contradict the design ethos of this style',
    'Photo (unless the candidate is in a visual field and has a strong professional portrait)',
    'Headers that are verbose or redundant with the content',
    'Dense paragraphs — every section should breathe on the page',
    'Padding bullets to fill whitespace — whitespace is intentional',
  ],
}

export const minimalistDesign: StyleDesignConfig = {
  id: 'minimalist',
  layout: 'single-column',
  hasPhoto: false,
  hasIcons: false,          // minimal header: no icons, just text separators
  accentColorOptions: ['#000000', '#1A1A1A', '#4A4A4A', '#C8B97A'],   // warm gold optional
  defaultAccentColor: '#000000',
  primaryTextColor: '#1A1A1A',
  secondaryTextColor: '#888888',
  typography: {
    recommended: ['Helvetica Neue', 'Aktiv Grotesk', 'Suisse Int\'l', 'Inter', 'DM Sans'],
    nameSize: '20–24pt light or regular weight',
    sectionHeaderSize: '9–10pt uppercase tracking-widest',
    bodySize: '10–11pt',
  },
  sectionHeaderStyle: 'uppercase tracking-widest, no rule — whitespace separates sections',
  bulletCharacter: '',      // no bullet character — em dash or thin line before item
  dateFormat: 'Mon YYYY',
  numberFormat: 'us',
}

export const minimalistMeta: StyleMetadata = {
  id: 'minimalist',
  displayName: 'Minimalista',
  tagline: 'Para perfiles creativos y de diseño. Cuando el CV mismo es una muestra de criterio.',
  industriasAltas: [
    'UX/UI design y product design',
    'Brand design e identidad visual',
    'Editorial y diseño gráfico',
    'Motion design y dirección de arte',
    'Creative direction',
    'Architecture y diseño de espacios',
  ],
  industriasMedias: [
    'Frontend development con foco en UI',
    'Photography y dirección visual',
    'Content strategy y UX writing',
  ],
  perfilIdeal: 'Profesionales de diseño y comunicación visual que quieren que el CV refleje su sensibilidad estética.',
  atsScore: '75–85/100',
  longitudRecomendada: '1 página siempre. El minimalismo no admite excepciones.',
}
