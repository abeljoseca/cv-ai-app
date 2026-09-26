// Samples for the styles still on the shared CVContent templates. They use Tailwind and
// next/font, so they are photographed through the app itself: a dev server on a spare
// port serves app/muestra-cv/[estilo] (development only) and headless Chromium takes
//   public/muestras/<estilo>-portada.png  (top of the CV, selector card)
//   public/muestras/<estilo>-completo.png (whole CV, "Ver ejemplo")
//   public/muestras/<estilo>.json         (fingerprint)
// Part of `npm run samples`. Needs CHROME_EXECUTABLE_PATH (or .env.local).

import { spawn, execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { LEGACY_STYLE_FILES, ROOT, SAMPLES_DIR, legacyFingerprint } from './fingerprint.ts'

const PORT = 3131
const BASE = `http://localhost:${PORT}`

function chromePath(): string {
  if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH
  const m = readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/^CHROME_EXECUTABLE_PATH=(.+)$/m)
  if (!m) throw new Error('CHROME_EXECUTABLE_PATH is not set')
  return m[1].trim().replace(/^"|"$/g, '')
}

async function waitFor(url: string, ms: number) {
  const until = Date.now() + ms
  while (Date.now() < until) {
    try { if ((await fetch(url)).ok) return } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`Dev server not ready at ${url}`)
}

const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { cwd: ROOT, shell: true, stdio: 'ignore', env: { ...process.env, NODE_ENV: 'development' } })
const stop = () => {
  if (!server.pid) return
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' })
    else process.kill(-server.pid)
  } catch { /* already gone */ }
}

try {
  await waitFor(`${BASE}/muestra-cv/harvard`, 180_000)
  mkdirSync(SAMPLES_DIR, { recursive: true })
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })
    for (const estilo of Object.keys(LEGACY_STYLE_FILES)) {
      await page.goto(`${BASE}/muestra-cv/${estilo}`, { waitUntil: 'networkidle0', timeout: 120_000 })
      await page.evaluate(() => document.fonts.ready)
      // The dev server's floating indicator must never end up in a sample.
      await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
      const el = await page.$('#muestra')
      if (!el) throw new Error(`No sample element for ${estilo}`)
      await page.screenshot({ path: path.join(SAMPLES_DIR, `${estilo}-portada.png`), clip: { x: 0, y: 0, width: 794, height: 620 } })
      await el.screenshot({ path: path.join(SAMPLES_DIR, `${estilo}-completo.png`) })
      writeFileSync(path.join(SAMPLES_DIR, `${estilo}.json`), JSON.stringify({ fingerprint: legacyFingerprint(estilo) }, null, 2) + '\n')
      console.log(`sample ok: ${estilo}`)
    }
  } finally {
    await browser.close()
  }
} finally {
  stop()
}
