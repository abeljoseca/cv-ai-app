'use client';

import { useEffect, useState, useCallback, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { Select } from '@/components/Select';
import { createClient } from '@/lib/supabase/client';
import {
  listAllTemplates,
  updateTemplate,
  deleteTemplate,
  createCVInspiración,
  findExistingEditSession,
} from '@/src/features/cv-inspiracion/lib/supabase-cv-service';
import type { SupabaseTemplate } from '@/src/features/cv-inspiracion/types/template.types';

type Tab = 'resumen' | 'usuarios' | 'plantillas' | 'configuracion' | 'embajadores';
type UserRole = 'admin' | 'editor';

interface Stats {
  overview: { totalUsers: number; totalCVs: number; totalApplications: number; cvs7days: number };
  plans: Record<string, number>;
  cvs: { byStyle: Record<string, number>; byIntention: Record<string, number> };
}

interface UserRow {
  id: string;
  nombre: string;
  apellido: string;
  email_cv: string;
  plan: 'gratuito' | 'pro';
  puntaje_completitud: number;
  onboarding_completado: boolean;
  is_admin: boolean | null;
  is_editor: boolean | null;
  created_at: string;
}

/* ── Helper components ──────────────────────────────── */
function Spinner({ size = 14, color = 'var(--blue)' }: { size?: number; color?: string }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(0,0,0,.1)`, borderTopColor: color,
      display: 'inline-block', animation: 'spin .8s linear infinite', flexShrink: 0,
    }} />
  );
}

function PageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
      <Spinner size={28} />
    </div>
  );
}

/* ── ConfirmModal ───────────────────────────────────── */
interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, description, confirmLabel = 'Confirmar', variant = 'default', onConfirm, onCancel }: ConfirmModalProps) {
  const btnColor = variant === 'danger' ? '#DC2626' : variant === 'warning' ? '#D97706' : 'var(--blue)';
  const icon = variant === 'default'
    ? { bg: '#EFF6FF', border: '#BFDBFE', el: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ) }
    : { bg: variant === 'danger' ? '#FEF2F2' : '#FEF3C7', border: variant === 'danger' ? '#FECACA' : '#FDE68A', el: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={btnColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      ) };
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(15,23,42,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '24px 26px',
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 64px rgba(15,23,42,.22)',
          animation: 'fadeUp .18s var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: icon.bg, border: `1px solid ${icon.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon.el}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
            <h3 style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 700, color: 'var(--deep)', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.55 }}>
              {description}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: btnColor, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────── */
function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      background: type === 'error' ? '#FEF2F2' : '#F0FDF4',
      border: `1px solid ${type === 'error' ? '#FECACA' : '#BBF7D0'}`,
      color: type === 'error' ? '#B91C1C' : '#16A34A',
      borderRadius: 12, padding: '12px 18px', fontSize: 13.5, fontWeight: 500,
      boxShadow: '0 8px 24px rgba(15,23,42,.12)', animation: 'fadeUp .2s var(--ease)',
      maxWidth: 360,
    }}>
      {message}
    </div>
  );
}

