// Fingerprint of everything that decides how a style's sample image looks. Stored next to
// the images (public/muestras/<style>.json); a test recomputes it and fails when the
// template, its presets, the paginator, the demo data or the demo photo changed without
// regenerating the images (`npm run samples`). Line endings are normalised so Windows and
// Linux checkouts give the same fingerprint.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

// Run from the project root (npm scripts and vitest both do).
export const ROOT = process.cwd()
export const SAMPLES_DIR = path.join(ROOT, 'public', 'muestras')
export const EUROPASS_DEMO_PHOTO = path.join(SAMPLES_DIR, 'europass-foto-demo.jpg')

const EUROPASS_SOURCES = [
  'components/CVTemplates/EuropassV2CV.tsx',
  'components/CVTemplates/print.ts',
  'lib/cv/styles/europass/contract.ts',
  'lib/cv/styles/europass/format.ts',
  'lib/cv/styles/europass/sample.ts',
  'lib/cv/paginate.ts',
  'scripts/samples/europass.sample.tsx',
]

export function europassFingerprint(): string {
  const h = createHash('sha256')
  for (const rel of EUROPASS_SOURCES) {
    h.update(rel)
    h.update(readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n'))
  }
  h.update(existsSync(EUROPASS_DEMO_PHOTO) ? readFileSync(EUROPASS_DEMO_PHOTO) : 'silueta')
  return h.digest('hex')
}
