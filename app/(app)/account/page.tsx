'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Pago } from '@/types';

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
  const supabase = createClient();

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
            disabled={!isPro}
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

          <button
            disabled={isPro}
            style={{
              width: '100%', padding: '13px 18px', borderRadius: 10,
              background: isPro ? 'var(--surface)' : 'var(--blue)',
              border: isPro ? '1px solid var(--line)' : 'none',
              color: isPro ? 'var(--mute)' : '#fff',
              fontWeight: 600, fontSize: 14.5,
              cursor: isPro ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: isPro ? 'none' : '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.45)',
              transition: 'all .15s var(--ease)',
            }}
            onMouseEnter={e => { if (!isPro) (e.currentTarget as HTMLElement).style.background = 'var(--blue-600)'; }}
            onMouseLeave={e => { if (!isPro) (e.currentTarget as HTMLElement).style.background = 'var(--blue)'; }}
          >
            {!isPro && <SparklesIcon size={16} />}
            {isPro ? 'Plan actual' : 'Mejorar a Pro'}
          </button>

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
function SparklesIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9z"/>
    </svg>
  );
}