/* ── Resumen tab ────────────────────────────────────── */
function ResumenTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!stats) return null;

  const total = stats.overview.totalUsers;
  const pro = stats.plans.pro || 0;
  const gratuito = stats.plans.gratuito || 0;
  const conversionPct = total > 0 ? ((pro / total) * 100).toFixed(1) : '0.0';
  const cvsPerUser = total > 0 ? (stats.overview.totalCVs / total).toFixed(1) : '0.0';

  const kpis = [
    { label: 'Usuarios totales', value: total, color: 'var(--deep)' },
    { label: 'CVs generados', value: stats.overview.totalCVs, color: 'var(--blue)' },
    { label: 'CVs últimos 7 días', value: stats.overview.cvs7days, color: '#8B5CF6' },
    { label: 'Usuarios Pro', value: pro, color: '#16A34A' },
  ];

  const styleTotal = Object.values(stats.cvs.byStyle).reduce((a, b) => a + b, 0);
  const intentionLabels: Record<string, string> = { general: 'CV General', vacante: 'CV Vacante' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Distribución de planes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ label: 'Plan Inicio', count: gratuito, color: '#94A3B8' }, { label: 'Pro', count: pro, color: '#22C55E' }].map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{row.count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--hover)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${total > 0 ? (row.count / total) * 100 : 0}%`, background: row.color, borderRadius: 999, transition: 'width .4s var(--ease)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Métricas clave</div>
          {[
            { label: 'Tasa de conversión a Pro', value: `${conversionPct}%`, highlight: '#16A34A' },
            { label: 'CVs por usuario', value: cvsPerUser, highlight: 'var(--blue)' },
            { label: 'Aplicaciones registradas', value: String(stats.overview.totalApplications), highlight: 'var(--deep)' },
          ].map((m, i, arr) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--mute)' }}>{m.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: m.highlight }}>{m.value}</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: 'var(--line)' }} />}
            </div>
          ))}
        </div>
      </div>

      {styleTotal > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>CVs por estilo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(stats.cvs.byStyle).map(([style, count]) => {
              const pct = ((count / styleTotal) * 100).toFixed(0);
              return (
                <div key={style}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink)', textTransform: 'capitalize' }}>{style}</span>
                    <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500 }}>{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--hover)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue)', borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(stats.cvs.byIntention).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--sh-1)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>CVs por intención</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(stats.cvs.byIntention).map(([key, count]) => (
              <div key={key} style={{ flex: 1, background: 'var(--hover)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--deep)', letterSpacing: '-0.02em' }}>{count}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>{intentionLabels[key] ?? key}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Invite modal ───────────────────────────────────── */
type InviteRole = 'user' | 'editor' | 'admin';

function InviteModal({ isSuperAdmin, onClose, onInvited }: {
  isSuperAdmin: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('editor');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const roleOptions: { value: InviteRole; label: string; desc: string }[] = [
    { value: 'user', label: 'Usuario', desc: 'Acceso normal a la plataforma' },
    { value: 'editor', label: 'Editor', desc: 'Puede gestionar plantillas canvas' },
    ...(isSuperAdmin ? [{ value: 'admin' as InviteRole, label: 'Admin', desc: 'Acceso completo al panel admin' }] : []),
  ];

  async function handleInvite() {
    if (!email.trim()) { setError('Introduce un email válido'); return; }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al enviar la invitación'); return; }
      setSuccess(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 28px 24px', maxWidth: 420, width: 'calc(100% - 32px)', boxShadow: '0 24px 64px rgba(15,23,42,.22)', animation: 'fadeUp .18s var(--ease)' }}>

        {success ? (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--deep)' }}>Invitación enviada</h3>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
              <strong>{email}</strong> recibirá un email con un link para activar su cuenta. Cuando lo haga, aparecerá en la tabla de usuarios con el rol <strong>{role}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setEmail(''); setRole('editor'); setSuccess(false); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--hover)', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                Invitar otro
              </button>
              <button onClick={() => { onInvited(); onClose(); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--deep)' }}>Invitar usuario</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>Recibirá un email para activar su cuenta</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: 4, borderRadius: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="nombre@empresa.com"
                  autoFocus
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol asignado</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {roleOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                        border: `1.5px solid ${role === opt.value ? 'var(--blue)' : 'var(--line)'}`,
                        background: role === opt.value ? 'var(--lav)' : 'var(--surface)',
                        transition: 'all .15s',
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${role === opt.value ? 'var(--blue)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {role === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#B91C1C' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={onClose} disabled={sending} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                  Cancelar
                </button>
                <button
                  onClick={handleInvite}
                  disabled={sending || !email.trim()}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: sending || !email.trim() ? 'var(--line)' : 'var(--blue)', color: sending || !email.trim() ? 'var(--mute)' : '#fff', border: 'none', cursor: sending || !email.trim() ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s' }}
                >
                  {sending && <Spinner size={13} color="#fff" />}
                  {sending ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Usuarios tab ───────────────────────────────────── */
function UsuariosTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModalProps | null>(null);
  const LIMIT = 15;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search, plan: planFilter });
    if (roleFilter !== 'all') params.set('role', roleFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setPagination({ total: data.pagination?.total || 0, pages: data.pagination?.pages || 0 });
    setLoading(false);
  }, [page, search, planFilter, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function updateUser(id: string, updates: Record<string, unknown>) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error || 'Error al actualizar', type: 'error' });
        return;
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      setToast({ message: 'Cambio guardado', type: 'success' });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
        />
        <Select
          value={planFilter}
          onChange={v => { setPlanFilter(v); setPage(1); }}
          options={[
            { value: 'all',      label: 'Todos los planes' },
            { value: 'gratuito', label: 'Plan Inicio' },
            { value: 'pro',      label: 'Pro' },
          ]}
        />
        {isSuperAdmin && (
          <Select
            value={roleFilter}
            onChange={v => { setRoleFilter(v); setPage(1); }}
            options={[
              { value: 'all',       label: 'Todos los roles' },
              { value: 'admin',     label: 'Admin' },
              { value: 'editor',    label: 'Editor' },
              { value: 'embajador', label: 'Embajador' },
              { value: 'usuario',   label: 'Usuario regular' },
            ]}
          />
        )}
        <span style={{ fontSize: 12.5, color: 'var(--mute)', flexShrink: 0 }}>{pagination.total} usuarios</span>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Invitar usuario
        </button>
      </div>

      {showInviteModal && (
        <InviteModal
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowInviteModal(false)}
          onInvited={loadUsers}
        />
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-1)' }}>
        {loading ? (
          <div style={{ padding: '56px 24px', display: 'flex', justifyContent: 'center' }}><Spinner size={24} /></div>
        ) : users.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center', fontSize: 14, color: 'var(--mute)' }}>Sin resultados</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--hover)' }}>
                {['Usuario', 'Plan', 'Completitud', 'Onboarding', 'Admin', 'Editor', 'Registro'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.055em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const busy = updatingId === user.id;
                return (
                  <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--line)' : 'none', opacity: busy ? 0.6 : 1, transition: 'opacity .15s' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>{user.nombre} {user.apellido}</div>
                      <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>{user.email_cv}</div>
                    </td>

                    {/* Plan toggle */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => !busy && setConfirm({
                          title: user.plan === 'pro' ? '¿Quitar plan Pro?' : '¿Asignar plan Pro?',
                          description: user.plan === 'pro'
                            ? `${user.nombre} ${user.apellido} volverá al plan Gratuito. Perderá acceso a las funciones Pro.`
                            : `${user.nombre} ${user.apellido} obtendrá acceso completo al plan Pro.`,
                          confirmLabel: user.plan === 'pro' ? 'Quitar Pro' : 'Asignar Pro',
                          variant: user.plan === 'pro' ? 'warning' : 'default',
                          onConfirm: () => updateUser(user.id, { plan: user.plan === 'pro' ? 'gratuito' : 'pro' }),
                          onCancel: () => setConfirm(null),
                        })}
                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', background: user.plan === 'pro' ? '#EFF6FF' : 'var(--hover)', color: user.plan === 'pro' ? 'var(--blue)' : 'var(--mute)', transition: 'all .15s' }}
                      >
                        {user.plan === 'pro' ? 'Pro' : 'Plan Inicio'}
                      </button>
                    </td>

                    {/* Completitud */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 52, height: 5, background: 'var(--hover)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${user.puntaje_completitud}%`, background: 'var(--blue)', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--mute)', flexShrink: 0 }}>{user.puntaje_completitud}%</span>
                      </div>
                    </td>

                    {/* Onboarding */}
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: user.onboarding_completado ? '#16A34A' : '#D97706' }}>
                        {user.onboarding_completado ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>

                    {/* Admin toggle */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => !busy && setConfirm({
                          title: user.is_admin ? '¿Quitar rol de Admin?' : '¿Asignar rol de Admin?',
                          description: user.is_admin
                            ? `${user.nombre} ${user.apellido} perderá acceso al panel de administración.`
                            : `${user.nombre} ${user.apellido} tendrá acceso completo al panel de administración. Esta acción es de alto impacto.`,
                          confirmLabel: user.is_admin ? 'Quitar Admin' : 'Asignar Admin',
                          variant: 'danger',
                          onConfirm: () => updateUser(user.id, { is_admin: !user.is_admin }),
                          onCancel: () => setConfirm(null),
                        })}
                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${user.is_admin ? '#BBF7D0' : 'var(--line)'}`, cursor: busy ? 'not-allowed' : 'pointer', background: user.is_admin ? '#F0FDF4' : 'var(--surface)', color: user.is_admin ? '#16A34A' : 'var(--mute)', transition: 'all .15s' }}
                      >
                        {user.is_admin ? 'Admin' : '—'}
                      </button>
                    </td>

                    {/* Editor toggle */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => !busy && setConfirm({
                          title: user.is_editor ? '¿Quitar rol de Editor?' : '¿Asignar rol de Editor?',
                          description: user.is_editor
                            ? `${user.nombre} ${user.apellido} perderá acceso al editor de plantillas canvas.`
                            : `${user.nombre} ${user.apellido} podrá gestionar plantillas en el editor canvas.`,
                          confirmLabel: user.is_editor ? 'Quitar Editor' : 'Asignar Editor',
                          variant: 'warning',
                          onConfirm: () => updateUser(user.id, { is_editor: !user.is_editor }),
                          onCancel: () => setConfirm(null),
                        })}
                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${user.is_editor ? '#E9D5FF' : 'var(--line)'}`, cursor: busy ? 'not-allowed' : 'pointer', background: user.is_editor ? '#FAF5FF' : 'var(--surface)', color: user.is_editor ? '#7C3AED' : 'var(--mute)', transition: 'all .15s' }}
                      >
                        {user.is_editor ? 'Editor' : '—'}
                      </button>
                    </td>

                    {/* Fecha */}
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--mute)', whiteSpace: 'nowrap' }}>
                      {new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, color: 'var(--ink)' }}>Anterior</button>
          <span style={{ fontSize: 13, color: 'var(--mute)' }}>Página {page} de {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.5 : 1, color: 'var(--ink)' }}>Siguiente</button>
        </div>
      )}
    </div>
  );
}

