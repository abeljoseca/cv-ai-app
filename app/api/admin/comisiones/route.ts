import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const VALID_ESTADOS = ['pendiente', 'disponible', 'solicitada', 'pagada', 'anulada', 'rechazada']

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

// GET /api/admin/comisiones?estado=pendiente — queue for manual review (default: pendiente, oldest first)
export async function GET(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const estado = request.nextUrl.searchParams.get('estado') || 'pendiente'
  if (!VALID_ESTADOS.includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('comisiones')
    .select(`
      id, monto_base, porcentaje_aplicado, monto_comision, tipo, estado, fecha_generacion, fecha_disponible,
      embajador_perfil:embajador_id ( id, codigo_referido, profiles:user_id ( nombre, apellido, email_cv ) )
    `)
    .eq('estado', estado)
    .order('fecha_generacion', { ascending: true })

  if (error) {
    console.error('[admin/comisiones GET]', error)
    return NextResponse.json({ error: 'Error al cargar comisiones' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
