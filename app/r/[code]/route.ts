import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME    = 'momentum_ref'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params
  const code = (rawCode ?? '').toUpperCase().trim()
  const { origin } = new URL(request.url)

  if (!code) {
    return NextResponse.redirect(`${origin}/register`)
  }

  const admin = createAdminClient()

  // Validate code exists and ambassador is active
  const { data: embajador } = await admin
    .from('embajador_perfil')
    .select('id, estado')
    .eq('codigo_referido', code)
    .single()

  const response = NextResponse.redirect(`${origin}/register`)

  if (embajador && embajador.estado === 'activo') {
    // last-click wins: always overwrite existing cookie
    response.cookies.set(COOKIE_NAME, `${code}|${Date.now()}`, {
      path:     '/',
      maxAge:   COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      secure:   process.env.NODE_ENV === 'production',
    })
  }

  return response
}