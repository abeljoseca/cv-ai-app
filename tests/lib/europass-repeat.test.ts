import { describe, expect, it } from 'vitest'
import { repeatedSobreMiFigures, writeAndVerifyEuropass } from '@/lib/cv/styles/europass/generate'
import { mapEuropassObjective } from '@/lib/cv/styles/europass/mapper'
import type { EuropassAISources, EuropassBullet } from '@/lib/cv/styles/europass/schema'
import type { EuropassWriting } from '@/lib/cv/styles/europass/write'
import type { SenseJudge } from '@/lib/cv/verify/sense'
import type { Profile } from '@/types'

const sources: EuropassAISources = {
  resumen: { ref: 'perfil:resumen', texto: 'Asistente administrativa con experiencia en cuentas por pagar. Reduje costos un 7% validando facturas.' },
  hechos: [{ ref: 'calc:anios_experiencia', texto: 'Años de experiencia profesional (suma de los periodos trabajados según el perfil): 8' }],
  experiencias: [{
    ref: 'exp:e1', cargo: 'Asistente', empleador: 'Acme', periodo: '09/2020 – actualidad',
    descripcion: { ref: 'exp:e1:descripcion', texto: 'Registré transacciones en SAP.' },
    logros: [{ ref: 'logro:l1', texto: 'Reduje costos un 7% validando facturas.' }],
  }],
}
const { content } = mapEuropassObjective({
  profile: { id: 'u', nombre: 'Ana', apellido: 'Ruiz' } as unknown as Profile,
  experiencias: [{ id: 'e1', user_id: 'u', created_at: '', empresa: 'Acme', cargo: 'Asistente', fecha_inicio: '2020-09', fecha_fin: null, activo: true, descripcion: 'x' }],
  educaciones: [], idiomas: [], logros: [], habilidades: [], certificaciones: [],
})

const bullets: EuropassBullet[] = [
  { texto: 'Reducción de costos del 7% mediante validación de facturas.', _fuentes: ['logro:l1'], _origen: 'ia' },
  { texto: 'Registro de transacciones en SAP.', _fuentes: ['exp:e1:descripcion'], _origen: 'ia' },
]
const draft = (sobre: string): EuropassWriting => ({
  sobreMi: { texto: sobre, fuentes: ['perfil:resumen', 'calc:anios_experiencia'] },
  bullets: new Map([['exp:e1', bullets]]),
})
const REPEATS = 'Asistente administrativa con 8 años de experiencia; redujo costos un 7%.'
const CLEAN = 'Asistente administrativa con 8 años de experiencia en cuentas por pagar.'
const approveAll: SenseJudge = async items => new Map(items.map(i => [i.id, { apoyado: true, motivo: '' }]))

// Writer that returns the given drafts in order, recording the feedback it got.
function writer(...drafts: EuropassWriting[]) {
  const feedbacks: Array<string | undefined> = []
  return { feedbacks, write: async (fb?: string) => { feedbacks.push(fb); return drafts[feedbacks.length - 1] } }
}

describe('Sobre mí does not repeat bullet figures', () => {
  it('rewrites "Sobre mí" once and keeps the version without the repeated figure', async () => {
    const w = writer(draft(REPEATS), draft(CLEAN))
    const r = await writeAndVerifyEuropass(content, sources, { write: w.write, judge: approveAll })
    expect(w.feedbacks[1]).toContain('7')
    expect(r.content.sobre_mi).toMatchObject({ texto: CLEAN, _origen: 'ia' })
    expect(r.content.experiencia_laboral[0].bullets.map(b => b.texto)).toEqual(bullets.map(b => b.texto))
    expect(r.report.sobre_mi_cifras_repetidas).toBe('corregida')
  })

  it('keeps the verified original when the rewrite still repeats', async () => {
    const w = writer(draft(REPEATS), draft('Asistente con 8 años; ahorro del 7%.'))
    const r = await writeAndVerifyEuropass(content, sources, { write: w.write, judge: approveAll })
    expect(r.content.sobre_mi.texto).toBe(REPEATS)
    expect(r.report.sobre_mi_cifras_repetidas).toBe('sin_corregir')
  })

  it('keeps the verified original (not the user fallback) when the rewrite fails the checks', async () => {
    const w = writer(draft(REPEATS), draft(CLEAN))
    let calls = 0
    const judge: SenseJudge = async items => { calls++; return new Map(items.map(i => [i.id, { apoyado: calls === 1, motivo: 'x' }])) }
    const r = await writeAndVerifyEuropass(content, sources, { write: w.write, judge })
    expect(r.content.sobre_mi.texto).toBe(REPEATS)
    expect(r.report.sobre_mi_cifras_repetidas).toBe('sin_corregir')
  })

  it('allows the calculated years of experience and skips the user\'s own text', async () => {
    const withYears = { ...content, sobre_mi: { texto: CLEAN, _fuentes: [], _origen: 'ia' as const }, experiencia_laboral: [{ ...content.experiencia_laboral[0], bullets: [{ texto: 'Gestión de 8 cuentas.', _fuentes: [], _origen: 'ia' as const }] }] }
    expect(repeatedSobreMiFigures(withYears, sources)).toEqual([])
    const w = writer(draft(CLEAN))
    const r = await writeAndVerifyEuropass(content, sources, { write: w.write, judge: approveAll })
    expect(w.feedbacks).toHaveLength(1)
    expect(r.report.sobre_mi_cifras_repetidas).toBe('no')
  })
})
