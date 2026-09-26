'use client';

// Europass side panel (step 5b; spec §7, changes 23–27). Order: density · photo size
// (only with a photo) · sections in accordions — "Recomendadas en Europass" first. Inputs
// live here, under their switch (change 23); per-item fields have one switch per section
// and a field per item (change 24). Every change is one server operation.

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
  // Pages the CV takes, from the same paginator as the PDF (spec change 32).
  paginas?: number | null;
}

const DENSITY_LABELS: Record<EuropassDensity, string> = { compacto: 'Compacto', estandar: 'Estándar', amplio: 'Amplio' };
const PHOTO_LABELS: Record<EuropassPhotoSize, string> = { pequena: 'Pequeña', mediana: 'Mediana', grande: 'Grande' };

// Plain-language explanations for what a regular user wouldn't know (CEO 2026-09-25).
export const EUROPASS_TIPS = {
  densidad: 'Cuánto espacio hay entre líneas y secciones. Úsalo para que tu CV quepa en menos páginas.',
  nivel_isced: 'La escala europea de estudios: 6 es una carrera universitaria, 7 una maestría, 8 un doctorado. Ayuda a que en otros países entiendan tu título.',
  digcomp: 'La escala europea para medir tu manejo de herramientas digitales, en 5 áreas.',
  fecha_nacimiento: 'Es opcional. Muchos países prefieren no pedirla, para evitar discriminación por edad.',
  direccion: 'Reemplaza la ciudad en tu CV. Agrégala solo si la oferta la pide.',
  orcid: 'Un código que identifica a investigadores. Úsalo si publicas investigaciones.',
  researchgate: 'Una red para investigadores y académicos.',
  sector_nace: 'El área a la que se dedica la empresa, por ejemplo «Salud» o «Construcción».',
  materias: 'Las asignaturas más importantes de tu carrera.',
  certificacion: 'Un examen oficial de idioma que aprobaste, como IELTS, TOEFL o DELF.',
  permiso_conducir: 'Las categorías de tu licencia de conducir. La B es la de carro.',
  informacion_adicional: 'Publicaciones, charlas, voluntariado, premios o asociaciones a las que perteneces.',
  logros_destacados: 'Tus logros que no están asignados a un empleo. Se editan en Mi perfil.',
  ponencias: 'Charlas o presentaciones que diste en eventos.',
  afiliaciones: 'Asociaciones o colegios profesionales a los que perteneces.',
  anexos: 'Los documentos que envías junto a tu CV, como títulos o certificados. Solo se nombran; no se suben archivos.',
} as const;

const PENDING_HINT = 'Aparecerá en tu CV al completarlo';

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

