'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  // null = still checking, false = no valid recovery session, true = ready
  const [ready, setReady]         = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });

    async function establishSession() {
      // Recovery links can arrive in two shapes depending on how they were
      // generated: PKCE (?code=...), which the browser client exchanges
      // automatically, or implicit-style hash tokens (#access_token=...&type=recovery),
      // which it does NOT always pick up on its own — handle that case explicitly.
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) {
          setReady(true);
          // Clean the sensitive tokens out of the visible URL/history.
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
      }

      // PKCE case: the code exchange (if any) happens automatically on client
      // init — just check whether a session already resulted from it.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setReady(true);
    }
    establishSession();

    const timeout = setTimeout(() => setReady(prev => (prev === null ? false : prev)), 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error('[reset-password]', updateError.message);
        setError('No se pudo actualizar la contraseña. Intenta de nuevo.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/profile'), 2000);
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

        {ready === null && (
          <p style={{ color: 'var(--mute)', fontSize: 14.5 }}>Verificando enlace...</p>
        )}

        {ready === false && (
          <>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
              Enlace inválido o vencido
            </h1>
            <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14.5, lineHeight: 1.6 }}>
              Este enlace de recuperación ya no es válido. Los enlaces expiran después de un tiempo por seguridad.
            </p>
            <a href="/forgot-password" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Solicitar un enlace nuevo
            </a>
          </>
        )}

        {ready === true && !success && (
          <>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
              Crea una nueva contraseña
            </h1>
            <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14.5 }}>
              Mínimo 8 caracteres.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Nueva contraseña</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px', background: 'var(--surface)' }}>
                  <input
                    type={showPw ? 'text' : 'password'} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--ink)' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 12.5 }}>
                    {showPw ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Confirma la contraseña</span>
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
                />
              </label>

              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--danger-50)', border: '1px solid #F3C2C2', borderRadius: 10, fontSize: 13, color: '#B52020' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 6, padding: '12px 18px', borderRadius: 10,
                background: 'var(--blue)', color: '#fff',
                fontWeight: 600, fontSize: 15, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}>
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}

        {success && (
          <>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
              ¡Listo!
            </h1>
            <p style={{ margin: 0, color: 'var(--mute)', fontSize: 14.5 }}>
              Tu contraseña se actualizó. Redirigiendo...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
