import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyWebhookSignature,
  getSubscription,
  SUBSCRIPTION_ACTIVE_EVENTS,
  SUBSCRIPTION_DOWNGRADE_EVENTS,
  SUBSCRIPTION_PAYMENT_EVENT,
} from '@/lib/paypal'
import { NextRequest, NextResponse } from 'next/server'

// PayPal webhook — durable source of truth for subscription state. Verifies
// signature via PayPal's own verify-webhook-signature API (there's no simple
// HMAC like NOWPayments; PayPal requires calling back to their API with the
// transmission headers). Idempotent per event_id via a soft check on current
// state before writing.
export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      console.error('[paypal/webhook] PAYPAL_WEBHOOK_ID not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const headers = {
      'paypal-auth-algo': request.headers.get('paypal-auth-algo') ?? '',
      'paypal-cert-url': request.headers.get('paypal-cert-url') ?? '',
      'paypal-transmission-id': request.headers.get('paypal-transmission-id') ?? '',
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') ?? '',
      'paypal-transmission-time': request.headers.get('paypal-transmission-time') ?? '',
    }

    const isValid = await verifyWebhookSignature(headers, body, webhookId)
    if (!isValid) {
      console.warn('[paypal/webhook] Invalid signature — possible spoofed request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const eventType = body.event_type as string
    const resource = body.resource ?? {}
    // Subscription lifecycle events: resource IS the subscription (resource.id).
    // Sale/payment events: resource is a Sale, the subscription id is billing_agreement_id.
    const subscriptionId: string | undefined =
      eventType === SUBSCRIPTION_PAYMENT_EVENT ? resource.billing_agreement_id : resource.id

    if (!subscriptionId) {
      // Event we don't need to act on (e.g. product/plan lifecycle events) — acknowledge.
      return NextResponse.json({ received: true })
    }

    const admin = createAdminClient()

    if (SUBSCRIPTION_ACTIVE_EVENTS.has(eventType)) {
      const subscription = await getSubscription(subscriptionId)
      const userId = subscription.custom_id
      if (!userId) {
        console.error(`[paypal/webhook] subscription ${subscriptionId} has no custom_id`)
        return NextResponse.json({ received: true })
      }

      const tipo = subscription.plan_id === process.env.PAYPAL_PLAN_ID_ANUAL ? 'anual' : 'mensual'
      const nextBilling = subscription.billing_info?.next_billing_time

      await Promise.all([
        admin.from('profiles').update({ plan: 'pro' }).eq('id', userId),
        admin.from('suscripciones').upsert({
          user_id: userId,
          tipo,
          estado: 'activa',
          paypal_subscription_id: subscription.id,
          paypal_plan_id: subscription.plan_id,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: nextBilling ? new Date(nextBilling).toISOString() : new Date(Date.now() + 365 * 86_400_000).toISOString(),
        }, { onConflict: 'paypal_subscription_id' }),
      ])

      console.log(`[paypal/webhook] ${eventType}: subscription ${subscriptionId} -> profiles.plan='pro' (user ${userId})`)
    } else if (SUBSCRIPTION_DOWNGRADE_EVENTS.has(eventType)) {
      const { data: suscripcion } = await admin
        .from('suscripciones')
        .select('id, user_id')
        .eq('paypal_subscription_id', subscriptionId)
        .single()

      if (suscripcion) {
        const nuevoEstado = eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ? 'expirada' : 'cancelada'
        await Promise.all([
          admin.from('profiles').update({ plan: 'gratuito' }).eq('id', suscripcion.user_id),
          admin.from('suscripciones').update({ estado: nuevoEstado }).eq('id', suscripcion.id),
        ])
        console.log(`[paypal/webhook] ${eventType}: subscription ${subscriptionId} -> profiles.plan='gratuito' (user ${suscripcion.user_id})`)
      }
    } else if (eventType === SUBSCRIPTION_PAYMENT_EVENT) {
      const { data: suscripcion } = await admin
        .from('suscripciones')
        .select('user_id, tipo')
        .eq('paypal_subscription_id', subscriptionId)
        .single()

      if (suscripcion) {
        const amount = parseFloat(resource.amount?.total ?? resource.amount?.value ?? '0')
        await admin.from('pagos').insert({
          user_id: suscripcion.user_id,
          tipo: suscripcion.tipo === 'anual' ? 'suscripcion_anual' : 'suscripcion_mensual',
          monto: amount,
          moneda: 'USD',
          estado: 'confirmado',
          confirmed_at: new Date().toISOString(),
        })
        console.log(`[paypal/webhook] ${eventType}: logged payment for subscription ${subscriptionId}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[paypal/webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
