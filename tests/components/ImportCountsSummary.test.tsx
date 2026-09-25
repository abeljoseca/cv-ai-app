import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ImportCountsSummary, type ImportCounts } from '@/components/import/ImportFlow'

const zero: ImportCounts = { experiencias: 0, educacion: 0, habilidades: 0, idiomas: 0, logros: 0, certificaciones: 0 }

describe('ImportCountsSummary', () => {
  it('shows what was added and, apart, what was already in the profile', () => {
    const { container } = render(<ImportCountsSummary counts={{ ...zero, logros: 3 }} existentes={{ ...zero, experiencias: 2, idiomas: 1 }} />)
    expect(container.textContent).toContain('Agregamos a tu perfil')
    expect(container.textContent).toContain('3 logros')
    expect(container.textContent).toContain('Ya estaban en tu perfil: 2 experiencias laborales, 1 idioma')
    expect(container.textContent).not.toMatch(/^.*2 experiencias laborales.*Agregamos/)
  })

  it('says so when the document brought nothing new', () => {
    const { container } = render(<ImportCountsSummary counts={zero} existentes={{ ...zero, experiencias: 2 }} />)
    expect(container.textContent).toContain('No encontramos datos nuevos: todo lo de este documento ya estaba en tu perfil.')
    expect(container.textContent).toContain('Ya estaban en tu perfil: 2 experiencias laborales')
  })

  it('without a report keeps the previous list (profile totals, no "Agregamos" label)', () => {
    const { container } = render(<ImportCountsSummary counts={{ ...zero, experiencias: 1 }} />)
    expect(container.textContent).toContain('1 experiencia laboral')
    expect(container.textContent).not.toContain('Agregamos')
    expect(container.textContent).not.toContain('Ya estaban')
  })
})
