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

const month = () => screen.getByLabelText('Fecha: mes') as HTMLSelectElement
const year = () => screen.getByLabelText('Fecha: año') as HTMLSelectElement
const value = () => screen.getByTestId('value').textContent

describe('MonthYearField', () => {
  it('keeps a month picked before the year', () => {
    render(<Harness />)
    fireEvent.change(month(), { target: { value: '03' } })
    expect(month().value).toBe('03')
    expect(value()).toBe('')
    fireEvent.change(year(), { target: { value: '2021' } })
    expect(value()).toBe('2021-03')
  })

  it('emits year only when no month is picked', () => {
    render(<Harness />)
    fireEvent.change(year(), { target: { value: '2019' } })
    expect(value()).toBe('2019')
  })

  it('loads an existing value', () => {
    render(<Harness initial="2020-07" />)
    expect(month().value).toBe('07')
    expect(year().value).toBe('2020')
  })

  it('clears both selects when the form is reset from outside', () => {
    render(<Harness />)
    fireEvent.change(month(), { target: { value: '03' } })
    fireEvent.change(year(), { target: { value: '2021' } })
    fireEvent.click(screen.getByText('reset'))
    expect(month().value).toBe('')
    expect(year().value).toBe('')
  })
})
