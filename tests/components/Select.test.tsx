import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Select } from '@/components/Select'

const options = [
  { value: 'A1', label: 'A1 · Básico', description: 'Entiendo y uso frases muy básicas.' },
  { value: 'C1', label: 'C1 · Avanzado', description: 'Me expreso con fluidez.' },
]

describe('Select option descriptions', () => {
  it('shows descriptions only inside the open dropdown', () => {
    render(<Select value="A1" onChange={() => {}} options={options} />)
    // Closed: trigger shows the label, no description
    expect(screen.getByText('A1 · Básico')).toBeTruthy()
    expect(screen.queryByText('Entiendo y uso frases muy básicas.')).toBeNull()

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Entiendo y uso frases muy básicas.')).toBeTruthy()
    expect(screen.getByText('Me expreso con fluidez.')).toBeTruthy()
  })

  it('selects the clicked option and closes', () => {
    const onChange = vi.fn()
    render(<Select value="" onChange={onChange} options={options} placeholder="Elige tu nivel" />)
    fireEvent.click(screen.getByText('Elige tu nivel'))
    fireEvent.click(screen.getByText('C1 · Avanzado'))
    expect(onChange).toHaveBeenCalledWith('C1')
    expect(screen.queryByText('Me expreso con fluidez.')).toBeNull()
  })
})
