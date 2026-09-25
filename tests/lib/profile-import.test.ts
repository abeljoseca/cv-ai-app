import { describe, expect, it } from 'vitest'
import { findExperienciaIdByEmpresa, isPresentMarker } from '@/lib/profile-import'

const exps = [
  { id: 'a', empresa: 'Deloitte' },
  { id: 'b', empresa: 'Banco Mercantil' },
  { id: 'c', empresa: 'Accenture' },
  { id: 'd', empresa: 'Accenture' },
]

describe('findExperienciaIdByEmpresa', () => {
  it('links when the company matches exactly one job (case/space-insensitive)', () => {
    expect(findExperienciaIdByEmpresa(exps, 'deloitte')).toBe('a')
    expect(findExperienciaIdByEmpresa(exps, '  Banco Mercantil ')).toBe('b')
  })

  it('never guesses: no match, ambiguous match or empty company → null', () => {
    expect(findExperienciaIdByEmpresa(exps, 'Google')).toBeNull()
    expect(findExperienciaIdByEmpresa(exps, 'Accenture')).toBeNull()
    expect(findExperienciaIdByEmpresa(exps, 'Banco')).toBeNull()
    expect(findExperienciaIdByEmpresa(exps, null)).toBeNull()
    expect(findExperienciaIdByEmpresa([], 'Deloitte')).toBeNull()
  })
})

describe('isPresentMarker', () => {
  it('detects "current job" markers only', () => {
    expect(isPresentMarker('Presente')).toBe(true)
    expect(isPresentMarker('Actualidad')).toBe(true)
    expect(isPresentMarker('2021')).toBe(false)
    expect(isPresentMarker(null)).toBe(false)
  })
})
