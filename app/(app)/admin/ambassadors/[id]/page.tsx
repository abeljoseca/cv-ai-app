'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type EmbTab = 'resumen' | 'enlace' | 'referidos' | 'pagos';

interface Perfil {
  id: string;
  codigo_referido: string;
  porcentaje_comision: number;
  max_porcentaje_descuento: number;
  meses_recurrencia_mensual: number;
  umbral_minimo_pago: number;
  estado: 'activo' | 'suspendido';
  profiles: { id: string; nombre: string; apellido: string; email_cv: string } | null;
}

interface Referido {
  id: string;
  origen: string;
  fecha_clic_atribucion: string;
  fecha_registro: string | null;
  fecha_primera_suscripcion: string | null;
}

interface Comision {
  id: string;
  monto_base: number;
  porcentaje_aplicado: number;
  monto_comision: number;
  estado: string;
  tipo: string;
  fecha_generacion: string;
  fecha_disponible: string;
}

interface Codigo {
  id: string;
  codigo: string;
  porcentaje_descuento: number;
  usos_maximos: number | null;
  usos_actuales: number;
  activo: boolean;
  fecha_expiracion: string | null;
}

interface DashData {
  perfil: Perfil;
  referidos: Referido[];
  comisiones: Comision[];
  codigos: Codigo[];
  saldo_disponible: number;
  total_ganado: number;
}

const TABS: { id: EmbTab; label: string }[] = [
  { id: 'resumen',   label: 'Resumen' },
  { id: 'enlace',    label: 'Enlace y códigos' },
  { id: 'referidos', label: 'Referidos' },
  { id: 'pagos',     label: 'Pagos' },
];

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', border: '2px solid rgba(0,0,0,.1)', borderTopColor: 'var(--blue)', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
  );
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color, background: bg, border: `1px solid ${border}` }}>{label}</span>;
}