/* ── Plantillas tab ─────────────────────────────────── */
function PlantillasTab() {
  const router = useRouter();
  const supabase = createClient();
  const [templates, setTemplates] = useState<SupabaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);

  useEffect(() => {
    listAllTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  async function handleToggle(t: SupabaseTemplate) {
    setTogglingId(t.id);
    try {
      await updateTemplate(t.id, { is_published: !t.is_published });
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_published: !t.is_published } : x));
    } finally { setTogglingId(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla? No se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } finally { setDeletingId(null); }
  }

  async function handleEdit(t: SupabaseTemplate) {
    setEditingId(t.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar sesión de edición existente para esta plantilla
      const existing = await findExistingEditSession(user.id, t.id);
      if (existing) {
        setResumingId(t.id);
        sessionStorage.setItem('editor_template_source_id', t.id);
        router.push(`/create-cv/studio/editor/${existing.id}`);
        return;
      }

      // Crear nueva sesión
      const record = await createCVInspiración(user.id, t.id, t.canvas_state);
      sessionStorage.setItem('editor_template_source_id', t.id);
      router.push(`/create-cv/studio/editor/${record.id}`);
    } catch { setEditingId(null); setResumingId(null); }
  }

  if (loading) return <PageSpinner />;

  const published = templates.filter(t => t.is_published);
  const drafts = templates.filter(t => !t.is_published);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>
          {published.length} publicada{published.length !== 1 ? 's' : ''} · {drafts.length} borrador{drafts.length !== 1 ? 'es' : ''}
        </p>
        <div style={{ fontSize: 12, color: 'var(--mute)', background: 'var(--hover)', borderRadius: 8, padding: '5px 12px' }}>
          Crear plantillas: editor canvas → "Guardar Plantilla"
        </div>
      </div>

      {templates.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '64px 24px', textAlign: 'center', boxShadow: 'var(--sh-1)' }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>🎨</div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--deep)', fontSize: 17, fontWeight: 600 }}>Sin plantillas aún</h3>
          <p style={{ color: 'var(--mute)', fontSize: 14, margin: 0 }}>
            Abre el editor canvas, diseña una plantilla y usa el botón <strong>Guardar Plantilla</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map(t => {
            const isEditing = editingId === t.id;
            const isResuming = resumingId === t.id;
            return (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--sh-1)' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: t.is_published ? '#22C55E' : '#CBD5E1' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--deep)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  {t.description && <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>}
                  <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 3, fontFamily: 'ui-monospace, monospace', opacity: 0.65 }}>
                    {t.id.slice(0, 8)}… · {new Date(t.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, flexShrink: 0, background: t.is_published ? '#F0FDF4' : 'var(--hover)', color: t.is_published ? '#16A34A' : 'var(--mute)', border: `1px solid ${t.is_published ? '#BBF7D0' : 'var(--line)'}` }}>
                  {t.is_published ? 'Publicada' : 'Borrador'}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleEdit(t)}
                    disabled={!!editingId}
                    style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 500, cursor: editingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: isEditing ? 0.6 : 1, transition: 'all .15s' }}
                    onMouseEnter={e => { if (!editingId) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                  >
                    {isEditing ? <Spinner size={12} /> : null}
                    {isEditing ? (isResuming ? 'Retomando...' : 'Abriendo...') : 'Editar'}
                  </button>
                  <button
                    onClick={() => handleToggle(t)}
                    disabled={togglingId === t.id}
                    style={{ height: 32, padding: '0 12px', borderRadius: 8, border: `1px solid ${t.is_published ? '#FECACA' : '#BBF7D0'}`, background: t.is_published ? '#FEF2F2' : '#F0FDF4', color: t.is_published ? '#DC2626' : '#16A34A', fontSize: 12.5, fontWeight: 500, cursor: togglingId === t.id ? 'not-allowed' : 'pointer', opacity: togglingId === t.id ? 0.6 : 1 }}
                  >
                    {t.is_published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    title="Eliminar"
                    style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--mute)', cursor: deletingId === t.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
                    onMouseEnter={e => { if (deletingId !== t.id) { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626'; } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Configuración tab ──────────────────────────────── */
function ConfiguracionTab() {
  const PRICE_FIELDS = [
    { clave: 'precio_cv_unico',    label: 'CV Único',             desc: 'Precio para descargar un CV generado con IA' },
    { clave: 'precio_mensual',     label: 'Suscripción mensual',  desc: 'Precio del plan Pro por mes' },
    { clave: 'precio_anual',       label: 'Suscripción anual',    desc: 'Precio del plan Pro por año' },
    { clave: 'precio_inspiracion', label: 'CV Studio',       desc: 'Precio para descargar un CV del editor canvas' },
  ];

  const [values, setValues]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then((rows: { clave: string; valor: string }[]) => {
        const map = Object.fromEntries(rows.map(r => [r.clave, r.valor]));
        setValues(map);
        setLoaded(true);
      });
  }, []);

  async function save(clave: string) {
    setSaving(clave);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor: values[clave] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ msg: 'Precio actualizado correctamente.', type: 'success' });
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Error al guardar.', type: 'error' });
    } finally {
      setSaving(null);
    }
  }

  if (!loaded) return <PageSpinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px', boxShadow: 'var(--sh-1)' }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
          Precios (USD)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {PRICE_FIELDS.map((field, i) => (
            <div key={field.clave} style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              alignItems: 'center', gap: 16,
              padding: '14px 0',
              borderBottom: i < PRICE_FIELDS.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--deep)', marginBottom: 2 }}>{field.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>{field.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute', left: 10, color: 'var(--mute)',
                    fontSize: 14, fontWeight: 600, pointerEvents: 'none',
                  }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={values[field.clave] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [field.clave]: e.target.value }))}
                    style={{
                      width: 100, padding: '8px 10px 8px 22px',
                      border: '1px solid var(--line)', borderRadius: 8,
                      fontSize: 14, fontWeight: 600, color: 'var(--deep)',
                      background: 'var(--bg)', outline: 'none',
                      textAlign: 'right',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                  />
                </div>
                <button
                  onClick={() => save(field.clave)}
                  disabled={saving === field.clave}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: 'var(--blue)', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: saving === field.clave ? 0.7 : 1,
                    transition: 'opacity .15s',
                  }}
                >
                  {saving === field.clave ? <Spinner size={13} color="#fff" /> : null}
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 24px', boxShadow: 'var(--sh-1)' }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Otras funciones</div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
          Próximamente: mensajes globales, banners, exportación de datos.
        </p>
      </div>
    </div>
  );
}

