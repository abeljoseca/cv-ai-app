import { Arimo, Carlito, Gelasio, Inter } from 'next/font/google'

// Self-hosted, open-licence fonts for every CV template. The CV must look identical in
// the editor, on any device and in the server-generated PDF (headless Chromium has none
// of the Windows/Mac system fonts), so templates never rely on installed fonts.
// Each one is metric-compatible with the font the template was designed around:
//   Carlito ≈ Calibri · Gelasio ≈ Georgia · Arimo ≈ Arial/Helvetica · Inter = Inter

const carlito = Carlito({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--cv-font-carlito',
})

const gelasio = Gelasio({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--cv-font-gelasio',
})

const arimo = Arimo({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--cv-font-arimo',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--cv-font-inter',
})

// Applied to the CVRenderer wrapper so the CSS variables are defined for every template.
export const cvFontVariables = [carlito, gelasio, arimo, inter].map(f => f.variable).join(' ')

// Font stacks used by the templates (system font kept as a last-resort fallback).
export const CV_FONT = {
  carlito: 'var(--cv-font-carlito), Calibri, Arial, sans-serif',
  gelasio: 'var(--cv-font-gelasio), Georgia, "Times New Roman", serif',
  arimo:   'var(--cv-font-arimo), "Helvetica Neue", Arial, sans-serif',
  inter:   'var(--cv-font-inter), Inter, "Helvetica Neue", Arial, sans-serif',
} as const
