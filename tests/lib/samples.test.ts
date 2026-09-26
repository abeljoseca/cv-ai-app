// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { LEGACY_STYLE_FILES, SAMPLES_DIR, europassFingerprint, legacyFingerprint } from '../../scripts/samples/fingerprint'

// The style-selector samples must always show the real templates (spec §11). If a
// template, its presets, the paginator, the demo data or the demo photo changed, the
// images must be regenerated with `npm run samples`.
const stale = (estilo: string) => `La muestra de ${estilo} está desactualizada: ejecuta "npm run samples"`
const saved = (estilo: string) => JSON.parse(readFileSync(path.join(SAMPLES_DIR, `${estilo}.json`), 'utf8'))

describe('style samples are up to date', () => {
  it('europass', () => {
    expect(saved('europass').fingerprint, stale('europass')).toBe(europassFingerprint())
    expect(saved('europass').paginas).toBe(1)
  })

  for (const estilo of Object.keys(LEGACY_STYLE_FILES)) {
    it(estilo, () => {
      expect(saved(estilo).fingerprint, stale(estilo)).toBe(legacyFingerprint(estilo))
    })
  }
})
