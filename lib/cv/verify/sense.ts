// Sense check (spec §8.3, control 2): an independent, cheaper model judges whether each
// sentence follows from its cited sources — catching what the exact check can't see
// (e.g. "participé" → "lideré", added scope or results). One call for all sentences.
// Fail-safe: any sentence without an explicit "supported" verdict counts as NOT supported.
// Shared by every CV style.

import type Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'

export const SENSE_CHECK_MODEL = 'claude-haiku-4-5'

export interface SenseItem {
  id: string
  texto: string
  fuentes: string[]
}

export interface SenseVerdict {
  apoyado: boolean
  motivo: string
}

export type SenseJudge = (items: SenseItem[]) => Promise<Map<string, SenseVerdict>>

const SYSTEM = `You verify sentences written for a CV against the candidate's own source texts.

A sentence is SUPPORTED when every claim in it is stated in, or directly implied by, its sources. Rephrasing, summarising, reordering, merging and changing grammatical person or style are all fine.

A sentence is NOT SUPPORTED when it adds anything the sources do not say, for example:
- a figure, result, metric, team size, budget, duration or frequency;
- more seniority or responsibility than stated ("participated" → "led", "support" → "responsible for", "helped" → "managed");
- a tool, company, client, product, place or domain;
- a consequence or impact the sources do not claim.

Judge each sentence independently, strictly against its own sources. When in doubt, it is NOT supported.
Give a short reason in the same language as the sentence.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['veredictos'],
  properties: {
    veredictos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'apoyado', 'motivo'],
        properties: {
          id: { type: 'string' },
          apoyado: { type: 'boolean' },
          motivo: { type: 'string' },
        },
      },
    },
  },
} as const

export function anthropicSenseJudge(anthropic: Anthropic): SenseJudge {
  return async (items) => {
    const verdicts = new Map<string, SenseVerdict>()
    if (items.length === 0) return verdicts
    const response = await anthropic.messages.parse({
      model: SENSE_CHECK_MODEL,
      max_tokens: 8000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Judge every sentence. Return one verdict per id.\n\n${JSON.stringify(items.map(i => ({ id: i.id, sentence: i.texto, sources: i.fuentes })), null, 2)}`,
      }],
      output_config: { format: jsonSchemaOutputFormat(SCHEMA) },
    })
    if (response.stop_reason !== 'end_turn' || !response.parsed_output) return verdicts // fail-safe: none supported
    const known = new Set(items.map(i => i.id))
    for (const v of (response.parsed_output as { veredictos: Array<{ id: string } & SenseVerdict> }).veredictos) {
      if (known.has(v.id) && !verdicts.has(v.id)) verdicts.set(v.id, { apoyado: v.apoyado === true, motivo: v.motivo })
    }
    return verdicts
  }
}
