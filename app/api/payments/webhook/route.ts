import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyNOWPaymentsSignature,
  PAYMENT_FINISHED,
  PAYMENT_FAILED,
} from '@/lib/nowpayments'
import { generarComision } from '@/lib/embajadores'
import { NextRequest, NextResponse } from 'next/server'

// NOWPayments IPN (Instant Payment Notification) webhook
// Called by NOWPayments when payment status changes
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const signature = request.headers.get('x-nowpayments-sig') ?? ''
    const secret = process.env.NOWPAYMENTS_IPN_SECRET

    if (!secret) {
      console.error('[webhook] NOWPAYMENTS_IPN_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const isValid = await verifyNOWPaymentsSignature(body, signature, secret)
    if (!isValid) {
      console.warn('[webhook] Invalid NOWPayments signature — possible spoofed request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const paymentId     = String(body.payment_id ?? '')
    const paymentStatus = String(body.payment_status ?? '')

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: pago } = await admin
      .from('pagos')
      .select('id, user_id, cv_id, tipo, monto, estado')
      .eq('nowpayments_payment_id', paymentId)
      .single()

    if (!pago) {
      // Unknown payment — acknowledge without error (could be from a different app)
      console.warn('[webhook] Payment not found in DB:', paymentId)
      return NextResponse.json({ received: true })
    }

    // Idempotency: skip already-processed payments
    if (pago.estado === 'confirmado' || pago.estado === 'fallido') {
      return NextResponse.json({ received: true })
    }

    if (PAYMENT_FINISHED.has(paymentStatus)) {
      await admin.from('pagos').update({
        estado:                     'confirmado',
        nowpayments_payment_status: paymentStatus,
        confirmed_at:               new Date().toISOString(),
      }).eq('id', pago.id)

      // Unblock CV creation: clear pending payment id only if this CV is the one blocking
      if (pago.cv_id) {
        await admin.from('profiles')
          .update({ cv_pendiente_pago_id: null })
          .eq('id', pago.user_id)
          .eq('cv_pendiente_pago_id', pago.cv_id)
      }

      console.log(`[webhook] Payment confirmed: pago_id=${pago.id} user_id=${pago.user_id}`)

      // Generate ambassador commission if applicable (fire-and-forget)
      generarComision(pago.id).catch(err =>
        console.error('[webhook] generarComision error:', err),
      )
    } else if (PAYMENT_FAILED.has(paymentStatus)) {
      await admin.from('pagos').update({
        estado:                     'fallido',
        nowpayments_payment_status: paymentStatus,
      }).eq('id', pago.id)
    } else {
      // Intermediate status — just update the NOWPayments status field
      await admin.from('pagos').update({
        nowpayments_payment_status: paymentStatus,
      }).eq('id', pago.id)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}