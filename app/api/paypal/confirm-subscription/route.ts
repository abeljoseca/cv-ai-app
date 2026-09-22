import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { getSubscription } from '@/lib/paypal'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/paypal/confirm-subscription — called from the frontend's onApprove
// right after the user approves on PayPal's checkout. This is a fast path for
// immediate UI feedback; the webhook (BILLING.SUBSCRIPTION.ACTIVATED) is the
// durable source of truth and does the same upgrade independently, in case the
// user closes the tab before this call completes.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!(await rateLimit(user.id, 10, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const { subscription_id } = await request.json() as { subscription_id?: string }
    if (!subscription_id) {
      return NextResponse.json({ error: 'Falta subscription_id.' }, { status: 400 })
    }

    // Never trust the client's word that it's active — verify against PayPal directly.
    const subscription = await getSubscription(subscription_id)

    if (subscription.custom_id !== user.id) {
      console.warn(`[paypal/confirm] subscription ${subscription_id} custom_id mismatch: expected ${user.id}, got ${subscription.custom_id}`)
      return NextResponse.json({ error: 'La suscripción no corresponde a este usuario.' }, { status: 403 })
    }

    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json({ ok: false, status: subscription.status })
    }

    const admin = createAdminClient()
    const tipo = subscription.plan_id === process.env.PAYPAL_PLAN_ID_ANUAL ? 'anual' : 'mensual'
    const nextBilling = subscription.billing_info?.next_billing_time

    await Promise.all([
      admin.from('profiles').update({ plan: 'pro' }).eq('id', user.id),
      admin.from('suscripciones').upsert({
        user_id: user.id,
        tipo,
        estado: 'activa',
        paypal_subscription_id: subscription.id,
        paypal_plan_id: subscription.plan_id,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: nextBilling ? new Date(nextBilling).toISOString() : new Date(Date.now() + 365 * 86_400_000).toISOString(),
      }, { onConflict: 'paypal_subscription_id' }),
    ])

    return NextResponse.json({ ok: true, status: subscription.status })
  } catch (error: any) {
    console.error('Confirm PayPal subscription error:', error)
    return NextResponse.json({ error: 'Error al confirmar la suscripción.' }, { status: 500 })
  }
}
