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
  applied: boolean
  application_result: string
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'Pendiente',     bg: '#FFFBEB', color: '#B45309' },
  interview:   { label: 'Entrevista',    bg: '#EFF6FF', color: '#1D4ED8' },
  hired:       { label: 'Contratado',    bg: '#F0FDF4', color: '#15803D' },
  rejected:    { label: 'Rechazado',     bg: '#FEF2F2', color: '#B91C1C' },
  no_response: { label: 'Sin respuesta', bg: '#F8FAFC', color: '#64748B' },
}

const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IconLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>

export default function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
    if (prof?.first_name) setFirstName(prof.first_name)
    const { data } = await supabase.from('cvs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setCvs(data)
    setLoading(false)
  }

  async function toggleApplied(cv: CV) {
    const { error } = await supabase.from('cvs').update({ applied: !cv.applied }).eq('id', cv.id)
    if (!error) setCvs(prev => prev.map(c => c.id === cv.id ? { ...c, applied: !c.applied } : c))
  }

  async function updateResult(cv: CV, result: string) {
    const { error } = await supabase.from('cvs').update({ application_result: result }).eq('id', cv.id)
    if (!error) setCvs(prev => prev.map(c => c.id === cv.id ? { ...c, application_result: result } : c))
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalCVs = cvs.length
  const applied = cvs.filter(c => c.applied).length
  const interviews = cvs.filter(c => c.application_result === 'interview' || c.application_result === 'hired').length

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
          { value: totalCVs, label: 'CVs Generados' },
          { value: applied, label: 'Trabajos Aplicados' },
          { value: interviews, label: 'Entrevistas' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A2B4C', letterSpacing: '-1px', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* CVs generados */}
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
          <button onClick={() => router.push('/app/apply')} style={{ background: '#4B6BFB', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Generar mi primer CV
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cvs.map(cv => {
            const status = statusConfig[cv.application_result] ?? statusConfig.pending
            return (
              <div key={cv.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A2B4C' }}>{cv.job_title_applied || 'Sin título'}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px', background: status.bg, color: status.color }}>{status.label}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                    {cv.company_name || 'Sin empresa'} · {formatDate(cv.created_at)} · {cv.template_used}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cv.applied} onChange={() => toggleApplied(cv)} style={{ width: '14px', height: '14px', accentColor: '#4B6BFB' }} />
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Apliqué con este CV</span>
                    {cv.applied && (
                      <select value={cv.application_result} onChange={e => updateResult(cv, e.target.value)} style={{ marginLeft: '8px', fontSize: '11px', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '2px 6px', color: '#1A2B4C', background: '#fff', cursor: 'pointer' }}>
                        <option value="pending">Pendiente</option>
                        <option value="interview">En entrevista</option>
                        <option value="hired">Contratado</option>
                        <option value="rejected">Rechazado</option>
                        <option value="no_response">Sin respuesta</option>
                      </select>
                    )}
                  </label>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#4B6BFB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', width: '100%' }}>
  <IconDownload /> Descargar
</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#1A2B4C', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <IconMail /> Enviar por e-mail
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#1A2B4C', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <IconLink /> Generar CV Link
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}