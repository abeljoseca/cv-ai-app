// Exact check (spec §8.3, control 1): every figure and every proper name a sentence
// contains must appear in the source texts it cites. Pure code, deterministic, free —
// it runs before the (paid) sense check. Shared by every CV style.

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
}

// Figures compared by their digits ("1.250.000" == "1,250,000" == "1250000"; "7%" -> "7").
function figures(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map(n => n.replace(/[.,]/g, ''))
}

// Capitalised words that are not the first word of a sentence/clause (Spanish and
// Portuguese only capitalise proper names mid-sentence), plus acronyms anywhere.
function properNames(text: string): string[] {
  const out: string[] = []
  const re = /[\p{L}\p{N}][\p{L}\p{N}&+#.'-]*/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const word = m[0].replace(/[.'-]+$/, '')
    if (!/^\p{Lu}/u.test(word)) continue
    const before = text.slice(0, m.index).trimEnd()
    const clauseStart = before === '' || /[.!?:;(\n•–—-]$/.test(before)
    const acronym = word.length >= 2 && word === word.toUpperCase() && /\p{L}/u.test(word)
    if (!clauseStart || acronym) out.push(word)
  }
  return out
}

export interface ExactCheckResult {
  ok: boolean
  // Figures / names found in the sentence but not in its sources.
  missing: string[]
}

export function exactCheck(sentence: string, sourceTexts: string[]): ExactCheckResult {
  const source = sourceTexts.join(' \n ')
  const sourceFigures = new Set(figures(source))
  const normalizedSource = ` ${normalize(source).replace(/[^\p{L}\p{N}&+#]+/gu, ' ')} `
  const missing = [
    ...figures(sentence).filter(f => !sourceFigures.has(f)),
    ...properNames(sentence).filter(name => {
      const n = normalize(name).replace(/[^\p{L}\p{N}&+#]+/gu, ' ').trim()
      return n && !normalizedSource.includes(` ${n} `)
    }),
  ]
  return { ok: missing.length === 0, missing: [...new Set(missing)] }
}
