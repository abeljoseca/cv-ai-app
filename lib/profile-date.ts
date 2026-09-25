// Profile dates (experiencia/educacion.fecha_inicio|fecha_fin) have ONE canonical form:
//   'AAAA'     when only the year is known
//   'AAAA-MM'  when the month is known
// Never invent a missing month. Every writer (profile form, CV/chat/LinkedIn import)
// must pass values through normalizeProfileDate; the DB enforces the format
// (migrations/step3b-date-format-checks.sql).

const MONTHS: Record<string, number> = {
  // Spanish
  ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4, may: 5, mayo: 5,
  jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8, sep: 9, sept: 9, set: 9, septiembre: 9,
  setiembre: 9, oct: 10, octubre: 10, nov: 11, noviembre: 11, dic: 12, diciembre: 12,
  // English
  jan: 1, january: 1, february: 2, march: 3, apr: 4, april: 4, june: 6, july: 7, aug: 8,
  august: 8, september: 9, october: 10, november: 11, dec: 12, december: 12,
  // Portuguese
  fev: 2, fevereiro: 2, marco: 3, mai: 5, maio: 5, junho: 6, julho: 7, out: 10,
  outubro: 10, novembro: 11, dez: 12, dezembro: 12,
}

const CANONICAL = /^\d{4}(-(0[1-9]|1[0-2]))?$/

function validYear(y: number): boolean {
  return y >= 1900 && y <= 2100
}

function canonical(year: number, month?: number | null): string | null {
  if (!validYear(year)) return null
  if (month == null) return String(year)
  if (month < 1 || month > 12) return null
  return `${year}-${String(month).padStart(2, '0')}`
}

export function monthFromName(name: string | null | undefined): number | null {
  if (!name) return null
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\./g, '').trim()
  return MONTHS[key] ?? null
}

// Returns the canonical form, or null when the input is empty, a "present" marker,
// or can't be interpreted with certainty.
export function normalizeProfileDate(input: string | null | undefined): string | null {
  if (input == null) return null
  const s = input.trim()
  if (!s) return null
  if (CANONICAL.test(s)) return canonical(+s.slice(0, 4), s.length > 4 ? +s.slice(5) : null)

  const lower = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/^(presente|actualidad|actual|present|current|hoy|now|en curso)$/.test(lower)) return null

  let m: RegExpMatchArray | null
  // 2021-3, 2021/03, 2021.03
  if ((m = lower.match(/^(\d{4})[-/.](\d{1,2})$/))) return canonical(+m[1], +m[2])
  // 03/2021, 3-2021, 03.2021
  if ((m = lower.match(/^(\d{1,2})[-/.](\d{4})$/))) return canonical(+m[2], +m[1])
  // 15/03/2021 (day dropped — profiles store month precision)
  if ((m = lower.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) return canonical(+m[3], +m[2])
  // 2021-03-15
  if ((m = lower.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return canonical(+m[1], +m[2])
  // "mar 2021", "marzo de 2021", "march, 2021"
  if ((m = lower.match(/^([a-z.]+)[\s,]+(?:de\s+)?(\d{4})$/))) {
    const month = monthFromName(m[1])
    return month ? canonical(+m[2], month) : null
  }
  // "2021 mar"
  if ((m = lower.match(/^(\d{4})[\s,]+([a-z.]+)$/))) {
    const month = monthFromName(m[2])
    return month ? canonical(+m[1], month) : null
  }
  return null
}

// Display form: 'MM/AAAA' when the month is known, 'AAAA' otherwise. Non-canonical
// legacy values are returned unchanged rather than guessed.
export function formatProfileDate(value: string | null | undefined): string {
  if (!value) return ''
  const m = value.match(/^(\d{4})(?:-(\d{2}))?$/)
  if (!m) return value
  return m[2] ? `${m[2]}/${m[1]}` : m[1]
}

export function hasMonth(value: string | null | undefined): boolean {
  return !!value && /^\d{4}-\d{2}$/.test(value)
}

// False only when the end date is certainly before the start date. With year-only
// precision on either side, only the years are compared (2021 → 2021-03 is fine).
export function isDateRangeValid(start: string | null | undefined, end: string | null | undefined): boolean {
  const a = start?.match(/^(\d{4})(?:-(\d{2}))?$/)
  const b = end?.match(/^(\d{4})(?:-(\d{2}))?$/)
  if (!a || !b) return true
  if (+b[1] !== +a[1]) return +b[1] > +a[1]
  return !(a[2] && b[2] && +b[2] < +a[2])
}
