'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/contexts/SidebarContext';
import { Select } from '@/components/Select';

type EmbTab = 'resumen' | 'enlace' | 'referidos' | 'pagos';
type DurTipo = 'ilimitado' | 'tiempo' | 'usos' | 'ambos';
type DurUnidad = 'horas' | 'dias';

interface Perfil {
  id: string;
  codigo_referido: string;
  porcentaje_comision: number;
  max_porcentaje_descuento: number;
  meses_recurrencia_mensual: number;
  umbral_minimo_pago: number;
  estado: 'activo' | 'suspendido';
  modulo_codigos_activo: boolean;
  acuerdo_aceptado: boolean;
}

interface Referido {
  numero: number;
  id: string;
  email_masked: string | null;
  plan: string | null;
  origen: string;
  codigo_descuento_usado: string | null;
  descuento_pct: number | null;
  fecha_clic_atribucion: string;
  fecha_registro: string | null;
  fecha_primera_suscripcion: string | null;
}

interface Comision {
  id: string;
  referido_id: string | null;
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
  eliminado: boolean;
  fecha_expiracion: string | null;
  created_at: string;
}

interface Solicitud {
  id: string;
  monto_total: number;
  red_blockchain: 'TRON' | 'POLYGON';
  direccion_wallet: string;
  estado: 'solicitada' | 'en_proceso' | 'pagada' | 'rechazada';
  fecha_solicitud: string;
  fecha_pago: string | null;
  hash_transaccion: string | null;
  nota_admin: string | null;
}

interface DashData {
  perfil: Perfil;
  referidos: Referido[];
  comisiones: Comision[];
  codigos: Codigo[];
  solicitudes: Solicitud[];
  saldo_disponible: number;
  total_ganado: number;
}

// Único lugar donde vive este texto — se puede editar sin tocar ninguna
// lógica del gating/checkbox de abajo. Refleja las reglas reales implementadas
// en lib/embajadores.ts y las tablas embajador_perfil / comisiones / solicitudes_pago.
const TEXTO_ACUERDO_EMBAJADORES = `Al participar como embajador de Momentum aceptas lo siguiente:

Comisiones: ganas una comisión (el porcentaje se indica en tu panel de embajador, típicamente 25%) sobre pagos confirmados de usuarios que referiste a través de tu enlace o código de descuento, siempre que el pago alcance el monto mínimo indicado en tu panel. Para suscripciones del Plan Pro, la comisión es recurrente durante un máximo de 6 meses por usuario referido; para descargas de pago único, es una comisión única.

Disponibilidad de fondos: cada comisión queda en estado "pendiente" y se libera automáticamente a "disponible" 24 horas después de generarse, para dar tiempo a que se resuelvan disputas o reembolsos del pago que la originó.

Retiros: puedes solicitar el retiro de tu saldo disponible una vez que alcance el mínimo indicado en tu panel. Los retiros se pagan en criptomonedas a la dirección de wallet que registres, y son revisados y procesados manualmente por el equipo de Momentum. Si una solicitud es rechazada, el saldo correspondiente vuelve a estar disponible para una nueva solicitud.

Códigos de descuento: los códigos que generes para tus referidos tienen un descuento máximo configurado en tu panel. El uso indebido del sistema de códigos (por ejemplo, aplicarlos a cuentas propias o compartirlas fuera del uso previsto del programa) se considera abuso.

Suspensión: Momentum puede suspender tu cuenta de embajador en caso de fraude, abuso del sistema de códigos de descuento, o incumplimiento de estos términos. La suspensión no afecta comisiones ya liberadas y pagadas, pero puede retener comisiones pendientes mientras se investiga.

Este acuerdo se complementa con los Términos y Condiciones generales y la Política de Privacidad de Momentum.`;

const TABS: { id: EmbTab; label: string }[] = [
  { id: 'resumen',   label: 'Resumen' },
  { id: 'enlace',    label: 'Mi enlace y códigos' },
  { id: 'referidos', label: 'Mis referidos' },
  { id: 'pagos',     label: 'Pagos' },
];

/* ── Helpers ── */
function Spinner({ size = 14, color = 'var(--blue)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', border: `2px solid rgba(0,0,0,.1)`, borderTopColor: color, display: 'inline-block', animation: 'spin .8s linear infinite', flexShrink: 0 }} />;
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color, background: bg, border: `1px solid ${border}` }}>{label}</span>;
}

