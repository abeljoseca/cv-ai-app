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

// PATCH /api/admin/comisiones/[id] — approve ('disponible') or reject ('rechazada') a single commission.
// Only transitions commissions currently in 'pendiente', one at a time — this is the CEO's manual
// review step (deliberately not automated, see handoff.md pendiente #6).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const nuevoEstado = body.estado

  if (!['disponible', 'rechazada'].includes(nuevoEstado)) {
    return NextResponse.json({ error: 'Estado inválido — debe ser "disponible" o "rechazada"' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Guard on estado='pendiente' so a commission already processed (e.g. from another
  // tab, or already reviewed) can't be silently overwritten — 0 rows updated → 404/409.
  const { data, error } = await admin
    .from('comisiones')
    .update({ estado: nuevoEstado })
    .eq('id', id)
    .eq('estado', 'pendiente')
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Comisión no encontrada o ya fue procesada' }, { status: 409 })
  }

  console.log(`[admin/comisiones] ${adminUser.email} → comisión ${id}: pendiente → ${nuevoEstado}`)
  return NextResponse.json(data)
}
