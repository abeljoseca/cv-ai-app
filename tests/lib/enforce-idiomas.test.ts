import { describe, expect, it } from 'vitest'
import { enforceIdiomaLevels } from '@/lib/cv/enforce-idiomas'
import type { CVContent } from '@/lib/cv/types/cv-content'

function cvWith(idiomas: CVContent['idiomas']): CVContent {
  return { idiomas } as CVContent
}

describe('enforceIdiomaLevels', () => {
  const profile = [
    { nombre: 'Inglés', nivel: 'C1' },
    { nombre: 'Español', nivel: 'Nativo' },
    { nombre: 'Francés', nivel: null },
  ]

  it('overwrites whatever level the AI wrote with the profile code', () => {
    const cv = cvWith([
      { nombre: 'inglés', nivel: 'Avanzado (C1)' },
      { nombre: 'Español', nivel: 'Lengua materna' },
    ])
    enforceIdiomaLevels(cv, profile)
    expect(cv.idiomas).toEqual([
      { nombre: 'Inglés', nivel: 'C1', nivel_cefr: null },
      { nombre: 'Español', nivel: 'Nativo', nivel_cefr: null },
    ])
  })

  it('shows no level when the user has not confirmed one', () => {
    const cv = cvWith([{ nombre: 'Francés', nivel: 'Intermedio' }])
    enforceIdiomaLevels(cv, profile)
    expect(cv.idiomas[0].nivel).toBeNull()
  })

  it('drops languages the profile does not have and any AI-made CEFR breakdown', () => {
    const cv = cvWith([
      { nombre: 'Alemán', nivel: 'B2' },
      {
        nombre: 'Inglés', nivel: 'C1',
        nivel_cefr: { comprension_auditiva: 'C2', comprension_lectora: 'C2', interaccion_oral: 'C1', expresion_oral: 'C1', expresion_escrita: 'C1' },
      },
    ])
    enforceIdiomaLevels(cv, profile)
    expect(cv.idiomas).toEqual([{ nombre: 'Inglés', nivel: 'C1', nivel_cefr: null }])
  })
})
