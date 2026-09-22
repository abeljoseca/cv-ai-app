import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const VALID_ESTADOS = ['solicitada', 'en_proceso', 'pagada', 'rechazada']

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

// GET /api/admin/solicitudes-pago?estado=solicitada — queue for manual processing
export async function GET(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const estado = request.nextUrl.searchParams.get('estado') || 'solicitada'
  if (!VALID_ESTADOS.includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('solicitudes_pago')
    .select(`
      id, monto_total, red_blockchain, direccion_wallet, estado, fecha_solicitud, fecha_pago, hash_transaccion, nota_admin,
      embajador_perfil:embajador_id ( id, codigo_referido, profiles:user_id ( nombre, apellido, email_cv ) )
    `)
    .eq('estado', estado)
    .order('fecha_solicitud', { ascending: true })

  if (error) {
    console.error('[admin/solicitudes-pago GET]', error)
    return NextResponse.json({ error: 'Error al cargar solicitudes' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