// "i" next to a name: explanation on hover, focus or tap. The bubble spans the row (its
// nearest positioned parent), so it never overflows the scrolling sidebar.
function Tip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 5 }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={`¿Qué es ${label}?`} aria-expanded={open}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        style={{
          width: 15, height: 15, borderRadius: '50%', border: '1px solid var(--mute)', background: 'transparent', padding: 0,
          color: 'var(--mute)', cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {/* Drawn, not a font glyph: a letter "i" never sits exactly in the middle. */}
        <svg width="7" height="9" viewBox="0 0 7 9" aria-hidden="true" fill="currentColor">
          <circle cx="3.5" cy="1.2" r="1.1" /><rect x="2.55" y="3.2" width="1.9" height="5.6" rx="0.6" />
        </svg>
      </button>
      {open && (
        <span role="tooltip" style={{
          position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 20,
          background: 'var(--deep)', color: '#fff', fontSize: 11.5, fontWeight: 400, lineHeight: 1.45,
          padding: '7px 10px', borderRadius: 8, boxShadow: '0 6px 16px rgba(15,23,42,.18)', textTransform: 'none', letterSpacing: 0,
        }}>{text}</span>
      )}
    </span>
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
  width: '100%', minWidth: 0, padding: '6px 9px', borderRadius: 7, border: '1px solid var(--line)', fontSize: 12.5,
  color: 'var(--ink)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

// ✓ next to an input: blue when there is something to save, green for a moment once saved.
// onMouseDown keeps the input focused, so clicking ✓ saves once (not blur + click).
function SaveButton({ dirty, saved, onClick, label }: { dirty: boolean; saved: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} title="Guardar" onMouseDown={e => e.preventDefault()} onClick={onClick}
      style={{
        width: 30, height: 30, flexShrink: 0, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${saved ? '#86EFAC' : dirty ? 'var(--blue)' : 'var(--line)'}`,
        background: saved ? '#F0FDF4' : dirty ? 'var(--lav)' : 'var(--surface)',
        color: saved ? '#16A34A' : dirty ? 'var(--blue)' : 'var(--mute)', transition: 'all .15s',
      }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </button>
  );
}

function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { saved, flash: () => { setSaved(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setSaved(false), 1500); } };
}

// Text input that saves with ✓, Enter or on leaving the field (only when it changed).
function SavedInput({ value, placeholder, save, type = 'text', multiline, ariaLabel }: {
  value: string; placeholder?: string; save: (v: string) => Promise<EuropassOpResult>; type?: string; multiline?: boolean; ariaLabel: string;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const { saved, flash } = useSavedFlash();
  const [savedValue, setSavedValue] = useState(value);
  // A new value from the server replaces the draft (React's "adjust state on prop change").
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) { setPrevValue(value); setDraft(value); setSavedValue(value); }
  async function commit() {
    if (draft === savedValue) return;
    const r = await save(draft);
    if (r.ok) { setSavedValue(draft); setError(null); flash(); } else setError(r.error ?? 'No se pudo guardar.');
  }
  const common = {
    value: draft, placeholder, 'aria-label': ariaLabel,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: multiline ? 'flex-end' : 'center' }}>
        {multiline
          ? <textarea {...common} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }} />
          : <input {...common} type={type} style={inputStyle} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />}
        <SaveButton dirty={draft !== savedValue} saved={saved} onClick={commit} label={`Guardar ${ariaLabel}`} />
      </div>
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

type Group = 'recomendadas' | 'personal' | 'experiencia' | 'educacion' | 'idiomas' | 'otros';

export default function EuropassPanel({ content, visual, send, identidadDisponible, onUploadPhoto, paginas }: Props) {
  // Slots the user switched on that have no data yet: the input is shown here and the
  // slot appears in the CV once a value is saved (an empty section is never "on").
  const [open, setOpen] = useState<Set<EuropassSlot>>(new Set());
  // Accordions (CEO 2026-09-25): all closed at first.
  const [expanded, setExpanded] = useState<Set<Group>>(new Set());
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
  const expand = (g: Group) => setExpanded(prev => { const n = new Set(prev); if (n.has(g)) n.delete(g); else n.add(g); return n; });

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

  const identity = (slot: 'fecha_nacimiento' | 'nacionalidad' | 'direccion', label: string, tip?: string) => (
    <SlotRow {...rp(slot)} label={label} tip={tip} disabled={!identidadDisponible}>
      {!identidadDisponible && <Hint>Tus datos personales no están disponibles en este momento.</Hint>}
      <SavedInput ariaLabel={label}
        type={slot === 'fecha_nacimiento' ? 'date' : 'text'}
        // The CV shows DD/MM/AAAA; the date input needs AAAA-MM-DD.
        value={slot === 'fecha_nacimiento' ? (ip.fecha_nacimiento.valor ?? '').split('/').reverse().join('-') : (ip[slot].valor ?? '')}
        placeholder={slot === 'nacionalidad' ? 'Ej.: Venezolana' : slot === 'direccion' ? 'Calle, número, código postal, ciudad' : undefined}
        save={v => send({ op: 'identidad', campo: slot, valor: v })} />
    </SlotRow>
  );

  const perfil = (tipo: 'linkedin' | 'orcid' | 'researchgate', label: string, placeholder: string, tip?: string) => (
    <SlotRow {...rp(tipo)} label={label} tip={tip}>
      <SavedInput ariaLabel={label} value={ip.perfiles.find(p => p.tipo === tipo)?.url ?? ''} placeholder={placeholder}
        save={v => send({ op: 'perfil_url', tipo, valor: v })} />
    </SlotRow>
  );

  const list = (campo: 'publicaciones' | 'ponencias' | 'voluntariado' | 'premios_becas' | 'afiliaciones' | 'anexos', items: string[], label: string) => (
    <SavedInput ariaLabel={label} multiline value={items.join('\n')} placeholder="Uno por línea"
      save={v => send({ op: 'lista', campo, valor: v.split('\n') })} />
  );

  const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--sh-2)' };
  const title: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', position: 'relative' };

  return (
    <>
      {/* Diseño */}
      <div style={card}>
        <div style={{ ...title, marginBottom: 10 }}>Densidad textual<Tip text={EUROPASS_TIPS.densidad} label="la densidad textual" /></div>
        <Segmented value={visual.densidad ?? 'estandar'} onChange={v => send({ op: 'visual', densidad: v })}
          options={(Object.keys(EUROPASS_DENSITIES) as EuropassDensity[]).map(k => [k, DENSITY_LABELS[k]])} />
        {paginas != null && (
          <p aria-live="polite" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--mute)' }}>
            Tu CV ocupa <strong style={{ color: 'var(--deep)' }}>{paginas} {paginas === 1 ? 'página' : 'páginas'}</strong>
          </p>
        )}
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
        <div style={{ ...title, marginBottom: 4 }}>Secciones</div>

        <Accordion id="recomendadas" title="Recomendadas en Europass" expanded={expanded} onToggle={expand}>
          {identity('nacionalidad', field('informacion_personal', 'nacionalidad'))}
          {studies.length > 0 && (
            <SlotRow {...rp('educacion.nivel_isced')} label={field('educacion_formacion', 'nivel_isced')} tip={EUROPASS_TIPS.nivel_isced}>
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
          <SlotRow {...rp('digcomp')} label={field('competencias_digitales', 'digcomp')} tip={EUROPASS_TIPS.digcomp} pendingHint="Aparecerá en tu CV al completar las 5 áreas">
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
        </Accordion>

        <Accordion id="personal" title={sectionLabel('informacion_personal')} expanded={expanded} onToggle={expand}>
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
          {identity('fecha_nacimiento', field('informacion_personal', 'fecha_nacimiento'), EUROPASS_TIPS.fecha_nacimiento)}
          {identity('direccion', field('informacion_personal', 'direccion'), EUROPASS_TIPS.direccion)}
          {perfil('linkedin', 'LinkedIn', 'linkedin.com/in/tu-perfil')}
          {perfil('orcid', 'ORCID', 'orcid.org/0000-0000-0000-0000', EUROPASS_TIPS.orcid)}
          {perfil('researchgate', 'ResearchGate', 'researchgate.net/profile/Tu-Nombre', EUROPASS_TIPS.researchgate)}
        </Accordion>

        {jobs.length > 0 && (
          <Accordion id="experiencia" title={sectionLabel('experiencia_laboral')} expanded={expanded} onToggle={expand}>
            <SlotRow {...rp('experiencia.lugar')} label={field('experiencia_laboral', 'lugar')}>
              {jobs.map(e => <LugarInputs key={e._id} label={`${e.cargo} · ${e.empleador}`} valor={e.lugar.valor}
                save={v => send({ op: 'item', seccion: 'experiencia', id: e._id, campo: 'lugar', valor: v })} />)}
            </SlotRow>
            <SlotRow {...rp('experiencia.sector_nace')} label={field('experiencia_laboral', 'sector_nace')} tip={EUROPASS_TIPS.sector_nace}>
              {jobs.map(e => (
                <div key={e._id}>
                  <ItemLabel>{e.cargo} · {e.empleador}</ItemLabel>
                  <SavedInput ariaLabel={`Sector de ${e.empleador}`} value={e.sector_nace.valor ?? ''} placeholder="Ej.: Administración pública"
                    save={v => send({ op: 'item', seccion: 'experiencia', id: e._id, campo: 'sector_nace', valor: v })} />
                </div>
              ))}
            </SlotRow>
          </Accordion>
        )}

        {studies.length > 0 && (
          <Accordion id="educacion" title={sectionLabel('educacion_formacion')} expanded={expanded} onToggle={expand}>
            <SlotRow {...rp('educacion.lugar')} label={field('educacion_formacion', 'lugar')}>
              {studies.map(e => <LugarInputs key={e._id} label={e.titulo} valor={e.lugar.valor}
                save={v => send({ op: 'item', seccion: 'educacion', id: e._id, campo: 'lugar', valor: v })} />)}
            </SlotRow>
            <SlotRow {...rp('educacion.materias')} label={field('educacion_formacion', 'materias')} tip={EUROPASS_TIPS.materias}>
              {studies.map(e => (
                <div key={e._id}>
                  <ItemLabel>{e.titulo}</ItemLabel>
                  <SavedInput ariaLabel={`Materias de ${e.titulo}`} value={e.materias.valor ?? ''} placeholder="Ej.: Contabilidad, Finanzas"
                    save={v => send({ op: 'item', seccion: 'educacion', id: e._id, campo: 'materias', valor: v })} />
                </div>
              ))}
            </SlotRow>
          </Accordion>
        )}

        {langs.length > 0 && (
          <Accordion id="idiomas" title={sectionLabel('competencias_linguisticas')} expanded={expanded} onToggle={expand}>
            <SlotRow {...rp('idiomas.certificacion')} label={field('competencias_linguisticas', 'certificacion')} tip={EUROPASS_TIPS.certificacion}>
              {langs.map(l => (
                <div key={l._id}>
                  <ItemLabel>{l.idioma}</ItemLabel>
                  <SavedInput ariaLabel={`Certificación de ${l.idioma}`} value={l.certificacion.valor ?? ''} placeholder="Ej.: IELTS 7.5, 2023"
                    save={v => send({ op: 'item', seccion: 'idioma', id: l._id!, campo: 'certificacion', valor: v })} />
                </div>
              ))}
            </SlotRow>
          </Accordion>
        )}

        <Accordion id="otros" title="Otros" expanded={expanded} onToggle={expand}>
          <SlotRow {...rp('permiso_conducir')} label={sectionLabel('permiso_conducir')} tip={EUROPASS_TIPS.permiso_conducir}>
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
          <SlotRow {...rp('informacion_adicional')} label={sectionLabel('informacion_adicional')} tip={EUROPASS_TIPS.informacion_adicional}>
            {c.informacion_adicional.logros_destacados.items.length > 0 && (
              <SubRow on={c.informacion_adicional.logros_destacados.activo} label={field('informacion_adicional', 'logros_destacados')}
                tip={EUROPASS_TIPS.logros_destacados} onChange={v => toggle('adicional.logros_destacados', v)} />
            )}
            {(['publicaciones', 'ponencias', 'voluntariado', 'premios_becas', 'afiliaciones'] as const).map(k => (
              <SubRow key={k} on={shown(`adicional.${k}`)} label={field('informacion_adicional', k)}
                tip={k === 'ponencias' ? EUROPASS_TIPS.ponencias : k === 'afiliaciones' ? EUROPASS_TIPS.afiliaciones : undefined}
                onChange={v => toggle(`adicional.${k}`, v)}>
                {list(k, c.informacion_adicional[k].items, field('informacion_adicional', k))}
              </SubRow>
            ))}
          </SlotRow>
          <SlotRow {...rp('anexos')} label={sectionLabel('anexos')} tip={EUROPASS_TIPS.anexos}>
            {list('anexos', c.anexos.items, sectionLabel('anexos'))}
          </SlotRow>
        </Accordion>
      </div>
    </>
  );
}

const GROUP_ICONS: Record<Group, React.ReactNode> = {
  recomendadas: <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.5 5.8 21 7.2 14 2 9.3 8.9 8.6 12 2" />,
  personal: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  experiencia: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  educacion: <><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>,
  idiomas: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></>,
  otros: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
};

// Open section: title and icon in Momentum blue, so open sections are easy to tell apart.
function Accordion({ id, title, expanded, onToggle, children }: {
  id: Group; title: string; expanded: Set<Group>; onToggle: (g: Group) => void; children: React.ReactNode;
}) {
  const isOpen = expanded.has(id);
  const color = isOpen ? 'var(--blue)' : 'var(--deep)';
  return (
    <div style={{ borderTop: '1px solid var(--line-soft)' }}>
      <button type="button" aria-expanded={isOpen} onClick={() => onToggle(id)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isOpen ? 'var(--blue)' : 'var(--mute)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
          {GROUP_ICONS[id]}
        </svg>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOpen ? 'var(--blue)' : 'var(--mute)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {isOpen && <div style={{ paddingBottom: 6 }}>{children}</div>}
    </div>
  );
}

function SlotRow({ label, children, disabled, tip, pendingHint = PENDING_HINT, on, filled, onToggle }: {
  slot: EuropassSlot; label: string; children?: React.ReactNode; disabled?: boolean; tip?: string; pendingHint?: string;
  on: boolean; filled: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div style={{ padding: '9px 0', borderTop: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
          {label}{tip && <Tip text={tip} label={label} />}
        </span>
        <Switch on={on} onChange={onToggle} label={label} disabled={disabled} />
      </div>
      {on && children && (
        <div style={{ marginTop: 8 }}>
          {!filled && <Hint>{pendingHint}</Hint>}
          {children}
        </div>
      )}
    </div>
  );
}

function SubRow({ on, label, tip, onChange, children }: { on: boolean; label: string; tip?: string; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div style={{ padding: '6px 0 6px 10px', borderLeft: '2px solid var(--line-soft)', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)' }}>{label}{tip && <Tip text={tip} label={label} />}</span>
        <Switch on={on} onChange={onChange} label={label} />
      </div>
      {on && children && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}

// City + country of one job/study. Stored as "Ciudad, País" in the CV; sent as two fields,
// saved with ✓, Enter, or when the focus leaves BOTH inputs (never half a place).
function LugarInputs({ label, valor, save }: { label: string; valor: string | null; save: (v: { ciudad: string; pais: string }) => Promise<EuropassOpResult> }) {
  const [ciudad0, ...rest] = (valor ?? '').split(', ');
  const pais0 = rest.join(', ');
  const [ciudad, setCiudad] = useState(ciudad0 ?? '');
  const [pais, setPais] = useState(pais0);
  const [error, setError] = useState<string | null>(null);
  const { saved, flash } = useSavedFlash();
  const [prevValor, setPrevValor] = useState(valor);
  if (valor !== prevValor) { setPrevValor(valor); setCiudad(ciudad0 ?? ''); setPais(pais0); }
  const dirty = ciudad !== (ciudad0 ?? '') || pais !== pais0;
  async function commit() {
    if (!dirty) return;
    const r = await save({ ciudad, pais });
    if (r.ok) { setError(null); flash(); } else setError(r.error ?? 'No se pudo guardar.');
  }
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commit(); };
  return (
    <div>
      <ItemLabel>{label}</ItemLabel>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit(); }}>
        <input aria-label={`Ciudad de ${label}`} value={ciudad} placeholder="Ciudad" onChange={e => setCiudad(e.target.value)} onKeyDown={enter} style={inputStyle} />
        <input aria-label={`País de ${label}`} value={pais} placeholder="País" onChange={e => setPais(e.target.value)} onKeyDown={enter} style={inputStyle} />
        <SaveButton dirty={dirty} saved={saved} onClick={commit} label={`Guardar ciudad y país de ${label}`} />
      </div>
      {error && <p role="alert" style={{ margin: '4px 0 0', fontSize: 11.5, color: '#DC2626' }}>{error}</p>}
    </div>
  );
}