/* ── Embajadores tab ────────────────────────────────── */
interface EmbajadorRow {
  id: string;
  codigo_referido: string;
  porcentaje_comision: number;
  max_porcentaje_descuento: number;
  meses_recurrencia_mensual: number;
  umbral_minimo_pago: number;
  estado: 'activo' | 'suspendido';
  modulo_codigos_activo: boolean;
  created_at: string;
  profiles: { id: string; nombre: string; apellido: string; email_cv: string } | null;
  stats: {
    clics: number; registros: number; conversiones: number;
    pendiente: number; disponible: number; pagada: number; total: number;
  };
}

interface ComisionPendiente {
  id: string;
  monto_base: number;
  porcentaje_aplicado: number;
  monto_comision: number;
  tipo: 'unica' | 'recurrente';
  estado: string;
  fecha_generacion: string;
  fecha_disponible: string;
  embajador_perfil: {
    id: string;
    codigo_referido: string;
    profiles: { nombre: string; apellido: string; email_cv: string } | null;
  } | null;
}

interface SolicitudPendiente {
  id: string;
  monto_total: number;
  red_blockchain: 'TRON' | 'POLYGON';
  direccion_wallet: string;
  estado: string;
  fecha_solicitud: string;
  embajador_perfil: {
    id: string;
    codigo_referido: string;
    profiles: { nombre: string; apellido: string; email_cv: string } | null;
  } | null;
}

