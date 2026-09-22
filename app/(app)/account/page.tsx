'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Pago } from '@/types';

declare global {
  interface Window {
    paypal?: any;
  }
}

const CONCEPTO_LABELS: Record<Pago['tipo'], string> = {
  cv_unico: 'CV Único',
  suscripcion_mensual: 'Plan Pro · Mensual',
  suscripcion_anual: 'Plan Pro · Anual',
  inspiracion_descarga: 'CV Studio',
};

const ESTADO_STYLES: Record<Pago['estado'], { label: string; bg: string; color: string; border: string }> = {
  confirmado: { label: 'Pagado',   bg: 'var(--success-50)', color: '#148B3D', border: '1px solid #A3E6BF' },
  pendiente:  { label: 'Pendiente', bg: '#FEF9E7',           color: '#92720A', border: '1px solid #F5E2A0' },
  fallido:    { label: 'Fallido',   bg: '#FDECEC',           color: '#B42318', border: '1px solid #F3A9A4' },
  expirado:   { label: 'Expirado',  bg: 'var(--surface-2)',  color: 'var(--mute)', border: '1px solid var(--line)' },
};

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const FREE_FEATURES = [
  'Crea todos los CVs que quieras',
  'Paga $2.99 solo al descargar — debes pagar tu CV para crear el siguiente',
  '2 estilos de CV incluidos',
  'Descarga en PDF',
  'Hasta 5 aplicaciones en seguimiento',
];

const PRO_FEATURES = [
  'CVs y descargas ilimitadas, sin pagar por separado',
  'Aplicaciones ilimitadas',
  'Descarga en PDF y DOCX',
  'Los 7 estilos de CV disponibles',
  'Análisis de compatibilidad avanzado',
  'Soporte prioritario',
];

