import { describe, expect, it } from 'vitest'
import { exactCheck } from '@/lib/cv/verify/exact'

const src = [
  'Gestioné cuentas por pagar y control de servicios externos, logrando un ahorro mensual de hasta 7% con Google Sheets y SAP.',
  'Asistente Administrativo en Empresa de tecnología y educación (09/2020 – actualidad)',
  'Presupuesto anual de 1.250.000€ en la región EMEA.',
]

describe('exactCheck', () => {
  it('accepts a faithful rephrasing', () => {
    expect(exactCheck('Gestión de cuentas por pagar, con ahorro mensual de hasta 7% mediante Google Sheets y SAP.', src)).toEqual({ ok: true, missing: [] })
  })

  it('rejects figures that are not in the sources', () => {
    const r = exactCheck('Ahorro mensual de hasta 15% en cuentas por pagar.', src)
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['15'])
  })

  it('does not accept a number just because it is part of another one', () => {
    expect(exactCheck('Equipo de 1 persona.', ['Coordinación de 12 personas.']).missing).toEqual(['1'])
  })

  it('compares figures regardless of thousand separators', () => {
    expect(exactCheck('Gestión de un presupuesto de 1,250,000€.', src).ok).toBe(true)
  })

  it('rejects proper names and acronyms that are not in the sources', () => {
    const r = exactCheck('Gestión de cuentas en Oracle y reportes en Power BI para la región LATAM.', src)
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(expect.arrayContaining(['Oracle', 'Power', 'BI', 'LATAM']))
  })

  it('ignores the capital at the start of a sentence or clause', () => {
    expect(exactCheck('Registro de transacciones. Control documental: Gestión de cuentas por pagar.', src).ok).toBe(true)
  })

  it('accepts dates and names from the cited job reference', () => {
    expect(exactCheck('Desde 09/2020, en Empresa de tecnología y educación.', src).ok).toBe(true)
  })

  it('is accent- and case-insensitive for names', () => {
    expect(exactCheck('Operaciones en la región Emea con SAP.', src).ok).toBe(true)
  })
})
