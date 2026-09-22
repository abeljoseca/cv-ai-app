'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import {
  ImportSource, ImportResult, runLinkedInImport, runCVImport,
  slugFromLinkedInUrl, linkedInSlugFromInput,
  ProcessingView, ConfirmationView, ImportDataModal,
} from '@/components/import/ImportFlow';

export default function EditarPerfilPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView]               = useState<'form' | 'procesando' | 'confirmacion'>('form');
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError]   = useState(false);
  const [importAttempt, setImportAttempt] = useState(0);
  const [importedName, setImportedName] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data as Profile);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(form: EditForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      nombre:           form.nombre,
      apellido:         form.apellido,
      profesion_perfil: form.profesion || null,
      email_cv:         form.emailCv,
      linkedin_url:     form.linkedinUrl ? `https://www.linkedin.com/in/${form.linkedinUrl.trim()}/` : null,
      telefono:         form.telefono || null,
      ciudad:           form.ciudad || null,
      pais:             form.pais || null,
      foto_url:         form.foto_url || null,
      updated_at:       new Date().toISOString(),
    }).eq('id', user.id);
    router.push('/profile');
  }

  async function startLinkedInImport(slug: string) {
    setImportAttempt(n => n + 1);
    setImportSource('linkedin');
    setImportError(false);
    setView('procesando');
    const r = await runLinkedInImport(slug);
    if (!r.ok) { setImportError(true); return; }
    setImportedName([r.patch.nombre, r.patch.apellido].filter(Boolean).join(' '));
    setImportResult({ source: 'linkedin', completitud: r.summary.completitud, counts: r.summary.counts });
    setView('confirmacion');
  }

  async function startCVImport(file: File) {
    setImportAttempt(n => n + 1);
    setImportSource('cv');
    setImportError(false);
    setView('procesando');
    const r = await runCVImport(file);
    if (!r.ok) { setImportError(true); return; }
    setImportedName('');
    setImportResult({ source: 'cv', completitud: r.summary.completitud, counts: r.summary.counts });
    setView('confirmacion');
  }

  function retryImport() {
    setImportError(false);
    setView('form');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  if (!profile) return null;

  if (view === 'procesando') {
    return (
      <ProcessingView
        key={importAttempt}
        source={importSource}
        error={importError}
        onRetry={retryImport}
        onManual={() => { setImportError(false); setView('form'); }}
      />
    );
  }

  if (view === 'confirmacion' && importResult) {
    // Tras importar, recargamos editar-perfil para revisar los datos ya actualizados.
    return (
      <ConfirmationView
        result={importResult}
        detectedName={importedName}
        onContinue={() => window.location.reload()}
      />
    );
  }

  return (
    <EditarPerfilForm
      profile={profile}
      onSave={handleSave}
      onCancel={() => router.back()}
      onImportLinkedIn={startLinkedInImport}
      onImportCV={startCVImport}
    />
  );
}

/* ── Form ─────────────────────────────────────────────────────────────── */
interface EditForm {
  nombre: string;
  apellido: string;
  profesion: string;
  emailCv: string;
  linkedinUrl: string;
  telefono: string;
  ciudad: string;
  pais: string;
  foto_url: string;
}

