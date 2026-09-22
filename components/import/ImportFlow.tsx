'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { calcularPuntajeCompletitud } from '@/lib/completitud';
import { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma } from '@/types';

/* ── Tipos ────────────────────────────────────────────────────────────── */
export type ImportSource = 'linkedin' | 'cv';
export interface ImportCounts {
  experiencias: number;
  educacion: number;
  habilidades: number;
  idiomas: number;
  logros: number;
  certificaciones: number;
}
export interface ImportResult {
  source: ImportSource;
  completitud: number;
  counts: ImportCounts;
}

const EMPTY_COUNTS: ImportCounts = { experiencias: 0, educacion: 0, habilidades: 0, idiomas: 0, logros: 0, certificaciones: 0 };
const EMPTY_SUMMARY = { counts: EMPTY_COUNTS, completitud: 0 };

/* ── Helpers ──────────────────────────────────────────────────────────── */
export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const CV_ACCEPT = `application/pdf,.pdf,${DOCX_MIME},.docx,text/plain,.txt`;

export function validateCvFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const ok =
    file.type === 'application/pdf' || name.endsWith('.pdf') ||
    file.type === DOCX_MIME         || name.endsWith('.docx') ||
    file.type === 'text/plain'      || name.endsWith('.txt');
  if (!ok) return 'Solo aceptamos PDF o Word (.docx).';
  if (file.size > 10 * 1024 * 1024) return 'El archivo es muy grande. Máximo 10 MB.';
  return null;
}

// Normaliza lo que el usuario escribe/pega en un input de LinkedIn a SOLO el slug.
export function linkedInSlugFromInput(value: string): string {
  const v = value.trim();
  const m = v.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  return m ? m[1].replace(/\/+$/, '') : v.replace(/^\/+|\/+$/g, '');
}

// Extrae el slug de una URL completa guardada en BD (vacío si no coincide).
export function slugFromLinkedInUrl(url?: string | null): string {
  if (!url) return '';
  const m = url.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  return m ? m[1].replace(/\/+$/, '') : '';
}

