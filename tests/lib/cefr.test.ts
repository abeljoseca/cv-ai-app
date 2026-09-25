import { describe, expect, it } from 'vitest'
import { isCefrBreakdown, normalizeCefr } from '@/lib/cefr'

describe('normalizeCefr', () => {
  it('accepts CEFR levels and native markers', () => {
    expect(normalizeCefr('c1')).toBe('C1')
    expect(normalizeCefr(' B2 ')).toBe('B2')
    expect(normalizeCefr('Nativa')).toBe('Nativo')
    expect(normalizeCefr('Lengua materna')).toBe('Nativo')
    expect(normalizeCefr('native')).toBe('Nativo')
  })

  it('never converts legacy or ambiguous levels', () => {
    for (const v of ['Básico', 'Intermedio', 'Avanzado', 'Advanced', 'Fluent', 'Bilingüe', '', null]) {
      expect(normalizeCefr(v)).toBeNull()
    }
  })
})

describe('isCefrBreakdown', () => {
  const full = { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'B2', expresion_oral: 'B2', expresion_escrita: 'B2' }
  it('requires all five skills with valid levels', () => {
    expect(isCefrBreakdown(full)).toBe(true)
    expect(isCefrBreakdown({ ...full, expresion_escrita: 'Nativo' })).toBe(false)
    expect(isCefrBreakdown({ comprension_auditiva: 'C1' })).toBe(false)
    expect(isCefrBreakdown(null)).toBe(false)
  })
})
