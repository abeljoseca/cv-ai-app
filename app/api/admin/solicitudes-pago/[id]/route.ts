import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin ? user : null
}

// PATCH /api/admin/solicitudes-pago/[id] — mark a withdrawal request 'pagada' (with
// hash_transaccion) or 'rechazada' (with nota_admin). Rejecting releases the locked
// commissions back to 'disponible' so they can be requested again.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const nuevoEstado = body.estado as string

  if (!['pagada', 'rechazada'].includes(nuevoEstado)) {
    return NextResponse.json({ error: 'Estado inválido — debe ser "pagada" o "rechazada"' }, { status: 400 })
  }
  if (nuevoEstado === 'pagada' && !body.hash_transaccion?.trim()) {
    return NextResponse.json({ error: 'Falta hash_transaccion para marcar como pagada.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: solicitud, error: fetchError } = await admin
    .from('solicitudes_pago')
    .select('id, estado, comisiones_incluidas')
    .eq('id', id)
    .single()

  if (fetchError || !solicitud) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }
  if (!['solicitada', 'en_proceso'].includes(solicitud.estado)) {
    return NextResponse.json({ error: 'La solicitud ya fue procesada.' }, { status: 409 })
  }

  const patch: Record<string, unknown> = { estado: nuevoEstado, nota_admin: body.nota_admin?.trim() || null }
  if (nuevoEstado === 'pagada') {
    patch.hash_transaccion = body.hash_transaccion.trim()
    patch.fecha_pago = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('solicitudes_pago')
    .update(patch)
    .eq('id', id)
    .in('estado', ['solicitada', 'en_proceso'])
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Solicitud no encontrada o ya fue procesada' }, { status: 409 })
  }

  // Update the locked commissions: 'pagada' on payout, back to 'disponible' on rejection.
  const comisionEstado = nuevoEstado === 'pagada' ? 'pagada' : 'disponible'
  await admin
    .from('comisiones')
    .update({ estado: comisionEstado })
    .in('id', solicitud.comisiones_incluidas)
    .eq('estado', 'solicitada')

  console.log(`[admin/solicitudes-pago] ${adminUser.email} → solicitud ${id}: ${solicitud.estado} → ${nuevoEstado}`)
  return NextResponse.json(data)
}
