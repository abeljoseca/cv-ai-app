// Best-effort phone formatting for CV display. Falls back to the original
// string untouched if it doesn't match a recognized shape — never mangle
// a number we're not confident about.
const COUNTRY_CODE_LENGTHS = [3, 2, 1] // try longest match first (e.g. +593 before +59)

export function formatPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const digits = trimmed.replace(/[^\d]/g, '')
  const hasPlus = trimmed.startsWith('+')

  if (!hasPlus || digits.length < 8 || digits.length > 15) return raw

  // Local number after the country code is typically 7-10 digits for the
  // countries Momentum targets (LatAm mobile numbers are usually 10 digits
  // with a country code of 1-3 digits: +58 414 573 5559).
  for (const ccLen of COUNTRY_CODE_LENGTHS) {
    const localLen = digits.length - ccLen
    if (localLen === 10) {
      const cc = digits.slice(0, ccLen)
      const local = digits.slice(ccLen)
      return `+${cc} ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`
    }
  }

  return raw
}
