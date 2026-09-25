// Europass writing prompt (spec §8). The AI writes ONLY "Sobre mí" and the experience
// bullets, and must cite, for every sentence, the source references it wrote from.
// Everything else in the CV is placed by code (mapper.ts).
//
// The system prompt is static (no per-user data) so it can be cached; all user data goes
// in the user message.

import type { EuropassAISources } from './schema'
import { EUROPASS_AI_LIMITS } from './contract'

const { sobreMiLineas, bulletsPorPuesto } = EUROPASS_AI_LIMITS

export const EUROPASS_SYSTEM_PROMPT = `You write two parts of a Europass CV from a candidate's own profile data: the "Sobre mí" summary and the bullet points of each job. Everything else in the CV is filled in by software; do not produce it.

You receive SOURCES. Each source has a reference ("ref") and a text. They are the only facts you may use.

WRITING STYLE (Europass, European administrative convention)
- Descriptive, formal and impersonal. The reader wants to verify qualifications, not be persuaded.
- No first person and no third person verb conjugations. Use nominal constructions or infinitives:
  "Coordinación del equipo de auditoría…", "Responsable de la elaboración de…", "Gestión de…".
- No superlatives or self-praise ("excelente", "world-class", "apasionado", "líder nato").
- No personality adjectives in "Sobre mí".
- Write in the language requested in the user message.

FACTS — ABSOLUTE RULES
- Use only facts present in the SOURCES. You may rephrase, reorder, merge and shorten, but you may never add a fact.
- Every number, percentage, amount, date, company, product, tool or proper name you write must appear literally in the sources you cite. Copy numbers exactly as written in the source.
- If the sources give no figure, describe the scope without one. Never estimate, round up or invent metrics, team sizes, budgets or results.
- Do not upgrade the candidate's role: if a source says "participé", do not write "lideré"; if it says "apoyo", do not write "responsable".
- An achievement ("logro") belongs to the job it is listed under; integrate it as one of that job's bullets.

CITATIONS
- For "Sobre mí" and for every bullet, list in "fuentes" the refs of every source the sentence relies on. Only use refs that appear in the SOURCES.
- A bullet may only cite sources of its own job. "Sobre mí" may cite any source.

LENGTH
- "Sobre mí": ${sobreMiLineas.min} to ${sobreMiLineas.max} lines about specialisation, years of experience (only the calculated figure given in the sources) and main domains. If the sources are not enough for a factual summary, return an empty string — never filler.
- Each job: ${bulletsPorPuesto.min} to ${bulletsPorPuesto.max} bullets, most relevant first. If a job's sources only support fewer, write fewer. If a job has no descriptive source, return no bullets for it. Never pad.

OUTPUT
Return the JSON object defined by the response schema: "sobre_mi" and one entry in "experiencias" per job ref you were given, in the same order.`

// JSON schema enforced by the API (structured outputs). Numeric limits are enforced in code.
export const EUROPASS_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sobre_mi', 'experiencias'],
  properties: {
    sobre_mi: {
      type: 'object',
      additionalProperties: false,
      required: ['texto', 'fuentes'],
      properties: {
        texto: { type: 'string' },
        fuentes: { type: 'array', items: { type: 'string' } },
      },
    },
    experiencias: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['ref', 'bullets'],
        properties: {
          ref: { type: 'string' },
          bullets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['texto', 'fuentes'],
              properties: {
                texto: { type: 'string' },
                fuentes: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
} as const

const LANGUAGE_NAMES: Record<string, string> = { es: 'Spanish', en: 'English', pt: 'Portuguese', fr: 'French' }

export function buildEuropassUserMessage(sources: EuropassAISources, lang: string): string {
  const payload = {
    idioma_de_salida: LANGUAGE_NAMES[lang] ?? 'Spanish',
    fuentes_generales: [
      ...(sources.resumen ? [sources.resumen] : []),
      ...sources.hechos,
    ],
    empleos: sources.experiencias.map(e => ({
      ref: e.ref,
      cargo: e.cargo,
      empleador: e.empleador,
      periodo: e.periodo,
      fuentes: [
        { ref: e.ref, texto: `${e.cargo} en ${e.empleador}${e.periodo ? ` (${e.periodo})` : ''}` },
        ...(e.descripcion ? [e.descripcion] : []),
        ...e.logros,
      ],
    })),
  }
  return `Write the "Sobre mí" and the job bullets for this candidate. Output language: ${payload.idioma_de_salida}.

SOURCES:
${JSON.stringify(payload, null, 2)}`
}
