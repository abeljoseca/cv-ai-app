'use client';

// Europass side panel (step 5b; spec §7, changes 23–27). Order: density · photo size
// (only with a photo) · sections — "Recomendadas en Europass" first, then the rest.
// Inputs live here, under their switch (change 23); per-item fields have one switch per
// section and a field per item (change 24). Every change is one server operation.

import { useEffect, useRef, useState } from 'react';
import { Select } from '@/components/Select';
import { EUROPASS_DENSITIES, EUROPASS_PHOTO_SIZES, EUROPASS_SECTIONS, type EuropassDensity, type EuropassPhotoSize } from '@/lib/cv/styles/europass/contract';
import { DIGCOMP_AREA_LABELS, DIGCOMP_LEVELS, DRIVING_LICENCE_CATEGORIES, ISCED_LABELS } from '@/lib/cv/styles/europass/format';
import { DIGCOMP_AREAS, type EuropassContent } from '@/lib/cv/styles/europass/schema';
import type { EuropassSlot } from '@/lib/cv/styles/europass/edit-ops';
import type { VisualConfig } from '@/lib/cv/visual-config';
import type { EuropassOpResult } from './useEuropassEditor';

type Send = (op: Record<string, unknown>) => Promise<EuropassOpResult>;

interface Props {
  content: EuropassContent;
  visual: VisualConfig;
  send: Send;
  identidadDisponible: boolean;
  onUploadPhoto: (file: File) => Promise<boolean>;
}

const DENSITY_LABELS: Record<EuropassDensity, string> = { compacto: 'Compacto', estandar: 'Estándar', amplio: 'Amplio' };
const PHOTO_LABELS: Record<EuropassPhotoSize, string> = { pequena: 'Pequeña', mediana: 'Mediana', grande: 'Grande' };

const field = (section: string, key: string) =>
  EUROPASS_SECTIONS.find(s => s.key === section)?.fields?.find(f => f.key === key)?.label ?? key;
const sectionLabel = (key: string) => EUROPASS_SECTIONS.find(s => s.key === key)?.label ?? key;

/* ── Small UI pieces ─────────────────────────────────────────────────── */

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      onClick={() => onChange(!on)}
      style={{
        width: 34, height: 20, borderRadius: 999, border: 'none', padding: 2, flexShrink: 0,
        background: on ? 'var(--blue)' : 'var(--line)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'background .15s', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
      }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
    </button>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 8, padding: 3 }}>
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer',
            background: value === v ? '#fff' : 'transparent', color: value === v ? 'var(--deep)' : 'var(--mute)',
            fontWeight: value === v ? 600 : 500, boxShadow: value === v ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
          }}>{label}</button>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid var(--line)', fontSize: 12.5,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