export default function CuentaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<'mensual' | 'anual'>('mensual');
  const [prices, setPrices] = useState({ precio_mensual: 9.99, precio_anual: 79 });
  const [paypalReady, setPaypalReady] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load the PayPal JS SDK once
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;
    if (window.paypal) { setPaypalReady(true); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.onload = () => setPaypalReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [profileRes, configRes, paymentsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          fetch('/api/config').then(r => r.json()),
          supabase.from('pagos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        ]);
        setProfile(profileRes.data as Profile);
        setPrices({ precio_mensual: configRes.precio_mensual, precio_anual: configRes.precio_anual });
        setPayments((paymentsRes.data as Pago[]) || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data as Profile);
  }

  // Render the real PayPal Subscribe button whenever the SDK is ready, the
  // billing cycle toggle changes, or the user isn't Pro (nothing to render if they already are).
  useEffect(() => {
    if (!paypalReady || !window.paypal || !paypalButtonRef.current) return;
    if (profile?.plan === 'pro') return;

    paypalButtonRef.current.innerHTML = '';
    setUpgradeError(null);

    const buttons = window.paypal.Buttons({
      style: { shape: 'pill', color: 'blue', layout: 'horizontal', label: 'subscribe', height: 45 },
      createSubscription: async () => {
        const res = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: billing }),
        });
        const data = await res.json();
        if (!res.ok) { setUpgradeError(data.error || 'Error al iniciar la suscripción.'); throw new Error(data.error); }
        return data.id;
      },
      onApprove: async (data: { subscriptionID: string }) => {
        const res = await fetch('/api/paypal/confirm-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: data.subscriptionID }),
        });
        const result = await res.json();
        if (!res.ok || !result.ok) { setUpgradeError('El pago se procesó pero no pudimos activar tu plan. Contáctanos.'); return; }
        await refreshProfile();
      },
      onError: () => setUpgradeError('Ocurrió un error con PayPal. Intenta de nuevo.'),
    });
    buttons.render(paypalButtonRef.current);

    return () => { if (paypalButtonRef.current) paypalButtonRef.current.innerHTML = ''; };
  }, [paypalReady, billing, profile?.plan]);

  async function handleCancelSubscription() {
    setCancelling(true);
    try {
      const res = await fetch('/api/paypal/cancel-subscription', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setUpgradeError(data.error || 'Error al cancelar.'); return; }
      await refreshProfile();
      setShowCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  const isPro      = profile?.plan === 'pro';
  const savingsAnual = Math.round(prices.precio_mensual * 12 - prices.precio_anual);
  const discountPct  = Math.round((1 - prices.precio_anual / (prices.precio_mensual * 12)) * 100);
  const proPrice     = billing === 'mensual'
    ? { price: `$${prices.precio_mensual}`, cadence: '/mes', save: null }
    : { price: `$${prices.precio_anual}`,   cadence: '/año', save: `Ahorras $${savingsAnual}` };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeUp .25s var(--ease) both' }}>

      {/* Centered header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
          Potencia tu búsqueda de trabajo
        </h1>
        <p style={{ margin: '10px 0 0', color: 'var(--mute)', fontSize: 15 }}>
          Elige el plan que se ajuste a tu ritmo. Sin compromisos.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: 'inline-flex', padding: 4, background: 'var(--surface-2)',
          borderRadius: 12, marginTop: 22, border: '1px solid var(--line)',
        }}>
          {([
            { id: 'mensual', label: 'Mensual' },
            { id: 'anual',   label: `Anual · -${discountPct}%` },
          ] as { id: 'mensual' | 'anual'; label: string }[]).map(o => (
            <button key={o.id} onClick={() => setBilling(o.id)} style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600,
              background: billing === o.id ? '#fff' : 'transparent',
              color: billing === o.id ? 'var(--deep)' : 'var(--mute)',
              boxShadow: billing === o.id ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
              transition: 'all .16s var(--ease)',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 860, margin: '0 auto' }}>

        {/* Free plan */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: 32, position: 'relative',
          boxShadow: 'var(--sh-2)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mute)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Plan Inicio
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.03em' }}>$0</span>
            <span style={{ color: 'var(--mute)', fontSize: 14 }}>/crear · $2.99 por descarga</span>
          </div>
          <p style={{ color: 'var(--mute)', fontSize: 13.5, margin: '8px 0 22px' }}>
            Ideal para probar Momentum.
          </p>

          <button
            disabled={!isPro || cancelling}
            onClick={() => setShowCancelConfirm(true)}
            style={{
              width: '100%', padding: '13px 18px', borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--line)',
              color: isPro ? 'var(--ink)' : 'var(--mute)',
              fontWeight: 600, fontSize: 14.5,
              cursor: isPro ? 'pointer' : 'not-allowed',
              transition: 'all .15s var(--ease)',
            }}
            onMouseEnter={e => { if (isPro) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
            onMouseLeave={e => { if (isPro) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
          >
            {isPro ? 'Cambiar a Plan Inicio' : 'Plan actual'}
          </button>

          <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FREE_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--ink)' }}>
                <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}>
                  <CheckIcon size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro plan */}
        <div style={{
          background: 'linear-gradient(180deg, #F8F5FF 0%, #FFFFFF 60%)',
          border: '2px solid var(--blue)',
          borderRadius: 16, padding: 32, position: 'relative',
          boxShadow: 'var(--sh-3)',
        }}>
          {/* Recomendado badge */}
          <div style={{
            position: 'absolute', top: -12, right: 24,
            background: 'var(--blue)', color: '#fff',
            padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Recomendado
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Pro
            </div>
            <CrownIcon size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.03em' }}>
              {proPrice.price}
            </span>
            <span style={{ color: 'var(--mute)', fontSize: 14 }}>{proPrice.cadence}</span>
          </div>
          <p style={{ color: 'var(--mute)', fontSize: 13.5, margin: '8px 0 22px' }}>
            {proPrice.save && (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{proPrice.save} · </span>
            )}
            Para quien busca trabajo en serio.
          </p>

          {isPro ? (
            <button
              disabled
              style={{
                width: '100%', padding: '13px 18px', borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--line)',
                color: 'var(--mute)', fontWeight: 600, fontSize: 14.5, cursor: 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Plan actual
            </button>
          ) : (
            <div>
              <div ref={paypalButtonRef} style={{ minHeight: 45 }}>
                {!paypalReady && (
                  <div style={{ height: 45, borderRadius: 999, background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                  </div>
                )}
              </div>
              {upgradeError && (
                <p style={{ color: '#B42318', fontSize: 12.5, marginTop: 8 }}>{upgradeError}</p>
              )}
            </div>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PRO_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--ink)' }}>
                <span style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }}>
                  <CheckIcon size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Billing history (Pro only) */}
      {isPro && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: 24, marginTop: 40,
          boxShadow: 'var(--sh-2)',
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, color: 'var(--deep)', fontWeight: 600 }}>
            Historial de pagos
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Fecha', 'Concepto', 'Monto', 'Estado'].map(h => (
                  <th key={h} style={{
                    padding: '10px 0', textAlign: 'left',
                    color: 'var(--mute)', fontSize: 12, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '20px 0', color: 'var(--mute)', textAlign: 'center' }}>
                    Aún no tienes pagos registrados.
                  </td>
                </tr>
              )}
              {payments.map(p => {
                const estadoStyle = ESTADO_STYLES[p.estado];
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '12px 0', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{formatFecha(p.created_at)}</td>
                    <td style={{ padding: '12px 0', color: 'var(--ink)' }}>{CONCEPTO_LABELS[p.tipo]}</td>
                    <td style={{ padding: '12px 0', color: 'var(--ink)', fontWeight: 600 }}>${p.monto.toFixed(2)}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: estadoStyle.bg, color: estadoStyle.color,
                        border: estadoStyle.border,
                      }}>{estadoStyle.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCancelConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => !cancelling && setShowCancelConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: '24px 26px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(15,23,42,.22)' }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--deep)' }}>¿Cancelar tu suscripción Pro?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.5 }}>
              Perderás el acceso a Pro de inmediato — CVs y descargas ilimitadas, DOCX, los 7 estilos y soporte prioritario. Puedes volver a suscribirte cuando quieras.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
              >
                Volver
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.6 : 1 }}
              >
                {cancelling ? 'Cancelando…' : 'Cancelar suscripción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12 5 5L20 6"/>
    </svg>
  );
}
function CrownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--blue)" stroke="none">
      <path d="M3 7l4 3 5-6 5 6 4-3-2 12H5z"/>
    </svg>
  );
}
