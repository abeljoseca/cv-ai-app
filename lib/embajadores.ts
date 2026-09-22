import { createAdminClient } from '@/lib/supabase/admin'

// How long before a generated commission becomes withdrawable (ms)
const HOLDBACK_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Called from auth/callback after a new user registers.
 * Reads the momentum_ref cookie value (CODE|TIMESTAMP) and creates
 * a referidos record linking the ambassador to the new user.
 */
export async function registrarAtribucion(
  usuarioId: string,
  cookieValue: string,
): Promise<void> {
  const [codigoReferido, tsStr] = cookieValue.split('|')
  if (!codigoReferido) return

  // Validate cookie age — must be within 30 days
  const ts = parseInt(tsStr ?? '0', 10)
  if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return

  const admin = createAdminClient()

  // Find the ambassador by referral code
  const { data: embajador } = await admin
    .from('embajador_perfil')
    .select('id, estado')
    .eq('codigo_referido', codigoReferido)
    .single()

  if (!embajador || embajador.estado !== 'activo') return

  // Check if user is already attributed to someone (UNIQUE constraint on usuario_referido_id)
  const { data: existing } = await admin
    .from('referidos')
    .select('id')
    .eq('usuario_referido_id', usuarioId)
    .single()

  if (existing) return // already attributed

  await admin.from('referidos').insert({
    embajador_id:           embajador.id,
    usuario_referido_id:    usuarioId,
    codigo_referido_usado:  codigoReferido,
    origen:                 'enlace',
    fecha_clic_atribucion:  new Date(ts).toISOString(),
    fecha_registro:         new Date().toISOString(),
  })
}

/**
 * Called from the webhook after a payment is confirmed.
 * Looks up whether the paying user was referred, and if so
 * generates a commission for the ambassador.
 */
export async function generarComision(pagoId: string): Promise<void> {
  const admin = createAdminClient()

  // Load payment details
  const { data: pago } = await admin
    .from('pagos')
    .select('id, user_id, monto, tipo')
    .eq('id', pagoId)
    .single()

  if (!pago) return

  // Check if paying user has a referral attribution
  const { data: referido } = await admin
    .from('referidos')
    .select('id, embajador_id')
    .eq('usuario_referido_id', pago.user_id)
    .single()

  if (!referido) return

  // Load ambassador commission rate
  const { data: embajador } = await admin
    .from('embajador_perfil')
    .select('id, porcentaje_comision, meses_recurrencia_mensual, umbral_minimo_pago, estado')
    .eq('id', referido.embajador_id)
    .single()

  if (!embajador || embajador.estado !== 'activo') return

  // Determine commission type
  const tipo = pago.tipo === 'inspiracion_descarga' ? 'unica' : 'recurrente'

  // For recurring, check how many prior commissions exist for this ambassador+user
  if (tipo === 'recurrente') {
    const { count } = await admin
      .from('comisiones')
      .select('id', { count: 'exact', head: true })
      .eq('embajador_id', embajador.id)
      .in('referido_id', [referido.id])

    if ((count ?? 0) >= embajador.meses_recurrencia_mensual) return
  }

  // Check minimum payment threshold
  if (pago.monto < embajador.umbral_minimo_pago) return

  // Avoid double-generating for the same payment
  const { data: existing } = await admin
    .from('comisiones')
    .select('id')
    .eq('pago_origen_id', pagoId)
    .single()

  if (existing) return

  const montoComision = parseFloat(
    ((pago.monto * embajador.porcentaje_comision) / 100).toFixed(4),
  )

  const fechaDisponible = new Date(Date.now() + HOLDBACK_MS).toISOString()

  await admin.from('comisiones').insert({
    embajador_id:        embajador.id,
    referido_id:         referido.id,
    pago_origen_id:      pagoId,
    tipo,
    monto_base:          pago.monto,
    porcentaje_aplicado: embajador.porcentaje_comision,
    monto_comision:      montoComision,
    estado:              'pendiente',
    fecha_generacion:    new Date().toISOString(),
    fecha_disponible:    fechaDisponible,
  })

  // Mark the referido's first subscription date if not set
  if (tipo === 'recurrente') {
    await admin
      .from('referidos')
      .update({ fecha_primera_suscripcion: new Date().toISOString() })
      .eq('id', referido.id)
      .is('fecha_primera_suscripcion', null)
  }

  console.log(`[embajadores] Comisión generada: pago=${pagoId} embajador=${embajador.id} monto=${montoComision}`)
}

/**
 * Resolves a discount code to its percentage, or null if invalid/expired/exhausted.
 * Also returns the ambassador_id for attribution override.
 */
export async function resolverCodigoDescuento(codigo: string): Promise<{
  porcentaje: number
  embajadorId: string
  codigoId: string
} | null> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('codigos_descuento')
    .select('id, embajador_id, porcentaje_descuento, usos_maximos, usos_actuales, activo, fecha_expiracion')
    .eq('codigo', codigo.toUpperCase().trim())
    .single()

  if (!data || !data.activo) return null
  if (data.fecha_expiracion && new Date(data.fecha_expiracion) < new Date()) return null
  if (data.usos_maximos !== null && data.usos_actuales >= data.usos_maximos) return null

  return {
    porcentaje:   data.porcentaje_descuento,
    embajadorId:  data.embajador_id,
    codigoId:     data.id,
  }
}

/**
 * Increments usage counter for a discount code after successful payment.
 */
export async function consumirCodigoDescuento(codigoId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('increment_codigo_descuento_uso', { codigo_id: codigoId })
}

/**
 * Applies a discount percentage to a base price, rounded to 2 decimals.
 */
export function calcularPrecioConDescuento(precioBase: number, porcentaje: number): number {
  return Math.round(precioBase * (1 - porcentaje / 100) * 100) / 100
}

/**
 * Called from the payments webhook when a confirmed payment used a discount code.
 * Attributes the paying user to the code's ambassador (origen='codigo') unless the
 * user already has an attribution (e.g. from a referral link click) — in that case
 * it just records which discount code they used, without overriding who gets credit.
 */
export async function registrarAtribucionPorCodigo(
  usuarioId: string,
  codigoDescuentoId: string,
): Promise<void> {
  const admin = createAdminClient()

  const { data: codigo } = await admin
    .from('codigos_descuento')
    .select('codigo, embajador_id')
    .eq('id', codigoDescuentoId)
    .single()

  if (!codigo) return

  const { data: embajador } = await admin
    .from('embajador_perfil')
    .select('id, codigo_referido, estado')
    .eq('id', codigo.embajador_id)
    .single()

  if (!embajador || embajador.estado !== 'activo') return

  const { data: existing } = await admin
    .from('referidos')
    .select('id, codigo_descuento_usado')
    .eq('usuario_referido_id', usuarioId)
    .single()

  if (existing) {
    if (!existing.codigo_descuento_usado) {
      await admin.from('referidos')
        .update({ codigo_descuento_usado: codigo.codigo })
        .eq('id', existing.id)
    }
    return
  }

  await admin.from('referidos').insert({
    embajador_id:           embajador.id,
    usuario_referido_id:    usuarioId,
    codigo_referido_usado:  embajador.codigo_referido,
    codigo_descuento_usado: codigo.codigo,
    origen:                 'codigo',
    fecha_clic_atribucion:  new Date().toISOString(),
    fecha_registro:         new Date().toISOString(),
  })
}