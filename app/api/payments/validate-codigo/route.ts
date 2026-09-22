import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { resolverCodigoDescuento, calcularPrecioConDescuento } from '@/lib/embajadores'
import { getConfig } from '@/lib/config'
import { NextRequest, NextResponse } from 'next/server'

type Tipo = 'cv_unico' | 'inspiracion_descarga'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!(await rateLimit(user.id, 20, 60_000))) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
    }

    const { tipo, codigo } = await request.json() as { tipo?: Tipo; codigo?: string }

    if (tipo !== 'cv_unico' && tipo !== 'inspiracion_descarga') {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
    }

    const config = await getConfig()
    const precioOriginal = tipo === 'cv_unico' ? config.precio_cv_unico : config.precio_inspiracion

    if (!codigo?.trim()) {
      return NextResponse.json({ precio_original: precioOriginal })
    }

    const resuelto = await resolverCodigoDescuento(codigo)
    if (!resuelto) {
      return NextResponse.json({ valido: false, precio_original: precioOriginal, error: 'Código inválido o expirado.' })
    }

    return NextResponse.json({
      valido: true,
      porcentaje: resuelto.porcentaje,
      precio_original: precioOriginal,
      precio_final: calcularPrecioConDescuento(precioOriginal, resuelto.porcentaje),
    })
  } catch (error: any) {
    console.error('Validate codigo error:', error)
    return NextResponse.json({ error: 'Error al validar el código.' }, { status: 500 })
  }
}
