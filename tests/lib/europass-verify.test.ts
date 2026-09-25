import { describe, expect, it } from 'vitest'
import { verifyEuropassWriting, userTextWriting } from '@/lib/cv/styles/europass/verify'
import { writeAndVerifyEuropass } from '@/lib/cv/styles/europass/generate'
import { mapEuropassObjective } from '@/lib/cv/styles/europass/mapper'
import type { EuropassAISources, EuropassBullet } from '@/lib/cv/styles/europass/schema'
import type { EuropassWriting } from '@/lib/cv/styles/europass/write'
import type { SenseJudge } from '@/lib/cv/verify/sense'
import type { Profile } from '@/types'

const sources: EuropassAISources = {
  resumen: { ref: 'perfil:resumen', texto: 'Asistente administrativa con experiencia en cuentas por pagar.' },
  hechos: [{ ref: 'calc:anios_experiencia', texto: 'Años de experiencia profesional (suma de los periodos trabajados según el perfil): 8' }],
  experiencias: [{
    ref: 'exp:e1', cargo: 'Asistente', empleador: 'Acme', periodo: '09/2020 – actualidad',
    descripcion: { ref: 'exp:e1:descripcion', texto: 'Registré transacciones en SAP. Participé en la revisión de facturas con proveedores.' },
    logros: [{ ref: 'logro:l1', texto: 'Ahorro mensual de hasta 7% detectando sobrefacturación' }],
  }],
}

const b = (texto: string, fuentes: string[]): EuropassBullet => ({ texto, _fuentes: fuentes, _origen: 'ia' })
const writing = (bullets: EuropassBullet[], sobre: string | null = 'Asistente administrativa con 8 años de experiencia en cuentas por pagar.'): EuropassWriting => ({
  sobreMi: sobre ? { texto: sobre, fuentes: ['perfil:resumen', 'calc:anios_experiencia'] } : { texto: null, fuentes: [] },
  bullets: new Map([['exp:e1', bullets]]),
})

// Judge that approves everything except sentences containing any of the given words.
const judgeRejecting = (...words: string[]): SenseJudge => async items =>
  new Map(items.map(i => [i.id, { apoyado: !words.some(w => i.texto.includes(w)), motivo: 'rechazo de prueba' }]))

