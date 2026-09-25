// Identity data (birth date, address, nationality) — Europass spec change 26.
// Stored only encrypted in public.identidad_cifrada; read/written only by the server with
// the service role, after the caller has checked the session. Never shown in Mi perfil or
// in thumbnails, never sent to an AI, never stored in a CV's contenido_json: the CV keeps
// only the on/off switches and the values are injected on the server when it is rendered
// for its owner (editor, print page, PDF).

import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptForUser, encryptForUser } from '@/lib/identity-crypto'

export const IDENTITY_FIELDS = ['fecha_nacimiento', 'nacionalidad', 'direccion'] as const
export type IdentityField = typeof IDENTITY_FIELDS[number]

// fecha_nacimiento: 'AAAA-MM-DD'.
export type IdentityData = Partial<Record<IdentityField, string>>

const LIMITS: Record<IdentityField, number> = { fecha_nacimiento: 10, nacionalidad: 60, direccion: 200 }

// Validates and normalises one value. '' clears the field. Returns an error message
// (Spanish, shown to the user) or the clean value.
export function validateIdentityValue(field: IdentityField, raw: unknown, today = new Date()): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') return { ok: false, error: 'Valor inválido.' }
  const value = raw.replace(/\s+/g, ' ').trim()
  if (!value) return { ok: true, value: '' }
  if (value.length > LIMITS[field]) return { ok: false, error: 'El texto es demasiado largo.' }
  if (field !== 'fecha_nacimiento') return { ok: true, value }

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return { ok: false, error: 'Fecha inválida.' }
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return { ok: false, error: 'Fecha inválida.' }
  if (y < 1900) return { ok: false, error: 'Fecha inválida.' }
  // At least 14 years old: working age in most of the region.
  const limit = new Date(Date.UTC(today.getUTCFullYear() - 14, today.getUTCMonth(), today.getUTCDate()))
  if (date > limit) return { ok: false, error: 'La fecha de nacimiento no es válida.' }
  return { ok: true, value }
}

function parse(json: string): IdentityData {
  const obj = JSON.parse(json) as Record<string, unknown>
  const out: IdentityData = {}
  for (const f of IDENTITY_FIELDS) if (typeof obj[f] === 'string' && obj[f]) out[f] = obj[f] as string
  return out
}

// `admin` must be a service-role client. Returns {} when the user has none.
// Throws when the key is missing/wrong — callers decide whether to render without it.
export async function loadIdentity(admin: SupabaseClient, userId: string): Promise<IdentityData> {
  const { data, error } = await admin.from('identidad_cifrada').select('datos').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(`identidad_cifrada read failed: ${error.message}`)
  if (!data?.datos) return {}
  return parse(decryptForUser(userId, data.datos))
}

// Same, but never throws: logs and returns {} (the CV is rendered without identity data
// rather than not at all).
export async function loadIdentitySafe(admin: SupabaseClient, userId: string): Promise<IdentityData> {
  try { return await loadIdentity(admin, userId) } catch (err) {
    console.error('[identity] load failed', err instanceof Error ? err.message : err)
    return {}
  }
}

export async function saveIdentity(admin: SupabaseClient, userId: string, data: IdentityData): Promise<void> {
  const clean: IdentityData = {}
  for (const f of IDENTITY_FIELDS) if (data[f]) clean[f] = data[f]
  if (Object.keys(clean).length === 0) {
    const { error } = await admin.from('identidad_cifrada').delete().eq('user_id', userId)
    if (error) throw new Error(`identidad_cifrada delete failed: ${error.message}`)
    return
  }
  const { error } = await admin.from('identidad_cifrada').upsert(
    { user_id: userId, datos: encryptForUser(userId, JSON.stringify(clean)), actualizado: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(`identidad_cifrada write failed: ${error.message}`)
}