function EditarPerfilForm({
  profile,
  onSave,
  onCancel,
  onImportLinkedIn,
  onImportCV,
}: {
  profile: Profile;
  onSave: (f: EditForm) => void;
  onCancel: () => void;
  onImportLinkedIn: (slug: string) => void;
  onImportCV: (file: File) => void;
}) {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);
  const { updateProfile } = useProfile();
  const { registerGuard, unregisterGuard, setSaveAndContinue } = useNavigationGuard();

  const [form, setForm] = useState<EditForm>({
    nombre:      profile.nombre    || '',
    apellido:    profile.apellido  || '',
    profesion:   profile.profesion_perfil || '',
    emailCv:     profile.email_cv  || '',
    linkedinUrl: slugFromLinkedInUrl(profile.linkedin_url),
    telefono:    profile.telefono  || '',
    ciudad:      profile.ciudad    || '',
    pais:        profile.pais      || '',
    foto_url:    profile.foto_url  || '',
  });
  const [photoHover, setPhotoHover] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [liFocus, setLiFocus]       = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  function set(k: keyof EditForm, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const blobUrl = URL.createObjectURL(f);
    set('foto_url', blobUrl);
    updateProfile({ foto_url: blobUrl });
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newExt = (f.name.split('.').pop() ?? 'jpg').toLowerCase();
      const newPath = `${user.id}.${newExt}`;

      // Delete old file only when extension changed (upsert handles same-ext replace)
      if (profile.foto_url) {
        const oldExtMatch = profile.foto_url.match(/\.(\w+)(?:\?|$)/);
        const oldExt = oldExtMatch?.[1]?.toLowerCase();
        if (oldExt && oldExt !== newExt) {
          await supabase.storage.from('avatars').remove([`${user.id}.${oldExt}`]);
        }
      }

      const { error } = await supabase.storage.from('avatars').upload(newPath, f, { upsert: true });
      if (error) {
        set('foto_url', profile.foto_url || '');
        updateProfile({ foto_url: profile.foto_url || null });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(newPath);
      await supabase.from('profiles').update({ foto_url: publicUrl }).eq('id', user.id);
      set('foto_url', publicUrl);
      // Sync context with the real persistent URL so the sidebar stays correct
      // after navigation (the blobUrl set above is only valid for this session).
      updateProfile({ foto_url: publicUrl });
    } catch {
      set('foto_url', profile.foto_url || '');
      updateProfile({ foto_url: profile.foto_url || null });
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto(e: React.MouseEvent) {
    e.stopPropagation();
    set('foto_url', '');
    updateProfile({ foto_url: null });
    if (fileRef.current) fileRef.current.value = '';
  }

  const emailValid = /^\S+@\S+\.\S+$/.test(form.emailCv);
  const canSave    = !!form.nombre && !!form.apellido && emailValid && !uploading;

  const linkedinFullUrl = form.linkedinUrl ? `https://www.linkedin.com/in/${form.linkedinUrl.trim()}/` : null;
  const dirty =
    (profile.nombre || '')           !== form.nombre ||
    (profile.apellido || '')         !== form.apellido ||
    (profile.profesion_perfil || '') !== form.profesion ||
    (profile.email_cv || '')         !== form.emailCv ||
    (profile.telefono || '')         !== form.telefono ||
    (profile.ciudad || '')           !== form.ciudad ||
    (profile.pais || '')             !== form.pais ||
    (profile.foto_url || '')         !== form.foto_url ||
    slugFromLinkedInUrl(profile.linkedin_url) !== form.linkedinUrl;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    updateProfile({
      nombre:           form.nombre,
      apellido:         form.apellido,
      profesion_perfil: form.profesion || null,
      email_cv:         form.emailCv,
      linkedin_url:     linkedinFullUrl,
      telefono:         form.telefono || null,
      ciudad:           form.ciudad || null,
      pais:             form.pais || null,
      foto_url:         form.foto_url || null,
    });
    onSave(form);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1400);
  }

  // Guard de cambios sin guardar: si el usuario intenta salir por el sidebar (o
  // cerrar sesión) con cambios pendientes, el popup ofrece "Guardar y continuar".
  const formRef = useRef(form);
  const canSaveRef = useRef(canSave);
  useEffect(() => { formRef.current = form; canSaveRef.current = canSave; });

  useEffect(() => {
    if (!dirty) { unregisterGuard(); return; }
    registerGuard('edit-unsaved');
    setSaveAndContinue(async () => {
      if (!canSaveRef.current) return false;
      const f = formRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const url = f.linkedinUrl ? `https://www.linkedin.com/in/${f.linkedinUrl.trim()}/` : null;
      const patch = {
        nombre: f.nombre, apellido: f.apellido, profesion_perfil: f.profesion || null,
        email_cv: f.emailCv, linkedin_url: url, telefono: f.telefono || null,
        ciudad: f.ciudad || null, pais: f.pais || null, foto_url: f.foto_url || null,
      };
      await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', user.id);
      updateProfile(patch);
      return true;
    });
    return () => { unregisterGuard(); setSaveAndContinue(null); };
  }, [dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = form.nombre || 'Nombre';

  return (
    <>
    <div style={{ maxWidth: 820, margin: '8px auto 60px', animation: 'fadeUp .25s var(--ease) both' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--sh-2)',
      }}>
        {/* Header band */}
        <div style={{
          padding: '28px 40px 22px',
          background: 'linear-gradient(180deg, #F7F8FE 0%, #FFFFFF 100%)',
          borderBottom: '1px solid var(--line-soft)',
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.015em' }}>
            Hola, {firstName}
          </h2>
          <p style={{ margin: 0, color: 'var(--mute)', fontSize: 13.5, lineHeight: 1.55 }}>
            Si deseas modificar alguno de tus datos personales, aquí puedes hacerlo.<br />
            Estos datos nos ayudarán a generar tu CV profesional.
          </p>
        </div>

        <div style={{ padding: '28px 40px 32px' }}>
          {/* Importar / actualizar datos */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', marginBottom: 24,
            background: 'var(--lav)', border: '1px solid var(--line)', borderRadius: 12,
          }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'var(--surface)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)' }}>
              <IdeaIcon size={17} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>¿Actualizar tus datos?</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>Vuelve a importar desde LinkedIn o un CV anterior.</div>
            </div>
            <button type="button" onClick={() => setShowImportModal(true)}
              style={{
                flexShrink: 0, padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}>
              <UploadIcon size={14} /> Actualizar datos
            </button>
          </div>

          <form onSubmit={submit}>
            {/* Photo row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '18px 20px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line-soft)',
              borderRadius: 14,
              marginBottom: 26,
            }}>
              <div
                onMouseEnter={() => setPhotoHover(true)}
                onMouseLeave={() => setPhotoHover(false)}
                onClick={() => !uploading && fileRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
                style={{
                  position: 'relative', width: 88, height: 88, flexShrink: 0,
                  cursor: uploading ? 'wait' : 'pointer',
                }}>
                {/* Inner circle — overflow:hidden only here so camera badge isn't clipped */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'linear-gradient(180deg, #F0F1FE 0%, #E5E8FD 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--blue)',
                  border: form.foto_url ? '3px solid #fff' : `2px dashed ${photoHover ? 'var(--blue)' : '#C9D0EC'}`,
                  boxShadow: form.foto_url
                    ? '0 0 0 1px var(--line), var(--sh-2)'
                    : (photoHover ? '0 0 0 4px rgba(75,107,251,.12)' : 'none'),
                  transition: 'all .18s var(--ease)',
                  overflow: 'hidden',
                }}>
                  {form.foto_url && (
                    <img src={form.foto_url} alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {uploading && (
                    <span style={{ position: 'relative', width: 24, height: 24, borderRadius: '50%', border: '2.5px solid var(--blue)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
                  )}
                  {!form.foto_url && !uploading && <UserIcon size={32} />}
                  {form.foto_url && photoHover && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'rgba(15,23,42,.55)', color: '#fff',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 2,
                      fontSize: 11, fontWeight: 500,
                    }}>
                      <CameraIcon size={16} />
                      Cambiar
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
                </div>
                {/* Camera badge — positioned on outer wrapper, never clipped */}
                {!form.foto_url && !uploading && (
                  <div style={{
                    position: 'absolute', right: 0, bottom: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--blue)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 6px rgba(75,107,251,.4)',
                    pointerEvents: 'none',
                  }}>
                    <CameraIcon size={13} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--deep)' }}>Foto de perfil</span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'var(--hover)', color: 'var(--mute)', border: '1px solid var(--line)' }}>
                    Opcional
                  </span>
                </div>
                <div style={{ color: 'var(--mute)', fontSize: 12.5, lineHeight: 1.5 }}>
                  Una buena foto aumenta la confianza de los reclutadores.<br />
                  Formato JPG o PNG · mínimo 200×200 px.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UploadIcon size={13} />
                    {form.foto_url ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {form.foto_url && (
                    <button type="button" onClick={clearPhoto}
                      style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, border: 'none', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrashIcon size={13} />
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Datos personales */}
            <SectionLabel>Datos personales</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <FormInput label="Nombre" required placeholder="Ej. María"
                value={form.nombre} onChange={v => set('nombre', v)} />
              <FormInput label="Apellido" required placeholder="Ej. González"
                value={form.apellido} onChange={v => set('apellido', v)} />
              <FormInput label="Profesión" placeholder="Ej. Diseñadora de producto"
                hint="Se mostrará como tu título principal en el CV"
                value={form.profesion} onChange={v => set('profesion', v)}
                wrapStyle={{ gridColumn: '1 / -1' }} />
            </div>

            {/* Contacto */}
            <SectionLabel>Contacto</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <FormInput label="Correo electrónico" required type="email"
                hint="Aparecerá en tu CV"
                leftIcon={<MailIcon size={15} />}
                placeholder="correo@ejemplo.com"
                value={form.emailCv} onChange={v => set('emailCv', v)}
                wrapStyle={{ gridColumn: '1 / -1' }} />
              {/* LinkedIn — dato de contacto (aparece en el CV, no dispara import) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>LinkedIn</span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--surface-2)',
                    border: `1.5px solid ${liFocus ? 'var(--blue)' : 'var(--line)'}`,
                    borderRadius: 10, padding: '0 14px 0 12px', height: 44,
                    boxShadow: liFocus ? '0 0 0 3px rgba(75,107,251,.12)' : 'none',
                    transition: 'all .15s var(--ease)',
                  }}>
                    <span style={{ color: 'var(--mute)', display: 'flex', flexShrink: 0 }}>
                      <LinkedInIcon size={15} />
                    </span>
                    <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--mute)', whiteSpace: 'nowrap', userSelect: 'none' }}>linkedin.com/in/</span>
                    <input
                      type="text"
                      value={form.linkedinUrl}
                      placeholder="tu-nombre"
                      onFocus={() => setLiFocus(true)}
                      onBlur={() => setLiFocus(false)}
                      onChange={e => set('linkedinUrl', linkedInSlugFromInput(e.target.value))}
                      style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, lineHeight: '20px', color: 'var(--ink)', padding: 0, minWidth: 0 }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>
                    Tu URL pública de LinkedIn. Aparecerá en tu CV.
                  </span>
                </label>
              </div>
              <FormInput label="Teléfono" placeholder="+57 300 000 0000"
                leftIcon={<PhoneIcon size={15} />}
                value={form.telefono} onChange={v => set('telefono', v)}
                wrapStyle={{ gridColumn: '1 / -1' }} />
            </div>

            {/* Ubicación */}
            <SectionLabel>Ubicación</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
              <FormInput label="Ciudad" placeholder="Bogotá"
                leftIcon={<PinIcon size={15} />}
                value={form.ciudad} onChange={v => set('ciudad', v)} />
              <FormInput label="País" placeholder="Colombia"
                leftIcon={<GlobeIcon size={15} />}
                value={form.pais} onChange={v => set('pais', v)} />
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 16, paddingTop: 18, borderTop: '1px solid var(--line-soft)',
            }}>
              <div style={{ color: 'var(--mute)', fontSize: 12.5 }}>
                <span style={{ color: 'var(--danger)' }}>*</span> Campos obligatorios
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {savedPulse && (
                  <span style={{ color: 'var(--success)', fontSize: 12.5, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircleIcon size={14} /> Cambios guardados
                  </span>
                )}
                <button type="button" onClick={onCancel}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={!canSave || !dirty}
                  style={{
                    minWidth: 200, padding: '13px 22px', borderRadius: 10,
                    background: canSave && dirty ? 'var(--blue)' : 'var(--line)',
                    color: canSave && dirty ? '#fff' : 'var(--mute)',
                    fontWeight: 600, fontSize: 15, border: 'none',
                    cursor: canSave && dirty ? 'pointer' : 'not-allowed',
                    boxShadow: canSave && dirty ? '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.4)' : 'none',
                    transition: 'all .18s var(--ease)',
                  }}>
                  Guardar cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    {showImportModal && (
      <ImportDataModal
        dirty={dirty}
        onClose={() => setShowImportModal(false)}
        onImportLinkedIn={onImportLinkedIn}
        onImportCV={onImportCV}
      />
    )}
    </>
  );
}

/* ── SectionLabel ────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 14px' }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--blue)' }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
    </div>
  );
}

/* ── FormInput ───────────────────────────────────────────────────────── */
interface FormInputProps {
  label: string;
  required?: boolean;
  hint?: string;
  leftIcon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  wrapStyle?: React.CSSProperties;
}
function FormInput({ label, required, hint, leftIcon, type = 'text', placeholder, value, onChange, wrapStyle }: FormInputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={wrapStyle}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--deep)' }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-2)',
          border: `1.5px solid ${focus ? 'var(--blue)' : 'var(--line)'}`,
          borderRadius: 10, padding: leftIcon ? '10px 14px 10px 12px' : '10px 14px',
          boxShadow: focus ? '0 0 0 3px rgba(75,107,251,.12)' : 'none',
          transition: 'all .15s var(--ease)',
        }}>
          {leftIcon && <span style={{ color: 'var(--mute)', display: 'flex', flexShrink: 0 }}>{leftIcon}</span>}
          <input
            type={type} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--ink)', minHeight: 20 }}
          />
        </div>
        {hint && <span style={{ fontSize: 12, color: 'var(--mute)' }}>{hint}</span>}
      </label>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────── */
function IdeaIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>;
}
function LinkedInIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
}
function UserIcon({ size = 32 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.8-3.6 5-5 7.5-5s5.7 1.4 7.5 5"/></svg>;
}
function CameraIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>;
}
function UploadIcon({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>;
}
function TrashIcon({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>;
}
function MailIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>;
}
function PhoneIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6.3 6.3l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"/></svg>;
}
function PinIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function GlobeIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
}
function CheckCircleIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>;
}
