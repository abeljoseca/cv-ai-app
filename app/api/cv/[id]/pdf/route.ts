import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canDownloadCV } from '@/lib/cv/entitlement'
import { launchBrowser } from '@/lib/pdf/browser'
import { cvContentName } from '@/lib/cv/content'
import { rateLimit } from '@/lib/rate-limit'

// Server-side PDF: headless Chromium loads the print page (/cv/[id]/imprimir) as the
// requesting user and prints it. Same engine, fonts and margins for every user, no
// dependence on their browser or print settings.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function pdfFileName(nombre: unknown): { ascii: string; utf8: string } {
  const base = typeof nombre === 'string' && nombre.trim() ? `CV ${nombre.trim()}` : 'CV'
  const clean = base.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').slice(0, 80)
  return {
    ascii: clean.normalize('NFD').replace(/[^\x20-\x7E]/g, '') + '.pdf',
    utf8: encodeURIComponent(clean + '.pdf'),
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!(await rateLimit(`pdf:${user.id}`, 10, 60_000))) {
    return NextResponse.json({ error: 'Demasiadas descargas seguidas. Espera un minuto.' }, { status: 429 })
  }

  const { data: cv } = await supabase
    .from('cvs')
    .select('id, contenido_json')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!cv) return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })

  if (!(await canDownloadCV(supabase, user.id, id))) {
    return NextResponse.json({ error: 'Este CV no está desbloqueado para descarga' }, { status: 402 })
  }

  const origin = req.nextUrl.origin
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null
  try {
    browser = await launchBrowser()
    // Act as the requesting user: the print page re-checks session, ownership and payment.
    await browser.setCookie(
      ...req.cookies.getAll().map(c => ({ name: c.name, value: c.value, domain: req.nextUrl.hostname, path: '/' })),
    )
    const page = await browser.newPage()
    const res = await page.goto(`${origin}/cv/${id}/imprimir?modo=pdf`, { waitUntil: 'networkidle0', timeout: 30_000 })
    if (!res || !res.ok()) throw new Error(`Print page responded ${res?.status() ?? 'no response'}`)

    // Refuse to print anything other than the CV (e.g. a login or "not unlocked" page).
    await page.waitForSelector('[data-cv-ready="true"]', { timeout: 15_000 })
    await page.evaluate(() => document.fonts.ready)

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })

    const name = pdfFileName(cvContentName(cv.contenido_json))
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name.ascii}"; filename*=UTF-8''${name.utf8}`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[pdf] generation failed', { cvId: id, error: err instanceof Error ? err.message : err })
    return NextResponse.json({ error: 'No se pudo generar el PDF. Inténtalo de nuevo.' }, { status: 500 })
  } finally {
    await browser?.close().catch(() => {})
  }
}
