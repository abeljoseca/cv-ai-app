import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

// Phone formatting for CV display, using each country's official grouping
// (+34 611 22 33 44, +52 55 1234 5678, +58 414 5735559…). Falls back to the
// original string untouched if it isn't a recognizable international number —
// never mangle a number we're not confident about.
export function formatPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const parsed = parsePhoneNumberFromString(raw.trim())
  return parsed && parsed.isValid() ? parsed.formatInternational() : raw
}
