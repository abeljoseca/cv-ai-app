import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { cancelSubscription } from '@/lib/paypal'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/paypal/cancel-subscription — user-initiated cancellation. Per the
// CEO's decision, downgrade to Plan Inicio happens immediately (no access
// until period end). The webhook (BILLING.SUBSCRIPTION.CANCELLED) does the
// same downgrade independently and idempotently, as a durable backstop.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!(await rateLimit(user.id, 5, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const admin = createAdminClient()
    const { data: suscripcion } = await admin
      .from('suscripciones')
      .select('id, paypal_subscription_id')
      .eq('user_id', user.id)
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!suscripcion?.paypal_subscription_id) {
      return NextResponse.json({ error: 'No tienes una suscripción activa.' }, { status: 404 })
    }

    await cancelSubscription(suscripcion.paypal_subscription_id, 'Cancelado por el usuario desde su cuenta')

    await Promise.all([
      admin.from('profiles').update({ plan: 'gratuito' }).eq('id', user.id),
      admin.from('suscripciones').update({ estado: 'cancelada' }).eq('id', suscripcion.id),
    ])

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Cancel PayPal subscription error:', error)
    return NextResponse.json({ error: 'Error al cancelar la suscripción.' }, { status: 500 })
  }
}
