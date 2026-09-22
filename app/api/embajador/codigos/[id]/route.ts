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

// PATCH /api/embajador/codigos/[id] — edit code
// If usos_actuales > 0: only activo, fecha_expiracion (extend), usos_maximos (increase) are editable
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const perfil = await getEmbajador()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!perfil.modulo_codigos_activo) return NextResponse.json({ error: 'Módulo no activado' }, { status: 403 })

  const admin = createAdminClient()

  const { data: codigo } = await admin
    .from('codigos_descuento')
    .select('*')
    .eq('id', id)
    .eq('embajador_id', perfil.id)
    .maybeSingle()

  if (!codigo) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })
  if (codigo.eliminado) return NextResponse.json({ error: 'No se puede editar un código eliminado' }, { status: 400 })

  const body = await request.json()
  const used = codigo.usos_actuales > 0

  const updates: Record<string, unknown> = {}

  // Always editable
  if ('activo' in body) updates.activo = Boolean(body.activo)
  if ('fecha_expiracion' in body) updates.fecha_expiracion = body.fecha_expiracion ?? null

  // If used: usos_maximos can only increase
  if ('usos_maximos' in body) {
    const newMax = body.usos_maximos === null ? null : Number(body.usos_maximos)
    if (used && newMax !== null && newMax < codigo.usos_maximos) {
      return NextResponse.json({ error: 'No puedes reducir el límite de usos de un código ya utilizado' }, { status: 400 })
    }
    updates.usos_maximos = newMax
  }

  // Only editable if never used
  if (!used) {
    if ('codigo' in body) {
      const newCode = String(body.codigo).toUpperCase().trim()
      if (!/^[A-Z0-9_-]{3,20}$/.test(newCode)) {
        return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
      }
      // Check global uniqueness (excluding self)
      const { data: dup } = await admin
        .from('codigos_descuento')
        .select('id')
        .eq('codigo', newCode)
        .neq('id', id)
        .maybeSingle()
      if (dup) return NextResponse.json({ error: 'Ese código ya existe' }, { status: 409 })
      updates.codigo = newCode
    }
    if ('porcentaje_descuento' in body) {
      const pct = Number(body.porcentaje_descuento)
      if (pct < 1 || pct > perfil.max_porcentaje_descuento) {
        return NextResponse.json({ error: `Descuento debe ser 1–${perfil.max_porcentaje_descuento}%` }, { status: 400 })
      }
      updates.porcentaje_descuento = pct
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios válidos' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('codigos_descuento')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/embajador/codigos/[id]
// — hard delete if usos_actuales = 0
// — soft delete (eliminado=true, activo=false) if usos_actuales > 0
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const perfil = await getEmbajador()
  if (!perfil) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: codigo } = await admin
    .from('codigos_descuento')
    .select('id, usos_actuales, eliminado')
    .eq('id', id)
    .eq('embajador_id', perfil.id)
    .maybeSingle()

  if (!codigo) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 })
  if (codigo.eliminado) return NextResponse.json({ error: 'Ya fue eliminado' }, { status: 400 })

  if (codigo.usos_actuales === 0) {
    // Safe to hard delete
    await admin.from('codigos_descuento').delete().eq('id', id)
    return NextResponse.json({ deleted: true, soft: false })
  } else {
    // Soft delete — preserve history
    await admin
      .from('codigos_descuento')
      .update({ eliminado: true, activo: false })
      .eq('id', id)
    return NextResponse.json({ deleted: true, soft: true })
  }
}