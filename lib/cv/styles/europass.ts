import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

export const europassWriting: StyleWritingConfig = {
  id: 'europass',

  tone: `Descriptive, formal, and institutional. Europass follows European administrative
conventions: factual, impersonal, comprehensive. Unlike American styles, the goal is
completeness rather than impact — the reader wants to verify qualifications, not be persuaded.
No persuasive language. No achievements framed as "wins". Just facts.`,

  voice: `Third person implicit or infinitive constructions.
European convention: infinitives as headings ("Coordinación de", "Responsable de"),
or substantive noun phrases. Active constructions preferred but passive is acceptable.
No first person. No "I" anywhere.`,

  verbTense: `Infinitives or gerunds for responsibility descriptions.
Past simple or imperfect for completed roles where tense is necessary.`,

  bulletFormula: `[Noun phrase or infinitive] + [scope of responsibility or qualification] + [context when relevant]`,

  bulletFormulaExample: `"Coordinación del equipo de auditoría interna (8 personas) en 3 países del área EMEA."`,

  bulletCountRule: `3–5 responsibility descriptions per role. Europass values completeness over impact.
Every significant responsibility is listed — this is different from American styles where only
top achievements appear. In vacancy mode: lead with responsibilities that match the posting's scope.
Order responsibilities from most relevant to the target role to least.`,

  verbCategories: {
    coordination: ['Coordinación de', 'Gestión de', 'Supervisión de', 'Dirección de', 'Responsable de'],
    execution:    ['Desarrollo de', 'Implementación de', 'Elaboración de', 'Ejecución de', 'Aplicación de'],
    analysis:     ['Análisis de', 'Evaluación de', 'Seguimiento de', 'Control de', 'Auditoría de'],
    communication:['Redacción de', 'Presentación de', 'Negociación de', 'Colaboración en', 'Representación de'],
    support:      ['Asistencia a', 'Apoyo en', 'Participación en', 'Contribución a'],
  },

  metricsRule: `Metrics are secondary in Europass — scope is primary.
When metrics exist, use European number format: 1.250.000 (period as thousands separator), 3,5% (comma as decimal).
Currency: €, not $ unless the context is explicitly USD-denominated.
Scope qualifiers are acceptable as "metrics": number of team members, countries, business units,
budget managed, contracts negotiated. Specific monetary results are included but not mandatory per bullet.`,

  metricsExamples: [
    'Gestión del presupuesto departamental de 1.200.000 € anuales distribuidos en 4 líneas de actividad.',
    'Supervisión de equipo multidisciplinar de 12 personas en Madrid, Lisboa y Bruselas.',
    'Coordinación de proceso de licitación pública para contrato de servicios valorado en 850.000 €.',
    'Responsable de elaboración de informes trimestrales para Dirección General y Consejo de Administración.',
    'Seguimiento de KPIs operativos con reducción del tiempo de ciclo de 18 a 11 días.',
  ],

  summaryRule: `Personal Statement (Perfil Personal): optional in strict Europass format but
widely used in modern European CVs. If included: 3–5 lines. Factual tone.
Describes professional specialization, years of experience, and key domains.
No personality adjectives. No first person.
Example: "Profesional de recursos humanos con 12 años de experiencia en el sector financiero y asegurador.
Especialización en adquisición de talento, desarrollo organizacional y relaciones laborales a nivel europeo."`,

  sectionOrder: [
    'header',              // includes photo (MANDATORY), full date of birth optional by country
    'personal-information',// structured block per Europass: address, phone, email, nationality
    'personal-statement',  // optional 3–5 line factual summary
    'work-experience',     // chronological reverse, full month + year
    'education',           // full qualification names, ISCED level if known
    'languages',           // MANDATORY with CEFR levels per skill
    'digital-competences', // optional: DigComp framework levels
    'skills',              // soft skills and other competences — brief
    'additional-information', // publications, driving licence, memberships
  ],

  mandatorySections: ['header', 'work-experience', 'education', 'languages'],

  sectionFallbacks: {
    logros: `Europass does not have a standalone achievements section. Notable accomplishments
are embedded as the most prominent responsibility descriptions in each role.
Awards or official recognitions belong in "Additional Information".`,
    educacion: `ALWAYS include, even partial or in-progress. Use official credential name.
Include official date of award and awarding institution's full name.
Add ISCED level in parentheses if known: "(ISCED 6 — Bachelor)", "(ISCED 7 — Master)".`,
    habilidades: `Brief skills section after languages. Format as brief noun phrases or categories.
Include digital competences separately if relevant. No skill bars (Europass removed them in 2020 format).`,
    resumen: `Factual personal statement is recommended but not mandatory.
If the user has insufficient information, omit rather than generate filler.`,
    idiomas: `MANDATORY section. Every language must have CEFR levels for all 5 skills:
A1/A2/B1/B2/C1/C2 for: Comprensión auditiva, Comprensión lectora, Interacción oral,
Expresión oral, Expresión escrita. Native language is listed as "Lengua materna".
Never estimate CEFR levels — use only what the user reports.`,
  },

  prohibitions: [
    'Persuasive language: "achieved", "delivered", "drove growth", "championed"',
    'First person: "I managed", "I led", "my responsibility"',
    'American number format in European context: use 1.250.000 not 1,250,000',
    'Dollar signs without context: prefer € for European roles',
    'Omitting photo — photo is mandatory in Europass format',
    'Skill bars or visual competency indicators (Europass 2020 removed these)',
    'CEFR levels without breaking down into the 5 skills (omit or do it properly)',
    'Estimated or invented CEFR levels — use only user-reported levels',
    'Driving licence omitted when candidate has one — include in Additional Information',
    'Acronyms without expansion on first use',
    'Dates without month: all dates must include month and year (Jan 2020, not just 2020)',
  ],
}

export const europassDesign: StyleDesignConfig = {
  id: 'europass',
  layout: 'single-column',
  hasPhoto: true,             // MANDATORY — photo is part of the Europass standard
  hasIcons: true,
  accentColorOptions: ['#003399', '#1A2B4C', '#006EBF'],   // EU blue family
  defaultAccentColor: '#003399',   // EU institutional blue
  primaryTextColor: '#1A1A1A',
  secondaryTextColor: '#555555',
  typography: {
    recommended: ['Calibri', 'Arial', 'Helvetica', 'Verdana', 'Open Sans'],
    nameSize: '16–18pt bold',
    sectionHeaderSize: '12pt bold with EU blue background band',
    bodySize: '11pt',
  },
  sectionHeaderStyle: 'blue band header — EU institutional style',
  bulletCharacter: '–',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'eu',
}

export const europassMeta: StyleMetadata = {
  id: 'europass',
  displayName: 'Europeo (Europass)',
  tagline: 'El formato oficial de la Unión Europea. Estándar en administración pública y movilidad transfronteriza.',
  industriasAltas: [
    'Administración pública y organismos europeos',
    'Educación e investigación universitaria',
    'Entidades financieras reguladas en Europa',
    'Movilidad internacional dentro de la UE',
    'ONGs y entidades del tercer sector europeo',
    'Concursos y licitaciones públicas',
  ],
  industriasMedias: [
    'Recursos humanos en multinacionales europeas',
    'Sector salud con homologación europea',
    'Legal y compliance en entorno UE',
  ],
  perfilIdeal: 'Profesionales que postulan a empleos en o con la UE, instituciones públicas europeas, o procesos de homologación oficial.',
  atsScore: '70–82/100',
  longitudRecomendada: '2–3 páginas. La exhaustividad es una virtud en Europass.',
}
