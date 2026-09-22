'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CVRenderer, { styleAccentColors } from '@/components/CVTemplates';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';

interface CVParams {
  mode: 'general' | 'job';
  estilo?: string;
  descripcion_vacante?: string;
}

interface MatchData {
  match_porcentaje: number;
  explicacion?: string;
}

const STYLE_NAMES: Record<string, string> = {
  'harvard':        'Harvard',
  'stanford':       'Stanford',
  'silicon-valley': 'Silicon Valley',
  'tech':           'Tech',
  'minimalist':     'Minimalista',
  'europass':       'Europeo',
  'executive':      'Ejecutivo',
};

function getMatchMeta(pct: number) {
  if (pct >= 80) return { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', accent: '#22C55E', label: 'Excelente compatibilidad' };
  if (pct >= 55) return { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', accent: '#F59E0B', label: 'Buena compatibilidad, mejorable' };
  return { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', accent: '#EF4444', label: 'Compatibilidad baja' };
}

function setNestedValue(obj: any, path: string, value: string): any {
  const next = JSON.parse(JSON.stringify(obj));
  const parts = path.split('.');
  let cur: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur[parts[i]];
    if (cur === undefined || cur === null) return obj;
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

export default function PreviewPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useProfile();
  const { registerGuard, unregisterGuard, setGuardMode } = useNavigationGuard();

  const initDone = useRef(false);
  const [params, setParams] = useState<CVParams | null>(null);
  const [cvData, setCvData] = useState<any>(null);
  const [cvId, setCvId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [correctionApplied, setCorrectionApplied] = useState(false);
  const [creatingCV, setCreatingCV] = useState(false);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [showHexInput, setShowHexInput] = useState(false);
  const [customHex, setCustomHex] = useState('');

  async function loadExistingCV(id: string, p: CVParams) {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('cvs').select('*').eq('id', id).single();
      if (error || !data) {
        sessionStorage.removeItem('cv_preview_id');
        generateCV(p);
        return;
      }
      setCvData(data.contenido_json);
      setCvId(id);
      if (p.mode === 'job' && data.match_porcentaje) {
        setMatchData({ match_porcentaje: data.match_porcentaje });
      } else if (p.mode === 'job' && data.contenido_json && p.descripcion_vacante) {
        fetchMatch(data.contenido_json, p.descripcion_vacante);
      }
    } catch {
      sessionStorage.removeItem('cv_preview_id');
      generateCV(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    registerGuard();
    return () => { unregisterGuard(); };
  }, []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const stored = sessionStorage.getItem('cv_params');
    if (!stored) { router.replace('/create-cv'); return; }
    const p = JSON.parse(stored) as CVParams;
    setParams(p);

    const previewId = sessionStorage.getItem('cv_preview_id');
    if (previewId) {
      loadExistingCV(previewId, p);
    } else {
      generateCV(p);
    }
  }, []);

  async function generateCV(p: CVParams) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: p.mode, estilo: p.estilo, descripcion_vacante: p.descripcion_vacante }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar CV');
      setCvData(data.content);
      setCvId(data.cv.id);
      sessionStorage.setItem('cv_preview_id', data.cv.id);
      if (p.mode === 'job' && data.content) fetchMatch(data.content, p.descripcion_vacante!);
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el CV. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMatch(cv: any, vacante: string) {
    try {
      const res = await fetch('/api/match-vacante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv, vacante }),
      });
      const data = await res.json();
      if (res.ok && data.match) setMatchData(data.match);
    } catch { /* non-critical */ }
  }

  async function handleSaveAndReview() {
    if (!cvData) return;
    setSaving(true);
    setCorrectionApplied(false);
    try {
      const res = await fetch('/api/review-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.stringify(cvData) }),
      });
      const data = await res.json();
      let finalContent = cvData;
      if (res.ok && data.corrected) {
        try {
          const corrected = JSON.parse(data.corrected);
          finalContent = corrected;
          setCvData(corrected);
          if (data.corrections_made) setCorrectionApplied(true);
        } catch { /* keep original */ }
      }
      // Persist corrected content to Supabase
      if (cvId) {
        try {
          await supabase.from('cvs').update({ contenido_json: finalContent }).eq('id', cvId);
        } catch { /* non-critical */ }
      }
      setGuardMode('saved');
    } catch { /* best-effort */ } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function applyCustomHex(raw: string) {
    const clean = raw.trim().replace(/^#/, '');
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
      setAccentColor(`#${clean.toUpperCase()}`);
      setShowHexInput(false);
      setCustomHex('');
    }
  }

  function updateCvField(path: string, value: string) {
    setCvData((prev: any) => prev ? setNestedValue(prev, path, value) : prev);
  }

  async function handleCreateCV() {
    if (!cvId) return;
    setCreatingCV(true);

    unregisterGuard();
    try {
      if (accentColor) {
        setCvData((prev: any) => ({
          ...prev,
          visual_config: { ...(prev?.visual_config || {}), accent_color: accentColor },
        }));
      }
      sessionStorage.setItem('cv_created_id', cvId);
      sessionStorage.removeItem('cv_params');
      sessionStorage.removeItem('cv_preview_id');
      router.push('/create-cv/success');
    } catch { setCreatingCV(false); }
  }

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--lav)' }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--blue)', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--deep)' }}>Generando tu CV con IA</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--mute)' }}>Esto puede tardar unos segundos...</p>
        </div>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: '0 24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--deep)' }}>No se pudo generar el CV</p>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.55 }}>{error}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => params && generateCV(params)}
            style={{ padding: '9px 22px', borderRadius: 10, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Reintentar
          </button>
          <button onClick={() => router.back()}
            style={{ padding: '9px 22px', borderRadius: 10, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14 }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  /* ── Main ─────────────────────────────────────────────────────────── */
  const matchMeta = matchData ? getMatchMeta(matchData.match_porcentaje) : null;
  const palette = styleAccentColors[params?.estilo ?? ''] ?? styleAccentColors['harvard'];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'fadeUp .25s var(--ease) both', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.015em' }}>
          Vista previa de tu CV
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--mute)' }}>
          Revisa el resultado. Si algo no te convence, puedes editarlo antes de crear el CV definitivo.
        </p>
      </div>

      {/* 2-col layout */}
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0, alignItems: 'stretch' }}>

        {/* ── Left: CV ──────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: '#fff', border: '1px solid var(--line)',
            borderRadius: 16, boxShadow: 'var(--sh-2)', overflow: 'hidden',
            flex: 1, display: 'flex', flexDirection: 'column',
          }}>
            {editing && (
              <div style={{
                background: '#EEF2FF', borderBottom: '1px solid #C7D2FE',
                padding: '8px 20px', fontSize: 13, fontWeight: 500,
                color: '#185FA5', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}>
                ✏ Modo edición — haz clic sobre cualquier texto para modificarlo
              </div>
            )}
            {cvData && (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <CVRenderer
                  estilo={(params?.estilo as any) || 'harvard'}
                  data={cvData}
                  isEditMode={editing}
                  onFieldChange={updateCvField}
                  accentColor={accentColor ?? undefined}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right: sidebar ────────────────────────────────────── */}
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>

          {/* Meta card */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--sh-2)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--lav)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estilo de CV</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--deep)', marginTop: 1 }}>
                {STYLE_NAMES[params?.estilo ?? ''] ?? params?.estilo}
              </div>
            </div>
            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
              background: params?.mode === 'job' ? '#EFF6FF' : 'var(--hover)',
              color: params?.mode === 'job' ? 'var(--blue)' : 'var(--mute)',
              border: `1px solid ${params?.mode === 'job' ? '#BFDBFE' : 'var(--line)'}`,
              flexShrink: 0,
            }}>
              {params?.mode === 'job' ? 'Vacante' : 'General'}
            </span>
          </div>

          {/* Color picker */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--sh-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="var(--mute)"/><circle cx="17.5" cy="10.5" r=".5" fill="var(--mute)"/><circle cx="8.5" cy="7.5" r=".5" fill="var(--mute)"/><circle cx="6.5" cy="12.5" r=".5" fill="var(--mute)"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Personalizar colores</span>
              {accentColor && (
                <button
                  onClick={() => { setAccentColor(null); setShowHexInput(false); setCustomHex(''); }}
                  style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mute)', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 5px', borderRadius: 4, transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--mute)')}
                >
                  Limpiar
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              {palette.map((color) => (
                <button
                  key={color}
                  onClick={() => { setAccentColor(accentColor === color ? null : color); setShowHexInput(false); }}
                  title={color}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', backgroundColor: color,
                    border: 'none', cursor: 'pointer',
                    boxShadow: accentColor === color ? `0 0 0 2px #fff, 0 0 0 3.5px ${color}` : '0 1px 3px rgba(0,0,0,0.2)',
                    transform: accentColor === color ? 'scale(1.16)' : 'scale(1)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  {accentColor === color && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
              <button
                onClick={() => { if (!showHexInput) setAccentColor(null); setShowHexInput(v => !v); }}
                title="Color personalizado"
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: showHexInput ? 'var(--lav)' : 'var(--surface)',
                  border: `1.5px dashed ${showHexInput ? 'var(--blue)' : 'var(--line)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all .15s ease', padding: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={showHexInput ? 'var(--blue)' : 'var(--mute)'} strokeWidth="1.8" strokeLinecap="round">
                  <line x1="5" y1="1.5" x2="5" y2="8.5"/><line x1="1.5" y1="5" x2="8.5" y2="5"/>
                </svg>
              </button>
            </div>
            {showHexInput && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: '1px solid var(--line)', transition: 'background-color .15s',
                  backgroundColor: /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(customHex.replace(/^#/, '').trim())
                    ? `#${customHex.replace(/^#/, '').trim()}` : '#E2E8F0',
                }} />
                <input
                  type="text" placeholder="#000000" value={customHex} maxLength={7} autoFocus
                  onChange={e => setCustomHex(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') applyCustomHex(customHex);
                    if (e.key === 'Escape') { setShowHexInput(false); setCustomHex(''); }
                  }}
                  style={{ flex: 1, padding: '5px 8px', borderRadius: 7, border: '1px solid var(--line)', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                />
                <button onClick={() => applyCustomHex(customHex)} style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>OK</button>
              </div>
            )}
            {!showHexInput && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--mute)', lineHeight: 1.4 }}>
                Paleta recomendada para este estilo
              </div>
            )}
          </div>

          {/* Match card (vacante only) */}
          {params?.mode === 'job' && matchData && matchMeta && (
            <div style={{ background: matchMeta.bg, border: `1px solid ${matchMeta.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: matchMeta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Compatibilidad con la vacante
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: matchMeta.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{matchData.match_porcentaje}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: matchMeta.color, paddingBottom: 4 }}>%</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,.08)', borderRadius: 999, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${matchData.match_porcentaje}%`, background: matchMeta.accent, borderRadius: 999, transition: 'width .6s var(--ease)' }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: matchMeta.color }}>{matchMeta.label}</div>
              {matchData.explicacion && (
                <div style={{ fontSize: 12.5, color: matchMeta.color, opacity: 0.8, marginTop: 6, lineHeight: 1.5 }}>{matchData.explicacion}</div>
              )}
            </div>
          )}

          {/* Correction notice */}
          {correctionApplied && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 13, color: '#1D4ED8', lineHeight: 1.5 }}>Se corrigieron errores menores de ortografía y gramática.</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: 'var(--sh-2)' }}>
            {editing ? (
              <>
                <button
                  onClick={handleSaveAndReview}
                  disabled={saving}
                  style={{ width: '100%', padding: '10px 16px', borderRadius: 10, background: 'var(--blue)', color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1, transition: 'opacity .15s' }}
                >
                  {saving && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .8s linear infinite' }} />}
                  {saving ? 'Revisando...' : 'Guardar y revisar'}
                </button>
                <button
                  onClick={() => { setEditing(false); setGuardMode('saved'); }}
                  disabled={saving}
                  style={{ width: '100%', padding: '9px 16px', borderRadius: 10, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, transition: 'background .15s var(--ease)', opacity: saving ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--hover)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Cancelar edición
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCreateCV}
                  disabled={creatingCV}
                  style={{ width: '100%', padding: '10px 16px', borderRadius: 10, background: 'var(--blue)', color: '#fff', border: 'none', cursor: creatingCV ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: creatingCV ? 0.7 : 1, transition: 'opacity .15s' }}
                >
                  {creatingCV ? (
                    <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {creatingCV ? 'Guardando...' : 'Crear CV'}
                </button>

                <button
                  onClick={() => { setEditing(true); setGuardMode('unsaved'); }}
                  style={{ width: '100%', padding: '9px 16px', borderRadius: 10, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'background .15s var(--ease)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Editar
                </button>

                <button
                  onClick={() => setShowBackModal(true)}
                  style={{ width: '100%', padding: '7px 16px', borderRadius: 10, background: 'transparent', color: 'var(--mute)', border: 'none', cursor: 'pointer', fontSize: 13, transition: 'color .15s var(--ease)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--mute)')}
                >
                  Atrás
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Back modal */}
      {showBackModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '28px 28px 24px', maxWidth: 400, width: 'calc(100% - 32px)', boxShadow: '0 24px 64px rgba(15,23,42,.2)', animation: 'fadeUp .18s var(--ease)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--deep)' }}>
              ¿Salir de la vista previa?
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.6 }}>
              Tu CV está guardado. Lo encontrarás en Mis CVs cuando quieras retomarlo o descargarlo.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  unregisterGuard();
                  setShowBackModal(false);
                  sessionStorage.removeItem('cv_params');
                  sessionStorage.removeItem('cv_preview_id');
                  router.push('/create-cv');
                }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Sí, volver
              </button>
              <button
                onClick={() => setShowBackModal(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
