'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularPuntajeCompletitud } from '@/lib/completitud'
import type { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma } from '@/types'
import PaymentModal from '@/components/PaymentModal'

type Intent  = 'general' | 'vacancy' | 'studio'
type StepNum = 1 | 2

/* ── Tarjetas de intención ──────────────────────────────────────────────── */
const INTENT_CARDS = [
  {
    id: 'general' as Intent,
    iconBg: '#1A2B4C',
    iconShadow: 'rgba(26,43,76,.30)',
    color: '#1A2B4C',
    selGradient: 'linear-gradient(155deg, #E4EAF7 0%, rgba(228,234,247,0.25) 55%, #FFFFFF 100%)',
    selBorder: 'rgba(26,43,76,0.35)',
    selGlow: 'rgba(26,43,76,0.12)',
    hoverGradient: 'linear-gradient(155deg, rgba(26,43,76,0.04) 0%, #FFFFFF 70%)',
    title: 'CV General',
    subtitle: 'Sin una vacante específica en mente',
    description: 'Una versión completa y versátil de tu perfil, basada en tu experiencia y habilidades.',
    bullets: [
      'Documenta toda tu trayectoria en un solo CV',
      'Ideal para crear tu primer CV profesional',
      'Perfecto para aplicar a múltiples vacantes',
    ],
    badge: undefined as { label: string; bg: string; color: string } | undefined,
  },
  {
    id: 'vacancy' as Intent,
    iconBg: '#3B5BDB',
    iconShadow: 'rgba(59,91,219,.32)',
    color: '#3B5BDB',
    selGradient: 'linear-gradient(155deg, #E8EEFF 0%, rgba(232,238,255,0.25) 55%, #FFFFFF 100%)',
    selBorder: '#3B5BDB',
    selGlow: 'rgba(59,91,219,0.14)',
    hoverGradient: 'linear-gradient(155deg, rgba(59,91,219,0.05) 0%, #FFFFFF 70%)',
    title: 'CV Vacante',
    subtitle: 'Optimizado para un puesto específico',
    description: 'Un CV alineado con los requisitos y palabras clave de la oferta concreta a la que vas a aplicar.',
    bullets: [
      'Optimizado para superar sistemas ATS',
      'Extrae keywords relevantes de la vacante',
      'Maximiza tus posibilidades de lograr una entrevista',
    ],
    badge: { label: 'Recomendado', bg: 'rgba(59,91,219,.1)', color: '#3B5BDB' },
  },
  {
    id: 'studio' as Intent,
    iconBg: '#6D44D4',
    iconShadow: 'rgba(109,68,212,.30)',
    color: '#6D44D4',
    selGradient: 'linear-gradient(155deg, #F0EAFF 0%, rgba(240,234,255,0.25) 55%, #FFFFFF 100%)',
    selBorder: '#6D44D4',
    selGlow: 'rgba(109,68,212,0.12)',
    hoverGradient: 'linear-gradient(155deg, rgba(109,68,212,0.05) 0%, #FFFFFF 70%)',
    title: 'CV Studio',
    subtitle: 'El diseño como parte de tu propuesta profesional',
    description: 'El CV ideal para quienes entienden que cómo te presentas también es parte de tu valor.',
    bullets: [
      'Plantillas premium con diseño personalizable',
      'Diseños creativos y profesionales',
      'Perfecto para cargos creativos sin sistemas ATS',
    ],
    badge: { label: 'Nuevo', bg: '#DCFCE7', color: '#16A34A' },
  },
] as const

/* ── Estilos de CV — los 7 reales (lib/cv/styles/index.ts). 2 incluidos en
   Plan Inicio (isPro: false), 5 exclusivos de Pro. ──────────────────────── */
