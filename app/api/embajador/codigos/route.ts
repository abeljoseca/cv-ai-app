import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function getEmbajador() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from('embajador_perfil')
    .select('id, max_porcentaje_descuento, modulo_codigos_activo, estado')
    .eq('user_id', user.id)
    .single()
  return perfil?.estado === 'activo' ? perfil : null
}

// GET /api/embajador/codigos — list all codes (active + history)
export async function GET() {
  const perfil = await getEmbajador()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!perfil.modulo_codigos_activo) return NextResponse.json({ error: 'Módulo no activado' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('codigos_descuento')
    .select('*')
    .eq('embajador_id', perfil.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/embajador/codigos — create new code
export async function POST(request: NextRequest) {
  const perfil = await getEmbajador()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!perfil.modulo_codigos_activo) return NextResponse.json({ error: 'Módulo no activado' }, { status: 403 })

  const body = await request.json()
  const {
    codigo,
    porcentaje_descuento,
    usos_maximos,
    fecha_expiracion,
  } = body as {
    codigo?: string
    porcentaje_descuento?: number
    usos_maximos?: number | null
    fecha_expiracion?: string | null
  }

  if (!codigo || porcentaje_descuento == null) {
    return NextResponse.json({ error: 'Faltan: codigo, porcentaje_descuento' }, { status: 400 })
  }

  const code = codigo.toUpperCase().trim()
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
    return NextResponse.json({ error: 'Código inválido: solo letras, números, guion y guion bajo (3–20 chars)' }, { status: 400 })
  }

  if (porcentaje_descuento < 1 || porcentaje_descuento > perfil.max_porcentaje_descuento) {
    return NextResponse.json({
      error: `El descuento debe estar entre 1% y ${perfil.max_porcentaje_descuento}% (tu límite)`,
    }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check uniqueness globally
  const { data: existing } = await admin
    .from('codigos_descuento')
    .select('id')
    .eq('codigo', code)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Ese código ya existe. Elige otro.' }, { status: 409 })

  const { data, error } = await admin
    .from('codigos_descuento')
    .insert({
      embajador_id:        perfil.id,
      codigo:              code,
      porcentaje_descuento,
      usos_maximos:        usos_maximos ?? null,
      usos_actuales:       0,
      activo:              true,
      eliminado:           false,
      fecha_expiracion:    fecha_expiracion ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}