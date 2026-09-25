// Europass anti-invention controls (spec §8.3, step 4c):
//   1. exact check (code): figures and proper names must be in the cited sources;
//   2. sense check (independent model): the sentence must follow from its sources;
//   3. one rewrite of the failing parts, with the rejection reasons, re-checked;
//   4. fallback: whatever still fails becomes the user's own text.
// Guarantee: every sentence in the CV is verified or is literally the user's.

import { exactCheck } from '@/lib/cv/verify/exact'
import type { SenseItem, SenseJudge } from '@/lib/cv/verify/sense'
import { EUROPASS_AI_LIMITS } from './contract'
import type { EuropassAISources, EuropassBullet } from './schema'
import type { EuropassWriting } from './write'

export interface VerificationReport {
  aprobadas: number
  // Replaced by the user's own text after failing twice.
  respaldo_usuario: number
  descartadas: number
  rechazos: Array<{ texto: string; motivo: string }>
}

interface Sentence { id: string; unit: string; texto: string; fuentes: string[] }

function sourceTextMap(sources: EuropassAISources): Map<string, string> {
  const m = new Map<string, string>()
  if (sources.resumen) m.set(sources.resumen.ref, sources.resumen.texto)
  for (const h of sources.hechos) m.set(h.ref, h.texto)
  for (const e of sources.experiencias) {
    m.set(e.ref, `${e.cargo} en ${e.empleador}${e.periodo ? ` (${e.periodo})` : ''}`)
    if (e.descripcion) m.set(e.descripcion.ref, e.descripcion.texto)
    for (const l of e.logros) m.set(l.ref, l.texto)
  }
  return m
}

function sentencesOf(w: EuropassWriting, units?: Set<string>): Sentence[] {
  const out: Sentence[] = []
  if (w.sobreMi.texto && (!units || units.has('sobre_mi'))) out.push({ id: 'sobre_mi', unit: 'sobre_mi', texto: w.sobreMi.texto, fuentes: w.sobreMi.fuentes })
  for (const [ref, bullets] of w.bullets) {
    if (units && !units.has(ref)) continue
    bullets.forEach((b, i) => out.push({ id: `${ref}#${i}`, unit: ref, texto: b.texto, fuentes: b._fuentes }))
  }
  return out
}

// Returns the rejected sentence ids with their reason.
async function check(sentences: Sentence[], texts: Map<string, string>, judge: SenseJudge): Promise<Map<string, string>> {
  const rejected = new Map<string, string>()
  const toJudge: SenseItem[] = []
  for (const s of sentences) {
    // A bullet may always rely on its own job's facts (title, employer, period).
    const refs = s.unit === 'sobre_mi' ? s.fuentes : [...new Set([s.unit, ...s.fuentes])]
    const sourceTexts = refs.map(r => texts.get(r) ?? '')
    const exact = exactCheck(s.texto, sourceTexts)
    if (!exact.ok) rejected.set(s.id, `Datos que no están en las fuentes: ${exact.missing.join(', ')}`)
    else toJudge.push({ id: s.id, texto: s.texto, fuentes: sourceTexts })
  }
  let verdicts = new Map<string, { apoyado: boolean; motivo: string }>()
  try { verdicts = await judge(toJudge) } catch { /* fail-safe below: no verdict = rejected */ }
  for (const item of toJudge) {
    const v = verdicts.get(item.id)
    if (!v || !v.apoyado) rejected.set(item.id, v?.motivo || 'Sin verificación de sentido')
  }
  return rejected
}

// ── User-text fallback ───────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text.split(/\n+|(?<=[.!?])\s+|\s*[•·]\s*/).map(s => s.replace(/^[-–—*]\s*/, '').trim()).filter(s => s.length > 3)
}

function overlap(a: string, b: string): number {
  const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/\p{L}{4,}/gu) ?? [])
  const A = words(a), B = words(b)
  let n = 0
  for (const w of A) if (B.has(w)) n++
  return n / Math.max(1, Math.min(A.size, B.size))
}

// The user's own sentence that best matches a rejected bullet: a cited achievement
// verbatim, otherwise the closest sentence of the cited job description.
function userTextFor(rejected: { texto: string; fuentes: string[] }, texts: Map<string, string>): string | null {
  const logro = rejected.fuentes.find(f => f.startsWith('logro:'))
  if (logro && texts.get(logro)) return texts.get(logro)!.trim()
  const candidates = rejected.fuentes.filter(f => f.endsWith(':descripcion')).flatMap(f => splitSentences(texts.get(f) ?? ''))
  if (candidates.length === 0) return null
  return candidates.reduce((best, c) => (overlap(rejected.texto, c) > overlap(rejected.texto, best) ? c : best))
}

