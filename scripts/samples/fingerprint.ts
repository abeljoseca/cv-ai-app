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

// Styles still on the shared CVContent templates (photographed through the app itself:
// scripts/samples/legacy.mts + app/muestra-cv/[estilo]).
export const LEGACY_STYLE_FILES: Record<string, string> = {
  harvard: 'HarvardCV', stanford: 'StanfordCV', 'silicon-valley': 'SiliconValleyCV',
  tech: 'TechCV', minimalist: 'MinimalistCV', executive: 'ExecutiveCV',
}

const LEGACY_SHARED = [
  'components/CVTemplates/index.tsx',
  'components/CVTemplates/fonts.ts',
  'components/CVTemplates/EditableField.tsx',
  'components/CVTemplates/SkillsBlock.tsx',
  'lib/format-phone.ts',
  'lib/format-education.ts',
  'app/globals.css',
  'lib/cv/samples/legacy-sample.ts',
  'app/muestra-cv/[estilo]/page.tsx',
  'scripts/samples/legacy.mts',
]

export function legacyFingerprint(estilo: string): string {
  const h = createHash('sha256')
  for (const rel of [`components/CVTemplates/${LEGACY_STYLE_FILES[estilo]}.tsx`, ...LEGACY_SHARED]) {
    h.update(rel)
    h.update(readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n'))
  }
  return h.digest('hex')
}
