'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [remember, setRemember]       = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (TURNSTILE_SITE_KEY && !captchaToken) { setError('Completa la verificación de seguridad'); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email, password,
        options: { captchaToken: captchaToken ?? undefined },
      });
      turnstileRef.current?.reset?.();
      setCaptchaToken(null);
      if (authError) {
        console.error('[login]', authError.message);
        if (authError.message.toLowerCase().includes('captcha')) {
          setError('Verificación de seguridad fallida. Recarga e intenta de nuevo.');
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          setError('Confirma tu correo antes de iniciar sesión.');
        } else {
          setError('Correo o contraseña incorrectos.');
        }
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles').select('onboarding_completado').eq('id', user?.id || '').single();
      router.push(profile?.onboarding_completado ? '/profile' : '/onboarding');
    } catch {
      setError('Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleLinkedInLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Left — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ width: 400, maxWidth: '100%' }}>

          <img src="/momentum-logo.svg" alt="Momentum" style={{ height: 32, marginBottom: 40 }} />

          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14.5 }}>
            Accede para seguir construyendo tu perfil.
          </p>

          {/* Social — vía principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            <button type="button" onClick={handleLinkedInLogin}
              style={{
                width: '100%', padding: '12px 18px', borderRadius: 10,
                background: '#0A66C2', color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(10,102,194,.5)',
                transition: 'background .15s var(--ease)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#085296'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0A66C2'}
            >
              <LinkedInIcon />
              Continuar con LinkedIn
            </button>

            <button type="button" onClick={handleGoogleLogin}
              style={{
                width: '100%', padding: '11px 18px', borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 14, fontWeight: 500, color: 'var(--ink)',
                cursor: 'pointer', transition: 'background .15s var(--ease)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
            >
              <GoogleIcon />
              Continuar con Google
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--mute)', fontSize: 12.5, margin: '0 0 22px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            o continúa con email
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {!showEmailForm ? (
            <button type="button" onClick={() => setShowEmailForm(true)}
              style={{
                width: '100%', padding: '11px 18px', borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 14, fontWeight: 500, color: 'var(--ink)',
                cursor: 'pointer', transition: 'background .15s var(--ease)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
            >
              <MailIcon />
              Continuar con email
            </button>
          ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldInput
              label="Correo electrónico" required
              type="email" placeholder="tu@correo.com"
              value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              leftIcon={<MailIcon />}
            />

            <FieldInput
              label="Contraseña" required
              type={showPw ? 'text' : 'password'}
              placeholder="Tu contraseña"
              value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              rightSlot={
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--mute)', display: 'flex', padding: 0, cursor: 'pointer' }}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--blue)' }}
                />
                Recordarme
              </label>
              <a href="#" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 500 }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Cloudflare Turnstile */}
            {TURNSTILE_SITE_KEY && (
              <div style={{ marginTop: 2, display: 'flex', justifyContent: 'center' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={token => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  options={{ theme: 'light', language: 'es' }}
                />
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-50)', border: '1px solid #F3C2C2', borderRadius: 10, fontSize: 13, color: '#B52020' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || (!!TURNSTILE_SITE_KEY && !captchaToken)} style={{
              marginTop: 6, padding: '12px 18px', borderRadius: 10,
              background: 'var(--blue)', color: '#fff',
              fontWeight: 600, fontSize: 15, border: 'none',
              boxShadow: '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.45)',
              cursor: (loading || (!!TURNSTILE_SITE_KEY && !captchaToken)) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .18s var(--ease)',
              opacity: (loading || (!!TURNSTILE_SITE_KEY && !captchaToken)) ? 0.6 : 1,
            }}>
              {loading && <Spinner />}
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--mute)' }}>
            ¿No tienes cuenta?{' '}
            <a href="/register" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
              Crea una gratis
            </a>
          </div>
        </div>
      </div>

      {/* Right — dark hero */}
      <div style={{
        flex: 1, background: 'var(--deep)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', padding: 48,
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .08 }}>
          <defs>
            <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(75,107,251,.35), transparent 70%)',
        }} />

        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)',
            fontSize: 12.5, fontWeight: 500, color: '#C8D0FE', marginBottom: 20,
          }}>
            <SparklesIcon size={12} /> Impulsado con IA
          </div>

          <h2 style={{ margin: '0 0 14px', fontSize: 34, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Un CV profesional en menos de 10 minutos.
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.72)', fontSize: 15, lineHeight: 1.55 }}>
            Conversa con la IA, adjunta tu CV antiguo y deja que Momentum cree versiones optimizadas para cada vacante.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Perfil único, siempre actualizado', 'Un solo lugar que crece contigo.'],
              ['Optimizado para ATS', 'Keywords y formato que pasan el filtro.'],
              ['Seguimiento de aplicaciones', 'No pierdas el hilo de tu búsqueda.'],
            ].map(([t, d]) => (
              <div key={t} style={{ display: 'flex', gap: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(75,107,251,.25)', color: '#C8D0FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon size={14} />
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
                  <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */
function FieldInput({ label, required, leftIcon, rightSlot, ...props }: {
  label: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface)',
        border: `1px solid ${focus ? 'var(--blue)' : 'var(--line)'}`,
        borderRadius: 10, padding: leftIcon ? '10px 14px 10px 12px' : '10px 14px',
        boxShadow: focus ? '0 0 0 3px rgba(75,107,251,.15)' : 'none',
        transition: 'all .15s var(--ease)',
      }}>
        {leftIcon && <span style={{ color: 'var(--mute)', display: 'flex', flexShrink: 0 }}>{leftIcon}</span>}
        <input {...props} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--ink)' }} />
        {rightSlot}
      </div>
    </label>
  );
}

function Spinner() {
  return <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .8s linear infinite' }} />;
}

function MailIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16"/><path d="M9.9 5.1A10 10 0 0 1 22 12a10 10 0 0 1-3.5 4.4M6.6 6.6A10 10 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 4-.9"/><path d="M9.3 9.3a3 3 0 0 0 4.4 4.4"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6c1.9-5.6 7.2-9.7 13.6-9.7z"/>
      <path fill="#4285F4" d="M46.5 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.7c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17.5z"/>
      <path fill="#FBBC05" d="M10.4 28.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6C.9 17.1 0 20.5 0 24s.9 6.9 2.6 9.9l7.8-5z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.4 0-11.8-4.3-13.7-10l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}
function SparklesIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9z"/>
    </svg>
  );
}
function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12 5 5L20 6"/>
    </svg>
  );
}
