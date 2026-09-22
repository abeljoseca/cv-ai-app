import { createClient } from '@/lib/supabase/client'
import type { CanvasState } from '../types/canvas.types'
import type { CVInspirationRecord } from '../types/editor.types'
import type { SupabaseTemplate } from '../types/template.types'
import { serializeCanvasState, deserializeCanvasState } from './canvas-serializer'

const TABLE = 'cvs_inspiracion'

export async function createCVInspiración(
  userId: string,
  templateId: string,
  initialState: CanvasState
): Promise<CVInspirationRecord> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      template_id: templateId,
      canvas_state: initialState,
    })
    .select()
    .single()
  if (error) throw error
  return data as CVInspirationRecord
}

export async function getCVInspiración(id: string): Promise<CVInspirationRecord | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
  if (error) return null
  return data as CVInspirationRecord
}

export async function updateCanvasState(id: string, state: CanvasState): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from(TABLE)
    .update({ canvas_state: state, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function listUserCVsInspiración(userId: string): Promise<CVInspirationRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return []
  return (data ?? []) as CVInspirationRecord[]
}

export async function deleteCVInspiración(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function findExistingEditSession(
  userId: string,
  templateId: string
): Promise<CVInspirationRecord | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as CVInspirationRecord) ?? null
}

export { serializeCanvasState, deserializeCanvasState }

// ── Template management (admin) ─────────────────────────────────────────────

const TEMPLATES_TABLE = 'cv_templates'

export async function saveTemplate(
  name: string,
  description: string,
  state: CanvasState
): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .insert({ name, description, canvas_state: state, created_by: user.id })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateTemplate(
  id: string,
  updates: { name?: string; description?: string; canvas_state?: CanvasState; is_published?: boolean }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from(TEMPLATES_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function listPublishedTemplates(): Promise<SupabaseTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as SupabaseTemplate[]
}

export async function listAllTemplates(): Promise<SupabaseTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as SupabaseTemplate[]
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from(TEMPLATES_TABLE).delete().eq('id', id)
  if (error) throw error
}