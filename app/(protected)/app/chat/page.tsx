'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { calculateProfession } from '@/lib/profile-helpers'

interface Message { role: 'user' | 'assistant'; content: string }

const IconPhone = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IconLocation = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
const IconLink = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const IconCopy = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IconCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconUser = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
const IconSparkle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2L13.5 9L20 10.5L13.5 12L12 19L10.5 12L4 10.5L10.5 9L12 2Z"/><path d="M19 3L19.8 6.2L23 7L19.8 7.8L19 11L18.2 7.8L15 7L18.2 6.2L19 3Z" opacity="0.7"/></svg>

const hardSkillKeywords = ['react','node','javascript','typescript','python','sql','excel','power bi','java','css','html','git','aws','docker','figma','next','vue','angular','mongodb','postgresql','data','tableau','word','google','office','notion','slack','zoom','linux','php','sheets','entry','procurement']

function classifySkills(skills: string[]) {
  const hard: string[] = []
  const soft: string[] = []
  skills.forEach(skill => {
    const isHard = hardSkillKeywords.some(kw => skill.toLowerCase().includes(kw))
    if (isHard) hard.push(skill)
    else soft.push(skill)
  })
  return { hard, soft }
}

const pillColors = [
  { bg: '#EEF2FF', color: '#4338CA' }, { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#FFF7ED', color: '#C2410C' }, { bg: '#FDF4FF', color: '#7E22CE' },
  { bg: '#F0F9FF', color: '#0369A1' }, { bg: '#FFF1F2', color: '#BE123C' },
  { bg: '#F7FEE7', color: '#4D7C0F' }, { bg: '#FFFBEB', color: '#B45309' },
]

function SkillGroup({ title, skills, showAll, onToggle }: {
  title: string, skills: string[], showAll: boolean, onToggle: () => void
}) {
  if (skills.length === 0) return null
  const visible = showAll ? skills : skills.slice(0, 5)
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {visible.map((s, i) => {
          const c = pillColors[i % pillColors.length]
          return <span key={i} style={{ background: c.bg, color: c.color, fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{s}</span>
        })}
        {skills.length > 5 && (
          <button onClick={onToggle} style={{ background: '#F5F5F5', color: '#888', fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {showAll ? 'Ver menos' : `Ver todas (${skills.length})`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>({})
  const [showAllHard, setShowAllHard] = useState(false)
  const [showAllSoft, setShowAllSoft] = useState(false)
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('first_name, last_name, phone, location, email_cv, profile_photo_url, profession').eq('id', user.id).single()
    setProfile(prof)
    const { data: pd } = await supabase.from('professional_profiles').select('data').eq('id', user.id).single()
    if (pd?.data) setProfileData(pd.data)
    const { data: msgs } = await supabase.from('chat_messages').select('role, content').eq('user_id', user.id).order('created_at', { ascending: true }).limit(50)
    if (msgs) setMessages(msgs as Message[])
    setLoadingHistory(false)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) })
      const data = await res.json()
      if (data.message) { setMessages(prev => [...prev, { role: 'assistant', content: data.message }]); loadData() }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un problema. Intenta de nuevo.' }])
    } finally { setLoading(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function copyLinkedin() {
    if (profile?.linkedin_url) {
      navigator.clipboard.writeText(profile.linkedin_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const allSkills: string[] = profileData?.habilidades ?? []
  const { hard, soft } = classifySkills(allSkills)
  const fullName = profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : null

  if (loadingHistory) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#AAAAAA', fontSize: '13px' }}>Cargando...</div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1px 1fr',
      height: 'calc(100vh - 130px)',
      minHeight: 0,
      fontFamily: "-apple-system, 'SF Pro Text', 'Inter', sans-serif",
    }}>

      {/* ── COLUMNA IZQUIERDA ── */}
      {/* overflow-y: auto aquí hace que TODA la columna scrollee junta */}
      <div style={{
        paddingRight: '28px',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Contenido interno en flex column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' }}>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4C6FFF', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', alignSelf: 'flex-start' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4C6FFF' }} />
            Mi Perfil
          </span>

          {/* Foto + nombre — flex-shrink: 0 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexShrink: 0 }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: '#EEF2FF', border: '1px solid #E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4C6FFF', flexShrink: 0 }}>
              <IconUser />
            </div>
            <div style={{ paddingTop: '4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                {fullName || '—'}
              </div>
              {(() => {
                const userProfession = profile?.profession
                const inferredProfession = calculateProfession(profileData)
                const finalProfession = userProfession || inferredProfession
                return finalProfession ? (
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                    {finalProfession}
                  </div>
                ) : null
              })()}
            </div>
          </div>

          {/* Tarjeta contacto — flex-shrink: 0, nunca se encoge */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #EFEFEF', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderBottom: '1px solid #F7F7F7' }}>
              <div style={{ color: '#BBBBBB', flexShrink: 0 }}><IconPhone /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>Teléfono</div>
                <div style={{ fontSize: '13px', fontWeight: profile?.phone ? 700 : 400, color: profile?.phone ? '#1C1C1E' : '#DDDDDD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.phone || '—'}
                </div>
              </div>
              {profile?.phone && <div style={{ flexShrink: 0 }}><IconCheck /></div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderBottom: '1px solid #F7F7F7' }}>
              <div style={{ color: '#BBBBBB', flexShrink: 0 }}><IconLocation /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>Ciudad y país</div>
                <div style={{ fontSize: '13px', fontWeight: profile?.location ? 700 : 400, color: profile?.location ? '#1C1C1E' : '#DDDDDD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.location || '—'}
                </div>
              </div>
              {profile?.location && <div style={{ flexShrink: 0 }}><IconCheck /></div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px' }}>
              <div style={{ color: '#BBBBBB', flexShrink: 0 }}><IconLink /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>LinkedIn</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: profile?.linkedin_url ? 700 : 400, color: profile?.linkedin_url ? '#1C1C1E' : '#DDDDDD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {profile?.linkedin_url || '—'}
                  </span>
                  {profile?.linkedin_url && (
                    <button onClick={copyLinkedin} style={{ background: copied ? '#F0FDF4' : '#F5F5F5', color: copied ? '#16A34A' : '#888', border: 'none', borderRadius: '8px', padding: '3px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 500, transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {copied ? <><IconCheck /> Copiado</> : <><IconCopy /> Copiar</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills — crece libremente, el scroll de la columna lo maneja */}
          {allSkills.length > 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #EFEFEF', padding: '14px' }}>
              <SkillGroup title="Hard Skills" skills={hard} showAll={showAllHard} onToggle={() => setShowAllHard(p => !p)} />
              <SkillGroup title="Soft Skills" skills={soft} showAll={showAllSoft} onToggle={() => setShowAllSoft(p => !p)} />
            </div>
          ) : (
            <div style={{ background: '#FAFAFA', borderRadius: '14px', border: '1px dashed #E5E5E5', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#BBBBBB', margin: 0 }}>Tus habilidades aparecerán aquí cuando converses con el asistente.</p>
            </div>
          )}
        </div>
      </div>

      {/* DIVISOR */}
      <div style={{ background: '#F0F0F0' }} />

      {/* ── COLUMNA DERECHA — completamente estable ── */}
      <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>

        <div style={{ flexShrink: 0, marginBottom: '14px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EEF2FF', color: '#4C6FFF', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', marginBottom: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4C6FFF' }} />
            Asistente IA
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1C1C1E', margin: 0, letterSpacing: '-0.4px' }}>Sobre mí</h1>
          <p style={{ fontSize: '12px', color: '#9B9B9B', marginTop: '6px', lineHeight: 1.6 }}>
            <strong style={{ color: '#1C1C1E', fontWeight: 600 }}>Cuéntame tu historia profesional.</strong><br />
            Puedes hacerlo a tu ritmo, sin prisa, como si se tratara de un amigo. Incluye logros, herramientas que usaste y datos cuantificables.
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #EFEFEF', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              {/* Burbuja con ícono ✨ */}
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconSparkle />
              </div>
              <div style={{ fontSize: '13px', color: '#444', lineHeight: 1.65, background: '#F7F7F7', padding: '10px 14px', borderRadius: '4px 14px 14px 14px', maxWidth: '85%' }}>
                Hola, soy tu asistente de carrera. ¿A qué te dedicas actualmente?
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSparkle />
                </div>
              )}
              <div style={{
                maxWidth: '80%', fontSize: '13px', lineHeight: 1.65, padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                background: msg.role === 'user' ? '#4C6FFF' : '#F7F7F7',
                color: msg.role === 'user' ? '#fff' : '#333',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconSparkle />
              </div>
              <div style={{ background: '#F7F7F7', padding: '10px 16px', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 1, 2].map(j => <div key={j} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#CCCCCC' }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe algo..."
            disabled={loading}
            style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '50px', padding: '11px 18px', fontSize: '13px', color: '#1C1C1E', outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{ background: input.trim() && !loading ? '#4C6FFF' : '#F0F0F0', color: input.trim() && !loading ? '#fff' : '#BBBBBB', border: 'none', borderRadius: '50px', padding: '11px 22px', fontSize: '13px', fontWeight: 600, cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}