function EmbajadoresTab() {
  const [list, setList]             = useState<EmbajadorRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm]       = useState<ConfirmModalProps | null>(null);
  const [savingId, setSavingId]     = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);

  // Comisiones pendientes de revisión manual (decisión del CEO: nunca automático, una por una)
  const [comisiones, setComisiones]           = useState<ComisionPendiente[]>([]);
  const [comisionesLoading, setComisionesLoading] = useState(true);
  const [comisionBusyId, setComisionBusyId]   = useState<string | null>(null);

  // Solicitudes de retiro pendientes de procesar
  const [solicitudes, setSolicitudes]           = useState<SolicitudPendiente[]>([]);
  const [solicitudesLoading, setSolicitudesLoading] = useState(true);
  const [solicitudBusyId, setSolicitudBusyId]   = useState<string | null>(null);
  const [hashInputs, setHashInputs]             = useState<Record<string, string>>({});

  // Assign-ambassador form state
  const [formUserId, setFormUserId]     = useState('');     // resolved UUID
  const [formEmail, setFormEmail]       = useState('');     // display value in input
  const [formCode, setFormCode]         = useState('');
  const [formCom, setFormCom]           = useState('25');
  const [formDisc, setFormDisc]         = useState('20');
  const [formMonths, setFormMonths]     = useState('6');
  const [formMin, setFormMin]           = useState('50');
  const [formSaving, setFormSaving]     = useState(false);
  const [formError, setFormError]       = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions]   = useState<{ id: string; email_cv: string; nombre: string; apellido: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimer, setSearchTimer]   = useState<ReturnType<typeof setTimeout> | null>(null);

  // Inline-edit state per row
  const [editing, setEditing]       = useState<Record<string, { com: string; disc: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/embajadores');
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadComisiones = useCallback(async () => {
    setComisionesLoading(true);
    const res = await fetch('/api/admin/comisiones?estado=pendiente');
    const data = await res.json();
    setComisiones(Array.isArray(data) ? data : []);
    setComisionesLoading(false);
  }, []);

  useEffect(() => { loadComisiones(); }, [loadComisiones]);

  const loadSolicitudes = useCallback(async () => {
    setSolicitudesLoading(true);
    const res = await fetch('/api/admin/solicitudes-pago?estado=solicitada');
    const data = await res.json();
    setSolicitudes(Array.isArray(data) ? data : []);
    setSolicitudesLoading(false);
  }, []);

  useEffect(() => { loadSolicitudes(); }, [loadSolicitudes]);

  async function resolverSolicitud(s: SolicitudPendiente, nuevoEstado: 'pagada' | 'rechazada') {
    setSolicitudBusyId(s.id);
    try {
      const body: Record<string, unknown> = { estado: nuevoEstado };
      if (nuevoEstado === 'pagada') body.hash_transaccion = hashInputs[s.id]?.trim();
      const res = await fetch(`/api/admin/solicitudes-pago/${s.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSolicitudes(prev => prev.filter(x => x.id !== s.id));
      setToast({ msg: nuevoEstado === 'pagada' ? 'Solicitud marcada como pagada' : 'Solicitud rechazada — comisiones liberadas', type: 'success' });
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Error', type: 'error' });
    } finally { setSolicitudBusyId(null); }
  }

  async function resolverComision(c: ComisionPendiente, nuevoEstado: 'disponible' | 'rechazada') {
    setComisionBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/comisiones/${c.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setComisiones(prev => prev.filter(x => x.id !== c.id));
      setToast({ msg: nuevoEstado === 'disponible' ? 'Comisión aprobada — ya está disponible para retiro' : 'Comisión rechazada', type: 'success' });
      load(); // refresca los totales pendiente/disponible de la tabla de embajadores
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Error', type: 'error' });
    } finally { setComisionBusyId(null); }
  }

  function handleEmailChange(value: string) {
    setFormEmail(value);
    setFormUserId('');   // clear resolved user when input changes
    setFormError('');

    if (searchTimer) clearTimeout(searchTimer);
    if (value.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }

    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(value.trim())}&limit=6`);
      const data = await res.json();
      const users = (data.users ?? []) as { id: string; email_cv: string; nombre: string; apellido: string }[];
      setSuggestions(users);
      setShowSuggestions(users.length > 0);
    }, 280);
    setSearchTimer(t);
  }

  function selectSuggestion(u: { id: string; email_cv: string; nombre: string; apellido: string }) {
    setFormEmail(u.email_cv);
    setFormUserId(u.id);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function toggleModuloCodigos(emb: EmbajadorRow) {
    setSavingId(emb.id);
    const nuevo = !emb.modulo_codigos_activo;
    try {
      const res = await fetch(`/api/admin/embajadores/${emb.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo_codigos_activo: nuevo }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setList(prev => prev.map(e => e.id === emb.id ? { ...e, modulo_codigos_activo: nuevo } : e));
      setToast({ msg: nuevo ? 'Módulo de códigos activado' : 'Módulo de códigos desactivado', type: 'success' });
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Error', type: 'error' });
    } finally { setSavingId(null); }
  }

  async function toggleEstado(emb: EmbajadorRow) {
    setSavingId(emb.id);
    const nuevoEstado = emb.estado === 'activo' ? 'suspendido' : 'activo';
    try {
      const res = await fetch(`/api/admin/embajadores/${emb.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setList(prev => prev.map(e => e.id === emb.id ? { ...e, estado: nuevoEstado } : e));
      setToast({ msg: `Embajador ${nuevoEstado}`, type: 'success' });
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Error', type: 'error' });
    } finally { setSavingId(null); }
  }

  async function saveEditing(emb: EmbajadorRow) {
    const ed = editing[emb.id];
    if (!ed) return;
    setSavingId(emb.id);
    try {
      const res = await fetch(`/api/admin/embajadores/${emb.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje_comision: Number(ed.com), max_porcentaje_descuento: Number(ed.disc) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setList(prev => prev.map(e => e.id === emb.id ? { ...e, porcentaje_comision: Number(ed.com), max_porcentaje_descuento: Number(ed.disc) } : e));
      setEditing(prev => { const n = { ...prev }; delete n[emb.id]; return n; });
      setToast({ msg: 'Comisión actualizada', type: 'success' });
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Error', type: 'error' });
    } finally { setSavingId(null); }
  }

  function resetForm() {
    setFormEmail(''); setFormUserId(''); setFormCode('');
    setFormCom('25'); setFormDisc('20'); setFormMonths('6'); setFormMin('50');
    setFormError(''); setSuggestions([]); setShowSuggestions(false);
  }

  async function handleAssign(e: { preventDefault(): void }) {
    e.preventDefault();
    setFormError('');
    if (!formUserId) { setFormError('Selecciona un usuario de la lista de sugerencias'); return; }
    if (!formCode.trim()) { setFormError('El código de referido es requerido'); return; }
    setFormSaving(true);
    try {
      const res = await fetch('/api/admin/embajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:                   formUserId,
          codigo_referido:           formCode.trim(),
          porcentaje_comision:       Number(formCom),
          max_porcentaje_descuento:  Number(formDisc),
          meses_recurrencia_mensual: Number(formMonths),
          umbral_minimo_pago:        Number(formMin),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error'); return; }
      setToast({ msg: 'Embajador asignado correctamente', type: 'success' });
      setShowForm(false);
      resetForm();
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally { setFormSaving(false); }
  }

  const inputStyle: CSSProperties = {
    padding: '8px 12px', borderRadius: 9, border: '1px solid var(--line)',
    fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const smallInputStyle: CSSProperties = {
    width: 70, padding: '5px 8px', borderRadius: 7, border: '1px solid var(--line)',
    fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', textAlign: 'right',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>
          {list.length} embajador{list.length !== 1 ? 'es' : ''} registrado{list.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo embajador
        </button>
      </div>

      {/* Comisiones pendientes de revisión — manual, una por una (decisión del CEO, ver handoff.md #6) */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 20, boxShadow: 'var(--sh-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: comisionesLoading || comisiones.length > 0 ? 14 : 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--deep)' }}>Comisiones pendientes de revisión</span>
          {!comisionesLoading && comisiones.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 999, padding: '2px 8px' }}>
              {comisiones.length}
            </span>
          )}
        </div>
        {comisionesLoading ? (
          <Spinner size={16} />
        ) : comisiones.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>No hay comisiones esperando revisión.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comisiones.map(c => {
              const p = c.embajador_perfil?.profiles;
              const busy = comisionBusyId === c.id;
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--hover)', borderRadius: 10, opacity: busy ? 0.6 : 1, transition: 'opacity .15s' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>
                      ${Number(c.monto_comision).toFixed(2)}
                      <span style={{ marginLeft: 8, fontWeight: 500, color: 'var(--mute)', fontSize: 12.5 }}>
                        {c.tipo === 'unica' ? 'pago único' : 'recurrente'} · {c.porcentaje_aplicado}% de ${Number(c.monto_base).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
                      {p ? `${p.nombre} ${p.apellido} (${p.email_cv})` : 'Embajador desconocido'}
                      {' · '}código {c.embajador_perfil?.codigo_referido ?? '—'}
                      {' · '}generada {new Date(c.fecha_generacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      disabled={busy}
                      onClick={() => setConfirm({
                        title: '¿Rechazar esta comisión?',
                        description: `${p?.nombre ?? 'Este embajador'} no recibirá los $${Number(c.monto_comision).toFixed(2)} de esta comisión. El registro se conserva marcado como rechazado, no se elimina.`,
                        confirmLabel: 'Rechazar',
                        variant: 'danger',
                        onConfirm: () => resolverComision(c, 'rechazada'),
                        onCancel: () => setConfirm(null),
                      })}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
                    >
                      Rechazar
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => setConfirm({
                        title: '¿Aprobar esta comisión?',
                        description: `${p?.nombre ?? 'Este embajador'} podrá solicitar el retiro de $${Number(c.monto_comision).toFixed(2)}.`,
                        confirmLabel: 'Aprobar',
                        variant: 'default',
                        onConfirm: () => resolverComision(c, 'disponible'),
                        onCancel: () => setConfirm(null),
                      })}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
                    >
                      Aprobar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solicitudes de retiro pendientes de procesar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 20, boxShadow: 'var(--sh-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: solicitudesLoading || solicitudes.length > 0 ? 14 : 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--deep)' }}>Solicitudes de retiro pendientes</span>
          {!solicitudesLoading && solicitudes.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 999, padding: '2px 8px' }}>
              {solicitudes.length}
            </span>
          )}
        </div>
        {solicitudesLoading ? (
          <Spinner size={16} />
        ) : solicitudes.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>No hay solicitudes de retiro pendientes.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {solicitudes.map(s => {
              const p = s.embajador_perfil?.profiles;
              const busy = solicitudBusyId === s.id;
              return (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--hover)', borderRadius: 10, opacity: busy ? 0.6 : 1, transition: 'opacity .15s', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>
                      ${Number(s.monto_total).toFixed(2)}
                      <span style={{ marginLeft: 8, fontWeight: 500, color: 'var(--mute)', fontSize: 12.5 }}>vía {s.red_blockchain}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
                      {p ? `${p.nombre} ${p.apellido} (${p.email_cv})` : 'Embajador desconocido'}
                      {' · '}código {s.embajador_perfil?.codigo_referido ?? '—'}
                      {' · '}solicitada {new Date(s.fecha_solicitud).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4, fontFamily: 'monospace' }}>
                      wallet: {s.direccion_wallet}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="hash de transacción"
                      value={hashInputs[s.id] ?? ''}
                      onChange={e => setHashInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                      disabled={busy}
                      style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid var(--line)', width: 180 }}
                    />
                    <button
                      disabled={busy}
                      onClick={() => setConfirm({
                        title: '¿Rechazar esta solicitud?',
                        description: `Las comisiones incluidas volverán a estar disponibles para ${p?.nombre ?? 'el embajador'}.`,
                        confirmLabel: 'Rechazar',
                        variant: 'danger',
                        onConfirm: () => resolverSolicitud(s, 'rechazada'),
                        onCancel: () => setConfirm(null),
                      })}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
                    >
                      Rechazar
                    </button>
                    <button
                      disabled={busy || !hashInputs[s.id]?.trim()}
                      onClick={() => setConfirm({
                        title: '¿Marcar como pagada?',
                        description: `Confirmas que enviaste $${Number(s.monto_total).toFixed(2)} a ${s.direccion_wallet} vía ${s.red_blockchain}.`,
                        confirmLabel: 'Marcar pagada',
                        variant: 'default',
                        onConfirm: () => resolverSolicitud(s, 'pagada'),
                        onCancel: () => setConfirm(null),
                      })}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: (busy || !hashInputs[s.id]?.trim()) ? 'not-allowed' : 'pointer', opacity: !hashInputs[s.id]?.trim() ? 0.5 : 1 }}
                    >
                      Marcar pagada
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign form */}
      {showForm && (
        <form onSubmit={handleAssign} style={{ background: 'var(--surface)', border: '1px solid var(--blue)', borderRadius: 14, padding: '20px 24px', boxShadow: 'var(--sh-2)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Asignar embajador</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Email with autocomplete */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Usuario
                {formUserId && (
                  <span style={{ marginLeft: 8, color: '#16A34A', fontWeight: 500, textTransform: 'none', fontSize: 11.5 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ display: 'inline', marginRight: 3 }}><polyline points="20 6 9 17 4 12"/></svg>
                    seleccionado
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formEmail}
                  onChange={e => handleEmailChange(e.target.value)}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; if (suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={e => { e.currentTarget.style.borderColor = formUserId ? '#BBF7D0' : 'var(--line)'; setTimeout(() => setShowSuggestions(false), 150); }}
                  placeholder="Escribe email o nombre para buscar..."
                  style={{ ...inputStyle, borderColor: formUserId ? '#BBF7D0' : 'var(--line)', paddingRight: 32 }}
                  autoComplete="off"
                />
                {formEmail && (
                  <button
                    type="button"
                    onClick={() => { setFormEmail(''); setFormUserId(''); setSuggestions([]); setShowSuggestions(false); }}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid var(--line)', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(15,23,42,.12)', overflow: 'hidden', marginTop: 4,
                  }}>
                    {suggestions.map((u, idx) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={() => selectSuggestion(u)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', background: 'transparent', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                          borderBottom: idx < suggestions.length - 1 ? '1px solid var(--line)' : 'none',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--lav)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {(u.nombre?.[0] ?? u.email_cv[0]).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>{u.nombre} {u.apellido}</div>
                          <div style={{ fontSize: 12, color: 'var(--mute)' }}>{u.email_cv}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de referido</label>
              <input type="text" value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} placeholder="JUAN2024" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Comisión %', value: formCom, set: setFormCom },
              { label: 'Desc. máx %', value: formDisc, set: setFormDisc },
              { label: 'Meses recur.', value: formMonths, set: setFormMonths },
              { label: 'Umbral mín $', value: formMin, set: setFormMin },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mute)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                <input type="number" min="0" step="0.01" value={f.value} onChange={e => f.set(e.target.value)} style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
              </div>
            ))}
          </div>
          {formError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#B91C1C', marginBottom: 12 }}>{formError}</div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={formSaving || !formUserId || !formCode.trim()} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: formSaving || !formUserId || !formCode.trim() ? 'var(--line)' : 'var(--blue)', color: formSaving || !formUserId || !formCode.trim() ? 'var(--mute)' : '#fff', fontSize: 13.5, fontWeight: 600, cursor: formSaving || !formUserId || !formCode.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}>
              {formSaving && <Spinner size={13} color="#fff" />}
              Hacer embajador
            </button>
          </div>
        </form>
      )}

      {/* Ambassador table */}
      {loading ? <PageSpinner /> : list.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '56px 24px', textAlign: 'center', boxShadow: 'var(--sh-1)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--deep)', fontSize: 16, fontWeight: 600 }}>Sin embajadores aún</h3>
          <p style={{ color: 'var(--mute)', fontSize: 14, margin: 0 }}>Asigna el primer embajador con el botón de arriba.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--hover)' }}>
                {['Embajador', 'Código', 'Comisión · Desc. máx.', 'Alcance', 'Comisiones generadas', 'Módulo códigos', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.055em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((emb, i) => {
                const p = emb.profiles;
                const busy = savingId === emb.id;
                const ed = editing[emb.id];
                const isActive = emb.estado === 'activo';
                return (
                  <tr key={emb.id} style={{ borderBottom: i < list.length - 1 ? '1px solid var(--line)' : 'none', opacity: busy ? 0.6 : 1, transition: 'opacity .15s' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>{p?.nombre ?? '—'} {p?.apellido ?? ''}</div>
                      <div style={{ fontSize: 12, color: 'var(--mute)' }}>{p?.email_cv ?? ''}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <code style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
                        {emb.codigo_referido}
                      </code>
                    </td>
                    {/* Comisión editable */}
                    <td style={{ padding: '11px 14px' }}>
                      {ed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="number" min="0" max="50" value={ed.com} onChange={e => setEditing(prev => ({ ...prev, [emb.id]: { ...prev[emb.id], com: e.target.value } }))} style={smallInputStyle} />
                          <span style={{ color: 'var(--mute)', fontSize: 12 }}>%</span>
                          <span style={{ color: 'var(--line)' }}>/</span>
                          <input type="number" min="0" max="50" value={ed.disc} onChange={e => setEditing(prev => ({ ...prev, [emb.id]: { ...prev[emb.id], disc: e.target.value } }))} style={smallInputStyle} />
                          <span style={{ color: 'var(--mute)', fontSize: 12 }}>%</span>
                          <button onClick={() => saveEditing(emb)} disabled={busy} style={{ height: 28, padding: '0 10px', borderRadius: 7, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                          <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[emb.id]; return n; })} style={{ height: 28, padding: '0 10px', borderRadius: 7, border: '1px solid var(--line)', background: 'transparent', color: 'var(--mute)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing(prev => ({ ...prev, [emb.id]: { com: String(emb.porcentaje_comision), disc: String(emb.max_porcentaje_descuento) } }))} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                          <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{emb.porcentaje_comision}%</span>
                          <span style={{ color: 'var(--line)', margin: '0 4px' }}>·</span>
                          <span style={{ fontSize: 13, color: 'var(--mute)' }}>{emb.max_porcentaje_descuento}%</span>
                          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--blue)', opacity: 0.7 }}>editar</span>
                        </button>
                      )}
                    </td>
                    {/* Alcance: visitas / registros / suscripciones */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', marginRight: 4 }}>{emb.stats.clics}</span>visitas al enlace
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', marginRight: 4 }}>{emb.stats.registros}</span>cuentas creadas
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                          <span style={{ fontWeight: 600, color: '#16A34A', marginRight: 4 }}>{emb.stats.conversiones}</span>suscripciones
                        </div>
                      </div>
                    </td>
                    {/* Comisiones desglosadas */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                          <span style={{ fontWeight: 600, color: '#D97706', marginRight: 4 }}>${emb.stats.pendiente.toFixed(2)}</span>en espera (holdback)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                          <span style={{ fontWeight: 600, color: '#16A34A', marginRight: 4 }}>${emb.stats.disponible.toFixed(2)}</span>disponible para retirar
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', marginRight: 4 }}>${emb.stats.pagada.toFixed(2)}</span>pagado históricamente
                        </div>
                      </div>
                    </td>
                    {/* Módulo códigos toggle */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => !busy && setConfirm({
                          title: emb.modulo_codigos_activo ? '¿Desactivar módulo de códigos?' : '¿Activar módulo de códigos?',
                          description: emb.modulo_codigos_activo
                            ? `${p?.nombre ?? 'Este embajador'} dejará de ver la sección de códigos de descuento en su panel.`
                            : `${p?.nombre ?? 'Este embajador'} podrá crear y gestionar sus propios códigos de descuento (hasta ${emb.max_porcentaje_descuento}% de descuento).`,
                          confirmLabel: emb.modulo_codigos_activo ? 'Desactivar' : 'Activar',
                          variant: emb.modulo_codigos_activo ? 'warning' : 'default',
                          onConfirm: () => toggleModuloCodigos(emb),
                          onCancel: () => setConfirm(null),
                        })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          border: `1px solid ${emb.modulo_codigos_activo ? '#BFDBFE' : 'var(--line)'}`,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          background: emb.modulo_codigos_activo ? '#EFF6FF' : 'var(--hover)',
                          color: emb.modulo_codigos_activo ? '#2563EB' : 'var(--mute)',
                          transition: 'all .15s',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                        {emb.modulo_codigos_activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    {/* Estado embajador */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => !busy && setConfirm({
                          title: isActive ? '¿Suspender embajador?' : '¿Reactivar embajador?',
                          description: isActive
                            ? `${p?.nombre ?? 'Este embajador'} no podrá acceder a su panel ni generar referidos. Sus comisiones pendientes se conservan.`
                            : `${p?.nombre ?? 'Este embajador'} recuperará acceso a su panel y su enlace de referido volverá a estar activo.`,
                          confirmLabel: isActive ? 'Suspender' : 'Reactivar',
                          variant: isActive ? 'danger' : 'default',
                          onConfirm: () => toggleEstado(emb),
                          onCancel: () => setConfirm(null),
                        })}
                        style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${isActive ? '#BBF7D0' : '#FECACA'}`, cursor: busy ? 'not-allowed' : 'pointer', background: isActive ? '#F0FDF4' : '#FEF2F2', color: isActive ? '#16A34A' : '#B91C1C', transition: 'all .15s' }}
                      >
                        {isActive ? 'Activo' : 'Suspendido'}
                      </button>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <a href={`/admin/ambassadors/${emb.id}`} style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 500, textDecoration: 'none' }}>
                        Ver dashboard →
                      </a>
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

/* ── Main page ──────────────────────────────────────── */
const ADMIN_TABS: { id: Tab; label: string }[] = [
  { id: 'resumen',       label: 'Resumen' },
  { id: 'usuarios',      label: 'Usuarios' },
  { id: 'plantillas',    label: 'Plantillas' },
  { id: 'embajadores',   label: 'Embajadores' },
  { id: 'configuracion', label: 'Configuración' },
];

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('profiles').select('is_admin, is_editor').eq('id', user.id).single();
      if (data?.is_admin) {
        setUserRole('admin');
        fetch('/api/admin/capabilities')
          .then(r => r.json())
          .then(caps => setIsSuperAdmin(!!caps.isSuperAdmin));
      } else if (data?.is_editor) {
        setUserRole('editor');
        setActiveTab('plantillas');
      } else {
        router.replace('/');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size={28} />
    </div>
  );

  const isAdmin = userRole === 'admin';
  const { sidebarOpen } = useSidebar();

  return (
    <div style={{ maxWidth: sidebarOpen ? 1060 : 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.015em' }}>
          {isAdmin ? 'Panel Admin' : 'Plantillas canvas'}
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--mute)' }}>
          {isAdmin
            ? 'Gestiona usuarios, plantillas y estadísticas del producto'
            : 'Crea, edita y publica plantillas para el editor canvas'}
        </p>
      </div>

      {/* Solo admins ven las tabs */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px', fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--blue)' : 'var(--mute)',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--blue)' : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1, transition: 'all .15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'resumen'       && <ResumenTab />}
      {activeTab === 'usuarios'      && <UsuariosTab isSuperAdmin={isSuperAdmin} />}
      {activeTab === 'plantillas'    && <PlantillasTab />}
      {activeTab === 'embajadores'   && <EmbajadoresTab />}
      {activeTab === 'configuracion' && <ConfiguracionTab />}
    </div>
  );
}