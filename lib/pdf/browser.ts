import chromium from '@sparticuz/chromium'
import puppeteer, { type Browser } from 'puppeteer-core'

// Headless Chromium for server-side PDF rendering.
// - Production (Vercel/Linux): @sparticuz/chromium. Its Chromium major (153) must match
//   the one puppeteer-core targets — both are pinned exactly in package.json; bump together.
// - Local dev (Windows/Mac): @sparticuz/chromium only runs on Linux, so point
//   CHROME_EXECUTABLE_PATH at a local Chrome/Edge binary.
export async function launchBrowser(): Promise<Browser> {
  const localPath = process.env.CHROME_EXECUTABLE_PATH
  if (localPath) {
    return puppeteer.launch({ executablePath: localPath, headless: true })
  }
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
    executablePath: await chromium.executablePath(),
    headless: 'shell',
  })
}
