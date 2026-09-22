import { createClient } from '@/lib/supabase/server'
import { registrarAtribucion } from '@/lib/embajadores'
import { NextRequest, NextResponse } from 'next/server'

// Handles email confirmation links and OAuth redirects
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/profile'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback]', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Create profile if it doesn't exist yet (for email confirmation flow)
  await supabase.from('profiles').upsert({
    id: user.id,
    email_cv: user.email ?? '',
    onboarding_completado: false,
    plan: 'gratuito',
  }, { onConflict: 'id', ignoreDuplicates: true })

  // Redirect to onboarding if not completed, otherwise to app
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completado')
    .eq('id', user.id)
    .single()

  // Register ambassador attribution if cookie is present (new registrations only)
  const refCookie = request.cookies.get('momentum_ref')?.value
  if (refCookie) {
    // Fire-and-forget: attribution failure must never block the user's redirect
    registrarAtribucion(user.id, refCookie).catch(err =>
      console.error('[auth/callback] atribucion error:', err),
    )
  }

  const destination = profile?.onboarding_completado ? next : '/onboarding'
  const redirectResponse = NextResponse.redirect(`${origin}${destination}`)

  // Clear attribution cookie — it's been consumed
  if (refCookie) {
    redirectResponse.cookies.set('momentum_ref', '', { path: '/', maxAge: 0 })
  }

  return redirectResponse
}