function estadoBadge(estado: string) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pendiente:  { label: 'Pendiente',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    disponible: { label: 'Disponible', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    solicitada: { label: 'Solicitada', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    pagada:     { label: 'Pagada',     color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
    anulada:    { label: 'Anulada',    color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    rechazada:  { label: 'Rechazada',  color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  };
  const m = map[estado] ?? { label: estado, color: 'var(--mute)', bg: 'var(--hover)', border: 'var(--line)' };
  return <Badge {...m} />;
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminEmbajadorViewPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const id      = params.id;

  const [data, setData]       = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<EmbTab>('resumen');
  const [copied, setCopied]   = useState(false);
  const [siteUrl, setSiteUrl] = useState('');

  useEffect(() => {
    setSiteUrl(window.location.origin);
    fetch(`/api/admin/embajadores/${id}`)
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.replace('/admin'); return null; }
        return r.json();
      })
      .then(json => { if (json) setData(json); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <Spinner size={28} />
      </div>
    );
  }
  if (!data) return null;

  const { perfil, referidos, comisiones, codigos, saldo_disponible, total_ganado } = data;
  const ambassador = perfil.profiles;
  const enlace = `${siteUrl}/r/${perfil.codigo_referido}`;
  const registros    = referidos.filter(r => r.fecha_registro).length;
  const conversiones = referidos.filter(r => r.fecha_primera_suscripcion).length;

  function copyLink() {
    navigator.clipboard.writeText(enlace);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)',
  };

  return (
    <div style={{ maxWidth: 1060, animation: 'fadeUp .25s var(--ease) both' }}>

      {/* Admin banner */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '10px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 500 }}>
            Vista de admin — estás viendo el panel de <strong>{ambassador?.nombre} {ambassador?.apellido}</strong> ({ambassador?.email_cv})
          </span>
        </div>
        <button
          onClick={() => router.push('/admin')}
          style={{ fontSize: 12.5, color: '#2563EB', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Volver al admin
        </button>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.015em' }}>
            Panel de Embajador
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--mute)' }}>
            Código: <strong style={{ color: 'var(--blue)' }}>{perfil.codigo_referido}</strong>
            {' · '}{perfil.porcentaje_comision}% de comisión
          </p>
        </div>
        {perfil.estado === 'suspendido' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
            Cuenta suspendida
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 18px', fontSize: 14,
            fontWeight: tab === t.id ? 600 : 500,
            color: tab === t.id ? 'var(--blue)' : 'var(--mute)',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? 'var(--blue)' : 'transparent'}`,
            cursor: 'pointer', marginBottom: -1, transition: 'all .15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Resumen ── */}
      {tab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Saldo disponible', value: `$${saldo_disponible.toFixed(2)}`, color: '#16A34A' },
              { label: 'Total ganado',     value: `$${total_ganado.toFixed(2)}`,     color: 'var(--blue)' },
              { label: 'Cuentas creadas',  value: registros,                          color: 'var(--deep)' },
              { label: 'Suscripciones',    value: conversiones,                       color: '#8B5CF6' },
            ].map(k => (
              <div key={k.label} style={card}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{k.label}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Condiciones del acuerdo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Comisión',           value: `${perfil.porcentaje_comision}%` },
                { label: 'Desc. máximo',        value: `${perfil.max_porcentaje_descuento}%` },
                { label: 'Meses recurrencia',   value: `${perfil.meses_recurrencia_mensual}` },
                { label: 'Retiro mínimo',        value: `$${perfil.umbral_minimo_pago}` },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--hover)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--deep)', letterSpacing: '-0.02em' }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {comisiones.slice(0, 5).length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Últimas comisiones</div>
              {comisiones.slice(0, 5).map((c, i) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--line)' : 'none' }}>
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>${Number(c.monto_comision).toFixed(2)}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--mute)' }}>{c.tipo === 'unica' ? 'Pago único' : 'Recurrente'} · {fmt(c.fecha_generacion)}</span>
                  </div>
                  {estadoBadge(c.estado)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Enlace y códigos ── */}
      {tab === 'enlace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          <div style={card}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Enlace de referido</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--hover)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
                {enlace}
              </div>
              <button onClick={copyLink} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: copied ? '#16A34A' : 'var(--blue)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Códigos de descuento ({codigos.filter(c => c.activo).length} activos)
            </div>
            {codigos.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>Sin códigos de descuento asignados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {codigos.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--hover)', borderRadius: 10 }}>
                    <div>
                      <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>{c.codigo}</code>
                      <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--mute)' }}>{c.porcentaje_descuento}% descuento</span>
                      {c.fecha_expiracion && <span style={{ marginLeft: 8, fontSize: 12, color: '#D97706' }}>expira {fmt(c.fecha_expiracion)}</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 4 }}>{c.usos_actuales}{c.usos_maximos !== null ? `/${c.usos_maximos}` : ''} usos</div>
                      <Badge label={c.activo ? 'Activo' : 'Inactivo'} color={c.activo ? '#16A34A' : 'var(--mute)'} bg={c.activo ? '#F0FDF4' : 'var(--hover)'} border={c.activo ? '#BBF7D0' : 'var(--line)'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Referidos ── */}
      {tab === 'referidos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>
            {referidos.length} visita{referidos.length !== 1 ? 's' : ''} · {registros} cuenta{registros !== 1 ? 's' : ''} creada{registros !== 1 ? 's' : ''} · {conversiones} suscripción{conversiones !== 1 ? 'es' : ''}
          </p>
          {referidos.length === 0 ? (
            <div style={{ ...card, padding: '56px 24px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px', color: 'var(--deep)', fontSize: 16, fontWeight: 600 }}>Sin referidos aún</h3>
              <p style={{ color: 'var(--mute)', fontSize: 14, margin: 0 }}>Este embajador no ha generado referidos todavía.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--hover)' }}>
                    {['Origen', 'Atribución', 'Cuenta creada', 'Primera suscripción'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.055em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referidos.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < referidos.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <Badge label={r.origen === 'enlace' ? 'Enlace' : 'Código'} color={r.origen === 'enlace' ? '#2563EB' : '#7C3AED'} bg={r.origen === 'enlace' ? '#EFF6FF' : '#FAF5FF'} border={r.origen === 'enlace' ? '#BFDBFE' : '#E9D5FF'} />
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--ink)' }}>{fmt(r.fecha_clic_atribucion)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: r.fecha_registro ? '#16A34A' : 'var(--mute)' }}>{r.fecha_registro ? fmt(r.fecha_registro) : '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: r.fecha_primera_suscripcion ? '#16A34A' : 'var(--mute)', fontWeight: r.fecha_primera_suscripcion ? 600 : 400 }}>{r.fecha_primera_suscripcion ? fmt(r.fecha_primera_suscripcion) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Pagos ── */}
      {tab === 'pagos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 480 }}>
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Saldo disponible</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#16A34A', letterSpacing: '-0.03em' }}>${saldo_disponible.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>Mínimo para retirar: ${perfil.umbral_minimo_pago}</div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total ganado</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue)', letterSpacing: '-0.03em' }}>${total_ganado.toFixed(2)}</div>
            </div>
          </div>

          {comisiones.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Historial de comisiones</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['Fecha', 'Tipo', 'Monto base', 'Comisión', 'Disponible desde', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 0', textAlign: 'left', color: 'var(--mute)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comisiones.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i < comisiones.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <td style={{ padding: '11px 0', color: 'var(--mute)', fontSize: 12.5 }}>{fmt(c.fecha_generacion)}</td>
                      <td style={{ padding: '11px 0', color: 'var(--ink)' }}>{c.tipo === 'unica' ? 'Pago único' : 'Recurrente'}</td>
                      <td style={{ padding: '11px 0', color: 'var(--mute)' }}>${Number(c.monto_base).toFixed(2)}</td>
                      <td style={{ padding: '11px 0', color: 'var(--deep)', fontWeight: 600 }}>${Number(c.monto_comision).toFixed(2)}</td>
                      <td style={{ padding: '11px 0', color: 'var(--mute)', fontSize: 12 }}>{fmt(c.fecha_disponible)}</td>
                      <td style={{ padding: '11px 0' }}>{estadoBadge(c.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}