const ESTILOS = [
  { id: 'harvard',        nombre: 'Harvard',                 tagline: 'Clásico, estructurado, enfocado en logros medibles.',              tags: ['Consultoría', 'Finanzas', 'Banca'],          iconBg: '#1F3A5F', accent: '#4B6BFB', isPro: false },
  { id: 'stanford',       nombre: 'Stanford',                tagline: 'Puente entre rigor académico y mentalidad de producto.',            tags: ['Startups', 'Product', 'MBA'],                iconBg: '#8C1515', accent: '#22C55E', isPro: false },
  { id: 'silicon-valley', nombre: 'Silicon Valley',          tagline: 'Directo, técnico, sin relleno. Cada bullet prueba escala.',          tags: ['Developers', 'Data', 'Infra/SRE'],           iconBg: '#2563EB', accent: '#A855F7', isPro: true  },
  { id: 'tech',           nombre: 'Tech',                    tagline: 'Técnico y legible para reclutadores no técnicos.',                  tags: ['Software', 'DevOps', 'QA'],                  iconBg: '#0F766E', accent: '#0F766E', isPro: true  },
  { id: 'minimalist',     nombre: 'Minimalista',             tagline: 'El CV mismo es una muestra de tu criterio estético.',               tags: ['Diseño', 'Editorial', 'Arquitectura'],       iconBg: '#1A1A1A', accent: '#888888', isPro: true  },
  { id: 'europass',       nombre: 'Europeo (Europass)',      tagline: 'El formato oficial de la Unión Europea, en 36 países.',             tags: ['Europa', 'Públicas', 'ONGs'],                iconBg: '#003399', accent: '#003399', isPro: true  },
  { id: 'executive',      nombre: 'Ejecutivo',               tagline: 'Para C-suite y senior leadership. Métricas de P&L, no tareas.',     tags: ['CEO', 'Directores', 'VP'],                   iconBg: '#1C1917', accent: '#EF4444', isPro: true  },
] as const

type EstiloId = typeof ESTILOS[number]['id']

