import { StyleWritingConfig, StyleDesignConfig, StyleMetadata } from '../types/style-config'

import { harvardWriting,      harvardDesign,      harvardMeta      } from './harvard'
import { stanfordWriting,     stanfordDesign,     stanfordMeta     } from './stanford'
import { siliconValleyWriting, siliconValleyDesign, siliconValleyMeta } from './silicon-valley'
import { techWriting,         techDesign,         techMeta         } from './tech'
import { minimalistWriting,   minimalistDesign,   minimalistMeta   } from './minimalist'
import { europassWriting,     europassDesign,     europassMeta     } from './europass'
import { executiveWriting,    executiveDesign,    executiveMeta    } from './executive'

// ─────────────────────────────────────────────────────────────────────────────
// Registry maps — keyed by style ID
// ─────────────────────────────────────────────────────────────────────────────

const WRITING_CONFIGS: Record<string, StyleWritingConfig> = {
  'harvard':       harvardWriting,
  'stanford':      stanfordWriting,
  'silicon-valley': siliconValleyWriting,
  'tech':          techWriting,
  'minimalist':    minimalistWriting,
  'europass':      europassWriting,
  'executive':     executiveWriting,
}

const DESIGN_CONFIGS: Record<string, StyleDesignConfig> = {
  'harvard':       harvardDesign,
  'stanford':      stanfordDesign,
  'silicon-valley': siliconValleyDesign,
  'tech':          techDesign,
  'minimalist':    minimalistDesign,
  'europass':      europassDesign,
  'executive':     executiveDesign,
}

const METADATA: Record<string, StyleMetadata> = {
  'harvard':       harvardMeta,
  'stanford':      stanfordMeta,
  'silicon-valley': siliconValleyMeta,
  'tech':          techMeta,
  'minimalist':    minimalistMeta,
  'europass':      europassMeta,
  'executive':     executiveMeta,
}

export const STYLE_IDS = [
  'harvard',
  'stanford',
  'silicon-valley',
  'tech',
  'minimalist',
  'europass',
  'executive',
] as const

export type StyleId = typeof STYLE_IDS[number]

// ─────────────────────────────────────────────────────────────────────────────
// Getters — throw if unknown style (fail loud, never silent)
// ─────────────────────────────────────────────────────────────────────────────

export function getWritingConfig(styleId: string): StyleWritingConfig {
  const config = WRITING_CONFIGS[styleId]
  if (!config) throw new Error(`Unknown style ID: "${styleId}". Valid IDs: ${STYLE_IDS.join(', ')}`)
  return config
}

export function getDesignConfig(styleId: string): StyleDesignConfig {
  const config = DESIGN_CONFIGS[styleId]
  if (!config) throw new Error(`Unknown style ID: "${styleId}". Valid IDs: ${STYLE_IDS.join(', ')}`)
  return config
}

export function getMeta(styleId: string): StyleMetadata {
  const config = METADATA[styleId]
  if (!config) throw new Error(`Unknown style ID: "${styleId}". Valid IDs: ${STYLE_IDS.join(', ')}`)
  return config
}

export function getAllStyles(): StyleMetadata[] {
  return STYLE_IDS.map(id => METADATA[id])
}

export function isValidStyleId(id: string): id is StyleId {
  return STYLE_IDS.includes(id as StyleId)
}
