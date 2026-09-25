import { describe, expect, it } from 'vitest'
import { isNearDuplicateLogro } from '@/lib/profile-import'

// Real achievements from a test profile (same facts, different AI rewordings).
const saved = [
  'Optimizó procesos internos logrando reducir hasta un 7% en costos operativos mediante control y validación de facturación',
  'Logró un ahorro mensual de hasta 7% mediante detección de sobrefacturación y comunicación efectiva con proveedores',
  'Mejoró la trazabilidad y redujo tiempos de búsqueda de información hasta en 1 hora por sesión mediante organización de bases de datos',
]

describe('isNearDuplicateLogro', () => {
  it('catches the same fact reworded', () => {
    expect(isNearDuplicateLogro('Reduje costos operativos hasta un 7% mediante control y validación sistemática de facturación, detectando sobrefacturación de proveedores.', saved)).toBe(true)
    expect(isNearDuplicateLogro('Organicé bases de datos de inventario reduciendo tiempos de búsqueda de información hasta en 1 hora por sesión de consulta.', saved)).toBe(true)
  })

  it('imports a borderline rewording (when in doubt, import)', () => {
    // Same 7% savings, but only half the words in common: could be a different fact.
    expect(isNearDuplicateLogro('Generé un ahorro mensual de hasta 7% a través de comunicación directa con proveedores y resolución de discrepancias en facturas.', saved)).toBe(false)
  })

  it('keeps different facts, even with the same figure', () => {
    // The two 7% achievements of the same person are distinct facts.
    expect(isNearDuplicateLogro(
      'Generé un ahorro mensual de hasta 7% a través de comunicación directa con proveedores y resolución de discrepancias en facturas.',
      ['Reduje costos operativos hasta un 7% mediante control y validación sistemática de facturación, detectando sobrefacturación de proveedores.'],
    )).toBe(false)
    expect(isNearDuplicateLogro('Aumenté las ventas un 7% en el primer trimestre.', saved)).toBe(false)
    expect(isNearDuplicateLogro('Reduje costos operativos hasta un 12% mediante control de facturación.', saved)).toBe(false)
  })

  it('without figures, needs a much closer match', () => {
    expect(isNearDuplicateLogro('Lideré la migración del sistema contable.', ['Lideré la migración del sistema contable a la nube.'])).toBe(true)
    expect(isNearDuplicateLogro('Lideré la migración del sistema contable.', ['Coordiné la auditoría anual del sistema de inventario.'])).toBe(false)
  })

  it('never matches against an empty list', () => {
    expect(isNearDuplicateLogro('Reduje costos 7%.', [])).toBe(false)
  })
})