// Text input that saves on blur (only when the value changed) and shows the server error.
function SavedInput({ value, placeholder, save, type = 'text', multiline, ariaLabel }: {
  value: string; placeholder?: string; save: (v: string) => Promise<EuropassOpResult>; type?: string; multiline?: boolean; ariaLabel: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const last = useRef(value);
  // A new value from the server replaces the draft (React's "adjust state on prop change").
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) { setPrevValue(value); setDraft(value); }
  useEffect(() => { last.current = value; }, [value]);
  async function commit() {
    if (draft === last.current) return;
    const r = await save(draft);
    if (r.ok) { last.current = draft; setError(null); } else setError(r.error ?? 'No se pudo guardar.');
  }
  const common = {
    value: draft, placeholder, 'aria-label': ariaLabel,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
  };
  return (
    <div>
      {multiline
        ? <textarea {...common} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} />
        : <input {...common} type={type} style={inputStyle} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />}
      {error && <p role="alert" style={{ margin: '4px 0 0', fontSize: 11.5, color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

function ItemLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, color: 'var(--mute)', margin: '6px 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.4 }}>{children}</p>;
}

/* ── Slot state ──────────────────────────────────────────────────────── */

function isOn(c: EuropassContent, slot: EuropassSlot): boolean {
  const ip = c.informacion_personal;
  switch (slot) {
    case 'foto': return ip.foto.activo && !!ip.foto.url;
    case 'fecha_nacimiento': case 'nacionalidad': case 'direccion': return ip[slot].activo;
    case 'linkedin': case 'orcid': case 'researchgate': return ip.perfiles.some(p => p.tipo === slot && p.activo);
    case 'experiencia.lugar': return c.experiencia_laboral.some(e => e.lugar.activo);
    case 'experiencia.sector_nace': return c.experiencia_laboral.some(e => e.sector_nace.activo);
    case 'educacion.nivel_isced': return c.educacion_formacion.some(e => e.nivel_isced.activo);
    case 'educacion.lugar': return c.educacion_formacion.some(e => e.lugar.activo);
    case 'educacion.materias': return c.educacion_formacion.some(e => e.materias.activo);
    case 'idiomas.certificacion': return c.competencias_linguisticas.otras_lenguas.some(l => l.certificacion.activo);
    case 'digcomp': return c.competencias_digitales.digcomp.activo;
    case 'permiso_conducir': return c.permiso_conducir.activo;
    case 'informacion_adicional': return c.informacion_adicional.activo;
    case 'anexos': return c.anexos.activo;
    default: return c.informacion_adicional[slot.slice('adicional.'.length) as 'publicaciones'].activo;
  }
}

/* ── Panel ───────────────────────────────────────────────────────────── */

export default function EuropassPanel({ content, visual, send, identidadDisponible, onUploadPhoto }: Props) {
  // Slots the user switched on that have no data yet: the input is shown here and the
  // slot appears in the CV once a value is saved (an empty section is never "on").
  const [open, setOpen] = useState<Set<EuropassSlot>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const c = content;
  const ip = c.informacion_personal;
  const jobs = c.experiencia_laboral;
  const studies = c.educacion_formacion.filter(e => e.origen === 'educacion');
  const langs = c.competencias_linguisticas.otras_lenguas.filter(l => l._id);
  const shown = (slot: EuropassSlot) => isOn(c, slot) || open.has(slot);

  async function toggle(slot: EuropassSlot, on: boolean) {
    setOpen(prev => { const n = new Set(prev); if (on) n.add(slot); else n.delete(slot); return n; });
    await send({ op: 'activar', slot, activo: on });
  }

  async function uploadPhoto(file: File) {
    setUploading(true); setPhotoError(null);
    try {
      const ok = await onUploadPhoto(file);
      if (!ok) { setPhotoError('No se pudo subir la foto. Inténtalo de nuevo.'); return; }
      const r = await send({ op: 'activar', slot: 'foto', activo: true });
      if (!r.ok) setPhotoError(r.error ?? 'No se pudo activar la foto.');
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  // State for a section row (SlotRow is a top-level component so inputs keep focus and
  // drafts when the panel re-renders).
  const rp = (slot: EuropassSlot) => ({ slot, on: shown(slot), filled: isOn(c, slot), onToggle: (v: boolean) => toggle(slot, v) });

  const identityNote = !identidadDisponible && <Hint>Tus datos personales no están disponibles en este momento.</Hint>;
  const identity = (slot: 'fecha_nacimiento' | 'nacionalidad' | 'direccion', label: string, recommended?: boolean) => (
    <SlotRow {...rp(slot)} label={label} disabled={!identidadDisponible} recommended={recommended}>
      {identityNote}
      <SavedInput ariaLabel={label}
        type={slot === 'fecha_nacimiento' ? 'date' : 'text'}
        // The CV shows DD/MM/AAAA; the date input needs AAAA-MM-DD.
        value={slot === 'fecha_nacimiento' ? (ip.fecha_nacimiento.valor ?? '').split('/').reverse().join('-') : (ip[slot].valor ?? '')}
        placeholder={slot === 'nacionalidad' ? 'Ej.: Venezolana' : slot === 'direccion' ? 'Calle, número, código postal, ciudad' : undefined}
        save={v => send({ op: 'identidad', campo: slot, valor: v })} />
    </SlotRow>
  );

  const perfil = (tipo: 'linkedin' | 'orcid' | 'researchgate', label: string, placeholder: string) => (
    <SlotRow {...rp(tipo)} label={label}>
      <SavedInput ariaLabel={label} value={ip.perfiles.find(p => p.tipo === tipo)?.url ?? ''} placeholder={placeholder}
        save={v => send({ op: 'perfil_url', tipo, valor: v })} />
    </SlotRow>
  );

  const list = (campo: 'publicaciones' | 'ponencias' | 'voluntariado' | 'premios_becas' | 'afiliaciones' | 'anexos', items: string[], label: string) => (
    <SavedInput ariaLabel={label} multiline value={items.join('\n')} placeholder="Uno por línea"
      save={v => send({ op: 'lista', campo, valor: v.split('\n') })} />
  );

  const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--sh-2)' };
  const title: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const group: React.CSSProperties = { ...title, margin: '14px 0 2px', color: 'var(--deep)' };

  return (
    <>
      {/* Diseño */}
      <div style={card}>
        <div style={{ ...title, marginBottom: 10 }}>Densidad</div>
        <Segmented value={visual.densidad ?? 'estandar'} onChange={v => send({ op: 'visual', densidad: v })}
          options={(Object.keys(EUROPASS_DENSITIES) as EuropassDensity[]).map(k => [k, DENSITY_LABELS[k]])} />
        {isOn(c, 'foto') && (
          <>
            <div style={{ ...title, margin: '14px 0 10px' }}>Tamaño de foto</div>
            <Segmented value={visual.foto_tam ?? 'mediana'} onChange={v => send({ op: 'visual', foto_tam: v })}
              options={(Object.keys(EUROPASS_PHOTO_SIZES) as EuropassPhotoSize[]).map(k => [k, PHOTO_LABELS[k]])} />
          </>
        )}
      </div>

      {/* Secciones */}
      <div style={card}>
        <div style={title}>Secciones</div>

        <div style={group}>Recomendadas en Europass</div>
        {identity('nacionalidad', field('informacion_personal', 'nacionalidad'), true)}
        {studies.length > 0 && (
          <SlotRow {...rp('educacion.nivel_isced')} label={field('educacion_formacion', 'nivel_isced')} recommended>
            <Hint>Nivel oficial de cada estudio (clasificación internacional).</Hint>
            {studies.map(e => (
              <div key={e._id}>
                <ItemLabel>{e.titulo}</ItemLabel>
                <Select ariaLabel={`Nivel de ${e.titulo}`} value={e.nivel_isced.valor === null ? '' : String(e.nivel_isced.valor)}
                  onChange={v => send({ op: 'item', seccion: 'educacion', id: e._id, campo: 'nivel_isced', valor: v === '' ? null : Number(v) })}
                  placeholder="Seleccionar nivel" style={{ width: '100%' }} triggerStyle={{ fontSize: 12.5, borderRadius: 7 }}
                  options={[{ value: '', label: 'Sin nivel' }, ...Object.entries(ISCED_LABELS).map(([k, l]) => ({ value: k, label: `${k} · ${l}` }))]} />
              </div>
            ))}
          </SlotRow>
        )}
        <SlotRow {...rp('digcomp')} label={field('competencias_digitales', 'digcomp')} recommended>
          <Hint>Tu nivel en las 5 áreas del marco europeo de competencias digitales. Aparece cuando completes las 5.</Hint>
          {DIGCOMP_AREAS.map(a => (
            <div key={a}>
              <ItemLabel>{DIGCOMP_AREA_LABELS[a]}</ItemLabel>
              <Select ariaLabel={DIGCOMP_AREA_LABELS[a]} value={c.competencias_digitales.digcomp[a] ?? ''}
                onChange={v => send({ op: 'digcomp', valor: { [a]: v || null } })}
                placeholder="Seleccionar nivel" style={{ width: '100%' }} triggerStyle={{ fontSize: 12.5, borderRadius: 7 }}
                options={[{ value: '', label: 'Sin nivel' }, ...DIGCOMP_LEVELS.map(l => ({ value: l, label: l }))]} />
            </div>
          ))}
        </SlotRow>

        <div style={group}>{sectionLabel('informacion_personal')}</div>
        <SlotRow {...rp('foto')} label={field('informacion_personal', 'foto')}>
          {ip.foto.url ? null : (
            <>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px dashed var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 12.5, cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? 'Subiendo…' : 'Sube tu foto'}
              </button>
              {photoError && <p role="alert" style={{ margin: '4px 0 0', fontSize: 11.5, color: '#DC2626' }}>{photoError}</p>}
            </>
          )}
        </SlotRow>
        {identity('fecha_nacimiento', field('informacion_personal', 'fecha_nacimiento'))}
        {identity('direccion', field('informacion_personal', 'direccion'))}
        {perfil('linkedin', 'LinkedIn', 'linkedin.com/in/tu-perfil')}
        {perfil('orcid', 'ORCID', 'orcid.org/0000-0000-0000-0000')}
        {perfil('researchgate', 'ResearchGate', 'researchgate.net/profile/Tu-Nombre')}

        {jobs.length > 0 && (
          <>
            <div style={group}>{sectionLabel('experiencia_laboral')}</div>
            <SlotRow {...rp('experiencia.lugar')} label={field('experiencia_laboral', 'lugar')}>
              {jobs.map(e => <LugarInputs key={e._id} label={`${e.cargo} · ${e.empleador}`} valor={e.lugar.valor}
                save={v => send({ op: 'item', seccion: 'experiencia', id: e._id, campo: 'lugar', valor: v })} />)}
            </SlotRow>
            <SlotRow {...rp('experiencia.sector_nace')} label={field('experiencia_laboral', 'sector_nace')}>
              <Hint>El sector de actividad de cada empresa.</Hint>
              {jobs.map(e => (
                <div key={e._id}>
                  <ItemLabel>{e.cargo} · {e.empleador}</ItemLabel>
                  <SavedInput ariaLabel={`Sector de ${e.empleador}`} value={e.sector_nace.valor ?? ''} placeholder="Ej.: Administración pública"
                    save={v => send({ op: 'item', seccion: 'experiencia', id: e._id, campo: 'sector_nace', valor: v })} />
                </div>
              ))}
            </SlotRow>
          </>
        )}

        {studies.length > 0 && (
          <>
            <div style={group}>{sectionLabel('educacion_formacion')}</div>
            <SlotRow {...rp('educacion.lugar')} label={field('educacion_formacion', 'lugar')}>
              {studies.map(e => <LugarInputs key={e._id} label={e.titulo} valor={e.lugar.valor}
                save={v => send({ op: 'item', seccion: 'educacion', id: e._id, campo: 'lugar', valor: v })} />)}
            </SlotRow>
            <SlotRow {...rp('educacion.materias')} label={field('educacion_formacion', 'materias')}>
              {studies.map(e => (
                <div key={e._id}>
                  <ItemLabel>{e.titulo}</ItemLabel>
                  <SavedInput ariaLabel={`Materias de ${e.titulo}`} value={e.materias.valor ?? ''} placeholder="Ej.: Contabilidad, Finanzas"
                    save={v => send({ op: 'item', seccion: 'educacion', id: e._id, campo: 'materias', valor: v })} />
                </div>
              ))}
            </SlotRow>
          </>
        )}

        {langs.length > 0 && (
          <>
            <div style={group}>{sectionLabel('competencias_linguisticas')}</div>
            <SlotRow {...rp('idiomas.certificacion')} label={field('competencias_linguisticas', 'certificacion')}>
              {langs.map(l => (
                <div key={l._id}>
                  <ItemLabel>{l.idioma}</ItemLabel>
                  <SavedInput ariaLabel={`Certificación de ${l.idioma}`} value={l.certificacion.valor ?? ''} placeholder="Ej.: IELTS 7.5, 2023"
                    save={v => send({ op: 'item', seccion: 'idioma', id: l._id!, campo: 'certificacion', valor: v })} />
                </div>
              ))}
            </SlotRow>
          </>
        )}

        <div style={group}>Otros</div>
        <SlotRow {...rp('permiso_conducir')} label={sectionLabel('permiso_conducir')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {DRIVING_LICENCE_CATEGORIES.map(cat => {
              const sel = c.permiso_conducir.categorias.includes(cat);
              return (
                <button key={cat} type="button" aria-pressed={sel}
                  onClick={() => send({ op: 'permiso', valor: sel ? c.permiso_conducir.categorias.filter(x => x !== cat) : [...c.permiso_conducir.categorias, cat] })}
                  style={{ padding: '3px 9px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: `1px solid ${sel ? 'var(--blue)' : 'var(--line)'}`, background: sel ? 'var(--lav)' : '#fff', color: sel ? 'var(--blue)' : 'var(--ink)', fontWeight: sel ? 600 : 500 }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </SlotRow>
        <SlotRow {...rp('informacion_adicional')} label={sectionLabel('informacion_adicional')}>
          {c.informacion_adicional.logros_destacados.items.length > 0 && (
            <SubRow on={c.informacion_adicional.logros_destacados.activo} label={field('informacion_adicional', 'logros_destacados')}
              onChange={v => toggle('adicional.logros_destacados', v)}>
              <Hint>Tus logros que no están asignados a un empleo. Se editan en Mi perfil.</Hint>
            </SubRow>
          )}
          {(['publicaciones', 'ponencias', 'voluntariado', 'premios_becas', 'afiliaciones'] as const).map(k => (
            <SubRow key={k} on={shown(`adicional.${k}`)} label={field('informacion_adicional', k)} onChange={v => toggle(`adicional.${k}`, v)}>
              {list(k, c.informacion_adicional[k].items, field('informacion_adicional', k))}
            </SubRow>
          ))}
        </SlotRow>
        <SlotRow {...rp('anexos')} label={sectionLabel('anexos')}>
          <Hint>Nombres de los documentos que adjuntas (títulos, certificados…).</Hint>
          {list('anexos', c.anexos.items, sectionLabel('anexos'))}
        </SlotRow>
      </div>
    </>
  );
}

function SlotRow({ label, children, disabled, on, filled, onToggle }: {
  slot: EuropassSlot; label: string; children?: React.ReactNode; disabled?: boolean; recommended?: boolean;
  on: boolean; filled: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div style={{ padding: '9px 0', borderTop: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
          {label}
        </span>
        <Switch on={on} onChange={onToggle} label={label} disabled={disabled} />
      </div>
      {on && children && (
        <div style={{ marginTop: 8 }}>
          {!filled && <Hint>Aparecerá en tu CV cuando lo completes.</Hint>}
          {children}
        </div>
      )}
    </div>
  );
}

function SubRow({ on, label, onChange, children }: { on: boolean; label: string; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div style={{ padding: '6px 0 6px 10px', borderLeft: '2px solid var(--line-soft)', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)' }}>{label}</span>
        <Switch on={on} onChange={onChange} label={label} />
      </div>
      {on && children && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}

// City + country of one job/study. Stored as "Ciudad, País" in the CV; sent as two fields.
function LugarInputs({ label, valor, save }: { label: string; valor: string | null; save: (v: { ciudad: string; pais: string }) => Promise<EuropassOpResult> }) {
  const [ciudad0, ...rest] = (valor ?? '').split(', ');
  const pais0 = rest.join(', ');
  const [ciudad, setCiudad] = useState(ciudad0 ?? '');
  const [pais, setPais] = useState(pais0);
  const [error, setError] = useState<string | null>(null);
  const [prevValor, setPrevValor] = useState(valor);
  if (valor !== prevValor) { setPrevValor(valor); setCiudad(ciudad0 ?? ''); setPais(pais0); }
  async function commit() {
    if (ciudad === (ciudad0 ?? '') && pais === pais0) return;
    const r = await save({ ciudad, pais });
    setError(r.ok ? null : (r.error ?? 'No se pudo guardar.'));
  }
  return (
    <div>
      <ItemLabel>{label}</ItemLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        <input aria-label={`Ciudad de ${label}`} value={ciudad} placeholder="Ciudad" onChange={e => setCiudad(e.target.value)} onBlur={commit} style={inputStyle} />
        <input aria-label={`País de ${label}`} value={pais} placeholder="País" onChange={e => setPais(e.target.value)} onBlur={commit} style={inputStyle} />
      </div>
      {error && <p role="alert" style={{ margin: '4px 0 0', fontSize: 11.5, color: '#DC2626' }}>{error}</p>}
    </div>
  );
}