/* Activa onClick con Enter/Espacio en divs que actúan como opción seleccionable */
function handleOptionKeyDown(e: React.KeyboardEvent, onActivate: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onActivate()
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════════════ */
export default function CreateCVPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [loading, setLoading]   = useState(true)
  const [puntaje, setPuntaje]   = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const [step, setStep]                     = useState<StepNum>(1)
  const [intent, setIntent]                 = useState<Intent | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [selectedStyle, setSelectedStyle]   = useState<EstiloId | null>(null)

  const [plan, setPlan]                             = useState<'gratuito' | 'pro'>('gratuito')
  const [pendingPaymentCvId, setPendingPaymentCvId] = useState<string | null>(null)
  const [showPayment, setShowPayment]               = useState(false)
  const isPro = plan === 'pro'

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let mounted = true
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const [
        { data: profile }, { data: exp }, { data: edu },
        { data: hab },     { data: log }, { data: idi },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('experiencia').select('*').eq('user_id', user.id),
        supabase.from('educacion').select('*').eq('user_id', user.id),
        supabase.from('habilidades').select('*').eq('user_id', user.id),
        supabase.from('logros').select('*').eq('user_id', user.id),
        supabase.from('idiomas').select('*').eq('user_id', user.id),
      ])
      if (!mounted) return
      if (profile) {
        setPlan(profile.plan as 'gratuito' | 'pro')
        setPendingPaymentCvId(profile.cv_pendiente_pago_id ?? null)
        setPuntaje(calcularPuntajeCompletitud(
          profile as Profile,
          (exp ?? []) as Experiencia[], (edu ?? []) as Educacion[],
          (hab ?? []) as Habilidad[],  (log ?? []) as Logro[],
          (idi ?? []) as Idioma[],
        ))
      }
      setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [])

  const handleContinueStep1 = useCallback(() => {
    if (intent === 'studio') { router.push('/create-cv/studio'); return }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [intent, router])

  const handleGenerar = useCallback(() => {
    if (!selectedStyle || !intent) return
    sessionStorage.setItem('cv_params', JSON.stringify({
      mode: intent === 'vacancy' ? 'job' : 'general',
      estilo: selectedStyle,
      ...(intent === 'vacancy' && { descripcion_vacante: jobDescription }),
    }))
    router.push('/create-cv/preview')
  }, [selectedStyle, intent, jobDescription, router])

  const canContinueStep1 = intent !== null && (intent !== 'vacancy' || jobDescription.trim().length >= 30)

  if (loading) return (
    <div role="status" aria-label="Cargando" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #3B5BDB', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '12px 16px 60px' : '14px 40px 80px', animation: 'fadeUp .3s var(--ease) both' }}>

      {puntaje <= 30 && (
        <CompletitudBanner puntaje={puntaje} onGoToProfile={() => router.push('/profile')} />
      )}

      {pendingPaymentCvId && !isPro && (
        <PendingPaymentBanner onPay={() => setShowPayment(true)} />
      )}

      {showPayment && pendingPaymentCvId && (
        <PaymentModal
          cvId={pendingPaymentCvId}
          onSuccess={() => { setShowPayment(false); setPendingPaymentCvId(null) }}
          onClose={() => setShowPayment(false)}
        />
      )}

      {!pendingPaymentCvId && (
        <>
          {/* Fila de navegación: Volver (solo step 2) + indicador de pasos centrado */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            {step === 2 && (
              <BackButton
                onClick={() => { setStep(1); setSelectedStyle(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ position: 'absolute', left: 0 }}
              />
            )}
            <ProgressCapsule step={step} intent={intent} selectedStyle={selectedStyle} />
          </div>

          {step === 1 && (
            <Step1
              intent={intent}
              setIntent={(i) => { setIntent(i); setSelectedStyle(null) }}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              canContinue={canContinueStep1}
              blocked={puntaje < 30}
              isMobile={isMobile}
              onContinue={handleContinueStep1}
            />
          )}

          {step === 2 && (
            <Step2A
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              isMobile={isMobile}
              isPro={isPro}
              onGenerar={handleGenerar}
              onUpgrade={() => router.push('/account')}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   BANNER PAGO PENDIENTE
══════════════════════════════════════════════════════════════════════════ */
function PendingPaymentBanner({ onPay }: { onPay: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', marginBottom: 24,
      background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14,
    }}>
      <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: '#FED7AA', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LockIcon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#7C2D12', marginBottom: 2 }}>Tienes un CV con descarga pendiente</div>
        <div style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.5 }}>Para generar un nuevo CV debes completar el pago de $2.99 del CV anterior.</div>
      </div>
      <button onClick={onPay} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#F97316', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Completar pago
      </button>
    </div>
  )
}

function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   BANNER COMPLETITUD
══════════════════════════════════════════════════════════════════════════ */
function CompletitudBanner({ puntaje, onGoToProfile }: { puntaje: number; onGoToProfile: () => void }) {
  const blocked = puntaje < 30
  const col = blocked ? '#DC2626' : '#D97706'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', marginBottom: 24,
      background: blocked ? '#FEF2F2' : '#FFFBEB',
      border: `1px solid ${blocked ? 'rgba(220,38,38,.18)' : 'rgba(217,119,6,.18)'}`,
      borderRadius: 14,
    }}>
      <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: `${col}18`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <WarningIcon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--deep)', marginBottom: 2 }}>
          {blocked ? 'Perfil incompleto' : 'Tu CV tendrá poca información'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
          {blocked
            ? 'Necesitas al menos un 30% de completitud para crear un CV.'
            : `Tu perfil está al ${puntaje}%. Puedes continuar, pero más información mejora el resultado.`}
        </div>
      </div>
      <button onClick={onGoToProfile} style={{
        flexShrink: 0, padding: '7px 14px', borderRadius: 8,
        border: `1px solid ${blocked ? 'rgba(220,38,38,.2)' : 'rgba(217,119,6,.2)'}`,
        background: '#FFFFFF', color: 'var(--deep)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        Ir a Mi Perfil
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   PROGRESS CAPSULE
══════════════════════════════════════════════════════════════════════════ */
function ProgressCapsule({ step, intent, selectedStyle }: {
  step: StepNum; intent: Intent | null; selectedStyle: EstiloId | null
}) {
  const intentLabel = intent === 'vacancy' ? 'CV Vacante' : intent === 'general' ? 'CV General' : intent === 'studio' ? 'CV Studio' : 'Tipo de CV'
  const styleLabel  = selectedStyle ? (ESTILOS.find(e => e.id === selectedStyle)?.nombre ?? 'Estilo') : 'Estilo'
  const steps = [
    { label: step > 1 ? intentLabel : 'Tipo de CV', done: step > 1, active: step === 1 },
    { label: step > 1 && selectedStyle ? styleLabel : 'Estilo',     done: false,    active: step === 2 },
    { label: 'Vista previa',                                          done: false,    active: false },
  ]
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && (
              <div style={{
                width: 28, height: 1, flexShrink: 0,
                background: s.done ? '#3B5BDB' : '#E2E8F0',
                transition: 'background .4s ease',
              }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Dot con radar o check */}
              <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
                {/* Radar rings — solo en paso activo */}
                {s.active && <>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '1.5px solid #3B5BDB',
                    animation: 'radarPulse 2s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '1.5px solid #3B5BDB',
                    animation: 'radarPulse 2s ease-out infinite 0.7s',
                    pointerEvents: 'none',
                  }} />
                </>}
                {/* Círculo principal */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.done ? '#DCFCE7' : s.active ? '#3B5BDB' : 'transparent',
                  border: s.done ? 'none' : s.active ? 'none' : '1.5px solid #CBD5E1',
                  transition: 'background .35s ease, border-color .35s ease',
                }}>
                  {s.done ? (
                    <DrawnCheck />
                  ) : s.active ? (
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#fff',
                    }} />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#CBD5E1',
                    }} />
                  )}
                </div>
              </div>

              <span style={{
                fontSize: 13, fontWeight: s.active ? 600 : s.done ? 500 : 400,
                color: s.done ? '#334155' : s.active ? '#0F172A' : '#64748B',
                whiteSpace: 'nowrap',
                transition: 'color .3s ease',
              }}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Check con spring bounce — más premium que stroke-dashoffset */