describe('verifyEuropassWriting', () => {
  it('keeps everything when both controls approve', async () => {
    const w = writing([b('Registro de transacciones en SAP.', ['exp:e1:descripcion']), b('Ahorro mensual de hasta 7% por detección de sobrefacturación.', ['logro:l1'])])
    const { writing: out, report } = await verifyEuropassWriting({ writing: w, sources, judge: judgeRejecting(), rewrite: async () => { throw new Error('should not rewrite') } })
    expect(report).toMatchObject({ aprobadas: 3, respaldo_usuario: 0, descartadas: 0 })
    expect(out.bullets.get('exp:e1')!.every(x => x._origen === 'ia')).toBe(true)
  })

  it('rejects an invented figure with the exact check, rewrites once, and accepts the fixed rewrite', async () => {
    const w = writing([b('Ahorro mensual de hasta 15%.', ['logro:l1'])])
    let feedbackSeen = ''
    const { writing: out, report } = await verifyEuropassWriting({
      writing: w, sources, judge: judgeRejecting(),
      rewrite: async fb => { feedbackSeen = fb; return writing([b('Ahorro mensual de hasta 7%.', ['logro:l1'])]) },
    })
    expect(feedbackSeen).toContain('15')
    expect(out.bullets.get('exp:e1')).toEqual([b('Ahorro mensual de hasta 7%.', ['logro:l1'])])
    expect(report.rechazos[0].motivo).toContain('15')
  })

  it('falls back to the user\'s own text when the rewrite still fails the sense check', async () => {
    const w = writing([b('Liderazgo de la revisión de facturas con proveedores.', ['exp:e1:descripcion'])])
    const { writing: out, report } = await verifyEuropassWriting({
      writing: w, sources, judge: judgeRejecting('Liderazgo', 'Dirección'),
      rewrite: async () => writing([b('Dirección de la revisión de facturas.', ['exp:e1:descripcion'])]),
    })
    expect(out.bullets.get('exp:e1')).toEqual([{ texto: 'Participé en la revisión de facturas con proveedores.', _fuentes: ['exp:e1:descripcion'], _origen: 'usuario' }])
    expect(report.respaldo_usuario).toBe(1)
  })

  it('uses a cited achievement verbatim as the fallback', async () => {
    const w = writing([b('Ahorro de 20% en costos.', ['logro:l1'])])
    const { writing: out } = await verifyEuropassWriting({ writing: w, sources, judge: judgeRejecting(), rewrite: async () => { throw new Error('down') } })
    expect(out.bullets.get('exp:e1')![0]).toEqual({ texto: 'Ahorro mensual de hasta 7% detectando sobrefacturación', _fuentes: ['logro:l1'], _origen: 'usuario' })
  })

  it('treats a missing verdict as rejected (fail-safe) and a judge outage as rejected too', async () => {
    const w = writing([b('Registro de transacciones en SAP.', ['exp:e1:descripcion'])], null)
    const silent: SenseJudge = async () => new Map()
    const r1 = await verifyEuropassWriting({ writing: w, sources, judge: silent, rewrite: async () => { throw new Error('down') } })
    expect(r1.writing.bullets.get('exp:e1')![0]._origen).toBe('usuario')
    const broken: SenseJudge = async () => { throw new Error('outage') }
    const r2 = await verifyEuropassWriting({ writing: w, sources, judge: broken, rewrite: async () => { throw new Error('down') } })
    expect(r2.writing.bullets.get('exp:e1')![0]._origen).toBe('usuario')
  })

  it('replaces a rejected summary with the user\'s own summary', async () => {
    const w = writing([], 'Asistente con 12 años de experiencia.')
    const { writing: out } = await verifyEuropassWriting({ writing: w, sources, judge: judgeRejecting(), rewrite: async () => { throw new Error('down') } })
    expect(out.sobreMi).toEqual({ texto: sources.resumen!.texto, fuentes: ['perfil:resumen'] })
  })
})

describe('writeAndVerifyEuropass', () => {
  const { content } = mapEuropassObjective({
    profile: { id: 'u', nombre: 'Ana', apellido: 'Ruiz' } as unknown as Profile,
    experiencias: [{ id: 'e1', user_id: 'u', created_at: '', empresa: 'Acme', cargo: 'Asistente', fecha_inicio: '2020-09', fecha_fin: null, activo: true, descripcion: 'x' }],
    educaciones: [], idiomas: [], logros: [], habilidades: [], certificaciones: [],
  })

  it('still produces the CV from the user\'s own text when the writer fails', async () => {
    const r = await writeAndVerifyEuropass(content, sources, { write: async () => { throw new Error('API down') }, judge: judgeRejecting() })
    expect(r.report.escritor_fallo).toBe(true)
    expect(r.content.sobre_mi.texto).toBe(sources.resumen!.texto)
    expect(r.content.experiencia_laboral[0].bullets.map(x => x.texto)).toEqual([
      'Ahorro mensual de hasta 7% detectando sobrefacturación',
      'Registré transacciones en SAP.',
      'Participé en la revisión de facturas con proveedores.',
    ])
  })

  it('does not call the AI when the profile has nothing to write from', async () => {
    const empty: EuropassAISources = { resumen: null, hechos: [], experiencias: [{ ...sources.experiencias[0], descripcion: null, logros: [] }] }
    const r = await writeAndVerifyEuropass(content, empty, { write: async () => { throw new Error('must not be called') }, judge: judgeRejecting() })
    expect(r.report.escritor_fallo).toBe(false)
    expect(r.content.sobre_mi.texto).toBeNull()
  })

  it('userTextWriting caps bullets per job', () => {
    const many: EuropassAISources = { ...sources, experiencias: [{ ...sources.experiencias[0], descripcion: { ref: 'exp:e1:descripcion', texto: 'Uno aa. Dos bb. Tres cc. Cuatro dd. Cinco ee. Seis ff.' } }] }
    expect(userTextWriting(many).bullets.get('exp:e1')).toHaveLength(5)
  })
})