function codigoBadge(c: Codigo) {
  if (c.eliminado) return <Badge label="Eliminado" color="#6B7280" bg="#F9FAFB" border="#E5E7EB" />;
  if (!c.activo)   return <Badge label="Inactivo"  color="#D97706" bg="#FFFBEB" border="#FDE68A" />;
  const expired = c.fecha_expiracion && new Date(c.fecha_expiracion) < new Date();
  if (expired)     return <Badge label="Vencido"   color="#B91C1C" bg="#FEF2F2" border="#FECACA" />;
  const exhausted = c.usos_maximos !== null && c.usos_actuales >= c.usos_maximos;
  if (exhausted)   return <Badge label="Agotado"   color="#7C3AED" bg="#FAF5FF" border="#E9D5FF" />;
  return <Badge label="Activo" color="#16A34A" bg="#F0FDF4" border="#BBF7D0" />;
}

function estadoComisionBadge(estado: string) {
  const m: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pendiente:  { label: 'Pendiente',  color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    disponible: { label: 'Disponible', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    solicitada: { label: 'Solicitada', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    pagada:     { label: 'Pagada',     color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
    anulada:    { label: 'Anulada',    color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
    rechazada:  { label: 'Rechazada',  color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  };
  const d = m[estado] ?? { label: estado, color: 'var(--mute)', bg: 'var(--hover)', border: 'var(--line)' };
  return <Badge {...d} />;
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildExpiracion(tipo: DurTipo, durVal: string, durUnidad: DurUnidad): string | null {
  if (tipo === 'ilimitado' || tipo === 'usos') return null;
  const n = parseInt(durVal, 10);
  if (!n || n <= 0) return null;
  const ms = durUnidad === 'horas' ? n * 3600000 : n * 86400000;
  return new Date(Date.now() + ms).toISOString();
}

function buildUsosMaximos(tipo: DurTipo, usosVal: string): number | null {
  if (tipo === 'ilimitado' || tipo === 'tiempo') return null;
  const n = parseInt(usosVal, 10);
  return (!n || n <= 0) ? null : n;
}

/* ── Código form ── */
interface CodigoFormProps {
  maxPct: number;
  onCreated: () => void;
  onCancel: () => void;
  initial?: Codigo | null;
}

function CodigoForm({ maxPct, onCreated, onCancel, initial }: CodigoFormProps) {
  const isEdit = !!initial;
  const used = isEdit && (initial?.usos_actuales ?? 0) > 0;

  const [codigo, setCodigo]       = useState(initial?.codigo ?? '');
  const [pct, setPct]             = useState(String(initial?.porcentaje_descuento ?? 10));
  const [durTipo, setDurTipo]     = useState<DurTipo>('ilimitado');
  const [durVal, setDurVal]       = useState('7');
  const [durUnidad, setDurUnidad] = useState<DurUnidad>('dias');
  const [usosVal, setUsosVal]     = useState('1');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Pre-fill duration fields when editing
  useEffect(() => {
    if (!initial) return;
    const hasTime = !!initial.fecha_expiracion;
    const hasUsos = initial.usos_maximos !== null;
    if (hasTime && hasUsos) { setDurTipo('ambos'); }
    else if (hasTime) { setDurTipo('tiempo'); }
    else if (hasUsos) { setDurTipo('usos'); setUsosVal(String(initial.usos_maximos)); }
    else { setDurTipo('ilimitado'); }
  }, []);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    const pctNum = parseFloat(pct);
    if (!codigo.trim()) { setError('El código es requerido'); return; }
    if (isNaN(pctNum) || pctNum < 1 || pctNum > maxPct) { setError(`El descuento debe ser entre 1% y ${maxPct}%`); return; }

    const body: Record<string, unknown> = {
      codigo:               codigo.toUpperCase().trim(),
      porcentaje_descuento: pctNum,
      fecha_expiracion:     buildExpiracion(durTipo, durVal, durUnidad),
      usos_maximos:         buildUsosMaximos(durTipo, usosVal),
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/embajador/codigos/${initial!.id}` : '/api/embajador/codigos';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); return; }
      onCreated();
    } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { padding: '8px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const durBtn = (id: DurTipo, label: string) => (
    <button type="button" onClick={() => setDurTipo(id)} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${durTipo === id ? 'var(--blue)' : 'var(--line)'}`, background: durTipo === id ? 'var(--lav)' : 'var(--surface)', color: durTipo === id ? 'var(--blue)' : 'var(--ink)', fontSize: 13, fontWeight: durTipo === id ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--blue)', borderRadius: 14, padding: '20px 24px', boxShadow: 'var(--sh-2)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        {isEdit ? 'Editar código' : 'Nuevo código de descuento'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</label>
          <input
            value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="VERANO25" disabled={used}
            style={{ ...inp, opacity: used ? 0.6 : 1, cursor: used ? 'not-allowed' : 'text' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
          />
          {used && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--mute)' }}>No editable — ya fue utilizado</p>}
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            % Descuento <span style={{ fontWeight: 400, textTransform: 'none' }}>(máx. {maxPct}%)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number" min="1" max={maxPct} step="0.5" value={pct}
              onChange={e => setPct(e.target.value)}
              disabled={used}
              style={{ ...inp, paddingRight: 28, opacity: used ? 0.6 : 1, cursor: used ? 'not-allowed' : 'text' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--mute)', pointerEvents: 'none' }}>%</span>
          </div>
        </div>
      </div>

      {/* Duration */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duración</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {durBtn('ilimitado', 'Sin límite')}
          {durBtn('tiempo', 'Por tiempo')}
          {durBtn('usos', 'Por usos')}
          {durBtn('ambos', 'Tiempo + usos')}
        </div>

        {/* Microtexto explicativo por tipo */}
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--mute)', lineHeight: 1.5 }}>
          {durTipo === 'ilimitado' && 'El código no expira ni tiene límite de usos. Permanece activo hasta que tú lo desactives o elimines.'}
          {durTipo === 'tiempo' && 'El código deja de funcionar automáticamente cuando se cumple el plazo indicado, sin importar cuántas veces se haya usado.'}
          {durTipo === 'usos' && 'El código se desactiva automáticamente cuando se alcanza el número de usos configurado.'}
          {durTipo === 'ambos' && 'El código expira en cuanto se cumple primero cualquiera de las dos condiciones: el tiempo o el número de usos. Útil para promociones de "primeros N clientes en X días".'}
        </p>

        {(durTipo === 'tiempo' || durTipo === 'ambos') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input type="number" min="1" value={durVal} onChange={e => setDurVal(e.target.value)} style={{ ...inp, width: 80 }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
            <button type="button" onClick={() => setDurUnidad('horas')} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${durUnidad === 'horas' ? 'var(--blue)' : 'var(--line)'}`, background: durUnidad === 'horas' ? 'var(--lav)' : 'var(--surface)', color: durUnidad === 'horas' ? 'var(--blue)' : 'var(--ink)', fontSize: 13, fontWeight: durUnidad === 'horas' ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>Horas</button>
            <button type="button" onClick={() => setDurUnidad('dias')} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${durUnidad === 'dias' ? 'var(--blue)' : 'var(--line)'}`, background: durUnidad === 'dias' ? 'var(--lav)' : 'var(--surface)', color: durUnidad === 'dias' ? 'var(--blue)' : 'var(--ink)', fontSize: 13, fontWeight: durUnidad === 'dias' ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>Días</button>
          </div>
        )}

        {(durTipo === 'usos' || durTipo === 'ambos') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={() => setUsosVal('1')} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${usosVal === '1' ? 'var(--blue)' : 'var(--line)'}`, background: usosVal === '1' ? 'var(--lav)' : 'var(--surface)', color: usosVal === '1' ? 'var(--blue)' : 'var(--ink)', fontSize: 13, fontWeight: usosVal === '1' ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>Uso único</button>
            <span style={{ fontSize: 13, color: 'var(--mute)' }}>o</span>
            <input type="number" min="2" value={usosVal === '1' ? '' : usosVal} onChange={e => setUsosVal(e.target.value)} placeholder="N usos" style={{ ...inp, width: 90 }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
          </div>
        )}
      </div>

      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#B91C1C', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
          {saving && <Spinner size={13} color="#fff" />}
          {isEdit ? 'Guardar cambios' : 'Crear código'}
        </button>
      </div>
    </form>
  );
}

/* ── Main page ── */
export default function EmbajadorPage() {
  const router    = useRouter();
  const supabase  = createClient();
  const [data, setData]         = useState<DashData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<EmbTab>('resumen');
  const [copied, setCopied]     = useState(false);
  const [siteUrl, setSiteUrl]   = useState('');

  // Codes state
  const [codigos, setCodigos]       = useState<Codigo[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [editingCod, setEditingCod] = useState<Codigo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [planFilter, setPlanFilter]   = useState<'all' | 'gratuito' | 'pro'>('all');
  const [gananciasRef, setGananciasRef] = useState<string | null>(null); // referido id for popup

  // Agreement gate
  const [acceptingAcuerdo, setAcceptingAcuerdo] = useState(false);
  const [acuerdoChecked, setAcuerdoChecked]     = useState(false);

  // Withdrawal request form
  const [wRed, setWRed]           = useState<'TRON' | 'POLYGON'>('TRON');
  const [wWallet, setWWallet]     = useState('');
  const [wSubmitting, setWSubmitting] = useState(false);
  const [wError, setWError]       = useState<string | null>(null);

  useEffect(() => { setSiteUrl(window.location.origin); }, []);

  const loadDash = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const res = await fetch('/api/embajador');
    if (res.status === 403) { router.push('/'); return; }
    const json = await res.json();
    setData(json);
    setCodigos(json.codigos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadDash(); }, [loadDash]);

  async function aceptarAcuerdo() {
    setAcceptingAcuerdo(true);
    try {
      const res = await fetch('/api/embajador', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acuerdo_aceptado: true }),
      });
      if (res.ok) {
        setData(prev => prev ? { ...prev, perfil: { ...prev.perfil, acuerdo_aceptado: true } } : prev);
      }
    } finally {
      setAcceptingAcuerdo(false);
    }
  }

  async function solicitarRetiro() {
    setWError(null);
    if (!wWallet.trim()) { setWError('Ingresa tu dirección de wallet.'); return; }
    setWSubmitting(true);
    try {
      const res = await fetch('/api/embajador/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ red_blockchain: wRed, direccion_wallet: wWallet.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setWError(d.error || 'Error al crear la solicitud.'); return; }
      setWWallet('');
      await loadDash();
    } catch {
      setWError('Error al crear la solicitud. Intenta de nuevo.');
    } finally {
      setWSubmitting(false);
    }
  }

  async function loadCodigos() {
    const res = await fetch('/api/embajador/codigos');
    if (res.ok) { const d = await res.json(); setCodigos(d); }
  }

  async function toggleActivo(cod: Codigo) {
    setTogglingId(cod.id);
    const res = await fetch(`/api/embajador/codigos/${cod.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !cod.activo }),
    });
    if (res.ok) { setCodigos(prev => prev.map(c => c.id === cod.id ? { ...c, activo: !cod.activo } : c)); }
    setTogglingId(null);
  }

  async function deleteCodigo(cod: Codigo) {
    if (!confirm(cod.usos_actuales > 0
      ? `Este código fue usado ${cod.usos_actuales} vez/veces. Se marcará como eliminado pero quedará en el historial por transparencia. ¿Continuar?`
      : '¿Eliminar este código? No se puede deshacer.')) return;
    setDeletingId(cod.id);
    const res = await fetch(`/api/embajador/codigos/${cod.id}`, { method: 'DELETE' });
    if (res.ok) {
      const d = await res.json();
      if (d.soft) {
        setCodigos(prev => prev.map(c => c.id === cod.id ? { ...c, eliminado: true, activo: false } : c));
      } else {
        setCodigos(prev => prev.filter(c => c.id !== cod.id));
      }
    }
    setDeletingId(null);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <Spinner size={28} />
    </div>
  );
  if (!data) return null;

  const { sidebarOpen } = useSidebar();
  const { perfil, referidos, comisiones, solicitudes, saldo_disponible, total_ganado } = data;
  const solicitudPendiente = solicitudes.find(s => s.estado === 'solicitada' || s.estado === 'en_proceso');
  const enlace = `${siteUrl}/r/${perfil.codigo_referido}`;
  const registros    = referidos.filter(r => r.fecha_registro).length;
  const conversiones = referidos.filter(r => r.fecha_primera_suscripcion).length;

  // Per-referido commissions lookup
  const comisionesPorReferido = (refId: string) =>
    comisiones.filter(c => c.referido_id === refId);
  const totalPorReferido = (refId: string) =>
    comisionesPorReferido(refId)
      .filter(c => ['disponible', 'solicitada', 'pagada'].includes(c.estado))
      .reduce((s, c) => s + Number(c.monto_comision), 0);

  // Filtered referidos
  const referidosFiltrados = planFilter === 'all'
    ? referidos
    : referidos.filter(r => r.plan === planFilter);

  // Visible codes: active + history (eliminado with uses)
  const codigosActivos   = codigos.filter(c => !c.eliminado);
  const codigosHistorial = codigos.filter(c => c.eliminado && c.usos_actuales > 0);

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)' };

  return (
    <div style={{ maxWidth: sidebarOpen ? 1060 : 1400, animation: 'fadeUp .25s var(--ease) both' }}>
      {/* Agreement gate — blocks the whole dashboard until accepted, first access only */}
      {!perfil.acuerdo_aceptado && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '28px 28px 24px', maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Acuerdo del programa de embajadores</p>
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '12px 14px', background: 'var(--hover)', borderRadius: 10, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{TEXTO_ACUERDO_EMBAJADORES}</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 18 }}>
              <input
                type="checkbox"
                checked={acuerdoChecked}
                onChange={e => setAcuerdoChecked(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>He leído y acepto los términos del programa de embajadores de Momentum.</span>
            </label>
            <button
              onClick={aceptarAcuerdo}
              disabled={!acuerdoChecked || acceptingAcuerdo}
              style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: 'none', background: acuerdoChecked ? 'var(--blue)' : 'var(--line)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: acuerdoChecked ? 'pointer' : 'not-allowed' }}
            >
              {acceptingAcuerdo ? 'Guardando…' : 'Aceptar y continuar'}
            </button>
          </div>
        </div>,
        document.body
      )}

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.015em' }}>Panel de Embajador</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--mute)' }}>
            Código: <strong style={{ color: 'var(--blue)' }}>{perfil.codigo_referido}</strong> · {perfil.porcentaje_comision}% de comisión
          </p>
        </div>
        {perfil.estado === 'suspendido' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>Cuenta suspendida — contacta al equipo</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 18px', fontSize: 14, fontWeight: tab === t.id ? 600 : 500, color: tab === t.id ? 'var(--blue)' : 'var(--mute)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--blue)' : 'transparent'}`, cursor: 'pointer', marginBottom: -1, transition: 'all .15s' }}>
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
              { label: 'Usuarios referidos', value: registros,                          color: 'var(--deep)' },
              { label: 'Suscripciones',    value: conversiones,                       color: '#8B5CF6' },
            ].map(k => (
              <div key={k.label} style={card}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{k.label}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Tu acuerdo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Comisión',          value: `${perfil.porcentaje_comision}%` },
                { label: 'Desc. máximo',       value: `${perfil.max_porcentaje_descuento}%` },
                { label: 'Meses recurrencia',  value: `${perfil.meses_recurrencia_mensual}` },
                { label: 'Retiro mínimo',      value: `$${perfil.umbral_minimo_pago}` },
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
                  {estadoComisionBadge(c.estado)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Enlace y códigos ── */}
      {tab === 'enlace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Referral link */}
          <div style={card}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Tu enlace de referido</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--hover)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{enlace}</div>
              <button onClick={() => { navigator.clipboard.writeText(enlace); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: copied ? '#16A34A' : 'var(--blue)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Discount codes */}
          {!perfil.modulo_codigos_activo ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px 24px', background: 'var(--hover)', border: '1px dashed var(--line)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--mute)', lineHeight: 1.6 }}>
                El módulo de códigos de descuento aún no está habilitado para tu cuenta.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--deep)' }}>Mis códigos de descuento</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--mute)' }}>
                    Descuento máximo permitido: <strong>{perfil.max_porcentaje_descuento}%</strong>
                  </p>
                </div>
                {!showForm && !editingCod && (
                  <button onClick={() => setShowForm(true)} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nuevo código
                  </button>
                )}
              </div>

              {/* Create / Edit form */}
              {(showForm || editingCod) && (
                <CodigoForm
                  maxPct={perfil.max_porcentaje_descuento}
                  initial={editingCod}
                  onCreated={() => { setShowForm(false); setEditingCod(null); loadCodigos(); }}
                  onCancel={() => { setShowForm(false); setEditingCod(null); }}
                />
              )}

              {/* Active codes list */}
              {codigosActivos.length === 0 && !showForm && (
                <div style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
                  <p style={{ margin: 0, color: 'var(--mute)', fontSize: 14 }}>Aún no tienes códigos. Crea el primero.</p>
                </div>
              )}

              {codigosActivos.map(c => {
                const busy = deletingId === c.id || togglingId === c.id;
                const isEditable = c.usos_actuales === 0;
                return (
                  <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, opacity: busy ? 0.6 : 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>{c.codigo}</code>
                        {codigoBadge(c)}
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--deep)' }}>{c.porcentaje_descuento}% descuento</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--mute)' }}>
                        <span><strong style={{ color: 'var(--ink)' }}>{c.usos_actuales}</strong> uso{c.usos_actuales !== 1 ? 's' : ''}{c.usos_maximos !== null ? ` / ${c.usos_maximos}` : ' (ilimitados)'}</span>
                        {c.fecha_expiracion && <span>Expira: {fmt(c.fecha_expiracion)}</span>}
                        {!c.fecha_expiracion && !c.usos_maximos && <span>Sin expiración</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleActivo(c)} disabled={busy}
                        style={{ height: 32, padding: '0 12px', borderRadius: 8, border: `1px solid ${c.activo ? '#FECACA' : '#BBF7D0'}`, background: c.activo ? '#FEF2F2' : '#F0FDF4', color: c.activo ? '#DC2626' : '#16A34A', fontSize: 12.5, fontWeight: 500, cursor: busy ? 'not-allowed' : 'pointer' }}
                      >
                        {c.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {isEditable && (
                        <button onClick={() => { setEditingCod(c); setShowForm(false); }} disabled={busy} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 500, cursor: busy ? 'not-allowed' : 'pointer' }}>
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => deleteCodigo(c)} disabled={busy || !!deletingId}
                        style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--mute)', cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                        onMouseEnter={e => { if (!busy) { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* History */}
              {codigosHistorial.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Historial (eliminados con uso)</div>
                  {codigosHistorial.map(c => (
                    <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, opacity: 0.65, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <code style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--mute)', background: 'var(--hover)', padding: '3px 8px', borderRadius: 6 }}>{c.codigo}</code>
                          {codigoBadge(c)}
                          <span style={{ fontSize: 13, color: 'var(--mute)' }}>{c.porcentaje_descuento}%</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--mute)' }}>{c.usos_actuales} uso{c.usos_actuales !== 1 ? 's' : ''} registrado{c.usos_actuales !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Referidos ── */}
      {tab === 'referidos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Ganancias popup — rendered via portal so overlay covers full viewport */}
          {gananciasRef && typeof document !== 'undefined' && createPortal((() => {
            const coms = comisionesPorReferido(gananciasRef);
            const total = coms.reduce((s, c) => s + Number(c.monto_comision), 0);
            const ref = referidos.find(r => r.id === gananciasRef);
            return (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                onClick={() => setGananciasRef(null)}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 18,
                    padding: '28px 28px 24px',
                    maxWidth: 540,
                    width: '100%',
                    boxShadow: '0 4px 6px rgba(15,23,42,.04), 0 24px 64px rgba(15,23,42,.18)',
                    animation: 'fadeUp .18s var(--ease)',
                    maxHeight: 'calc(100vh - 64px)',
                    overflowY: 'auto',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Detalle de ganancias</div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.01em' }}>Ganancias generadas</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--mute)', fontFamily: 'ui-monospace, monospace' }}>{ref?.email_masked ?? '—'}</p>
                    </div>
                    <button
                      onClick={() => setGananciasRef(null)}
                      style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', flexShrink: 0, transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  {coms.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                      <p style={{ margin: 0, color: 'var(--mute)', fontSize: 13.5 }}>Este usuario aún no ha generado comisiones.</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: 'var(--hover)', borderBottom: '1px solid var(--line)' }}>
                              {['Fecha', 'Tipo', 'Monto base', 'Comisión', 'Estado'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--mute)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {coms.map((c, i) => (
                              <tr key={c.id} style={{ borderBottom: i < coms.length - 1 ? '1px solid var(--line)' : 'none' }}>
                                <td style={{ padding: '11px 14px', color: 'var(--mute)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{fmt(c.fecha_generacion)}</td>
                                <td style={{ padding: '11px 14px', color: 'var(--ink)' }}>{c.tipo === 'unica' ? 'Único' : 'Recurrente'}</td>
                                <td style={{ padding: '11px 14px', color: 'var(--mute)' }}>${Number(c.monto_base).toFixed(2)}</td>
                                <td style={{ padding: '11px 14px', color: 'var(--deep)', fontWeight: 700 }}>${Number(c.monto_comision).toFixed(2)}</td>
                                <td style={{ padding: '11px 14px' }}>{estadoComisionBadge(c.estado)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--lav)', border: '1px solid var(--blue-100)', borderRadius: 12, padding: '14px 18px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>Total generado por este usuario</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)', letterSpacing: '-0.02em' }}>${total.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <button
                      onClick={() => setGananciasRef(null)}
                      style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })(), document.body)}

          {/* Toolbar: stats + plan filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>
              {referidos.length} visita{referidos.length !== 1 ? 's' : ''} · {registros} usuario{registros !== 1 ? 's' : ''} referido{registros !== 1 ? 's' : ''} · {conversiones} suscripción{conversiones !== 1 ? 'es' : ''}
            </p>
            <Select
              value={planFilter}
              onChange={v => setPlanFilter(v as 'all' | 'gratuito' | 'pro')}
              options={[
                { value: 'all',      label: 'Todos los planes' },
                { value: 'gratuito', label: 'Plan Inicio' },
                { value: 'pro',      label: 'Pro' },
              ]}
              triggerStyle={{ fontSize: 13 }}
            />
          </div>

          {referidosFiltrados.length === 0 ? (
            <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px', color: 'var(--deep)', fontSize: 16, fontWeight: 600 }}>
                {referidos.length === 0 ? 'Sin referidos aún' : 'Sin resultados para ese filtro'}
              </h3>
              <p style={{ color: 'var(--mute)', fontSize: 14, margin: 0 }}>
                {referidos.length === 0 ? 'Comparte tu enlace para empezar.' : 'Prueba con otro plan.'}
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--hover)' }}>
                    {['Usuario', 'Plan', 'Origen', 'Registro', 'Primera suscripción', 'Ganancias generadas'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.055em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referidosFiltrados.map((r, i) => {
                    const ganancia = totalPorReferido(r.id);
                    return (
                      <tr key={r.id} style={{ borderBottom: i < referidosFiltrados.length - 1 ? '1px solid var(--line)' : 'none' }}>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ fontSize: 13, fontFamily: 'ui-monospace, monospace', color: 'var(--ink)', fontWeight: 500 }}>{r.email_masked ?? '—'}</div>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {r.plan ? (
                            <Badge label={r.plan === 'pro' ? 'Pro' : 'Plan Inicio'} color={r.plan === 'pro' ? 'var(--blue)' : 'var(--mute)'} bg={r.plan === 'pro' ? '#EFF6FF' : 'var(--hover)'} border={r.plan === 'pro' ? '#BFDBFE' : 'var(--line)'} />
                          ) : <span style={{ color: 'var(--mute)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {r.codigo_descuento_usado ? (
                            <div>
                              <Badge label="Código" color="#7C3AED" bg="#FAF5FF" border="#E9D5FF" />
                              <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 3 }}>
                                <code>{r.codigo_descuento_usado}</code>
                                {r.descuento_pct != null && <span style={{ marginLeft: 4 }}>· {r.descuento_pct}% dto.</span>}
                              </div>
                            </div>
                          ) : <Badge label="Enlace" color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: r.fecha_registro ? '#16A34A' : 'var(--mute)' }}>
                          {r.fecha_registro ? fmt(r.fecha_registro) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13 }}>
                          {r.fecha_primera_suscripcion ? (
                            <span style={{ color: '#16A34A', fontWeight: 600 }}>{fmt(r.fecha_primera_suscripcion)}</span>
                          ) : <span style={{ color: 'var(--mute)', fontSize: 12 }}>Sin suscripción aún</span>}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: ganancia > 0 ? '#16A34A' : 'var(--mute)' }}>
                              ${ganancia.toFixed(2)}
                            </span>
                            <button
                              onClick={() => setGananciasRef(r.id)}
                              title="Ver detalle de ganancias"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', padding: 2, display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity .15s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

          {solicitudPendiente ? (
            <div style={{ ...card, border: '1px solid #BFDBFE', background: '#EFF6FF' }}>
              <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#1E40AF', fontWeight: 600 }}>
                Tienes una solicitud de retiro en curso — ${solicitudPendiente.monto_total.toFixed(2)} vía {solicitudPendiente.red_blockchain}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
                Solicitada el {new Date(solicitudPendiente.fecha_solicitud).toLocaleDateString('es')}. Te notificaremos cuando se procese.
              </p>
            </div>
          ) : saldo_disponible < perfil.umbral_minimo_pago ? (
            <div style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--lav)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--deep)' }}>Saldo insuficiente para retiro</p>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
                    Necesitas al menos <strong style={{ color: 'var(--ink)' }}>${perfil.umbral_minimo_pago}</strong> disponibles.
                    Tu saldo actual es <strong style={{ color: 'var(--ink)' }}>${saldo_disponible.toFixed(2)}</strong>.
                    Sigue refiriendo usuarios para alcanzar el mínimo.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card, border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, color: '#166534', fontWeight: 600 }}>
                Tienes ${saldo_disponible.toFixed(2)} disponibles para retirar.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Red</label>
                  <Select
                    value={wRed}
                    onChange={v => setWRed(v as 'TRON' | 'POLYGON')}
                    options={[{ value: 'TRON', label: 'TRON (USDT-TRC20)' }, { value: 'POLYGON', label: 'Polygon (USDT)' }]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Dirección de wallet</label>
                  <input
                    type="text"
                    value={wWallet}
                    onChange={e => setWWallet(e.target.value)}
                    placeholder="Tu dirección USDT"
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13.5, borderRadius: 10, border: '1px solid #BBF7D0', background: '#fff' }}
                  />
                </div>
                {wError && <p style={{ margin: 0, fontSize: 12.5, color: '#DC2626' }}>{wError}</p>}
                <button
                  onClick={solicitarRetiro}
                  disabled={wSubmitting}
                  style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', opacity: wSubmitting ? 0.6 : 1 }}
                >
                  {wSubmitting ? 'Enviando…' : `Solicitar retiro de $${saldo_disponible.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}

          {solicitudes.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Historial de solicitudes de retiro</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['Fecha', 'Monto', 'Red', 'Estado', 'Hash'].map(h => (
                      <th key={h} style={{ padding: '10px 0', textAlign: 'left', color: 'var(--mute)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px 0', color: 'var(--ink)' }}>{new Date(s.fecha_solicitud).toLocaleDateString('es')}</td>
                      <td style={{ padding: '10px 0', color: 'var(--ink)' }}>${s.monto_total.toFixed(2)}</td>
                      <td style={{ padding: '10px 0', color: 'var(--mute)' }}>{s.red_blockchain}</td>
                      <td style={{ padding: '10px 0' }}>
                        {s.estado === 'pagada' && <Badge label="Pagada" color="#166534" bg="#F0FDF4" border="#BBF7D0" />}
                        {s.estado === 'rechazada' && <Badge label="Rechazada" color="#DC2626" bg="#FEF2F2" border="#FECACA" />}
                        {(s.estado === 'solicitada' || s.estado === 'en_proceso') && <Badge label="En proceso" color="#1E40AF" bg="#EFF6FF" border="#BFDBFE" />}
                      </td>
                      <td style={{ padding: '10px 0', color: 'var(--mute)', fontFamily: 'monospace', fontSize: 12 }}>{s.hash_transaccion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {comisiones.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Historial de comisiones</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['Fecha', 'Tipo', 'Base', 'Comisión', 'Disponible', 'Estado'].map(h => (
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
                      <td style={{ padding: '11px 0' }}>{estadoComisionBadge(c.estado)}</td>
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