function DrawnCheck() {
  return (
    <svg
      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16A34A"
      strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'checkBounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both', display: 'block' }}
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 1
══════════════════════════════════════════════════════════════════════════ */
function Step1({ intent, setIntent, jobDescription, setJobDescription, canContinue, blocked, isMobile, onContinue }: {
  intent: Intent | null; setIntent: (i: Intent) => void
  jobDescription: string; setJobDescription: (v: string) => void
  canContinue: boolean; blocked: boolean; isMobile: boolean; onContinue: () => void
}) {
  const charCount = jobDescription.trim().length
  return (
    <div style={{ animation: 'fadeUp .25s var(--ease) both' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
          ¿Qué tipo de CV necesitas?
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>
          Elige según tu situación actual. Cada opción produce un resultado diferente.
        </p>
      </div>

      <div role="radiogroup" aria-label="Tipo de CV" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
        {INTENT_CARDS.map(card => (
          <IntentCard
            key={card.id}
            card={card}
            selected={intent === card.id}
            disabled={blocked}
            onClick={() => !blocked && setIntent(card.id)}
          />
        ))}
      </div>

      {/* Textarea vacante */}
      <div style={{
        overflow: 'hidden',
        maxHeight: intent === 'vacancy' ? 240 : 0,
        opacity: intent === 'vacancy' ? 1 : 0,
        transition: 'max-height .4s cubic-bezier(0.4,0,0.2,1), opacity .3s var(--ease)',
        marginTop: intent === 'vacancy' ? 16 : 0,
      }}>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Descripción del puesto
            </span>
            <span style={{ fontSize: 12, color: charCount >= 30 ? '#16A34A' : charCount > 0 ? '#D97706' : '#64748B', transition: 'color .2s' }}>
              {charCount} {charCount < 30 ? '/ mínimo 30' : 'caracteres'}
            </span>
          </div>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Pega aquí la descripción completa del puesto al que quieres aplicar. Cuanta más información, mejor resultado."
            rows={4}
            style={{
              width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 12px',
              fontSize: 13.5, color: '#0F172A', background: '#F8FAFC', resize: 'vertical', minHeight: 96,
              outline: 'none', lineHeight: 1.55, transition: 'border-color .15s, box-shadow .15s', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#3B5BDB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,91,219,.08)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
      </div>

      <button
        disabled={!canContinue} onClick={onContinue}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          margin: '32px auto 0', height: 52,
          width: isMobile ? '100%' : 'auto', minWidth: isMobile ? undefined : 400,
          padding: '0 48px', borderRadius: 12, border: 'none', boxSizing: 'border-box',
          background: canContinue ? '#3B5BDB' : '#E2E8F0',
          color: canContinue ? '#fff' : '#94A3B8',
          fontWeight: 600, fontSize: 15, cursor: canContinue ? 'pointer' : 'not-allowed',
          transition: 'all .2s var(--ease)',
          boxShadow: canContinue ? '0 1px 2px rgba(0,0,0,0.06), 0 8px 20px -6px rgba(59,91,219,.45)' : 'none',
        }}
      >
        {intent === 'studio' ? 'Ir a CV Studio' : 'Continuar'} <ChevRIcon size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

/* ── IntentCard — premium, gradient por color ───────────────────────────── */
function IntentCard({ card, selected, disabled, onClick }: {
  card: typeof INTENT_CARDS[number]
  selected: boolean; disabled: boolean; onClick: () => void
}) {
  const [hover, setHover] = useState(false)

  const bg      = selected ? card.selGradient : hover && !disabled ? card.hoverGradient : '#FFFFFF'
  const border  = selected ? `2px solid ${card.selBorder}` : hover && !disabled ? `2px solid rgba(59,91,219,.2)` : '2px solid #E2E8F0'
  const shadow  = selected
    ? `0 0 0 4px ${card.selGlow}, 0 8px 32px ${card.selGlow}, 0 2px 8px rgba(0,0,0,0.05)`
    : hover && !disabled
    ? '0 8px 28px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04)'
    : '0 1px 4px rgba(0,0,0,0.04)'

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className="focus-ring"
      onClick={onClick}
      onKeyDown={e => !disabled && handleOptionKeyDown(e, onClick)}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: bg, borderRadius: 20, padding: '28px 24px',
        border, boxShadow: shadow,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all .22s cubic-bezier(0.4,0,0.2,1)',
        transform: hover && !disabled && !selected ? 'translateY(-3px)' : 'none',
        height: '100%',
      }}
    >
      {/* Header — ícono + título misma línea */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 0 }}>
        <div aria-hidden="true" style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: card.iconBg, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 14px ${card.iconShadow}`,
        }}>
          {card.id === 'general' ? <FileStackIcon size={26} /> : card.id === 'vacancy' ? <TargetIcon size={26} /> : <PaletteIcon size={26} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', marginBottom: 3, overflow: 'hidden' }}>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>
              {card.title}
            </span>
            {card.badge && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: card.badge.bg, color: card.badge.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {card.badge.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4 }}>{card.subtitle}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: selected ? `${card.selBorder}30` : '#E2E8F0', margin: '20px 0' }} />

      {/* Descripción corta */}
      <p style={{ margin: '0 0 18px', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
        {card.description}
      </p>

      {/* Bullets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {card.bullets.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div aria-hidden="true" style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: selected ? `${card.color}18` : '#F1F5F9',
              border: `1.5px solid ${selected ? `${card.color}35` : '#E2E8F0'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s',
            }}>
              <CheckIcon size={10} color={selected ? card.color : '#64748B'} />
            </div>
            <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 2A — Selector de estilo
══════════════════════════════════════════════════════════════════════════ */
function Step2A({ selectedStyle, setSelectedStyle, isMobile, isPro, onGenerar, onUpgrade }: {
  selectedStyle: EstiloId | null; setSelectedStyle: (s: EstiloId) => void
  isMobile: boolean; isPro: boolean; onGenerar: () => void; onUpgrade: () => void
}) {
  const selectedMeta  = selectedStyle ? ESTILOS.find(e => e.id === selectedStyle) ?? null : null
  const needsUpgrade  = !isPro && !!selectedMeta?.isPro

  return (
    <div style={{ animation: 'fadeUp .25s var(--ease) both' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
          ¿Cómo quieres que se vea tu CV?
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>
          {isPro ? 'Los 7 estilos están disponibles en tu plan.' : 'Explora todos los estilos. Los marcados con Pro requieren mejorar tu cuenta para generar.'}
        </p>
      </div>

      {isMobile
        ? <EstilosAccordion selected={selectedStyle} onSelect={setSelectedStyle} isPro={isPro} />
        : <EstilosGrid      selected={selectedStyle} onSelect={setSelectedStyle} isPro={isPro} />
      }

      <button
        disabled={!selectedStyle}
        onClick={needsUpgrade ? onUpgrade : onGenerar}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          margin: '32px auto 0', height: 52,
          width: isMobile ? '100%' : 'auto', minWidth: isMobile ? undefined : 400,
          padding: '0 48px', borderRadius: 12, border: 'none', boxSizing: 'border-box',
          background: selectedStyle ? '#3B5BDB' : '#E2E8F0',
          color: selectedStyle ? '#fff' : '#94A3B8',
          fontWeight: 600, fontSize: 15, cursor: selectedStyle ? 'pointer' : 'not-allowed',
          transition: 'all .2s var(--ease)',
          boxShadow: selectedStyle ? '0 1px 2px rgba(0,0,0,0.06), 0 8px 20px -6px rgba(59,91,219,.45)' : 'none',
        }}
      >
        {!selectedStyle
          ? 'Selecciona un estilo para continuar'
          : needsUpgrade
          ? <> Mejorar cuenta para usar este estilo <ChevRIcon size={16} aria-hidden="true" /> </>
          : <> Generar y previsualizar CV <ChevRIcon size={16} aria-hidden="true" /> </>
        }
      </button>
    </div>
  )
}

/* ── Grid desktop, 4 columnas (7 estilos, se acomodan 4+3) ────────────────── */
function EstilosGrid({ selected, onSelect, isPro }: { selected: EstiloId | null; onSelect: (id: EstiloId) => void; isPro: boolean }) {
  return (
    <div role="radiogroup" aria-label="Estilo de CV" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {ESTILOS.map(e => <EstiloCard key={e.id} estilo={e} selected={selected === e.id} onSelect={() => onSelect(e.id)} locked={e.isPro && !isPro} />)}
    </div>
  )
}

function EstiloCard({ estilo, selected, onSelect, locked }: {
  estilo: typeof ESTILOS[number]; selected: boolean; onSelect: () => void; locked: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      className="focus-ring"
      onClick={onSelect}
      onKeyDown={e => handleOptionKeyDown(e, onSelect)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 20,
        border: `2px solid ${selected ? '#3B5BDB' : hover ? 'rgba(59,91,219,.22)' : '#E2E8F0'}`,
        cursor: 'pointer',
        transition: 'all .22s cubic-bezier(0.4,0,0.2,1)',
        transform: hover && !selected ? 'translateY(-3px)' : 'none',
        boxShadow: selected
          ? '0 0 0 3px rgba(59,91,219,.1), 0 10px 32px rgba(59,91,219,.2)'
          : hover ? '0 8px 28px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        background: '#FFFFFF',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Área del preview CV */}
      <div aria-hidden="true" style={{
        background: '#F8FAFC',
        padding: '16px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 0,
        flexShrink: 0,
      }}>
        {/* Header block — redondeado, con margen lateral (fiel al SVG de referencia) */}
        <div style={{
          borderRadius: 8,
          background: estilo.iconBg,
          height: 58,
          marginBottom: 14,
        }} />
        {/* Línea de acento gruesa */}
        <div style={{
          height: 8, width: '72%', borderRadius: 4,
          background: estilo.accent,
          marginBottom: 7,
        }} />
        {/* Líneas de contenido */}
        <div style={{ height: 6, width: '90%', borderRadius: 3, background: '#CBD5E1', marginBottom: 5 }} />
        <div style={{ height: 6, width: '78%', borderRadius: 3, background: '#E2E8F0', marginBottom: 5 }} />
        <div style={{ height: 6, width: '84%', borderRadius: 3, background: '#E2E8F0', marginBottom: 12 }} />
        {/* Segunda sección */}
        <div style={{
          height: 7, width: '55%', borderRadius: 4,
          background: estilo.accent + 'BB',
          marginBottom: 7,
        }} />
        <div style={{ height: 6, width: '90%', borderRadius: 3, background: '#CBD5E1', marginBottom: 5 }} />
        <div style={{ height: 6, width: '72%', borderRadius: 3, background: '#E2E8F0', marginBottom: 5 }} />
        <div style={{ height: 6, width: '80%', borderRadius: 3, background: '#E2E8F0' }} />
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: '#E2E8F0', flexShrink: 0 }} />

      {/* Info */}
      <div style={{ padding: '14px 16px 16px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{estilo.nombre}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {locked && (
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#EEF2FF', color: '#3B5BDB' }}>
                Pro
              </span>
            )}
            {selected && (
              <div aria-hidden="true" style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: '#3B5BDB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(59,91,219,.4)',
              }}>
                <CheckIcon size={11} color="#fff" />
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.45, marginBottom: 10 }}>{estilo.tagline}</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
          Ideal para
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {estilo.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 999,
              background: selected ? 'rgba(59,91,219,.07)' : '#F1F5F9',
              color: selected ? '#3B5BDB' : '#475569',
              border: `1px solid ${selected ? 'rgba(59,91,219,.18)' : '#E2E8F0'}`,
              fontWeight: 500, transition: 'all .2s',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* CVThumbnail usado solo en el acordeón mobile */
function CVThumbnail({ estilo }: { estilo: typeof ESTILOS[number] }) {
  return (
    <div style={{ width: '100%', height: '100%', padding: '8px 8px 6px', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <div style={{ borderRadius: 4, background: estilo.iconBg, height: '30%', marginBottom: 6, flexShrink: 0 }} />
      <div style={{ height: 5, width: '70%', borderRadius: 3, background: estilo.accent, marginBottom: 4, flexShrink: 0 }} />
      <div style={{ height: 4, width: '88%', borderRadius: 2, background: '#CBD5E1', marginBottom: 3 }} />
      <div style={{ height: 4, width: '72%', borderRadius: 2, background: '#E2E8F0', marginBottom: 3 }} />
      <div style={{ height: 4, width: '55%', borderRadius: 3, background: estilo.accent + 'AA', marginBottom: 3, marginTop: 4 }} />
      <div style={{ height: 4, width: '80%', borderRadius: 2, background: '#CBD5E1' }} />
    </div>
  )
}

/* ── Acordeón mobile ────────────────────────────────────────────────────── */
function EstilosAccordion({ selected, onSelect, isPro }: { selected: EstiloId | null; onSelect: (id: EstiloId) => void; isPro: boolean }) {
  return (
    <div role="radiogroup" aria-label="Estilo de CV" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
      {ESTILOS.map(estilo => (
        <div
          key={estilo.id}
          role="radio"
          aria-checked={selected === estilo.id}
          tabIndex={0}
          className="focus-ring"
          onClick={() => onSelect(estilo.id)}
          onKeyDown={e => handleOptionKeyDown(e, () => onSelect(estilo.id))}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            border: `2px solid ${selected === estilo.id ? '#3B5BDB' : '#E2E8F0'}`,
            borderRadius: 14, background: selected === estilo.id ? 'rgba(59,91,219,.03)' : '#FFFFFF',
            cursor: 'pointer', transition: 'all .2s var(--ease)',
          }}
        >
          <div aria-hidden="true" style={{ width: 58, height: 76, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#F8FAFC' }}>
            <CVThumbnail estilo={estilo} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{estilo.nombre}</span>
              {estilo.isPro && !isPro && (
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#EEF2FF', color: '#3B5BDB' }}>
                  Pro
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.4, marginBottom: 6 }}>{estilo.tagline}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {estilo.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {selected === estilo.id && (
            <div aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: '#3B5BDB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon size={11} color="#fff" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── BackButton ─────────────────────────────────────────────────────────── */
function BackButton({ onClick, style: extraStyle }: { onClick: () => void; style?: React.CSSProperties }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none',
        color: hover ? '#0F172A' : '#64748B', fontSize: 13.5, fontWeight: 500,
        cursor: 'pointer', padding: '4px 8px', transition: 'color .15s',
        ...extraStyle,
      }}
    >
      <ChevLIcon size={15} aria-hidden="true" /> Volver
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ICONOS
══════════════════════════════════════════════════════════════════════════ */
function FileStackIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
      <path d="M4 6H2v14a2 2 0 0 0 2 2h12v-2"/>
      <path d="M9 9h6M9 13h4"/>
    </svg>
  )
}

function TargetIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  )
}

function PaletteIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5"  cy="7.5"  r=".5" fill="currentColor"/>
      <circle cx="6.5"  cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.47-1.125-.29-.289-.438-.652-.438-1.040 0-.924.75-1.647 1.648-1.647H16c2.21 0 4-1.79 4-4 0-4.418-3.582-8-8-8z"/>
    </svg>
  )
}

function WarningIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function CheckIcon({ size = 10, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12 5 5L20 6"/>
    </svg>
  )
}

function ChevRIcon({ size = 16, 'aria-hidden': ariaHidden }: { size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="m9 6 6 6-6 6"/>
    </svg>
  )
}

function ChevLIcon({ size = 15, 'aria-hidden': ariaHidden }: { size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
}
