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

// GET /api/admin/embajadores/[id] — full dashboard data for one ambassador
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: perfil, error } = await admin
    .from('embajador_perfil')
    .select('*, profiles:user_id ( id, nombre, apellido, email_cv )')
    .eq('id', id)
    .single()

  if (error || !perfil) return NextResponse.json({ error: 'Embajador no encontrado' }, { status: 404 })

  const [referidosRes, comisionesRes, codigosRes] = await Promise.all([
    admin
      .from('referidos')
      .select('id, usuario_referido_id, origen, fecha_clic_atribucion, fecha_registro, fecha_primera_suscripcion, created_at')
      .eq('embajador_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('comisiones')
      .select('id, monto_base, porcentaje_aplicado, monto_comision, estado, tipo, fecha_generacion, fecha_disponible')
      .eq('embajador_id', id)
      .order('fecha_generacion', { ascending: false }),
    admin
      .from('codigos_descuento')
      .select('id, codigo, porcentaje_descuento, usos_maximos, usos_actuales, activo, fecha_expiracion, created_at')
      .eq('embajador_id', id)
      .order('created_at', { ascending: false }),
  ])

  const comisiones = comisionesRes.data ?? []
  const saldoDisponible = comisiones
    .filter(c => c.estado === 'disponible')
    .reduce((acc, c) => acc + Number(c.monto_comision), 0)
  const totalGanado = comisiones
    .filter(c => ['disponible', 'solicitada', 'pagada'].includes(c.estado))
    .reduce((acc, c) => acc + Number(c.monto_comision), 0)

  return NextResponse.json({
    perfil,
    referidos:        referidosRes.data ?? [],
    comisiones,
    codigos:          codigosRes.data ?? [],
    saldo_disponible: parseFloat(saldoDisponible.toFixed(2)),
    total_ganado:     parseFloat(totalGanado.toFixed(2)),
  })
}

// PATCH /api/admin/embajadores/[id] — update ambassador settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const allowed = [
    'porcentaje_comision',
    'max_porcentaje_descuento',
    'meses_recurrencia_mensual',
    'umbral_minimo_pago',
    'estado',
    'modulo_codigos_activo',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios válidos' }, { status: 400 })
  }

  if ('porcentaje_comision' in updates) {
    const v = Number(updates.porcentaje_comision)
    if (isNaN(v) || v < 0 || v > 50) {
      return NextResponse.json({ error: 'Comisión debe ser entre 0% y 50%' }, { status: 400 })
    }
  }

  if ('max_porcentaje_descuento' in updates) {
    const v = Number(updates.max_porcentaje_descuento)
    if (isNaN(v) || v < 0 || v > 50) {
      return NextResponse.json({ error: 'Descuento máximo debe ser entre 0% y 50%' }, { status: 400 })
    }
  }

  if ('estado' in updates && !['activo', 'suspendido'].includes(String(updates.estado))) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('embajador_perfil')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('[admin/embajadores PATCH]', error)
    return NextResponse.json({ error: 'Embajador no encontrado' }, { status: 404 })
  }

  // Sync profile is_embajador flag when suspending/reactivating
  if ('estado' in updates) {
    await admin
      .from('profiles')
      .update({ is_embajador: updates.estado === 'activo' })
      .eq('id', data.user_id)
  }

  return NextResponse.json(data)
}