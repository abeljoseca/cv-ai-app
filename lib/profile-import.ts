// Shared date rules for the routes that write AI-extracted data into the profile
// (/api/chat, /api/parse-document, /api/profile/hydrate). Dates must reach the DB in
// the canonical form of lib/profile-date.ts ('AAAA' or 'AAAA-MM').

const PRESENT = /^(presente|actualidad|actual|present|current|hoy|en curso)$/i

export function isPresentMarker(value: string | null | undefined): boolean {
  return !!value && PRESENT.test(value.trim())
}

// Prompt fragment so every extraction prompt asks for dates the same way.
export const PROFILE_DATE_RULES = `FECHAS (fecha_inicio / fecha_fin):
- "AAAA-MM" si la fuente da mes y año (ej. "2021-03"); "AAAA" si solo da el año (ej. "2021").
- null si no aparece. NUNCA inventes el mes ni el año.
- Trabajo actual ("Presente", "Actualidad") → fecha_fin null.`

// Logro → job link (logros.experiencia_id). The AI only reports the company it read in
// the source; the link is made here, and only when that company matches exactly one of
// the user's experiences. Otherwise it stays empty for the user to fill in manually.
export function findExperienciaIdByEmpresa(
  experiencias: Array<{ id: string; empresa: string | null }>,
  empresa: string | null | undefined,
): string | null {
  const target = empresa?.toLowerCase().trim()
  if (!target) return null
  const matches = experiencias.filter(e => e.empresa?.toLowerCase().trim() === target)
  return matches.length === 1 ? matches[0].id : null
}

export const LOGRO_EMPRESA_RULE = `- empresa: nombre de la empresa donde se logró, SOLO si la fuente lo indica claramente
  (ej. el logro aparece en la descripción de ese empleo). Si no está claro → null. Nunca lo adivines.`

// ── Import report (CEO decision 2026-09-25) ──────────────────────────────────
// The confirmation screen shows what an import ADDED and what was ALREADY in the profile —
// never the profile totals, which read as "imported N" when nothing new was saved.

export const IMPORT_SECTIONS = ['experiencias', 'educacion', 'habilidades', 'idiomas', 'certificaciones', 'logros'] as const
export type ImportSection = typeof IMPORT_SECTIONS[number]
export type ImportCounts = Record<ImportSection, number>

export interface ImportReport {
  agregados: ImportCounts
  existentes: ImportCounts
}

export function emptyImportReport(): ImportReport {
  const zero = () => Object.fromEntries(IMPORT_SECTIONS.map(s => [s, 0])) as ImportCounts
  return { agregados: zero(), existentes: zero() }
}

// ── Near-duplicate achievements (CEO decision 2026-09-25) ────────────────────
// An imported achievement is skipped when it restates one already saved: the same figures
// and most of the same words. When in doubt it is imported — a repeat is better than a
// lost achievement.

const LOGRO_STOPWORDS = new Set(['hasta', 'mediante', 'traves', 'para', 'como', 'desde', 'entre', 'sobre', 'durante', 'logrando', 'with', 'from', 'through'])

function logroWords(text: string): Set<string> {
  const folded = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const words = folded.match(/\p{L}{4,}/gu) ?? []
  // 4-letter stems so "reduje"/"reducir" or "facturas"/"facturación" count as the same word.
  return new Set(words.filter(w => !LOGRO_STOPWORDS.has(w)).map(w => w.slice(0, 4)))
}

function logroFigures(text: string): string {
  return [...new Set(text.match(/\d+(?:[.,]\d+)*/g) ?? [])].map(n => n.replace(/[.,]/g, '')).sort().join('|')
}

export function isNearDuplicateLogro(candidate: string, existing: string[]): boolean {
  const figures = logroFigures(candidate)
  const words = logroWords(candidate)
  if (words.size === 0) return false
  // With figures, matching numbers already say a lot; without them, ask for more overlap.
  const threshold = figures ? 0.6 : 0.8
  return existing.some(other => {
    if (logroFigures(other) !== figures) return false
    const ow = logroWords(other)
    let common = 0
    for (const w of words) if (ow.has(w)) common++
    return common / Math.min(words.size, ow.size || 1) >= threshold
  })
}
