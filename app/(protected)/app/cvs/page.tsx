'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface CV {
  id: string
  title: string
  job_title_applied: string
  company_name: string
  template_used: string
  created_at: string
}

interface Application {
  id: string
  cv_id: string
  status: string
}

const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IconLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>

export default function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [openFormCvId, setOpenFormCvId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ job_title: '', company_name: '', application_date: new Date().toISOString().split('T')[0], status: 'waiting', notes: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
    if (prof?.first_name) setFirstName(prof.first_name)
    const { data: cvsData } = await supabase.from('cvs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (cvsData) setCvs(cvsData)
const { data: appsData } = await supabase.from('job_applications').select('id, cv_id, status').eq('user_id', user.id)
    if (appsData) setApplications(appsData)
    setLoading(false)
  }

  function getApplicationsForCv(cvId: string) {
    return applications.filter(a => a.cv_id === cvId)
  }

  function openApplyForm(cv: CV) {
    setFormData({
      job_title: cv.job_title_applied || '',
      company_name: cv.company_name || '',
      application_date: new Date().toISOString().split('T')[0],
      status: 'waiting',
      notes: '',
    })
    setOpenFormCvId(cv.id)
  }

  async function handleSaveApplication(cv: CV) {
    if (!formData.job_title) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('job_applications').insert({
      user_id: user.id,
      cv_id: cv.id,
      company_name: formData.company_name,
      job_title: formData.job_title,
      application_date: formData.application_date,
      status: formData.status,
      notes: formData.notes,
    }).select().single()
    if (!error && data) {
      setApplications(prev => [...prev, { id: data.id, cv_id: cv.id, status: formData.status }])
      setOpenFormCvId(null)
    }
    setSaving(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalApplications = applications.length
  const totalInterviews = applications.filter(a => a.status === 'interviewing' || a.status === 'hired').length

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '13px' }}>Cargando...</div>

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
          Mis métricas
        </span>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          Hola nuevamente, {firstName || 'Usuario'}
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Lo que has logrado con nosotros.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { value: cvs.length, label: 'CVs Generados' },
          { value: totalApplications, label: 'Trabajos Aplicados' },
          { value: totalInterviews, label: 'Entrevistas' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A2B4C', letterSpacing: '-1px', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* CVs */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
          CVs generados
        </span>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>A continuación puedes ver los CVs que te hemos ayudado a crear.</p>
      </div>

      {cvs.length === 0 ? (
        <div style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 16px' }}>Todavía no has generado ningún CV.</p>
          <button onClick={() => router.push('/app/apply')} style={{ background: '#4B6BFB', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Generar mi primer CV</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cvs.map(cv => {
            const cvApps = getApplicationsForCv(cv.id)
            const hasApplied = cvApps.length > 0
            const isFormOpen = openFormCvId === cv.id

            return (
              <div key={cv.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
                  <div>
<div style={{ fontSize: '16px', fontWeight: 600, color: '#1A2B4C', marginBottom: '4px' }}>{cv.job_title_applied || 'Sin título'}</div>                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px', lineHeight: 1.7 }}>
  <div>Fecha: {formatDate(cv.created_at)}</div>
  <div>Estilo de CV: {cv.template_used ? cv.template_used.charAt(0).toUpperCase() + cv.template_used.slice(1) : '—'}</div>
</div>

                    {!hasApplied && !isFormOpen && (
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={() => openApplyForm(cv)} style={{ width: '14px', height: '14px', accentColor: '#4B6BFB', cursor: 'pointer' }} />
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Apliqué con este CV</span>
                      </label>
                    )}

                    {hasApplied && !isFormOpen && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 500 }}>
                          ✓ {cvApps.length} {cvApps.length === 1 ? 'aplicación registrada' : 'aplicaciones registradas'}
                        </span>
                        <button
                          onClick={() => openApplyForm(cv)}
                          style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Volví a aplicar con este CV
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botones acción */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#4B6BFB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <IconDownload /> Descargar
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff', color: '#1A2B4C', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <IconMail /> Enviar por e-mail
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff', color: '#1A2B4C', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <IconLink /> Generar CV Link
                    </button>
                  </div>
                </div>

                {/* Formulario inline */}
                {isFormOpen && (
                  <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 20px', background: '#F8FAFC' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1A2B4C', margin: '0 0 12px' }}>Registrar aplicación</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Puesto</label>
                        <input value={formData.job_title} onChange={e => setFormData(p => ({ ...p, job_title: e.target.value }))} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Empresa</label>
                        <input value={formData.company_name} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Fecha</label>
                        <input type="date" value={formData.application_date} onChange={e => setFormData(p => ({ ...p, application_date: e.target.value }))} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Estado</label>
                        <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                          <option value="waiting">En espera</option>
                          <option value="interviewing">Entrevistando</option>
                          <option value="hired">Contratado</option>
                          <option value="rejected">Rechazado</option>
                          <option value="no_response">Sin respuesta</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Notas (opcional)</label>
                      <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', resize: 'none', fontFamily: 'inherit', background: '#fff' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setOpenFormCvId(null)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                      <button onClick={() => handleSaveApplication(cv)} disabled={!formData.job_title || saving} style={{ background: formData.job_title ? '#4B6BFB' : '#E2E8F0', color: formData.job_title ? '#fff' : '#94A3B8', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: formData.job_title ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}