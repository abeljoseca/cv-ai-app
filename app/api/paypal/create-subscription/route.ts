import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { createSubscription } from '@/lib/paypal'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!(await rateLimit(user.id, 10, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const { tipo } = await request.json() as { tipo?: 'mensual' | 'anual' }
    if (tipo !== 'mensual' && tipo !== 'anual') {
      return NextResponse.json({ error: 'Tipo inválido — debe ser "mensual" o "anual".' }, { status: 400 })
    }

    const planId = tipo === 'mensual'
      ? process.env.PAYPAL_PLAN_ID_MENSUAL
      : process.env.PAYPAL_PLAN_ID_ANUAL
    if (!planId) {
      console.error(`PAYPAL_PLAN_ID_${tipo.toUpperCase()} not configured`)
      return NextResponse.json({ error: 'Plan Pro no disponible en este momento.' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    // custom_id always comes from the authenticated session server-side — never
    // trust a client-supplied user id here, the webhook uses this to identify who to upgrade.
    const subscription = await createSubscription({
      planId,
      userId: user.id,
      returnUrl: `${siteUrl}/account?paypal=success`,
      cancelUrl: `${siteUrl}/account?paypal=cancelled`,
    })

    return NextResponse.json({ id: subscription.id })
  } catch (error: any) {
    console.error('Create PayPal subscription error:', error)
    return NextResponse.json({ error: 'Error al crear la suscripción.' }, { status: 500 })
  }
}
