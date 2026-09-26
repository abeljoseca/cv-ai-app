// @vitest-environment node
// Generates the Europass sample images for the style selector (spec §11):
//   public/muestras/europass-portada.png  — top of page 1 (selector card)
//   public/muestras/europass-completo.png — every page, as A4 sheets ("Ver ejemplo")
//   public/muestras/europass.json         — fingerprint + page count
// Real template + real paginator, rendered by headless Chromium. Run: `npm run samples`
// (needs CHROME_EXECUTABLE_PATH, as for local PDFs).

import { it, vi } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

vi.mock('next/font/google', () => {
  const f = () => ({ variable: 'v', className: 'c' })
  return { Carlito: f, Gelasio: f, Arimo: f, Inter: f }
})

import EuropassV2CV from '@/components/CVTemplates/EuropassV2CV'
import { EUROPASS_PRINT_CSS } from '@/components/CVTemplates/print'
import { europassSample } from '@/lib/cv/styles/europass/sample'
import { EUROPASS_DEMO_PHOTO, ROOT, SAMPLES_DIR, europassFingerprint } from './fingerprint'

// Neutral silhouette until the AI-generated demo photo is in place.
const SILUETA = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40"><rect width="30" height="40" fill="#d5dbe8"/><circle cx="15" cy="15" r="6.5" fill="#a9b4ca"/><path d="M2 40 C2 29 8 24.5 15 24.5 C22 24.5 28 29 28 40 Z" fill="#a9b4ca"/></svg>')

function chromePath(): string {
  if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH
  const env = readFileSync(path.join(ROOT, '.env.local'), 'utf8')
  const m = env.match(/^CHROME_EXECUTABLE_PATH=(.+)$/m)
  if (!m) throw new Error('CHROME_EXECUTABLE_PATH is not set')
  return m[1].trim().replace(/^"|"$/g, '')
}

// The paginator, compiled for the browser (same code the app and the PDF use).
function paginatorScript(): string {
  const src = readFileSync(path.join(ROOT, 'lib/cv/paginate.ts'), 'utf8')
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText
    .replace(/^export /gm, '')
  return `window.P = (function(){ ${js}; return { computeBreaks, applyScreenBreaks }; })();`
}

it('generates the Europass sample images', async () => {
  const foto = existsSync(EUROPASS_DEMO_PHOTO)
    ? `data:image/jpeg;base64,${readFileSync(EUROPASS_DEMO_PHOTO).toString('base64')}`
    : SILUETA
  const cv = renderToStaticMarkup(<EuropassV2CV data={europassSample(foto)} />)
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>:root{--cv-font-carlito:Carlito} body{margin:0;background:#E9EDF3} ${EUROPASS_PRINT_CSS}</style>
</head><body>${cv}</body></html>`

  const puppeteer = (await import('puppeteer-core')).default
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.addScriptTag({ content: paginatorScript() })

    mkdirSync(SAMPLES_DIR, { recursive: true })
    // Selector card: the top of page 1 (header, summary, start of experience).
    await page.screenshot({ path: path.join(SAMPLES_DIR, 'europass-portada.png'), clip: { x: 0, y: 0, width: 794, height: 620 } })

    // "Ver ejemplo": every page as an A4 sheet, split exactly like the preview and PDF.
    const pages = await page.evaluate(() => {
      const w = window as unknown as { P: { computeBreaks: (p: HTMLElement) => { breaks: number[]; pages: number }; applyScreenBreaks: (p: HTMLElement, b: number[], s: number, g: number) => { gaps: Array<{ top: number; height: number }> } } }
      const sheet = document.querySelector<HTMLElement>('.ep2-page')!
      const { breaks, pages } = w.P.computeBreaks(sheet)
      const { gaps } = w.P.applyScreenBreaks(sheet, breaks, 1, 24)
      sheet.style.position = 'relative'
      for (const g of gaps) {
        const d = document.createElement('div')
        Object.assign(d.style, { position: 'absolute', left: '0', right: '0', top: `${g.top}px`, height: `${g.height}px`, background: '#E9EDF3' })
        sheet.appendChild(d)
      }
      return pages
    })
    const sheet = await page.$('.ep2-page')
    await sheet!.screenshot({ path: path.join(SAMPLES_DIR, 'europass-completo.png') })

    writeFileSync(path.join(SAMPLES_DIR, 'europass.json'), JSON.stringify({
      fingerprint: europassFingerprint(),
      paginas: pages,
      foto: existsSync(EUROPASS_DEMO_PHOTO) ? 'demo' : 'silueta',
    }, null, 2) + '\n')
  } finally {
    await browser.close()
  }
}, 120_000)
