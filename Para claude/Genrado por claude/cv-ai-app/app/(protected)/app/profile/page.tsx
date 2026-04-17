'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

function calcScore(data: any): number {
  if (!data) return 0
  let score = 0
  const exp = data.experiencia
  if (Array.isArray(exp) && exp.length > 0) {
    const hasComplete = exp.some((e: any) => e.cargo && e.empresa && e.periodo)
    if (hasComplete) score += 35
    else score += 15
  }
  const edu = data.educacion
  if (Array.isArray(edu) && edu.length > 0) {
    const hasComplete = edu.some((e: any) => e.titulo && e.institucion)
    if (hasComplete) score += 25
    else score += 10
  }
  const skills = data.habilidades
  if (Array.isArray(skills) && skills.length >= 3) score += 20
  else if (Array.isArray(skills) && skills.length > 0) score += 8
  if (data.resumen_profesional) score += 20
  return Math.min(score, 100)
}

const IconUserPlaceholder = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [emailCv, setEmailCv] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [profileScore, setProfileScore] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { loadProfile() }, [])

  useEffect(() => {
    async function checkOnboarding() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single()
      if (profile && !profile.onboarding_completed && pathname !== '/app/profile') {
        router.push('/app/profile')
      }
    }
    checkOnboarding()
  }, [pathname, router])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    const { data } = await supabase.from('profiles').select('first_name, last_name, phone, location, linkedin_url, profile_photo_url, email_cv').eq('id', user.id).single()
    if (data) {
      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
      setLinkedinUrl(data.linkedin_url || '')
      setEmailCv(data.email_cv || user.email || '')
      if (data.profile_photo_url) setPhotoUrl(data.profile_photo_url)
    }
    const { data: profData } = await supabase.from('professional_profiles').select('data, completeness_score').eq('id', user.id).single()
    if (profData) {
      const score = calcScore(profData.data)
      setProfileScore(score)
      if (score !== profData.completeness_score) {
        await supabase.from('professional_profiles').update({ completeness_score: score }).eq('id', user.id)
      }
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !emailCv.trim()) {
      setMessage('Nombre, apellido y correo electrónico son obligatorios.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase.from('profiles').update({
      first_name: firstName, 
      last_name: lastName,
      phone, 
      location, 
      linkedin_url: linkedinUrl,
      email_cv: emailCv,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (!error) {
      const { data: profData } = await supabase.from('professional_profiles').select('data').eq('id', user.id).single()
      const score = calcScore(profData?.data)
      setProfileScore(score)
      await supabase.from('professional_profiles').update({ completeness_score: score }).eq('id', user.id)
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { firstName, lastName, photoUrl } }))
      setMessage('Perfil guardado correctamente.')
      setTimeout(() => setMessage(''), 1500)
    } else {
      setMessage('Error al guardar. Intenta de nuevo.')
    }
    setSaving(false)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      await supabase.from('profiles').update({ profile_photo_url: publicUrl }).eq('id', userId)
      setPhotoUrl(publicUrl)
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { firstName, lastName, photoUrl: publicUrl } }))
    } catch {
      setMessage('Error subiendo la foto. Intenta de nuevo.')
      setTimeout(() => setMessage(''), 1500)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  async function handlePhotoDelete() {
    if (!userId) return
    await supabase.from('profiles').update({ profile_photo_url: null }).eq('id', userId)
    setPhotoUrl(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: { firstName, lastName, photoUrl: null } }))
  }

  async function handlePDFImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/import-pdf', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) { setImportMessage(`Error: ${result.error}`); return }
      const campos = result.campos_encontrados?.join(', ') ?? ''
      setImportMessage(`Listo. Se importó: ${campos}.`)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profData } = await supabase.from('professional_profiles').select('data').eq('id', user.id).single()
        const score = calcScore(profData?.data)
        setProfileScore(score)
        await supabase.from('professional_profiles').update({ completeness_score: score }).eq('id', user.id)
      }
    } catch {
      setImportMessage('Error procesando el archivo. Intenta de nuevo.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function getCTA() {
    if (profileScore >= 61) return {
      label: 'Generar mi CV →', microcopy: null,
      action: () => router.push('/app/apply'), bg: '#16A34A',
    }
    if (profileScore >= 31) return {
      label: 'Completar mi perfil →',
      microcopy: 'Tu perfil tiene información básica. Podemos mejorarlo antes de generar tu CV.',
      action: () => router.push('/app/chat'), bg: '#4B6BFB',
    }
    return {
      label: 'Cuéntanos más sobre ti →',
      microcopy: 'Nos gustaría conocer más de tu experiencia para armar un mejor CV.',
      action: () => router.push('/app/chat'), bg: '#4B6BFB',
    }
  }

  const cta = getCTA()

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #E2E8F0', borderRadius: '10px',
    padding: '12px 14px', fontSize: '13px', outline: 'none',
    fontFamily: 'inherit', color: '#0F172A', background: '#fff',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '13px' }}>Cargando...</div>
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4B6BFB', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4B6BFB' }} />
          Configuración y datos de tu perfil
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '48px', alignItems: 'start' }}>

        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Bienvenido</h1>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Comencemos creando tu perfil profesional.</p>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.7 }}>
              Completa tus datos personales con precisión y buena ortografía para destacar desde el primer momento.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              Si deseas puedes cargar<br />una foto de tu rostro.
            </p>
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{ width: '100%', aspectRatio: '1/1', borderRadius: '10px', overflow: 'hidden', position: 'relative', background: '#EEF2FF', cursor: uploadingPhoto ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {uploadingPhoto ? (
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Subiendo...</div>
              ) : photoUrl ? (
                <img src={photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <IconUserPlaceholder />
              )}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} style={{ flex: 1, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 0', fontSize: '11px', color: '#0F172A', cursor: 'pointer', fontFamily: 'inherit' }}>Subir foto</button>
              <button onClick={handlePhotoDelete} disabled={uploadingPhoto} style={{ flex: 1, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 0', fontSize: '11px', color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Borrar foto</button>
            </div>
            <button style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', fontSize: '10px', color: '#94A3B8', cursor: 'not-allowed', fontFamily: 'inherit', textAlign: 'center' }}>
              Mejorar foto con IA <span style={{ fontStyle: 'italic' }}>(Próximamente)</span>
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Importar desde PDF</p>
              <p style={{ fontSize: '12px', color: '#4B6BFB', margin: '0 0 4px', lineHeight: 1.5 }}>
                Sube un CV o tu perfil de LinkedIn en formato PDF para completar tu información automáticamente.
              </p>
              <p style={{ fontSize: '12px', color: '#4B6BFB', margin: 0, lineHeight: 1.5 }}>
                <em>¿No sabes cómo descargarlo?</em><br />
                Ve a tu perfil de LinkedIn → Recursos → Guardar en PDF.
              </p>
              {importMessage && <p style={{ fontSize: '11px', margin: '8px 0 0', color: importMessage.startsWith('Error') ? '#EF4444' : '#22C55E' }}>{importMessage}</p>}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: importing ? '#A5B4FC' : '#4B6BFB', color: '#fff', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              ⬆ {importing ? 'Procesando...' : 'Subir PDF'}
              <input type="file" accept=".pdf" onChange={handlePDFImport} disabled={importing} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', display: 'block', marginBottom: '6px' }}>Nombre <span style={{ color: '#EF4444' }}>*</span></label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Alex" style={inputStyle} onFocus={e => e.target.style.borderColor = '#4B6BFB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', display: 'block', marginBottom: '6px' }}>Apellido <span style={{ color: '#EF4444' }}>*</span></label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Johnson" style={inputStyle} onFocus={e => e.target.style.borderColor = '#4B6BFB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', display: 'block', marginBottom: '6px' }}>Teléfono</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} onFocus={e => e.target.style.borderColor = '#4B6BFB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', display: 'block', marginBottom: '6px' }}>Ciudad y país</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="New York, USA" style={inputStyle} onFocus={e => e.target.style.borderColor = '#4B6BFB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', display: 'block', marginBottom: '6px' }}>Correo electrónico <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={emailCv} onChange={e => setEmailCv(e.target.value)} placeholder="ejemplo@correo.com" style={inputStyle} onFocus={e => e.target.style.borderColor = '#4B6BFB'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              <small style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>Este correo aparecerá en tus CVs generados</small>
            </div>

            {message && (
              <div style={{ fontSize: '12px', padding: '10px 14px', borderRadius: '8px', background: message.includes('Error') || message.includes('obligatorios') ? '#FEF2F2' : '#F0FDF4', color: message.includes('Error') || message.includes('obligatorios') ? '#B91C1C' : '#15803D', border: `1px solid ${message.includes('Error') || message.includes('obligatorios') ? '#FECACA' : '#BBF7D0'}`, textAlign: 'center' }}>
                {message}
              </div>
            )}

            <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: '#fff', color: '#1A2B4C', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <div>
              {cta.microcopy && (
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 8px', textAlign: 'center', lineHeight: 1.5 }}>
                  {cta.microcopy}
                </p>
              )}
              <button onClick={cta.action} style={{ width: '100%', background: cta.bg, color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px' }}>
                {cta.label}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
