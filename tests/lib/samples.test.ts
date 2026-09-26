// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SAMPLES_DIR, europassFingerprint } from '../../scripts/samples/fingerprint'

// The style-selector sample must always show the real template (spec §11). If the
// template, its presets, the paginator, the demo data or the demo photo changed, the
// images must be regenerated.
describe('style samples are up to date', () => {
  it('Europass', () => {
    const saved = JSON.parse(readFileSync(path.join(SAMPLES_DIR, 'europass.json'), 'utf8'))
    expect(saved.fingerprint, 'La muestra de Europass está desactualizada: ejecuta `npm run samples`').toBe(europassFingerprint())
    expect(saved.paginas).toBe(1)
  })
})
