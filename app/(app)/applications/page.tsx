'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Aplicacion, CV } from '@/types';
import { Select } from '@/components/Select';
import { cvContentTitle } from '@/lib/cv/content';

const ESTADOS = [
  { value: 'pending',      label: 'En espera' },
  { value: 'interviewing', label: 'Entrevistando' },
  { value: 'hired',        label: 'Contratado' },
  { value: 'rejected',     label: 'Rechazado' },
  { value: 'no_response',  label: 'Sin respuesta' },
] as const;

const BADGE_TONE: Record<string, { bg: string; color: string }> = {
  'pending':      { bg: 'var(--warn-50)',    color: '#8A5A04' },
  'interviewing': { bg: 'var(--lav)',        color: 'var(--blue)' },
  'hired':        { bg: 'var(--success-50)', color: '#148B3D' },
  'rejected':     { bg: 'var(--danger-50)',  color: '#B52020' },
  'no_response':  { bg: 'var(--hover)',      color: 'var(--mute)' },
};

interface AplicacionConCV extends Aplicacion { cv?: CV; }

const fieldStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid var(--line)', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: 'var(--ink)',
  background: '#fff', outline: 'none', fontFamily: 'inherit',
};

export default function AplicacionesPage() {
  const supabase = createClient();
  const [aplicaciones, setAplicaciones] = useState<AplicacionConCV[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cv_id: '', empresa: '', cargo: '', fecha: '', estado: 'pending', nota: '' });
  const [submitting, setSubmitting] = useState(false);
  const [planGratuito, setPlanGratuito] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: appsData }, { data: cvsData }, { data: profileData }] = await Promise.all([
        supabase.from('aplicaciones').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('cvs').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
      ]);

      setCvs((cvsData as CV[]) || []);
      setPlanGratuito(profileData?.plan === 'gratuito');

      const apps = (appsData as Aplicacion[]) || [];
      setAplicaciones(apps.map(app => ({ ...app, cv: cvsData?.find((c: CV) => c.id === app.cv_id) })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (planGratuito && aplicaciones.length >= 5) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('aplicaciones').insert({
        user_id: user.id, cv_id: form.cv_id || null,
        empresa: form.empresa || null, cargo: form.cargo || null,
        fecha: form.fecha || null, estado: form.estado, nota: form.nota || null,
      }).select().single();
      if (data) {
        const cv = cvs.find(c => c.id === (data as Aplicacion).cv_id);
        setAplicaciones(prev => [{ ...(data as Aplicacion), cv }, ...prev]);
      }
      setShowForm(false);
      setForm({ cv_id: '', empresa: '', cargo: '', fecha: '', estado: 'pending', nota: '' });
    } finally { setSubmitting(false); }
  }

  async function handleEstadoChange(id: string, estado: string) {
    await supabase.from('aplicaciones').update({ estado }).eq('id', id);
    setAplicaciones(prev => prev.map(a => a.id === id ? { ...a, estado: estado as any } : a));
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta aplicación?')) return;
    await supabase.from('aplicaciones').delete().eq('id', id);
    setAplicaciones(prev => prev.filter(a => a.id !== id));
  }

  const filtradas = aplicaciones.filter(a => {
    const matchEstado = !filtroEstado || a.estado === filtroEstado;
    const matchBusqueda = !busqueda ||
      a.empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.cargo?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const limitAlcanzado = planGratuito && aplicaciones.length >= 5;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Filters bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'center',
        marginBottom: 16, boxShadow: 'var(--sh-1)',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '9px 14px' }}>
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder="Buscar empresa o cargo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--ink)', width: '100%', fontFamily: 'inherit' }}
          />
        </div>
        <Select
          value={filtroEstado}
          onChange={setFiltroEstado}
          options={[
            { value: '', label: 'Todos los estados' },
            ...ESTADOS.map(s => ({ value: s.value, label: s.label })),
          ]}
          triggerStyle={{ fontSize: 14 }}
        />
        <button
          onClick={() => setShowForm(true)}
          disabled={limitAlcanzado}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: limitAlcanzado ? 'var(--line)' : 'var(--blue)',
            color: limitAlcanzado ? 'var(--mute)' : '#fff',
            fontWeight: 600, fontSize: 13.5, cursor: limitAlcanzado ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}>
          <PlusIcon size={15} /> Agregar aplicación
        </button>
      </div>

      {/* Plan limit banner */}
      {limitAlcanzado && (
        <div style={{
          padding: '13px 18px', background: 'var(--warn-50)', color: '#8A5A04',
          borderRadius: 12, fontSize: 13, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid #F3DDA6',
        }}>
          <InfoIcon size={16} />
          <span style={{ flex: 1 }}>Has alcanzado el límite de 5 aplicaciones del plan gratuito.</span>
          <button onClick={() => window.location.href = '/account'} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 8, border: 'none',
            background: 'var(--blue)', color: '#fff',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}>
            <CrownIcon size={13} /> Mejorar a Pro
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--sh-1)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              {['Empresa', 'Cargo', 'CV asociado', 'Fecha', 'Estado', 'Nota', ''].map(h => (
                <th key={h} style={{
                  padding: '13px 16px', textAlign: 'left',
                  color: 'var(--mute)', fontSize: 11.5, fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((app, i) => {
              const badge = BADGE_TONE[app.estado] || BADGE_TONE['no_response'];
              return (
                <tr key={app.id} style={{ borderBottom: i < filtradas.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--deep)' }}>{app.empresa || '—'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--ink)' }}>{app.cargo || '—'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--mute)', fontSize: 13 }}>
                    {app.cv ? (cvContentTitle(app.cv.contenido_json) || app.cv.intencion) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--mute)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {app.fecha ? new Date(app.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Select
                      value={app.estado}
                      onChange={v => handleEstadoChange(app.id, v)}
                      options={ESTADOS.map(s => ({ value: s.value, label: s.label }))}
                      style={{ minWidth: 140 }}
                      triggerStyle={{
                        ...badge,
                        padding: '4px 12px 4px 10px',
                        borderRadius: 999,
                        border: 'none',
                        fontSize: 12.5,
                        fontWeight: 600,
                        boxShadow: 'none',
                      }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--mute)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {app.nota || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(app.id)} style={{
                      background: 'transparent', border: 'none', color: 'var(--mute)',
                      padding: '5px 7px', borderRadius: 6, cursor: 'pointer',
                      transition: 'color .2s var(--ease)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B52020'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--mute)'}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--mute)' }}>
                  {aplicaciones.length === 0 ? 'Aún no has registrado aplicaciones.' : 'Sin resultados para tu búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 520, width: '100%', margin: '0 16px', boxShadow: 'var(--sh-3)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 600, color: 'var(--deep)' }}>Nueva aplicación</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>CV asociado</span>
                <Select
                  value={form.cv_id}
                  onChange={v => setForm(p => ({ ...p, cv_id: v }))}
                  options={[
                    { value: '', label: 'Seleccionar CV (opcional)' },
                    ...cvs.map(cv => ({
                      value: cv.id,
                      label: `${cv.titulo || cvContentTitle(cv.contenido_json) || cv.intencion} — ${new Date(cv.created_at).toLocaleDateString('es-ES')}`,
                    })),
                  ]}
                  style={{ width: '100%' }}
                  triggerStyle={fieldStyle}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Empresa <span style={{ color: 'var(--danger)' }}>*</span></span>
                  <input type="text" required value={form.empresa} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))} placeholder="Ej. Google" style={fieldStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Cargo <span style={{ color: 'var(--danger)' }}>*</span></span>
                  <input type="text" required value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ej. Frontend Developer" style={fieldStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Fecha</span>
                  <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} style={fieldStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Estado</span>
                  <Select
                    value={form.estado}
                    onChange={v => setForm(p => ({ ...p, estado: v }))}
                    options={ESTADOS.map(s => ({ value: s.value, label: s.label }))}
                    style={{ width: '100%' }}
                    triggerStyle={fieldStyle}
                  />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Nota</span>
                <textarea rows={2} value={form.nota} onChange={e => setForm(p => ({ ...p, nota: e.target.value }))} placeholder="Notas adicionales..." style={{ ...fieldStyle, resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={submitting} style={{
                  flex: 1, padding: '11px 18px', borderRadius: 10, border: 'none',
                  background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? .7 : 1,
                }}>{submitting ? 'Guardando...' : 'Agregar'}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '11px 18px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--ink)', fontWeight: 500, fontSize: 14, cursor: 'pointer',
                }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Icons */
function SearchIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function CrownIcon({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2 19h20v2H2zM3 7l4 6 5-8 5 8 4-6v10H3z"/></svg>; }
function PlusIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TrashIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function InfoIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
