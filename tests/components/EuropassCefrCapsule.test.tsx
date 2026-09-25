import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('next/font/google', () => {
  const font = () => ({ variable: 'font-var', className: 'font' })
  return { Carlito: font, Gelasio: font, Arimo: font, Inter: font }
})

import EuropassV2CV from '@/components/CVTemplates/EuropassV2CV'
import type { EuropassContent } from '@/lib/cv/styles/europass/schema'
import { europassReferenceContent } from '../fixtures/europass-content'

function content(): EuropassContent {
  const c = europassReferenceContent()
  const [fr, en, it] = c.competencias_linguisticas.otras_lenguas
  c.competencias_linguisticas.otras_lenguas = [
    { ...fr, _id: 'fr' },
    // Pre-filled from the general level, not confirmed yet.
    { ...en, _id: 'en', niveles: { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'C1', expresion_oral: 'C1', expresion_escrita: 'C1' }, niveles_confirmados: false },
    { ...it, _id: 'it', niveles: null, niveles_confirmados: false },
  ]
  return c
}

describe('CEFR capsule (editor only)', () => {
  it('without the editor the CV is exactly the PDF: no capsule, no selectors', () => {
    const { container } = render(<EuropassV2CV data={content()} />)
    expect(container.querySelector('.ep2-capsula')).toBeNull()
    expect(container.querySelector('table.cefr select')).toBeNull()
    expect(container.querySelector('table.cefr')?.className).toBe('cefr')
    expect(container.querySelector('.otras-lenguas')?.textContent).toBe('Otras lenguas: Italiano')
  })

  it('shows the capsule for the pre-filled language and "Confirmar" confirms it as is', () => {
    const onNiveles = vi.fn()
    const { container } = render(<EuropassV2CV data={content()} idiomasEditor={{ onNiveles, onNivelGeneral: vi.fn() }} />)
    const capsules = [...container.querySelectorAll('.ep2-capsula')].map(c => c.textContent)
    expect(capsules[0]).toContain('Tu nivel general de inglés es C1. Ajusta si alguna habilidad es distinta.')
    expect(capsules.some(t => t?.includes('francés'))).toBe(false) // confirmed: no capsule
    expect(container.querySelector('table.cefr')?.classList.contains('ep2-resaltada')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onNiveles).toHaveBeenCalledWith('en', content().competencias_linguisticas.otras_lenguas[1].niveles)
  })

  it('changing one cell sends the whole breakdown with that skill changed', () => {
    const onNiveles = vi.fn()
    render(<EuropassV2CV data={content()} idiomasEditor={{ onNiveles, onNivelGeneral: vi.fn() }} />)
    fireEvent.change(screen.getByLabelText('Inglés: Expresión escrita'), { target: { value: 'B2' } })
    expect(onNiveles).toHaveBeenCalledWith('en', { comprension_auditiva: 'C1', comprension_lectora: 'C1', interaccion_oral: 'C1', expresion_oral: 'C1', expresion_escrita: 'B2' })
  })

  it('a language without a level asks for its general level', () => {
    const onNivelGeneral = vi.fn()
    render(<EuropassV2CV data={content()} idiomasEditor={{ onNiveles: vi.fn(), onNivelGeneral }} />)
    expect(screen.getByText('Indica tu nivel de italiano para mostrarlo en la tabla:')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nivel de Italiano'), { target: { value: 'B1' } })
    expect(onNivelGeneral).toHaveBeenCalledWith('it', 'B1')
  })
})
