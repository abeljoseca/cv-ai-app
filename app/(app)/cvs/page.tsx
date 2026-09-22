'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CV, Aplicacion, Profile } from '@/types';
import { Select } from '@/components/Select';
import CVRenderer from '@/components/CVTemplates';
import type { CVInspirationRecord } from '@/src/features/cv-inspiracion/types/editor.types';
import PaymentModal from '@/components/PaymentModal';

const ESTILO_NOMBRES: Record<string, string> = {
  harvard: 'Harvard',
  stanford: 'Stanford',
  'silicon-valley': 'Silicon Valley',
  tech: 'Tech',
  minimalist: 'Minimalista',
  europass: 'Europeo (Europass)',
  executive: 'Ejecutivo',
};

const fieldInputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid var(--line)', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: 'var(--ink)',
  background: '#fff', outline: 'none', fontFamily: 'inherit',
};

interface AplicacionForm {
  cargo: string; empresa: string; fecha: string; estado: string; nota: string;
}

function EditIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}

function CanvasThumbIcon() {
  return (
    <svg width={52} height={52} viewBox="0 0 52 52" fill="none">
      <rect x="4" y="4" width="44" height="44" rx="8" fill="#C7D2FE" />
      <rect x="10" y="10" width="14" height="32" rx="3" fill="#4B6BFB" opacity={0.7} />
      <rect x="28" y="10" width="14" height="8" rx="2" fill="#4B6BFB" opacity={0.5} />
      <rect x="28" y="22" width="14" height="5" rx="2" fill="#4B6BFB" opacity={0.35} />
      <rect x="28" y="31" width="10" height="5" rx="2" fill="#4B6BFB" opacity={0.25} />
    </svg>
  );
}

