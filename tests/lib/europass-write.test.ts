import { describe, expect, it } from 'vitest'
import { applyEuropassWriting, sanitizeEuropassWriting, type EuropassRawWriting } from '@/lib/cv/styles/europass/write'
import { buildEuropassUserMessage, EUROPASS_SYSTEM_PROMPT } from '@/lib/cv/styles/europass/prompt'
import { mapEuropassObjective } from '@/lib/cv/styles/europass/mapper'
import type { EuropassAISources } from '@/lib/cv/styles/europass/schema'
import type { Profile } from '@/types'

const sources: EuropassAISources = {
  resumen: { ref: 'perfil:resumen', texto: 'Diez años en operaciones.' },
  hechos: [{ ref: 'calc:anios_experiencia', texto: 'Años de experiencia profesional (calculado de las fechas del perfil): 7' }],
  experiencias: [
    { ref: 'exp:e1', cargo: 'Analista', empleador: 'Acme', periodo: '2018 – 06/2020', descripcion: { ref: 'exp:e1:descripcion', texto: 'Gestión de reportes.' }, logros: [{ ref: 'logro:l1', texto: 'Reduje el cierre de 18 a 11 días.' }] },
    { ref: 'exp:e2', cargo: 'Becaria', empleador: 'Globex', periodo: null, descripcion: null, logros: [] },
  ],
}

describe('sanitizeEuropassWriting', () => {
  it('keeps valid sentences and only their allowed citations', () => {
    const raw: EuropassRawWriting = {
      sobre_mi: { texto: ' Profesional con 7 años. ', fuentes: ['calc:anios_experiencia', 'inventada'] },
      experiencias: [{
        ref: 'exp:e1',
        bullets: [
          { texto: 'Reducción del cierre de 18 a 11 días.', fuentes: ['logro:l1', 'logro:l1'] },
          // cites another job's source only → dropped
          { texto: 'Algo de Globex.', fuentes: ['exp:e2'] },
          { texto: '   ', fuentes: ['exp:e1'] },
        ],
      }],
    }
    const w = sanitizeEuropassWriting(raw, sources)
    expect(w.sobreMi).toEqual({ texto: 'Profesional con 7 años.', fuentes: ['calc:anios_experiencia'] })
    expect(w.bullets.get('exp:e1')).toEqual([{ texto: 'Reducción del cierre de 18 a 11 días.', _fuentes: ['logro:l1'], _origen: 'ia' }])
  })

  it('ignores jobs that are not in the sources and duplicate job entries', () => {
    const raw: EuropassRawWriting = {
      sobre_mi: { texto: '', fuentes: [] },
      experiencias: [
        { ref: 'exp:inventado', bullets: [{ texto: 'X', fuentes: ['exp:inventado'] }] },
        { ref: 'exp:e1', bullets: [{ texto: 'Primero.', fuentes: ['exp:e1'] }] },
        { ref: 'exp:e1', bullets: [{ texto: 'Duplicado.', fuentes: ['exp:e1'] }] },
      ],
    }
    const w = sanitizeEuropassWriting(raw, sources)
    expect([...w.bullets.keys()]).toEqual(['exp:e1'])
    expect(w.bullets.get('exp:e1')!.map(b => b.texto)).toEqual(['Primero.'])
    expect(w.sobreMi.texto).toBeNull()
  })

  it('caps bullets per job and drops an uncited summary', () => {
    const raw: EuropassRawWriting = {
      sobre_mi: { texto: 'Resumen sin fuentes.', fuentes: [] },
      experiencias: [{ ref: 'exp:e1', bullets: Array.from({ length: 8 }, (_, i) => ({ texto: `B${i}`, fuentes: ['exp:e1:descripcion'] })) }],
    }
    const w = sanitizeEuropassWriting(raw, sources)
    expect(w.bullets.get('exp:e1')).toHaveLength(5)
    expect(w.sobreMi.texto).toBeNull()
  })
})

describe('applyEuropassWriting', () => {
  it('places sobre_mi and bullets by job id, leaving jobs without writing empty', () => {
    const { content } = mapEuropassObjective({
      profile: { id: 'u', nombre: 'Ana', apellido: 'Ruiz' } as unknown as Profile,
      experiencias: [
        { id: 'e1', user_id: 'u', created_at: '', empresa: 'Acme', cargo: 'Analista', fecha_inicio: '2018', fecha_fin: '2020-06', activo: false, descripcion: 'Gestión de reportes.' },
        { id: 'e2', user_id: 'u', created_at: '', empresa: 'Globex', cargo: 'Becaria', fecha_inicio: null, fecha_fin: null, activo: false, descripcion: null },
      ],
      educaciones: [], idiomas: [], logros: [], habilidades: [], certificaciones: [],
    })
    const out = applyEuropassWriting(content, {
      sobreMi: { texto: 'Resumen.', fuentes: ['perfil:resumen'] },
      bullets: new Map([['exp:e1', [{ texto: 'Gestión de reportes.', _fuentes: ['exp:e1:descripcion'], _origen: 'ia' }]]]),
    })
    expect(out.sobre_mi).toEqual({ texto: 'Resumen.', _fuentes: ['perfil:resumen'], _origen: 'ia' })
    expect(out.experiencia_laboral.find(e => e._id === 'e1')!.bullets).toHaveLength(1)
    expect(out.experiencia_laboral.find(e => e._id === 'e2')!.bullets).toEqual([])
    expect(content.sobre_mi.texto).toBeNull()
  })
})

describe('Europass prompt', () => {
  it('keeps the system prompt free of per-user data (cacheable) and sends sources with refs', () => {
    expect(EUROPASS_SYSTEM_PROMPT).not.toContain('Acme')
    const msg = buildEuropassUserMessage(sources, 'es')
    expect(msg).toContain('Output language: Spanish')
    for (const ref of ['perfil:resumen', 'calc:anios_experiencia', 'exp:e1', 'exp:e1:descripcion', 'logro:l1', 'exp:e2']) expect(msg).toContain(ref)
  })
})

describe('computed facts for the AI', () => {
  it('computes whole years of experience and formatted job periods', () => {
    const { aiSources } = mapEuropassObjective({
      profile: { id: 'u', nombre: 'Ana', apellido: 'Ruiz' } as unknown as Profile,
      experiencias: [
        { id: 'e1', user_id: 'u', created_at: '', empresa: 'Acme', cargo: 'Analista', fecha_inicio: '2015-03', fecha_fin: '2020-06', activo: false, descripcion: null },
        { id: 'e2', user_id: 'u', created_at: '', empresa: 'Globex', cargo: 'Jefa', fecha_inicio: '2020-07', fecha_fin: null, activo: true, descripcion: null },
      ],
      educaciones: [], idiomas: [], logros: [], habilidades: [], certificaciones: [],
    })
    const years = Math.floor(((new Date().getFullYear() * 12 + new Date().getMonth()) - (2015 * 12 + 2)) / 12)
    expect(aiSources.hechos).toEqual([{ ref: 'calc:anios_experiencia', texto: `Años de experiencia profesional (calculado de las fechas del perfil): ${years}` }])
    expect(aiSources.experiencias.find(e => e.ref === 'exp:e2')!.periodo).toBe('07/2020 – actualidad')
  })
})
