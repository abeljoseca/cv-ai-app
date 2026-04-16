'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Template = 'harvard' | 'standard' | 'europeo' | 'silicon_valley' | 'ejecutivo'
type Step = 'form' | 'loading' | 'preview' | 'done' | 'error'
type EditState = 'idle' | 'editing' | 'saved'

const templates = [
  { id: 'harvard' as Template, name: 'Estilo Harvard', short: 'Consultoría · Finanzas · Roles estratégicos y analíticos · Perfiles de alto rendimiento', description: 'Uno de los formatos más influyentes en el mundo profesional. Es limpio, altamente estructurado y enfocado en logros medibles. Cada experiencia incluye resultados concretos. Prioriza impacto sobre tareas. Máxima compatibilidad ATS.', ideal: 'Consultoría · Finanzas · Roles estratégicos y analíticos · Perfiles de alto rendimiento' },
  { id: 'standard' as Template, name: 'Estilo Standard', short: 'Startups · Tecnología · Innovación · Product managers, founders', description: 'Tiene un enfoque más narrativo y humano. Mantiene estructura profesional, pero pone más énfasis en proyectos, liderazgo y propósito personal.', ideal: 'Startups · Tecnología · Innovación · Product managers, founders' },
  { id: 'europeo' as Template, name: 'Estilo Europeo', short: 'Aplicaciones en Europa · Instituciones públicas · ONG · Programas académicos o becas', description: 'Estándar oficial en la Unión Europea. Formato muy estructurado y uniforme. Incluye secciones detalladas como idiomas, competencias y certificaciones.', ideal: 'Aplicaciones en Europa · Instituciones públicas · ONG · Programas académicos o becas' },
  { id: 'silicon_valley' as Template, name: 'Estilo Silicon Valley', short: 'Desarrolladores · Data scientists · Ingenieros · Startups y Big Tech', description: 'El estándar en empresas tecnológicas modernas. Directo, minimalista y enfocado en resultados técnicos. Prioriza proyectos, habilidades técnicas y métricas.', ideal: 'Desarrolladores · Data scientists · Ingenieros · Startups y Big Tech' },
  { id: 'ejecutivo' as Template, name: 'Estilo Ejecutivo', short: 'CEOs · Directores · Gerentes senior · Roles de liderazgo', description: 'Diseñado para perfiles de alto nivel. Enfocado en liderazgo, visión estratégica y resultados de negocio.', ideal: 'CEOs · Directores · Gerentes senior · Roles de liderazgo' },
]

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const colors = ['#EF4444', '#4B6BFB', '#FACC15', '#22C55E', '#F97316']
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -200 - 10,
      w: 6, h: 14,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      speed: 4 + Math.random() * 5,
      swing: Math.random() * 3 - 1.5,
      swingSpeed: 0.03 + Math.random() * 0.05,
      swingAngle: Math.random() * Math.PI * 2,
      opacity: 1,
    }))
    const startTime = Date.now()
    let frame: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const elapsed = (Date.now() - startTime) / 1000
      let anyVisible = false
      pieces.forEach(p => {
        p.swingAngle += p.swingSpeed
        p.x += Math.sin(p.swingAngle) * p.swing
        p.y += p.speed
        p.rotation += 4
        if (elapsed > 1.5) p.opacity = Math.max(0, p.opacity - 0.025)
        if (p.opacity > 0) {
          anyVisible = true
          ctx.save()
          ctx.globalAlpha = p.opacity
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation * Math.PI / 180)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          ctx.restore()
        }
      })
      if (anyVisible) frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}

