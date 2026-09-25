import { describe, expect, it } from 'vitest'
import { formatProfileDate, hasMonth, isDateRangeValid, normalizeProfileDate } from '@/lib/profile-date'

describe('normalizeProfileDate', () => {
  it('keeps canonical values', () => {
    expect(normalizeProfileDate('2019')).toBe('2019')
    expect(normalizeProfileDate('2021-03')).toBe('2021-03')
  })

  it('parses numeric formats', () => {
    expect(normalizeProfileDate('2021-3')).toBe('2021-03')
    expect(normalizeProfileDate('2021/03')).toBe('2021-03')
    expect(normalizeProfileDate('03/2021')).toBe('2021-03')
    expect(normalizeProfileDate('3-2021')).toBe('2021-03')
    expect(normalizeProfileDate('15/03/2021')).toBe('2021-03')
    expect(normalizeProfileDate('2021-03-15')).toBe('2021-03')
  })

  it('parses month names in Spanish, English and Portuguese', () => {
    expect(normalizeProfileDate('Jul 2025')).toBe('2025-07')
    expect(normalizeProfileDate('marzo de 2021')).toBe('2021-03')
    expect(normalizeProfileDate('Ene. 2020')).toBe('2020-01')
    expect(normalizeProfileDate('September, 2018')).toBe('2018-09')
    expect(normalizeProfileDate('dezembro 2022')).toBe('2022-12')
    expect(normalizeProfileDate('2021 abr')).toBe('2021-04')
  })

  it('treats "present" markers and empties as null', () => {
    for (const v of ['Presente', 'Actualidad', 'Present', '', '   ', null, undefined]) {
      expect(normalizeProfileDate(v)).toBeNull()
    }
  })

  it('never guesses: invalid or ambiguous input gives null', () => {
    expect(normalizeProfileDate('13/2021')).toBeNull()
    expect(normalizeProfileDate('2021-00')).toBeNull()
    expect(normalizeProfileDate('1850')).toBeNull()
    expect(normalizeProfileDate('verano 2020')).toBeNull()
    expect(normalizeProfileDate('hace dos años')).toBeNull()
  })
})

describe('formatProfileDate', () => {
  it('shows MM/AAAA with month and only AAAA without it', () => {
    expect(formatProfileDate('2021-03')).toBe('03/2021')
    expect(formatProfileDate('2019')).toBe('2019')
    expect(formatProfileDate(null)).toBe('')
  })

  it('returns non-canonical legacy values unchanged', () => {
    expect(formatProfileDate('Presente')).toBe('Presente')
  })
})

describe('hasMonth', () => {
  it('detects month precision', () => {
    expect(hasMonth('2021-03')).toBe(true)
    expect(hasMonth('2021')).toBe(false)
    expect(hasMonth(null)).toBe(false)
  })
})


describe('isDateRangeValid', () => {
  it('rejects an end date certainly before the start', () => {
    expect(isDateRangeValid('2024-03', '2015-05')).toBe(false)
    expect(isDateRangeValid('2021-06', '2021-03')).toBe(false)
    expect(isDateRangeValid('2021', '2020')).toBe(false)
  })
  it('accepts valid, equal, partial or missing ranges', () => {
    expect(isDateRangeValid('2015-05', '2024-03')).toBe(true)
    expect(isDateRangeValid('2021-03', '2021-03')).toBe(true)
    expect(isDateRangeValid('2021', '2021-01')).toBe(true)
    expect(isDateRangeValid('2021-06', '2021')).toBe(true)
    expect(isDateRangeValid(null, '2020')).toBe(true)
    expect(isDateRangeValid('2020', null)).toBe(true)
  })
})
