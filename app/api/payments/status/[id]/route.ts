import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNOWPaymentStatus, PAYMENT_FINISHED, PAYMENT_FAILED } from '@/lib/nowpayments'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminClient()

    // Fetch payment — validate ownership
    const { data: pago } = await admin
      .from('pagos')
      .select('id, user_id, cv_id, estado, nowpayments_payment_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!pago) {
      return NextResponse.json({ error: 'Pago no encontrado.' }, { status: 404 })
    }

    // Already confirmed — no need to call NOWPayments
    if (pago.estado === 'confirmado') {
      return NextResponse.json({ estado: 'confirmado', confirmado: true })
    }

    if (pago.estado === 'fallido' || pago.estado === 'expirado') {
      return NextResponse.json({ estado: pago.estado, confirmado: false })
    }

    // Poll NOWPayments for latest status (fallback if webhook was missed)
    if (pago.nowpayments_payment_id) {
      const nowStatus = await getNOWPaymentStatus(pago.nowpayments_payment_id)

      if (PAYMENT_FINISHED.has(nowStatus.payment_status)) {
        await admin.from('pagos').update({
          estado:                     'confirmado',
          nowpayments_payment_status: nowStatus.payment_status,
          confirmed_at:               new Date().toISOString(),
        }).eq('id', pago.id)

        if (pago.cv_id) {
          await admin.from('profiles')
            .update({ cv_pendiente_pago_id: null })
            .eq('id', user.id)
            .eq('cv_pendiente_pago_id', pago.cv_id)
        }

        return NextResponse.json({ estado: 'confirmado', confirmado: true })
      }

      if (PAYMENT_FAILED.has(nowStatus.payment_status)) {
        await admin.from('pagos').update({
          estado:                     'fallido',
          nowpayments_payment_status: nowStatus.payment_status,
        }).eq('id', pago.id)
        return NextResponse.json({ estado: 'fallido', confirmado: false })
      }

      return NextResponse.json({
        estado:             'pendiente',
        confirmado:         false,
        nowpayments_status: nowStatus.payment_status,
      })
    }

    return NextResponse.json({ estado: pago.estado, confirmado: false })
  } catch (error: any) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Error al verificar el pago.' }, { status: 500 })
  }
}