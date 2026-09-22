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

// GET /api/admin/embajadores — list all ambassadors with aggregate stats
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: embajadores, error } = await admin
    .from('embajador_perfil')
    .select(`
      id,
      codigo_referido,
      porcentaje_comision,
      max_porcentaje_descuento,
      meses_recurrencia_mensual,
      umbral_minimo_pago,
      estado,
      modulo_codigos_activo,
      acuerdo_aceptado,
      created_at,
      profiles:user_id ( id, nombre, apellido, email_cv )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/embajadores GET]', error)
    return NextResponse.json({ error: 'Error al obtener embajadores' }, { status: 500 })
  }

  // Fetch aggregate stats per ambassador
  const ids = (embajadores ?? []).map(e => e.id)
  if (ids.length === 0) return NextResponse.json([])

  const [referidosRes, comisionesRes] = await Promise.all([
    admin
      .from('referidos')
      .select('embajador_id, fecha_registro, fecha_primera_suscripcion')
      .in('embajador_id', ids),
    admin
      .from('comisiones')
      .select('embajador_id, monto_comision, estado')
      .in('embajador_id', ids),
  ])

  const refByEmb: Record<string, { clics: number; registros: number; conversiones: number }> = {}
  for (const r of referidosRes.data ?? []) {
    if (!refByEmb[r.embajador_id]) refByEmb[r.embajador_id] = { clics: 0, registros: 0, conversiones: 0 }
    refByEmb[r.embajador_id].clics++
    if (r.fecha_registro) refByEmb[r.embajador_id].registros++
    if (r.fecha_primera_suscripcion) refByEmb[r.embajador_id].conversiones++
  }

  const comByEmb: Record<string, { pendiente: number; disponible: number; pagada: number; total: number }> = {}
  for (const c of comisionesRes.data ?? []) {
    if (!comByEmb[c.embajador_id]) comByEmb[c.embajador_id] = { pendiente: 0, disponible: 0, pagada: 0, total: 0 }
    const monto = Number(c.monto_comision)
    comByEmb[c.embajador_id].total += monto
    if (c.estado === 'pendiente')   comByEmb[c.embajador_id].pendiente  += monto
    if (c.estado === 'disponible')  comByEmb[c.embajador_id].disponible += monto
    if (c.estado === 'pagada')      comByEmb[c.embajador_id].pagada     += monto
  }

  const result = (embajadores ?? []).map(e => ({
    ...e,
    stats: {
      ...(refByEmb[e.id] ?? { clics: 0, registros: 0, conversiones: 0 }),
      ...(comByEmb[e.id] ?? { pendiente: 0, disponible: 0, pagada: 0, total: 0 }),
    },
  }))

  return NextResponse.json(result)
}

// POST /api/admin/embajadores — assign ambassador role to an existing user
export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const {
    user_id,
    codigo_referido,
    porcentaje_comision = 25,
    max_porcentaje_descuento = 20,
    meses_recurrencia_mensual = 6,
    umbral_minimo_pago = 50,
  } = body as {
    user_id?: string
    codigo_referido?: string
    porcentaje_comision?: number
    max_porcentaje_descuento?: number
    meses_recurrencia_mensual?: number
    umbral_minimo_pago?: number
  }

  if (!user_id || !codigo_referido) {
    return NextResponse.json({ error: 'Faltan: user_id, codigo_referido' }, { status: 400 })
  }

  const code = codigo_referido.toUpperCase().trim()
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
    return NextResponse.json({ error: 'Código inválido: solo letras, números, guion y guion bajo (3–20 chars)' }, { status: 400 })
  }
  if (porcentaje_comision < 0 || porcentaje_comision > 50) {
    return NextResponse.json({ error: 'Comisión debe ser entre 0% y 50%' }, { status: 400 })
  }
  if (max_porcentaje_descuento < 0 || max_porcentaje_descuento > 50) {
    return NextResponse.json({ error: 'Descuento máximo debe ser entre 0% y 50%' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify user exists
  const { data: targetUser } = await admin
    .from('profiles')
    .select('id, nombre, apellido')
    .eq('id', user_id)
    .single()

  if (!targetUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Check user is not already an ambassador
  const { data: existingProfile } = await admin
    .from('embajador_perfil')
    .select('id')
    .eq('user_id', user_id)
    .maybeSingle()

  if (existingProfile) return NextResponse.json({ error: 'Este usuario ya tiene un perfil de embajador' }, { status: 409 })

  // Check code uniqueness
  const { data: existingCode } = await admin
    .from('embajador_perfil')
    .select('id')
    .eq('codigo_referido', code)
    .maybeSingle()

  if (existingCode) return NextResponse.json({ error: 'El código ya está en uso' }, { status: 409 })

  // Create ambassador profile
  const { data: perfil, error: perfilError } = await admin
    .from('embajador_perfil')
    .insert({
      user_id,
      codigo_referido:           code,
      porcentaje_comision,
      max_porcentaje_descuento,
      meses_recurrencia_mensual,
      umbral_minimo_pago,
      estado:                    'activo',
    })
    .select()
    .single()

  if (perfilError || !perfil) {
    console.error('[admin/embajadores POST]', perfilError)
    // Return the real DB error message to help diagnosis
    const msg = perfilError?.message ?? 'Error al crear perfil de embajador'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Mark user as ambassador
  await admin
    .from('profiles')
    .update({ is_embajador: true })
    .eq('id', user_id)

  return NextResponse.json(perfil, { status: 201 })
}