'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  listAllTemplates,
  updateTemplate,
  deleteTemplate,
  createCVInspiración,
} from '@/src/features/cv-inspiracion/lib/supabase-cv-service'
import type { SupabaseTemplate } from '@/src/features/cv-inspiracion/types/template.types'

export default function AdminPlantillasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [templates, setTemplates] = useState<SupabaseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin, is_editor').eq('id', user.id).single()
      if (!profile?.is_admin && !profile?.is_editor) { router.push('/'); return }
    }
    checkAccess()
    listAllTemplates().then(setTemplates).finally(() => setLoading(false))
  }, [])

  async function handleTogglePublish(t: SupabaseTemplate) {
    setTogglingId(t.id)
    try {
      await updateTemplate(t.id, { is_published: !t.is_published })
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_published: !t.is_published } : x))
    } finally { setTogglingId(null) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } finally { setDeletingId(null) }
  }

  async function handleEdit(t: SupabaseTemplate) {
    setEditingId(t.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const record = await createCVInspiración(user.id, t.id, t.canvas_state)
      sessionStorage.setItem('editor_template_source_id', t.id)
      router.push(`/create-cv/inspiration/editor/${record.id}`)
    } catch {
      setEditingId(null)
    }
  }

  const published = templates.filter(t => t.is_published)
  const drafts    = templates.filter(t => !t.is_published)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.015em' }}>Plantillas canvas</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--mute)' }}>
            {published.length} publicada{published.length !== 1 ? 's' : ''} · {drafts.length} borrador{drafts.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <a
          href="/admin"
          style={{ fontSize: 13, color: 'var(--mute)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}
        >
          ← Panel admin
        </a>
      </div>

      {templates.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
          padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--sh-1)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--deep)', fontSize: 17, fontWeight: 600 }}>Sin plantillas aún</h3>
          <p style={{ color: 'var(--mute)', fontSize: 14, margin: 0 }}>
            Abre el editor canvas, diseña una plantilla y usa el botón{' '}
            <strong>Guardar Plantilla</strong> para guardarla aquí.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => (
            <div key={t.id} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: 'var(--sh-1)',
            }}>
              {/* Status dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: t.is_published ? '#22C55E' : '#CBD5E1',
              }} title={t.is_published ? 'Publicada' : 'Borrador'} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--deep)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.name}
                </div>
                {t.description && (
                  <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.description}
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4, fontFamily: 'ui-monospace, monospace', opacity: 0.7 }}>
                  {t.id.slice(0, 8)}… · {new Date(t.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Badge */}
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
                background: t.is_published ? '#F0FDF4' : 'var(--hover)',
                color: t.is_published ? '#16A34A' : 'var(--mute)',
                border: `1px solid ${t.is_published ? '#BBF7D0' : 'var(--line)'}`,
              }}>
                {t.is_published ? 'Publicada' : 'Borrador'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleEdit(t)}
                  disabled={!!editingId}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)',
                    background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 500,
                    cursor: editingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    opacity: editingId === t.id ? 0.6 : 1, transition: 'all .15s',
                  }}
                  onMouseEnter={e => { if (!editingId) (e.currentTarget as HTMLElement).style.background = 'var(--hover)' }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                >
                  {editingId === t.id ? (
                    <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--blue)', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  )}
                  Editar
                </button>

                <button
                  onClick={() => handleTogglePublish(t)}
                  disabled={togglingId === t.id}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8,
                    border: `1px solid ${t.is_published ? '#FECACA' : '#BBF7D0'}`,
                    background: t.is_published ? '#FEF2F2' : '#F0FDF4',
                    color: t.is_published ? '#DC2626' : '#16A34A',
                    fontSize: 12.5, fontWeight: 500,
                    cursor: togglingId === t.id ? 'not-allowed' : 'pointer',
                    opacity: togglingId === t.id ? 0.6 : 1, transition: 'all .15s',
                  }}
                >
                  {t.is_published ? 'Despublicar' : 'Publicar'}
                </button>

                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  title="Eliminar plantilla"
                  style={{
                    height: 32, width: 32, borderRadius: 8, border: '1px solid var(--line)',
                    background: 'var(--surface)', color: 'var(--mute)', fontSize: 12.5,
                    cursor: deletingId === t.id ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => {
                    if (deletingId !== t.id) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--danger-50)'
                      ;(e.currentTarget as HTMLElement).style.color = '#B52020'
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--mute)'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}