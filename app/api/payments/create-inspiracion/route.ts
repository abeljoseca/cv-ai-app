import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { createNOWPayment, NETWORK_CURRENCY } from '@/lib/nowpayments'
import { getConfig } from '@/lib/config'
import { resolverCodigoDescuento, calcularPrecioConDescuento } from '@/lib/embajadores'
import type { CryptoNetwork } from '@/types'
import { NextRequest, NextResponse } from 'next/server'
const ALLOWED_NETWORKS: CryptoNetwork[] = ['TRON', 'BSC', 'MATIC']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!rateLimit(user.id, 10, 60_000)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const body = await request.json()
    const { cv_inspiracion_id, red, codigo } = body as { cv_inspiracion_id?: string; red?: CryptoNetwork; codigo?: string }

    if (!cv_inspiracion_id || !red) {
      return NextResponse.json({ error: 'Faltan parámetros: cv_inspiracion_id y red son requeridos.' }, { status: 400 })
    }

    if (!ALLOWED_NETWORKS.includes(red)) {
      return NextResponse.json({ error: 'Red no válida.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { precio_inspiracion: PRECIO_ORIGINAL } = await getConfig()

    // Discount code is always re-resolved server-side — never trust a client-sent price.
    let INSPIRACION_PRICE = PRECIO_ORIGINAL
    let codigoDescuentoId: string | null = null
    if (codigo?.trim()) {
      const resuelto = await resolverCodigoDescuento(codigo)
      if (!resuelto) {
        return NextResponse.json({ error: 'El código de descuento ya no es válido.' }, { status: 400 })
      }
      INSPIRACION_PRICE = calcularPrecioConDescuento(PRECIO_ORIGINAL, resuelto.porcentaje)
      codigoDescuentoId = resuelto.codigoId
    }

    // Verify CV Inspiración belongs to this user
    const { data: cvInsp } = await admin
      .from('cvs_inspiracion')
      .select('id, user_id')
      .eq('id', cv_inspiracion_id)
      .single()

    if (!cvInsp || cvInsp.user_id !== user.id) {
      return NextResponse.json({ error: 'CV no encontrado.' }, { status: 404 })
    }

    // Already has a confirmed payment for this cv_inspiracion
    const { data: confirmedPayment } = await admin
      .from('pagos')
      .select('id')
      .eq('cv_inspiracion_id', cv_inspiracion_id)
      .eq('user_id', user.id)
      .eq('estado', 'confirmado')
      .limit(1)
      .single()

    if (confirmedPayment) {
      return NextResponse.json({ already_paid: true })
    }

    // Return existing pending payment if one exists (avoid duplicates)
    const { data: pendingPayment } = await admin
      .from('pagos')
      .select('id, nowpayments_payment_id, direccion_wallet, monto_cripto, red')
      .eq('cv_inspiracion_id', cv_inspiracion_id)
      .eq('user_id', user.id)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pendingPayment) {
      return NextResponse.json({
        payment_id:             pendingPayment.id,
        nowpayments_payment_id: pendingPayment.nowpayments_payment_id,
        direccion_wallet:       pendingPayment.direccion_wallet,
        monto_cripto:           pendingPayment.monto_cripto,
        red:                    pendingPayment.red,
      })
    }

    // Create new payment via NOWPayments
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const nowPayment = await createNOWPayment({
      orderId:          `insp_${cv_inspiracion_id}_${Date.now()}`,
      orderDescription: 'CV Studio — Momentum',
      priceAmount:      INSPIRACION_PRICE,
      payCurrency:      NETWORK_CURRENCY[red],
      ipnCallbackUrl:   `${siteUrl}/api/payments/webhook`,
    })

    const { data: pago, error: pagoError } = await admin.from('pagos').insert({
      user_id:                    user.id,
      cv_inspiracion_id,
      tipo:                       'inspiracion_descarga',
      monto:                      INSPIRACION_PRICE,
      monto_original:             codigoDescuentoId ? PRECIO_ORIGINAL : null,
      codigo_descuento_id:        codigoDescuentoId,
      moneda:                     'USDT',
      red,
      estado:                     'pendiente',
      nowpayments_payment_id:     nowPayment.payment_id,
      nowpayments_payment_status: nowPayment.payment_status,
      direccion_wallet:           nowPayment.pay_address,
      monto_cripto:               nowPayment.pay_amount,
    }).select().single()

    if (pagoError || !pago) {
      console.error('Error saving inspiracion payment:', pagoError)
      return NextResponse.json({ error: 'Error al registrar el pago.' }, { status: 500 })
    }

    return NextResponse.json({
      payment_id:               pago.id,
      nowpayments_payment_id:   nowPayment.payment_id,
      direccion_wallet:         nowPayment.pay_address,
      monto_cripto:             nowPayment.pay_amount,
      expiration_estimate_date: nowPayment.expiration_estimate_date,
      red,
    })
  } catch (error: any) {
    console.error('Create inspiracion payment error:', error)
    return NextResponse.json({ error: 'Error al procesar el pago.' }, { status: 500 })
  }
}