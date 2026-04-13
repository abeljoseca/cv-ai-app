'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  company_name: string
  job_title: string
  application_date: string
  status: string
  notes: string
  cv_id: string | null
  created_at: string
}

interface CV {
  id: string
  job_title_applied: string
  company_name: string
  created_at: string
}

const statusConfig: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  waiting:      { label: 'En espera',     bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  interviewing: { label: 'Entrevistando', bg: '#EFF6FF', color: '#1D4ED8', dot: '#4B6BFB' },
  hired:        { label: 'Contratado',    bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  rejected:     { label: 'Rechazado',     bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
  no_response:  { label: 'Sin respuesta', bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' },
}

const filters = [
  { value: 'all', label: 'Todas' },
  { value: 'waiting', label: 'En espera' },
  { value: 'interviewing', label: 'Entrevistando' },
  { value: 'hired', label: 'Contratados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'no_response', label: 'Sin respuesta' },
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [firstName, setFirstName] = useState('')
  const [newApp, setNewApp] = useState({
    company_name: '', job_title: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'waiting', notes: '', cv_id: '',
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
    if (prof?.first_name) setFirstName(prof.first_name)
    const { data: appsData } = await supabase.from('job_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (appsData) setApplications(appsData)
    const { data: cvsData } = await supabase.from('cvs').select('id, job_title_applied, company_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
    if (cvsData) setCvs(cvsData)
    setLoading(false)
  }

  async function handleCreate() {
    if (!newApp.cv_id || !newApp.job_title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('job_applications').insert({
      user_id: user.id,
      cv_id: newApp.cv_id,
      company_name: newApp.company_name,
      job_title: newApp.job_title,
      application_date: newApp.application_date,
      status: newApp.status,
      notes: newApp.notes,
    }).select().single()
    if (!error && data) {
      setApplications(prev => [data, ...prev])
      setShowForm(false)
      setNewApp({ company_name: '', job_title: '', application_date: new Date().toISOString().split('T')[0], status: 'waiting', notes: '', cv_id: '' })
    }
  }

  function handleCvSelect(cvId: string) {
    const cv = cvs.find(c => c.id === cvId)
    setNewApp(p => ({
      ...p,
      cv_id: cvId,
      job_title: cv?.job_title_applied || p.job_title,
      company_name: cv?.company_name || p.company_name,
    }))
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('job_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function deleteApplication(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (!error) setApplications(prev => prev.filter(a => a.id !== id))
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getCvLabel(cvId: string | null) {
    if (!cvId) return null
    const cv = cvs.find(c => c.id === cvId)
    if (!cv) return null
    return `${cv.job_title_applied || 'CV'} — ${cv.company_name || 'Sin empresa'}`
  }

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter)
  const canSave = !!newApp.cv_id && !!newApp.job_title

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '13px' }}>Cargando...</div>

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
            Sigue el proceso de tus aplicaciones
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
            Hola{firstName ? `, ${firstName}` : ''}, esperamos que estés bien.
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '560px', lineHeight: 1.6 }}>
            Organiza y dale seguimiento a cada vacante en un solo lugar.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: '#4B6BFB', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          + Nueva aplicación
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1A2B4C', margin: '0 0 16px' }}>Nueva aplicación</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

            {/* CV utilizado — obligatorio */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '5px' }}>
                CV utilizado <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={newApp.cv_id}
                onChange={e => handleCvSelect(e.target.value)}
                style={{ width: '100%', border: `1px solid ${!newApp.cv_id ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', background: '#fff', color: newApp.cv_id ? '#1A2B4C' : '#94A3B8' }}
              >
                <option value="">Selecciona el CV que usaste...</option>
                {cvs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.job_title_applied || 'Sin título'} — {cv.company_name || 'Sin empresa'} ({formatDate(cv.created_at)})
                  </option>
                ))}
              </select>
              {!newApp.cv_id && <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0' }}>Debes seleccionar un CV para continuar.</p>}
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '5px' }}>Empresa</label>
              <input type="text" value={newApp.company_name} onChange={e => setNewApp(p => ({ ...p, company_name: e.target.value }))} placeholder="Google" style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '5px' }}>Puesto</label>
              <input type="text" value={newApp.job_title} onChange={e => setNewApp(p => ({ ...p, job_title: e.target.value }))} placeholder="Frontend Developer" style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '5px' }}>Fecha</label>
              <input type="date" value={newApp.application_date} onChange={e => setNewApp(p => ({ ...p, application_date: e.target.value }))} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '5px' }}>Estado</label>
              <select value={newApp.status} onChange={e => setNewApp(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                <option value="waiting">En espera</option>
                <option value="interviewing">Entrevistando</option>
                <option value="hired">Contratado</option>
                <option value="rejected">Rechazado</option>
                <option value="no_response">Sin respuesta</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '5px' }}>Notas (opcional)</label>
            <textarea value={newApp.notes} onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))} placeholder="Contacto, próximos pasos..." rows={2} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleCreate} disabled={!canSave} style={{ background: canSave ? '#4B6BFB' : '#E2E8F0', color: canSave ? '#fff' : '#94A3B8', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed' }}>Guardar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{ background: filter === f.value ? '#4B6BFB' : '#FFFFFF', color: filter === f.value ? '#fff' : '#64748B', border: `1px solid ${filter === f.value ? '#4B6BFB' : '#E2E8F0'}`, borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: filter === f.value ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            {applications.length === 0 ? 'Todavía no has registrado ninguna aplicación.' : 'No hay aplicaciones en esta categoría.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(app => {
            const s = statusConfig[app.status] ?? statusConfig.waiting
            const cvLabel = getCvLabel(app.cv_id)
            return (
              <div key={app.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A2B4C' }}>{app.job_title}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '20px', background: s.bg, color: s.color }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
                      {app.company_name} · {formatDate(app.application_date)}
                    </p>
                    {cvLabel && (
                      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 8px' }}>
                        CV: {cvLabel}
                      </p>
                    )}
                    {app.notes && <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 10px', fontStyle: 'italic' }}>{app.notes}</p>}
                    <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)} style={{ fontSize: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '5px 10px', color: '#1A2B4C', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                      <option value="waiting">En espera</option>
                      <option value="interviewing">Entrevistando</option>
                      <option value="hired">Contratado</option>
                      <option value="rejected">Rechazado</option>
                      <option value="no_response">Sin respuesta</option>
                    </select>
                  </div>
                  <button onClick={() => deleteApplication(app.id)} style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: '16px', padding: '2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}