export default function ApplyPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('harvard')
  const [expandedTemplate, setExpandedTemplate] = useState<Template | null>('harvard')
  const [jobDescription, setJobDescription] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [cvPreviewText, setCvPreviewText] = useState('')
  const [cvData, setCvData] = useState<any>(null)
  const [editState, setEditState] = useState<EditState>('idle')
  const [editedText, setEditedText] = useState('')
  const [firstName, setFirstName] = useState('')
  const router = useRouter()

  function handleTemplateClick(t: Template) {
    setSelectedTemplate(t)
    setExpandedTemplate(expandedTemplate === t ? null : t)
  }

  async function handleGenerate() {
    if (!jobDescription.trim()) return
    setStep('loading')
    setLoadingMessage('Analizando la oferta laboral...')
    try {
      const cvResponse = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, template: selectedTemplate }),
      })
      const cvResult = await cvResponse.json()
      if (!cvResponse.ok) {
        if (cvResult.error === 'perfil_incompleto') { setErrorMessage(cvResult.message); setStep('error'); return }
        throw new Error(cvResult.error)
      }
      setCvData(cvResult.cvData)
      if (cvResult.cvData?.nombre_completo) {
        setFirstName(cvResult.cvData.nombre_completo.split(' ')[0])
      }
      const previewText = buildPreviewText(cvResult.cvData)
      setCvPreviewText(previewText)
      setEditedText(previewText)
      setEditState('idle')
      setStep('preview')
    } catch {
      setErrorMessage('Hubo un problema generando tu CV. Intenta de nuevo.')
      setStep('error')
    }
  }

  function buildPreviewText(data: any): string {
    let text = ''
    if (data.nombre_completo) text += `${data.nombre_completo}\n`
    if (data.job_title_applied) text += `${data.job_title_applied}\n`
    const contact = [data.email, data.telefono, data.ubicacion, data.linkedin].filter(Boolean).join(' | ')
    if (contact) text += `${contact}\n`
    text += '\n'
    if (data.resumen_profesional) text += `RESUMEN PROFESIONAL\n${data.resumen_profesional}\n\n`
    if (data.experiencia?.length) {
      text += 'EXPERIENCIA PROFESIONAL\n'
      data.experiencia.forEach((exp: any) => {
        text += `${exp.cargo} — ${exp.empresa}\n${exp.periodo}\n`
        exp.logros?.forEach((l: string) => text += `• ${l}\n`)
        text += '\n'
      })
    }
    if (data.educacion?.length) {
      text += 'EDUCACIÓN\n'
      data.educacion.forEach((edu: any) => text += `${edu.titulo} — ${edu.institucion} | ${edu.periodo}\n`)
      text += '\n'
    }
    if (data.habilidades?.length) text += `HABILIDADES\n${data.habilidades.join(' · ')}\n\n`
    if (data.idiomas?.length) text += `IDIOMAS\n${data.idiomas.join(' · ')}\n\n`
    return text.trim()
  }

  async function handleGenerateDocx() {
    setLoadingMessage('Generando documento...')
    setStep('loading')
    try {
      const docxResponse = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, template: selectedTemplate }),
      })
      if (!docxResponse.ok) throw new Error('Error generando el documento')
      const blob = await docxResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const name = `CV_${cvData?.nombre_completo?.replace(/\s+/g, '_') ?? 'CV'}.docx`
      setDownloadUrl(url)
      setFileName(name)
      setStep('done')
    } catch {
      setErrorMessage('Hubo un problema generando el documento.')
      setStep('error')
    }
  }

  function handleDownload() {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handleReset() {
    setStep('form')
    setJobDescription('')
    setDownloadUrl(null)
    setCvData(null)
    setCvPreviewText('')
    setEditedText('')
    setEditState('idle')
  }

  if (step === 'loading') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #EEF2FF', borderTop: '3px solid #4B6BFB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: '13px', color: '#64748B' }}>{loadingMessage}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (step === 'preview') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '24px', height: 'calc(100vh - 130px)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
            Vista previa del contenido de tu CV
          </span>
          <p style={{ fontSize: '13px', color: '#1A2B4C', fontWeight: 700, margin: '0 0 6px' }}>
            A continuación puedes ver el contenido de tu CV estructurado según el estilo que elegiste.
          </p>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            Si estás de acuerdo, haz clic en <strong style={{ color: '#1A2B4C' }}>Generar Documento</strong>.<br />
            Si deseas modificar algo, haz clic en <strong style={{ color: '#1A2B4C' }}>Editar CV</strong>, edítalo, y cuando estés listo, haz clic en <strong style={{ color: '#1A2B4C' }}>Guardar</strong>, y luego genera el documento.
          </p>
        </div>
        <div style={{ flex: 1, minHeight: 0, background: '#FFFFFF', border: `1px solid ${editState === 'editing' ? '#4B6BFB' : '#E2E8F0'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
          {editState === 'editing' ? (
            <textarea
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              spellCheck
              style={{ width: '100%', height: '100%', padding: '20px', fontSize: '13px', lineHeight: 1.7, color: '#1A2B4C', border: 'none', outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif", background: '#FFFFFF' }}
            />
          ) : (
            <pre style={{ margin: 0, padding: '20px', fontSize: '13px', lineHeight: 1.7, color: '#1A2B4C', whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif", height: '100%', overflowY: 'auto' }}>
              {editState === 'saved' ? editedText : cvPreviewText}
            </pre>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'sticky', bottom: '0', alignSelf: 'end', paddingBottom: '8px' }}>
        {editState === 'idle' && (
          <>
            <button onClick={() => setEditState('editing')} style={{ background: '#FFFFFF', border: '2px solid #4B6BFB', borderRadius: '14px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4B6BFB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4B6BFB', textAlign: 'center' }}>Editar CV</span>
            </button>
            <button onClick={handleGenerateDocx} style={{ background: '#4B6BFB', border: '2px solid #4B6BFB', borderRadius: '14px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>Generar Documento</span>
            </button>
          </>
        )}
        {editState === 'editing' && (
          <button onClick={() => { setCvPreviewText(editedText); setEditState('saved') }} style={{ background: '#FFFFFF', border: '2px solid #22C55E', borderRadius: '14px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#22C55E', textAlign: 'center' }}>Guardar</span>
          </button>
        )}
        {editState === 'saved' && (
          <>
            <button onClick={() => setEditState('editing')} style={{ background: '#FFFFFF', border: '2px solid #4B6BFB', borderRadius: '14px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4B6BFB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4B6BFB', textAlign: 'center' }}>Editar CV</span>
            </button>
            <button onClick={handleGenerateDocx} style={{ background: '#4B6BFB', border: '2px solid #4B6BFB', borderRadius: '14px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>Generar Documento</span>
            </button>
          </>
        )}
      </div>
    </div>
  )

  if (step === 'done') return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <Confetti />
      {/* TODO: remove before launch */}
      <button
        onClick={() => setStep('preview')}
        style={{ position: 'fixed', top: '68px', left: '196px', background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 20, padding: '4px 8px', borderRadius: '6px' }}
      >
        ← Volver a editar
      </button>
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', maxWidth: '480px', margin: '0 auto' }}>

        <div style={{ width: '100%', textAlign: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#4B6BFB', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
  Descarga tu CV
</p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.8, textAlign: 'center' }}>
            Listo{firstName ? `, ${firstName}` : ''}, hemos generado tu CV.<br />
            <strong style={{ color: '#1A2B4C' }}>Te deseamos éxitos en esta nueva aplicación.</strong><br />
            Recuerda hacerle seguimiento a tu proceso de aplicación en la sección Historial.
          </p>
        </div>

<div style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', flexShrink: 0, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.5px' }}>¡Tu CV está listo!</h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>Revísalo antes de aplicar a la vacante.</p>
        </div>

        <button onClick={handleDownload} style={{ width: '100%', background: '#4B6BFB', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Descargar CV
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%' }}>
          <button onClick={handleReset} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 500, color: '#1A2B4C', cursor: 'pointer' }}>Generar otro CV</button>
          <button onClick={() => alert('Próximamente')} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 500, color: '#1A2B4C', cursor: 'pointer' }}>Enviar por e-mail</button>
          <button onClick={() => alert('Próximamente')} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 500, color: '#1A2B4C', cursor: 'pointer' }}>Generar CV Link</button>
        </div>

        <button onClick={() => router.push('/app/cvs')} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '11px 24px', fontSize: '13px', fontWeight: 600, color: '#1A2B4C', cursor: 'pointer', width: '100%' }}>Ver Mis CVs</button>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 6px' }}>Algo salió mal</h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{errorMessage}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleReset} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', color: '#1A2B4C', cursor: 'pointer' }}>Intentar de nuevo</button>
        <button onClick={() => router.push('/app/chat')} style={{ background: '#4B6BFB', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Ir al chat</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', height: 'calc(100vh - 130px)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ paddingRight: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
            Crea tu CV y aplica a un trabajo
          </span>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Elige el formato de CV</h1>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Haz clic en cada estilo para ver una descripción detallada.</p>
        </div>
        {templates.map(t => {
          const isSelected = selectedTemplate === t.id
          const isExpanded = expandedTemplate === t.id
          return (
            <div key={t.id} onClick={() => handleTemplateClick(t.id)} style={{ background: '#FFFFFF', border: isSelected ? '2px solid #4B6BFB' : '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #4B6BFB' : '2px solid #CBD5E1', flexShrink: 0, transition: 'all 0.15s' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B4C' }}>{t.name}</div>
                  {!isExpanded && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong style={{ color: '#1A2B4C' }}>Ideal para:</strong> {t.short}</div>}
                </div>
                {!isSelected && !isExpanded && <span style={{ fontSize: '11px', color: '#4B6BFB', fontWeight: 500, flexShrink: 0 }}>Ver más</span>}
              </div>
              {isExpanded && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: '0 0 8px' }}>{t.description}</p>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}><strong style={{ color: '#1A2B4C' }}>Ideal para:</strong> {t.ideal}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ background: '#E2E8F0' }} />

      <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, marginBottom: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
            Un CV para cada oferta laboral
          </span>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1A2B4C', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Oferta laboral</h1>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: '#1A2B4C' }}>La mayoría de CVs no pasan a la siguiente fase porque no están optimizados para la oferta laboral.</strong><br />
            Pega la oferta y te generamos un CV único y optimizado para esa vacante.
          </p>
        </div>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Pega aquí el texto completo de la oferta de trabajo..."
          style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', fontSize: '13px', color: '#1A2B4C', resize: 'none', outline: 'none', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginBottom: '8px' }}
        />
        <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px', flexShrink: 0 }}>Mientras más completa sea la oferta, mejor optimizado quedará tu CV.</p>
        <button
          onClick={handleGenerate}
          disabled={!jobDescription.trim()}
          style={{ background: jobDescription.trim() ? '#4B6BFB' : '#E2E8F0', color: jobDescription.trim() ? '#fff' : '#94A3B8', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: 600, cursor: jobDescription.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', flexShrink: 0 }}
        >
          Generar CV
        </button>
      </div>
    </div>
  )
}