import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

const VALID_REDES = ['TRON', 'POLYGON']

// POST /api/embajador/solicitudes — ambassador requests a withdrawal of their
// available balance. Locks in every commission currently 'disponible' at the
// moment of the request (moving them to 'solicitada') so nothing can be
// double-counted into a later request.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (!(await rateLimit(user.id, 5, 60_000))) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const { red_blockchain, direccion_wallet } = body as { red_blockchain?: string; direccion_wallet?: string }

  if (!red_blockchain || !VALID_REDES.includes(red_blockchain)) {
    return NextResponse.json({ error: 'Red inválida — debe ser TRON o POLYGON.' }, { status: 400 })
  }
  if (!direccion_wallet?.trim()) {
    return NextResponse.json({ error: 'Falta la dirección de wallet.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: perfil } = await admin
    .from('embajador_perfil')
    .select('id, umbral_minimo_pago, estado, acuerdo_aceptado')
    .eq('user_id', user.id)
    .single()

  if (!perfil) return NextResponse.json({ error: 'No eres embajador' }, { status: 403 })
  if (perfil.estado !== 'activo') {
    return NextResponse.json({ error: 'Tu cuenta de embajador no está activa.' }, { status: 403 })
  }
  if (!perfil.acuerdo_aceptado) {
    return NextResponse.json({ error: 'Debes aceptar el acuerdo de embajadores antes de solicitar un retiro.' }, { status: 403 })
  }

  const { data: comisionesDisponibles } = await admin
    .from('comisiones')
    .select('id, monto_comision')
    .eq('embajador_id', perfil.id)
    .eq('estado', 'disponible')

  const comisiones = comisionesDisponibles ?? []
  const montoTotal = parseFloat(
    comisiones.reduce((acc, c) => acc + Number(c.monto_comision), 0).toFixed(2)
  )

  if (montoTotal < perfil.umbral_minimo_pago) {
    return NextResponse.json(
      { error: `Necesitas al menos $${perfil.umbral_minimo_pago} disponibles para solicitar un retiro. Tu saldo actual es $${montoTotal}.` },
      { status: 400 }
    )
  }

  const { data: solicitud, error: insertError } = await admin
    .from('solicitudes_pago')
    .insert({
      embajador_id:         perfil.id,
      monto_total:          montoTotal,
      comisiones_incluidas: comisiones.map(c => c.id),
      red_blockchain,
      direccion_wallet:     direccion_wallet.trim(),
      estado:               'solicitada',
    })
    .select()
    .single()

  if (insertError || !solicitud) {
    console.error('[embajador/solicitudes] insert error', insertError)
    return NextResponse.json({ error: 'Error al crear la solicitud de pago.' }, { status: 500 })
  }

  // Lock the included commissions so they can't be pulled into another request.
  const { error: updateError } = await admin
    .from('comisiones')
    .update({ estado: 'solicitada' })
    .in('id', comisiones.map(c => c.id))
    .eq('estado', 'disponible')

  if (updateError) {
    console.error('[embajador/solicitudes] failed to lock comisiones', updateError)
  }

  return NextResponse.json(solicitud)
}