export default function MisCVsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [canvasCvs, setCanvasCvs] = useState<CVInspirationRecord[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paidCvIds, setPaidCvIds] = useState<Set<string>>(new Set());
  const [paymentCv, setPaymentCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingCv, setApplyingCv] = useState<CV | null>(null);
  const [deletingCanvasId, setDeletingCanvasId] = useState<string | null>(null);
  const [form, setForm] = useState<AplicacionForm>({ cargo: '', empresa: '', fecha: '', estado: 'pending', nota: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: cvsData }, { data: appsData }, { data: canvasData }, { data: profileData }, { data: pagosData }] = await Promise.all([
        supabase.from('cvs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('aplicaciones').select('*').eq('user_id', user.id),
        supabase.from('cvs_inspiracion').select('id, template_id, created_at, updated_at, canvas_state').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('pagos').select('cv_id').eq('user_id', user.id).eq('estado', 'confirmado').not('cv_id', 'is', null),
      ]);
      const uniqueCvs = Array.from(new Map(((cvsData as CV[]) || []).map(cv => [cv.id, cv])).values());
      setCvs(uniqueCvs);
      setAplicaciones((appsData as Aplicacion[]) || []);
      setCanvasCvs((canvasData as CVInspirationRecord[]) || []);
      if (profileData) setProfile(profileData as Profile);
      if (pagosData) setPaidCvIds(new Set((pagosData as { cv_id: string }[]).map(p => p.cv_id)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleDelete(cvId: string) {
    if (!confirm('¿Eliminar este CV? Esta acción no se puede deshacer.')) return;
    setDeletingId(cvId);
    try {
      await supabase.from('cvs').delete().eq('id', cvId);
      setCvs(prev => prev.filter(c => c.id !== cvId));
    } finally { setDeletingId(null); }
  }

  async function handleDeleteCanvas(id: string) {
    if (!confirm('¿Eliminar este CV canvas? Esta acción no se puede deshacer.')) return;
    setDeletingCanvasId(id);
    try {
      await supabase.from('cvs_inspiracion').delete().eq('id', id);
      setCanvasCvs(prev => prev.filter(c => c.id !== id));
    } finally { setDeletingCanvasId(null); }
  }

  function openApplyForm(cv: CV) {
    const content = cv.contenido_json as Record<string, any>;
    setForm({
      cargo: content?.titulo || '',
      empresa: content?.empresa_vacante || '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pending',
      nota: '',
    });
    setApplyingCv(cv);
  }

  async function handleSubmitApp(e: React.FormEvent) {
    e.preventDefault();
    if (!applyingCv) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('aplicaciones').insert({
        user_id: user.id, cv_id: applyingCv.id,
        empresa: form.empresa || null, cargo: form.cargo || null,
        fecha: form.fecha || null, estado: form.estado, nota: form.nota || null,
      }).select().single();
      if (data) setAplicaciones(prev => [...prev, data as Aplicacion]);
      setApplyingCv(null);
    } finally { setSubmitting(false); }
  }

  const isPro = profile?.plan === 'pro';

  function handleDownloadPDF(cv: CV) {
    if (!isPro && !paidCvIds.has(cv.id)) {
      setPaymentCv(cv);
      return;
    }
    window.open(`/cv/${cv.id}/imprimir`, '_blank');
  }

  function handlePaymentSuccess() {
    if (!paymentCv) return;
    setPaidCvIds(prev => new Set([...prev, paymentCv.id]));
    window.open(`/cv/${paymentCv.id}/imprimir`, '_blank');
    setPaymentCv(null);
  }

  const cvsGenerados = cvs.length + canvasCvs.length;
  const trabajosAplicados = aplicaciones.length;
  const entrevistas = aplicaciones.filter(a => a.estado === 'interviewing' || a.estado === 'hired').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Metrics header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--deep)', letterSpacing: '-0.01em' }}>Tus métricas</h2>
        <div style={{ marginTop: 4, color: 'var(--mute)', fontSize: 13.5 }}>Esto es lo que has logrado desde que utilizas Momentum.</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        <KpiCard label="CVs generados" value={cvsGenerados} tone="blue" icon={<FileIcon />} />
        <KpiCard label="Trabajos aplicados" value={trabajosAplicados} tone="lav" icon={<BriefcaseIcon />} />
        <KpiCard label="Entrevistas conseguidas" value={entrevistas} tone="success" icon={<AwardIcon />} />
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--deep)' }}>Tus CVs</h2>
        <button onClick={() => router.push('/create-cv')} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 10, border: 'none',
          background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 13.5,
          cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.45)',
        }}>
          <PlusIcon size={15} /> Generar nuevo CV
        </button>
      </div>

      {/* Canvas CVs (inspiración) */}
      {canvasCvs.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 32 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--deep)' }}>CVs con plantilla</h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--mute)' }}>Diseños personalizados en el editor canvas</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
            {canvasCvs.map(cv => {
              const fecha = new Date(cv.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
              return (
                <div key={cv.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  boxShadow: 'var(--sh-1)', transition: 'box-shadow .2s var(--ease)',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-1)'}
                >
                  {/* Thumbnail canvas */}
                  <div style={{
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                    padding: 20, borderBottom: '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    aspectRatio: '4/3',
                  }}>
                    <CanvasThumbIcon />
                  </div>

                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--deep)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        CV Personalizado
                      </div>
                      <span style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                        background: 'var(--lav)', color: 'var(--blue)',
                      }}>Canvas</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6 }}>
                      Editado {fecha}
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                      <button
                        onClick={() => router.push(`/create-cv/studio/editor/${cv.id}`)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '7px 10px', borderRadius: 8, border: 'none',
                          background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600,
                          cursor: 'pointer', transition: 'opacity .15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                      >
                        <EditIcon size={13} /> Continuar editando
                      </button>
                      <button
                        onClick={() => handleDeleteCanvas(cv.id)}
                        disabled={deletingCanvasId === cv.id}
                        title="Eliminar"
                        style={{
                          padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)',
                          background: 'var(--surface)', color: 'var(--mute)', fontSize: 12.5,
                          cursor: deletingCanvasId === cv.id ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .2s var(--ease)',
                        }}
                        onMouseEnter={e => {
                          if (deletingCanvasId !== cv.id) {
                            (e.currentTarget as HTMLElement).style.background = 'var(--danger-50)';
                            (e.currentTarget as HTMLElement).style.color = '#B52020';
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--mute)';
                        }}
                      >
                        <TrashIcon size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {cvs.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '60px 24px', textAlign: 'center',
          boxShadow: 'var(--sh-1)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: 'var(--lav)', color: 'var(--blue)',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderIcon size={30} />
          </div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--deep)', fontSize: 17, fontWeight: 600 }}>Aún no tienes CVs</h3>
          <p style={{ color: 'var(--mute)', fontSize: 14, margin: '0 0 20px' }}>Genera tu primer CV y aparecerá aquí.</p>
          <button onClick={() => router.push('/create-cv')} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>Crear mi primer CV</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {cvs.map(cv => {
            const hasApp = aplicaciones.some(a => a.cv_id === cv.id);
            const title = cv.titulo || (cv.contenido_json as any)?.titulo || 'CV sin título';
            const empresa = (cv.contenido_json as any)?.empresa_vacante;
            const estilo = ESTILO_NOMBRES[cv.estilo] || cv.estilo;
            const fecha = new Date(cv.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

            return (
              <div key={cv.id} style={{
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--sh-1)', transition: 'box-shadow .2s var(--ease)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-1)'}
              >
                {/* CV thumbnail */}
                <div style={{ background: 'var(--surface-2)', padding: 12, borderBottom: '1px solid var(--line)' }}>
                  <CvThumbnail cv={cv} />
                </div>

                {/* Card body */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--deep)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                      </div>
                      {cv.intencion === 'job' && empresa && (
                        <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>
                          Para <strong style={{ color: 'var(--deep)' }}>{empresa}</strong>
                        </div>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: cv.intencion === 'job' ? 'var(--lav)' : 'var(--hover)',
                      color: cv.intencion === 'job' ? 'var(--blue)' : 'var(--mute)',
                    }}>{cv.intencion === 'job' ? 'Vacante' : 'General'}</span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6 }}>
                    {estilo} · {fecha}
                  </div>

                  {cv.match_porcentaje && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      marginTop: 6, alignSelf: 'flex-start',
                      fontSize: 12, padding: '2px 9px', borderRadius: 999,
                      background: 'var(--success-50)', color: '#148B3D', fontWeight: 600,
                    }}>
                      {cv.match_porcentaje}% match
                    </span>
                  )}

                  <div style={{ flex: 1 }} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                    <button
                      onClick={() => handleDownloadPDF(cv)}
                      title="Descargar PDF"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)',
                        background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 500,
                        cursor: 'pointer', transition: 'background .15s var(--ease)',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                    >
                      {isPro || paidCvIds.has(cv.id)
                        ? <><DownloadIcon size={13} /> Descargar</>
                        : <><LockIcon size={13} /> Descargar</>}
                    </button>
                    <button
                      onClick={() => {}}
                      title="Enviar por email"
                      style={{
                        padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)',
                        background: 'var(--surface)', color: 'var(--mute)', fontSize: 12.5,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background .15s var(--ease)',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                    >
                      <MailIcon size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cv.id)}
                      disabled={deletingId === cv.id}
                      title="Eliminar CV"
                      style={{
                        padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)',
                        background: 'var(--surface)', color: 'var(--mute)', fontSize: 12.5,
                        cursor: deletingId === cv.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .2s var(--ease)',
                      }}
                      onMouseEnter={e => {
                        if (deletingId !== cv.id) {
                          (e.currentTarget as HTMLElement).style.background = 'var(--danger-50)';
                          (e.currentTarget as HTMLElement).style.color = '#B52020';
                        }
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--mute)';
                      }}
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>

                  {hasApp ? (
                    <div style={{
                      marginTop: 8, padding: '6px 10px', borderRadius: 8,
                      background: 'var(--success-50)', color: '#148B3D',
                      fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
                    }}>
                      <CheckIcon size={12} /> Aplicado
                    </div>
                  ) : (
                    <button onClick={() => openApplyForm(cv)} style={{
                      marginTop: 8, padding: '8px 10px', borderRadius: 8,
                      border: '1px dashed var(--line)', background: 'transparent',
                      color: 'var(--mute)', fontSize: 12.5, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
                      transition: 'all .2s var(--ease)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--blue)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--mute)';
                    }}
                    >
                      <PlusIcon size={13} /> Apliqué con este CV
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment modal */}
      {paymentCv && (
        <PaymentModal
          cvId={paymentCv.id}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentCv(null)}
        />
      )}

      {/* Apply modal */}
      {applyingCv && (
        <Modal title="Registrar aplicación" onClose={() => setApplyingCv(null)}>
          <form onSubmit={handleSubmitApp}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Cargo — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <ModalField label="Puesto / Cargo" placeholder="Ej. Diseñador UX" value={form.cargo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, cargo: e.target.value }))} />
              </div>
              {/* Empresa + Fecha */}
              <ModalField label="Empresa" placeholder="Nombre de la empresa" value={form.empresa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, empresa: e.target.value }))} />
              <ModalField label="Fecha" type="date" value={form.fecha}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, fecha: e.target.value }))} />
              {/* Estado — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Estado</span>
                  <Select
                    value={form.estado}
                    onChange={v => setForm(p => ({ ...p, estado: v }))}
                    options={['En espera', 'Entrevistando', 'Contratado', 'Rechazado', 'Sin respuesta'].map(s => ({ value: s, label: s }))}
                    style={{ width: '100%' }}
                    triggerStyle={fieldInputStyle}
                  />
                </label>
              </div>
              {/* Nota — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>Nota (opcional)</span>
                  <textarea rows={3} value={form.nota} placeholder="Notas adicionales..."
                    onChange={e => setForm(p => ({ ...p, nota: e.target.value }))}
                    style={{ ...fieldInputStyle, resize: 'vertical' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setApplyingCv(null)} style={{
                flex: 1, padding: '11px 18px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'var(--surface)', color: 'var(--ink)', fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>Cancelar</button>
              <button type="submit" disabled={submitting} style={{
                flex: 1, padding: '11px 18px', borderRadius: 10, border: 'none',
                background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? .7 : 1,
              }}>{submitting ? 'Guardando...' : 'Guardar aplicación'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* CV Thumbnail — renders the actual CV at scale */
function CvThumbnail({ cv }: { cv: CV }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.38);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / 794);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = cv.contenido_json as any;
  const thumbStyle = {
    aspectRatio: '794 / 1123' as const, background: '#fff', borderRadius: 6,
    overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)', position: 'relative' as const,
  };
  const innerStyle = {
    width: 794, transformOrigin: 'top left', transform: `scale(${scale})`,
    pointerEvents: 'none' as const, userSelect: 'none' as const,
  };

  return (
    <div ref={containerRef} style={thumbStyle}>
      <div style={innerStyle}>
        <CVRenderer estilo={cv.estilo as 'harvard' | 'stanford' | 'silicon-valley' | 'tech' | 'minimalist' | 'europass' | 'executive'} data={data} />
      </div>
    </div>
  );
}

/* KPI Card */
function KpiCard({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: React.ReactNode }) {
  const colors = ({
    blue: { bg: 'var(--lav)', color: 'var(--blue)' },
    lav: { bg: '#EEF2FF', color: '#4B6BFB' },
    success: { bg: 'var(--success-50)', color: '#148B3D' },
  } as Record<string, { bg: string; color: string }>)[tone] || { bg: 'var(--hover)', color: 'var(--ink)' };

  return (
    <div style={{
      flex: 1, background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: 'var(--sh-1)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.bg, color: colors.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

/* Modal */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 500, width: '100%', margin: '0 16px', boxShadow: 'var(--sh-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--deep)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: 4, display: 'flex', borderRadius: 6 }}>
            <XIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* Modal field */
function ModalField({ label, type, value, placeholder, onChange }: {
  label: string; type?: string; value?: string; placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>{label}</span>
      <input
        type={type || 'text'} value={value} placeholder={placeholder} onChange={onChange}
        style={fieldInputStyle}
      />
    </label>
  );
}

/* Icons */
function FileIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function BriefcaseIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function AwardIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>; }
function FolderIcon({ size = 20 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function PlusIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function DownloadIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function LockIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function MailIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function TrashIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function CheckIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function XIcon({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