// Whole CV from the user's own text (used when the writer itself fails).
export function userTextWriting(sources: EuropassAISources): EuropassWriting {
  const bullets = new Map<string, EuropassBullet[]>()
  for (const e of sources.experiencias) {
    const items: EuropassBullet[] = [
      ...e.logros.map(l => ({ texto: l.texto, _fuentes: [l.ref], _origen: 'usuario' as const })),
      ...(e.descripcion ? splitSentences(e.descripcion.texto).map(t => ({ texto: t, _fuentes: [e.descripcion!.ref], _origen: 'usuario' as const })) : []),
    ]
    bullets.set(e.ref, items.slice(0, EUROPASS_AI_LIMITS.bulletsPorPuesto.max))
  }
  return {
    sobreMi: sources.resumen ? { texto: sources.resumen.texto, fuentes: [sources.resumen.ref] } : { texto: null, fuentes: [] },
    bullets,
  }
}

// ── Orchestration ───────────────────────────────────────────────────────────

export async function verifyEuropassWriting(params: {
  writing: EuropassWriting
  sources: EuropassAISources
  judge: SenseJudge
  rewrite: (feedback: string) => Promise<EuropassWriting>
}): Promise<{ writing: EuropassWriting; report: VerificationReport }> {
  const { sources, judge, rewrite } = params
  const texts = sourceTextMap(sources)
  const report: VerificationReport = { aprobadas: 0, respaldo_usuario: 0, descartadas: 0, rechazos: [] }

  let current = params.writing
  let rejected = await check(sentencesOf(current), texts, judge)

  // One rewrite of the units (Sobre mí / jobs) that had any rejected sentence.
  if (rejected.size > 0) {
    const all = sentencesOf(current)
    const failedUnits = new Set(all.filter(s => rejected.has(s.id)).map(s => s.unit))
    const feedback = all.filter(s => rejected.has(s.id)).map(s => `- "${s.texto}" → ${rejected.get(s.id)}`).join('\n')
    for (const s of all) if (rejected.has(s.id)) report.rechazos.push({ texto: s.texto, motivo: rejected.get(s.id)! })

    let second: EuropassWriting | null = null
    try { second = await rewrite(feedback) } catch { second = null }

    if (second) {
      const merged: EuropassWriting = { sobreMi: current.sobreMi, bullets: new Map(current.bullets) }
      const replacedUnits = new Set<string>()
      if (failedUnits.has('sobre_mi') && second.sobreMi.texto) { merged.sobreMi = second.sobreMi; replacedUnits.add('sobre_mi') }
      for (const unit of failedUnits) {
        if (unit === 'sobre_mi') continue
        const rewritten = second.bullets.get(unit)
        if (rewritten && rewritten.length > 0) { merged.bullets.set(unit, rewritten); replacedUnits.add(unit) }
      }
      // Rejections that survive: original ones in units the rewrite didn't replace,
      // plus new ones in the rewritten units.
      const recheck = await check(sentencesOf(merged, replacedUnits), texts, judge)
      const next = new Map<string, string>()
      for (const [id, motivo] of rejected) if (!replacedUnits.has(id === 'sobre_mi' ? 'sobre_mi' : id.split('#')[0])) next.set(id, motivo)
      for (const [id, motivo] of recheck) next.set(id, motivo)
      current = merged
      rejected = next
    }
  }

  // Fallback: anything still rejected becomes the user's own text (or is dropped if the
  // user has no matching text).
  const final: EuropassWriting = { sobreMi: current.sobreMi, bullets: new Map() }
  if (current.sobreMi.texto) {
    if (rejected.has('sobre_mi')) {
      report.respaldo_usuario++
      final.sobreMi = sources.resumen ? { texto: sources.resumen.texto, fuentes: [sources.resumen.ref] } : { texto: null, fuentes: [] }
    } else report.aprobadas++
  }
  for (const [ref, bullets] of current.bullets) {
    const out: EuropassBullet[] = []
    const seen = new Set<string>()
    bullets.forEach((b, i) => {
      if (!rejected.has(`${ref}#${i}`)) { report.aprobadas++; out.push(b); seen.add(b.texto); return }
      const own = userTextFor({ texto: b.texto, fuentes: b._fuentes }, texts)
      if (own && !seen.has(own)) {
        report.respaldo_usuario++
        seen.add(own)
        out.push({ texto: own, _fuentes: b._fuentes, _origen: 'usuario' })
      } else report.descartadas++
    })
    final.bullets.set(ref, out)
  }
  return { writing: final, report }
}
