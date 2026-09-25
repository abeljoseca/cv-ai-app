import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MonthYearField from '@/components/profile/MonthYearField'

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <MonthYearField label="Fecha" value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
      <button onClick={() => setValue('')}>reset</button>
    </>
  )
}

const monthTrigger = () => screen.getByLabelText('Fecha: mes')
const yearTrigger = () => screen.getByLabelText('Fecha: año')
const value = () => screen.getByTestId('value').textContent
function pick(trigger: HTMLElement, option: string) {
  fireEvent.click(trigger)
  fireEvent.click(screen.getByRole('option', { name: option }))
}

describe('MonthYearField', () => {
  it('keeps a month picked before the year', () => {
    render(<Harness />)
    pick(monthTrigger(), 'Mar')
    expect(monthTrigger().textContent).toContain('Mar')
    expect(value()).toBe('')
    pick(yearTrigger(), '2021')
    expect(value()).toBe('2021-03')
  })

  it('emits year only when no month is picked', () => {
    render(<Harness />)
    pick(yearTrigger(), '2019')
    expect(value()).toBe('2019')
  })

  it('loads an existing value', () => {
    render(<Harness initial="2020-07" />)
    expect(monthTrigger().textContent).toContain('Jul')
    expect(yearTrigger().textContent).toContain('2020')
  })

  it('can clear the month back to a year-only date', () => {
    render(<Harness initial="2020-07" />)
    pick(monthTrigger(), 'Sin mes')
    expect(value()).toBe('2020')
  })

  it('clears both pickers when the form is reset from outside', () => {
    render(<Harness />)
    pick(monthTrigger(), 'Mar')
    pick(yearTrigger(), '2021')
    fireEvent.click(screen.getByText('reset'))
    expect(monthTrigger().textContent).toContain('Mes')
    expect(yearTrigger().textContent).toContain('Año')
  })
})
