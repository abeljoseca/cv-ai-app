import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return email
  const visible = local.slice(0, 4)
  const stars = '*'.repeat(Math.max(local.length - 4, 3))
  return `${visible}${stars}@${domain}`
}

// GET /api/embajador — returns the ambassador profile + stats for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: perfil, error } = await admin
    .from('embajador_perfil')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !perfil) {
    return NextResponse.json({ error: 'No eres embajador' }, { status: 403 })
  }

  const [referidosRes, comisionesRes, codigosRes] = await Promise.all([
    admin
      .from('referidos')
      .select('id, usuario_referido_id, origen, codigo_descuento_usado, fecha_clic_atribucion, fecha_registro, fecha_primera_suscripcion, created_at')
      .eq('embajador_id', perfil.id)
      .order('created_at', { ascending: false }),
    admin
      .from('comisiones')
      .select('id, referido_id, monto_base, porcentaje_aplicado, monto_comision, estado, tipo, fecha_generacion, fecha_disponible')
      .eq('embajador_id', perfil.id)
      .order('fecha_generacion', { ascending: false }),
    admin
      .from('codigos_descuento')
      .select('*')
      .eq('embajador_id', perfil.id)
      .order('created_at', { ascending: false }),
  ])

  // Enrich referidos: join profile data (plan) + mask email
  const referidosRaw = referidosRes.data ?? []
  const userIds = referidosRaw
    .map(r => r.usuario_referido_id)
    .filter(Boolean) as string[]

  let planMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email_cv, plan')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      planMap[p.id] = JSON.stringify({ plan: p.plan, email_masked: maskEmail(p.email_cv ?? '') })
    }
  }

  // Build discount code lookup: codigo -> porcentaje_descuento
  const codigosData = codigosRes.data ?? []
  const codigoMap: Record<string, number> = {}
  for (const c of codigosData) {
    codigoMap[c.codigo] = c.porcentaje_descuento
  }

  const referidos = referidosRaw.map((r, idx) => {
    const profileData = r.usuario_referido_id ? planMap[r.usuario_referido_id] : null
    const { plan, email_masked } = profileData
      ? JSON.parse(profileData)
      : { plan: null, email_masked: null }

    const pct = r.codigo_descuento_usado
      ? (codigoMap[r.codigo_descuento_usado] ?? null)
      : null

    return {
      numero:                  idx + 1,
      id:                      r.id,
      email_masked,
      plan,
      origen:                  r.origen,
      codigo_descuento_usado:  r.codigo_descuento_usado ?? null,
      descuento_pct:           pct,
      fecha_clic_atribucion:   r.fecha_clic_atribucion,
      fecha_registro:          r.fecha_registro,
      fecha_primera_suscripcion: r.fecha_primera_suscripcion,
    }
  })

  const comisiones = comisionesRes.data ?? []
  const saldoDisponible = comisiones
    .filter(c => c.estado === 'disponible')
    .reduce((acc, c) => acc + Number(c.monto_comision), 0)

  const totalGanado = comisiones
    .filter(c => ['disponible', 'solicitada', 'pagada'].includes(c.estado))
    .reduce((acc, c) => acc + Number(c.monto_comision), 0)

  return NextResponse.json({
    perfil,
    referidos,
    comisiones,
    codigos:          codigosData,
    saldo_disponible: parseFloat(saldoDisponible.toFixed(2)),
    total_ganado:     parseFloat(totalGanado.toFixed(2)),
  })
}