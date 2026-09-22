'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (TURNSTILE_SITE_KEY && !captchaToken) { setError('Completa la verificación de seguridad'); return; }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken: captchaToken ?? undefined,
      });
      turnstileRef.current?.reset?.();
      setCaptchaToken(null);
      if (resetError) {
        console.error('[forgot-password]', resetError.message);
        setError('No se pudo enviar el correo. Intenta de nuevo en un momento.');
        return;
      }
      // Always show success, whether or not the email exists — never reveal
      // account existence to an unauthenticated caller.
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '40px 32px' }}>
      <div style={{ width: 400, maxWidth: '100%' }}>
        <img src="/momentum-logo.svg" alt="Momentum" style={{ height: 32, marginBottom: 40 }} />

        {sent ? (
          <>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
              Revisa tu correo
            </h1>
            <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14.5, lineHeight: 1.6 }}>
              Si existe una cuenta con <strong style={{ color: 'var(--ink)' }}>{email}</strong>, te enviamos un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
            </p>
            <a href="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              ← Volver a iniciar sesión
            </a>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
              ¿Olvidaste tu contraseña?
            </h1>
            <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14.5 }}>
              Ingresa tu correo y te enviamos un enlace para restablecerla.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Correo electrónico</span>
                <input
                  type="email" required placeholder="tu@correo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)',
                    background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', outline: 'none',
                  }}
                />
              </label>

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
                cursor: (loading || (!!TURNSTILE_SITE_KEY && !captchaToken)) ? 'not-allowed' : 'pointer',
                opacity: (loading || (!!TURNSTILE_SITE_KEY && !captchaToken)) ? 0.6 : 1,
              }}>
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--mute)' }}>
              <a href="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                ← Volver a iniciar sesión
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
