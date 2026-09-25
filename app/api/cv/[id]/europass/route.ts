import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { isEuropassV2 } from '@/lib/cv/content'
import { parseVisualConfig } from '@/lib/cv/visual-config'
import { IdentityKeyError } from '@/lib/identity-crypto'
import { loadIdentity, saveIdentity, type IdentityData } from '@/lib/identity'
import { applyEuropassEdit } from '@/lib/cv/styles/europass/edit-ops'
import { withIdentity, withoutIdentity } from '@/lib/cv/styles/europass/identity-view'
import type { EuropassContent } from '@/lib/cv/styles/europass/schema'

// Europass editor backend (step 5a).
//   GET  → the CV as its owner sees it in the editor (identity values decrypted and
//          injected on the server) + its visual config.
//   POST → one edit operation (lib/cv/styles/europass/edit-ops.ts), validated here, saved
//          to the CV and to the profile. The client sends operations one at a time.
// The CV row never stores identity values (spec change 26): they are stripped before
// every write and live only encrypted in identidad_cifrada.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IDENTITY_UNAVAILABLE = 'Tus datos personales no están disponibles en este momento. Inténtalo más tarde.'

async function loadContext(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) } as const
  if (!UUID.test(id)) return { error: NextResponse.json({ error: 'CV no encontrado' }, { status: 404 }) } as const
  const { data: cv } = await supabase.from('cvs').select('id, contenido_json, visual_config').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!cv || !isEuropassV2(cv.contenido_json)) return { error: NextResponse.json({ error: 'CV no encontrado' }, { status: 404 }) } as const
  return { supabase, user, cv, content: cv.contenido_json as EuropassContent } as const
}

async function identityOf(userId: string): Promise<{ identity: IdentityData; disponible: boolean }> {
  try { return { identity: await loadIdentity(createAdminClient(), userId), disponible: true } } catch (err) {
    console.error('[europass-editor] identity unavailable', err instanceof Error ? err.message : err)
    return { identity: {}, disponible: false }
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await loadContext((await params).id)
  if ('error' in ctx) return ctx.error
  const { identity, disponible } = await identityOf(ctx.user.id)
  return NextResponse.json({
    content: withIdentity(ctx.content, identity),
    visual: parseVisualConfig(ctx.cv.visual_config),
    identidad_disponible: disponible,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await loadContext((await params).id)
  if ('error' in ctx) return ctx.error
  const { supabase, user, cv } = ctx

  if (!(await rateLimit(`europass-edit:${user.id}`, 120, 60_000))) {
    return NextResponse.json({ error: 'Demasiados cambios seguidos. Espera un momento.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Operación inválida.' }, { status: 400 }) }

  const [{ identity, disponible }, { data: profile }] = await Promise.all([
    identityOf(user.id),
    supabase.from('profiles').select('foto_url').eq('id', user.id).single(),
  ])
  const isIdentityOp = !!body && typeof body === 'object' && (body as { op?: unknown }).op === 'identidad'
  if (isIdentityOp && !disponible) return NextResponse.json({ error: IDENTITY_UNAVAILABLE }, { status: 503 })

  const result = applyEuropassEdit(ctx.content, body, { identity, fotoUrl: profile?.foto_url ?? null })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  const { writes } = result

  // Profile writes first: the CV never shows data that failed to save.
  let nextIdentity = identity
  try {
    if (writes.identidad) {
      nextIdentity = { ...identity, [writes.identidad.campo]: writes.identidad.valor || undefined }
      await saveIdentity(createAdminClient(), user.id, nextIdentity)
    }
    if (writes.profile) {
      const { data, error } = await supabase.from('profiles').update(writes.profile).eq('id', user.id).select('id')
      if (error || data?.length !== 1) throw new Error(`profiles: ${error?.message ?? 'no row updated'}`)
    }
    for (const [table, w] of [['experiencia', writes.experiencia], ['educacion', writes.educacion], ['idiomas', writes.idioma]] as const) {
      if (!w) continue
      const { data, error } = await supabase.from(table).update(w.patch).eq('id', w.id).eq('user_id', user.id).select('id')
      if (error || data?.length !== 1) throw new Error(`${table}: ${error?.message ?? 'no row updated'}`)
    }
  } catch (err) {
    if (err instanceof IdentityKeyError) return NextResponse.json({ error: IDENTITY_UNAVAILABLE }, { status: 503 })
    console.error('[europass-editor] profile write failed', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo guardar el cambio. Inténtalo de nuevo.' }, { status: 500 })
  }

  let visual = parseVisualConfig(cv.visual_config)
  const update: Record<string, unknown> = {}
  if (result.content !== ctx.content) update.contenido_json = withoutIdentity(result.content)
  if (writes.visual) {
    const { accent_color, ...presets } = writes.visual
    visual = { ...visual, ...presets }
    if (accent_color === null) delete visual.accent_color
    else if (accent_color !== undefined) visual.accent_color = accent_color
    update.visual_config = visual
  }
  if (Object.keys(update).length > 0) {
    const { data, error } = await supabase.from('cvs').update(update).eq('id', cv.id).eq('user_id', user.id).select('id')
    if (error || data?.length !== 1) {
      console.error('[europass-editor] cv write failed', error?.message)
      return NextResponse.json({ error: 'No se pudo guardar el cambio. Inténtalo de nuevo.' }, { status: 500 })
    }
  }

  return NextResponse.json({
    content: withIdentity(result.content, nextIdentity),
    visual,
    vacio: result.vacio ?? false,
    identidad_disponible: disponible,
  })
}