/* ── Orquestación ─────────────────────────────────────────────────────── */
// Fuente de verdad: cuenta secciones y calcula completitud con la función canónica.
export async function fetchImportSummary(): Promise<{ counts: ImportCounts; completitud: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return EMPTY_SUMMARY;

  const [
    { data: profile },
    { data: exp },
    { data: edu },
    { data: hab },
    { data: idi },
    { data: log },
    { count: certCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('experiencia').select('*').eq('user_id', user.id),
    supabase.from('educacion').select('*').eq('user_id', user.id),
    supabase.from('habilidades').select('*').eq('user_id', user.id),
    supabase.from('idiomas').select('*').eq('user_id', user.id),
    supabase.from('logros').select('*').eq('user_id', user.id),
    supabase.from('certificaciones').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const counts: ImportCounts = {
    experiencias:    exp?.length ?? 0,
    educacion:       edu?.length ?? 0,
    habilidades:     hab?.length ?? 0,
    idiomas:         idi?.length ?? 0,
    logros:          log?.length ?? 0,
    certificaciones: certCount ?? 0,
  };

  const completitud = profile
    ? calcularPuntajeCompletitud(
        profile as Profile,
        (exp ?? []) as Experiencia[],
        (edu ?? []) as Educacion[],
        (hab ?? []) as Habilidad[],
        (log ?? []) as Logro[],
        (idi ?? []) as Idioma[],
      )
    : 0;

  return { counts, completitud };
}

export async function runLinkedInImport(slug: string): Promise<{ ok: boolean; patch: Record<string, string>; summary: { counts: ImportCounts; completitud: number } }> {
  if (!slug) return { ok: false, patch: {}, summary: EMPTY_SUMMARY };
  try {
    const res = await fetch('/api/profile/hydrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: `linkedin.com/in/${slug}` }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, patch: {}, summary: EMPTY_SUMMARY };
    const summary = await fetchImportSummary();
    return { ok: true, patch: data.patch || {}, summary };
  } catch {
    return { ok: false, patch: {}, summary: EMPTY_SUMMARY };
  }
}

export async function runCVImport(file: File): Promise<{ ok: boolean; summary: { counts: ImportCounts; completitud: number } }> {
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/parse-document', { method: 'POST', body: fd });
    if (!res.ok) return { ok: false, summary: EMPTY_SUMMARY };
    const summary = await fetchImportSummary();
    return { ok: true, summary };
  } catch {
    return { ok: false, summary: EMPTY_SUMMARY };
  }
}

/* ── Pantalla de procesamiento (overlay con blur) ─────────────────────── */
const LINKEDIN_STEPS = [
  'Conectando con LinkedIn',
  'Leyendo tu perfil',
  'Analizando tu experiencia laboral',
  'Revisando tu formación académica',
  'Extrayendo tus habilidades',
  'Dando los últimos toques',
];
const CV_STEPS = [
  'Subiendo tu documento',
  'Leyendo tu CV',
  'Analizando tu experiencia',
  'Revisando tu formación académica',
  'Organizando tus datos',
  'Dando los últimos toques',
];

export function ProcessingView({
  source,
  error,
  onRetry,
  onManual,
}: {
  source: ImportSource | null;
  error: boolean;
  onRetry: () => void;
  onManual: () => void;
}) {
  const steps = source === 'cv' ? CV_STEPS : LINKEDIN_STEPS;
  const [current, setCurrent] = useState(0);
  const [slow, setSlow]       = useState(false);

  // Carrusel estimado; el padre remonta con key en cada intento (estado fresco).
  useEffect(() => {
    if (error) return;
    const stepTimer = setInterval(() => {
      setCurrent(c => (c < steps.length - 1 ? c + 1 : c));
    }, 2600);
    const slowTimer = setTimeout(() => setSlow(true), 35000);
    return () => { clearInterval(stepTimer); clearTimeout(slowTimer); };
  }, [error, steps.length]);

  const errorMsg = source === 'cv'
    ? 'No pudimos leer tu CV. Intenta con otro archivo o continúa manualmente.'
    : 'No pudimos importar tu perfil de LinkedIn. Verifica que la URL sea correcta y que tu perfil sea público, o continúa manualmente.';

  const inner = error ? (
    <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '40px 44px', boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 8px 24px rgba(15,23,42,.1)', textAlign: 'center', animation: 'fadeUp .4s var(--ease) both' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 21, fontWeight: 700, color: 'var(--deep)' }}>Lo sentimos</h2>
      <p style={{ margin: '0 0 24px', color: 'var(--mute)', fontSize: 14.5, lineHeight: 1.6 }}>{errorMsg}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={onRetry} style={{ padding: '11px 22px', borderRadius: 12, background: 'var(--blue)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>Reintentar</button>
        <button onClick={onManual} style={{ padding: '11px 22px', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>Continuar manualmente</button>
      </div>
    </div>
  ) : (
    <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '40px 40px', boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 8px 24px rgba(15,23,42,.1)', animation: 'fadeUp .4s var(--ease) both' }}>
      <style>{`@keyframes pulse-ring { 0% { transform: scale(.85); opacity: .7; } 70% { transform: scale(1.15); opacity: 0; } 100% { opacity: 0; } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 26 }}>
        <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 16 }}>
          <span style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid var(--blue)', animation: 'pulse-ring 1.6s ease-out infinite' }} />
          <img src="/momentum-assistant.svg" alt="" style={{ width: 56, height: 56, borderRadius: 14, display: 'block', boxShadow: '0 8px 18px -6px rgba(75,107,251,.5)' }} />
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.01em' }}>
          {source === 'cv' ? 'Analizando tu CV' : 'Importando tu perfil'}
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>
          Esto puede tardar hasta un minuto. No cierres esta ventana.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', opacity: done || active ? 1 : .45, transition: 'opacity .3s var(--ease)' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--success-50)' : 'transparent',
                color: done ? '#148B3D' : 'var(--blue)',
                border: active || done ? 'none' : '1.5px solid var(--line)',
              }}>
                {done
                  ? <CheckIcon size={12} />
                  : active
                  ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                  : <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--mute)' }} />}
              </span>
              <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: done ? 'var(--ink)' : active ? 'var(--deep)' : 'var(--mute)' }}>
                {label}{active ? '…' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {slow && (
        <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--lav)', borderRadius: 10, fontSize: 12.5, color: 'var(--deep)', textAlign: 'center' }}>
          Está tardando un poco más de lo normal, pero seguimos en ello.
        </div>
      )}
    </div>
  );

  return <Overlay maxWidth={460}>{inner}</Overlay>;
}

/* ── Pantalla de confirmación (overlay con blur) ──────────────────────── */
export function ConfirmationView({
  result,
  detectedName,
  onContinue,
}: {
  result: ImportResult;
  detectedName?: string;
  onContinue: () => void;
}) {
  const { counts, completitud } = result;
  const items = [
    { n: counts.experiencias,    one: 'experiencia laboral', many: 'experiencias laborales' },
    { n: counts.educacion,       one: 'título académico',    many: 'títulos académicos' },
    { n: counts.habilidades,     one: 'habilidad',           many: 'habilidades' },
    { n: counts.idiomas,         one: 'idioma',              many: 'idiomas' },
    { n: counts.certificaciones, one: 'certificación',       many: 'certificaciones' },
    { n: counts.logros,          one: 'logro',               many: 'logros' },
  ].filter(i => i.n > 0);

  const variant = completitud >= 70
    ? { title: '¡Listo! Tu perfil quedó muy completo', message: <>Revisa que todo esté correcto y continúa<br />para crear tu CV.</>, cta: 'Verificar mis datos' }
    : completitud >= 30
    ? { title: 'Importamos tu perfil', message: 'Tenemos una buena base. Revisa tus datos y completa lo que falte en el siguiente paso.', cta: 'Continuar' }
    : { title: 'Importamos algunos datos', message: 'Pudimos extraer algo de información, pero aún falta bastante. Lo completas en el siguiente paso.', cta: 'Completar mi perfil' };

  const barColor = completitud >= 70 ? 'var(--success)' : completitud >= 30 ? 'var(--blue)' : 'var(--warn)';

  return (
    <Overlay maxWidth={460}>
      <div style={{
        background: 'var(--surface)', borderRadius: 22, padding: '30px 32px',
        boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 8px 24px rgba(15,23,42,.1)',
        animation: 'fadeUp .4s var(--ease) both',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 14px', borderRadius: '50%', background: 'var(--success-50)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 5px rgba(34,197,94,.08)' }}>
            <CheckIcon size={30} />
          </div>
          <h2 style={{ margin: '0 0 7px', fontSize: 21, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>{variant.title}</h2>
          <p style={{ margin: '0 auto', maxWidth: 360, color: 'var(--mute)', fontSize: 14, lineHeight: 1.5 }}>{variant.message}</p>
          {detectedName && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', marginTop: 12, background: 'var(--surface-2)', borderRadius: 20, fontSize: 12.5, color: 'var(--mute)' }}>
              Detectamos el perfil de <strong style={{ color: 'var(--deep)', fontWeight: 600 }}>{detectedName}</strong>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--line-soft)', margin: '0 0 18px' }} />

        {items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--success-50)', color: '#148B3D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={12} />
                </span>
                <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>
                  <strong style={{ color: 'var(--deep)', fontWeight: 700 }}>{it.n}</strong> {it.n === 1 ? it.one : it.many}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--mute)', textAlign: 'center' }}>
            No extrajimos secciones detalladas, pero podrás añadirlas fácilmente.
          </p>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500 }}>Completitud del perfil</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--deep)' }}>{completitud}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completitud}%`, background: barColor, borderRadius: 999, transition: 'width 1s var(--ease)' }} />
          </div>
        </div>

        <button onClick={onContinue} style={{ width: '100%', height: 50, borderRadius: 12, background: 'var(--blue)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.4)' }}>
          {variant.cta} <ChevRIcon size={16} />
        </button>
      </div>
    </Overlay>
  );
}

/* ── Modal: Importar datos (LinkedIn / CV) ────────────────────────────── */
export function ImportDataModal({
  dirty,
  onClose,
  onImportLinkedIn,
  onImportCV,
}: {
  dirty: boolean;
  onClose: () => void;
  onImportLinkedIn: (slug: string) => void;
  onImportCV: (file: File) => void;
}) {
  const [modalView, setModalView] = useState<'options' | 'confirm'>('options');
  const [pending, setPending]     = useState<(() => void) | null>(null);
  const [liUrl, setLiUrl]         = useState('');
  const [cvError, setCvError]     = useState('');
  const cvRef = useRef<HTMLInputElement>(null);

  const liSlug = linkedInSlugFromInput(liUrl);

  function trigger(action: () => void) {
    if (dirty) { setPending(() => action); setModalView('confirm'); }
    else action();
  }
  function doLinkedIn() {
    if (!liSlug) return;
    trigger(() => { onClose(); onImportLinkedIn(liSlug); });
  }
  function onCVSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    const err = validateCvFile(file);
    if (err) { setCvError(err); return; }
    setCvError('');
    trigger(() => { onClose(); onImportCV(file); });
  }

  return typeof document !== 'undefined' ? createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: 'var(--surface)', borderRadius: 18, boxShadow: '0 20px 60px -15px rgba(15,23,42,.35)', overflow: 'hidden', animation: 'fadeUp .2s var(--ease) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--deep)' }}>
            {modalView === 'confirm' ? 'Reemplazar tus datos' : 'Importar tus datos'}
          </h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ border: 'none', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {modalView === 'confirm' ? (
          <div style={{ padding: 24 }}>
            <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>
              Tienes datos sin guardar. Si importas, podríamos reemplazar algunos de los campos que escribiste. ¿Quieres continuar?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalView('options')} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { const a = pending; setPending(null); a?.(); }} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Continuar</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: '#0A66C2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><LinkedInIcon size={17} /></span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--deep)' }}>Desde LinkedIn</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '0 12px', height: 44 }}>
                  <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--mute)', whiteSpace: 'nowrap', userSelect: 'none' }}>linkedin.com/in/</span>
                  <input value={liUrl} onChange={e => setLiUrl(linkedInSlugFromInput(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') doLinkedIn(); }} placeholder="tu-nombre" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, lineHeight: '20px', color: 'var(--ink)', padding: 0, minWidth: 0 }} />
                </div>
                <button onClick={doLinkedIn} disabled={!liSlug} style={{ flexShrink: 0, padding: '0 16px', borderRadius: 10, border: 'none', background: liSlug ? 'var(--blue)' : 'var(--line)', color: liSlug ? '#fff' : 'var(--mute)', fontWeight: 600, fontSize: 13.5, cursor: liSlug ? 'pointer' : 'not-allowed', height: 44 }}>Importar</button>
              </div>
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--lav)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DocIcon size={17} /></span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--deep)' }}>Desde un CV (PDF o Word)</div>
              </div>
              {cvError && <div style={{ fontSize: 12.5, color: 'var(--danger)', marginBottom: 10 }}>{cvError}</div>}
              <input ref={cvRef} type="file" accept={CV_ACCEPT} onChange={onCVSelected} style={{ display: 'none' }} />
              <button onClick={() => cvRef.current?.click()} style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><UploadIcon size={14} /> Subir archivo</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  ) : null;
}

/* ── Overlay contenedor (blur + tarjeta centrada) ─────────────────────── */
function Overlay({ children, maxWidth }: { children: React.ReactNode; maxWidth: number }) {
  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', padding: 24, overflowY: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', zIndex: 1, margin: 'auto', width: '100%', maxWidth }}>
        {children}
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

/* ── Iconos ───────────────────────────────────────────────────────────── */
function LinkedInIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
}
function DocIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>;
}
function UploadIcon({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>;
}
function CheckIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 6"/></svg>;
}
function ChevRIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;
}
