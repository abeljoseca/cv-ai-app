'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import { calcularPuntajeCompletitud } from '@/lib/completitud';
import { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma } from '@/types';

interface FormData {
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

type View = 'eleccion' | 'procesando' | 'confirmacion' | 'formulario';
type AuthProvider = 'linkedin_oidc' | 'google' | 'email';
type ImportSource = 'linkedin' | 'cv';

interface ImportCounts {
  experiencias: number;
  educacion: number;
  habilidades: number;
  idiomas: number;
  logros: number;
  certificaciones: number;
}
interface ImportResult {
  source: ImportSource;
  completitud: number;
  counts: ImportCounts;
}

function slugFromLinkedInUrl(url?: string | null): string {
  if (!url) return '';
  const m = url.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  return m ? m[1].replace(/\/+$/, '') : '';
}

// Normaliza lo que el usuario escribe/pega en un input de LinkedIn a SOLO el slug.
// Pegue la URL completa (con o sin https/www) o solo el slug: siempre queda el slug.
function linkedInSlugFromInput(value: string): string {
  const v = value.trim();
  const m = v.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  return m ? m[1].replace(/\/+$/, '') : v.replace(/^\/+|\/+$/g, '');
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const CV_ACCEPT = `application/pdf,.pdf,${DOCX_MIME},.docx,text/plain,.txt`;
// Devuelve un mensaje de error si el archivo no es válido, o null si está OK.
function validateCvFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const ok =
    file.type === 'application/pdf' || name.endsWith('.pdf') ||
    file.type === DOCX_MIME         || name.endsWith('.docx') ||
    file.type === 'text/plain'      || name.endsWith('.txt');
  if (!ok) return 'Solo aceptamos PDF o Word (.docx).';
  if (file.size > 10 * 1024 * 1024) return 'El archivo es muy grande. Máximo 10 MB.';
  return null;
}

export default function OnboardingPage() {
  const router   = useRouter();
  const supabase = createClient();
  const { updateProfile } = useProfile();

  const [userEmail, setUserEmail]   = useState('');
  const [userMeta, setUserMeta]     = useState<{ nombre: string; apellido: string; foto_url: string }>({ nombre: '', apellido: '', foto_url: '' });
  const [authProvider, setAuthProvider] = useState<AuthProvider>('email');
  const [initLoading, setInitLoading] = useState(true);

  const [view, setView] = useState<View>('eleccion');
  const [initialLinkedinUrl, setInitialLinkedinUrl] = useState('');
  const [importSource, setImportSource]   = useState<ImportSource | null>(null);
  const [importResult, setImportResult]   = useState<ImportResult | null>(null);
  const [importError, setImportError]     = useState(false);
  const [importedFields, setImportedFields] = useState<Record<string, string>>({});
  const [importAttempt, setImportAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        if (isMounted) {
          setUserEmail(user.email || '');

          const provider = user.app_metadata?.provider;
          setAuthProvider(provider === 'linkedin_oidc' || provider === 'google' ? provider : 'email');

          // Pre-fill from OAuth provider metadata (LinkedIn, Google)
          const meta = user.user_metadata ?? {};
          const fullName: string = meta.full_name || meta.name || '';
          const [given = '', ...rest] = fullName.trim().split(' ');
          setUserMeta({
            nombre:   meta.given_name  || given        || '',
            apellido: meta.family_name || rest.join(' ') || '',
            foto_url: meta.avatar_url  || meta.picture  || '',
          });

          setInitLoading(false);
        }
      } catch {
        if (isMounted) router.replace('/login');
      }
    }
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  async function handleFormContinue(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // upsert instead of update: new users have no profile row yet (no DB trigger
      // auto-creates it), so a plain UPDATE silently affects 0 rows and all data is lost.
      await supabase.from('profiles').upsert({
        id: user.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email_cv: data.emailCv,
        profesion_perfil: data.profesion || null,
        linkedin_url: data.linkedinUrl ? `https://www.linkedin.com/in/${data.linkedinUrl.trim()}/` : null,
        telefono: data.telefono || null,
        ciudad: data.ciudad || null,
        pais: data.pais || null,
        foto_url: data.foto_url || null,
        onboarding_completado: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Sync the in-memory ProfileContext so the sidebar avatar/name update
      // immediately without waiting for the hard-reload.
      updateProfile({
        nombre: data.nombre,
        apellido: data.apellido,
        email_cv: data.emailCv,
        profesion_perfil: data.profesion || null,
        linkedin_url: data.linkedinUrl ? `https://www.linkedin.com/in/${data.linkedinUrl.trim()}/` : null,
        telefono: data.telefono || null,
        ciudad: data.ciudad || null,
        pais: data.pais || null,
        foto_url: data.foto_url || null,
      });
    }
    // Hard navigation forces the layout to re-mount and re-fetch the profile,
    // so the sidebar shows the name/photo from onboarding immediately.
    window.location.href = '/profile';
  }

  // Fuente de verdad: cuenta secciones y calcula la completitud con la misma
  // función canónica que usan /perfil y /crear-cv, para que el % sea consistente.
  async function fetchImportSummary(): Promise<{ counts: ImportCounts; completitud: number }> {
    const emptyCounts: ImportCounts = { experiencias: 0, educacion: 0, habilidades: 0, idiomas: 0, logros: 0, certificaciones: 0 };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { counts: emptyCounts, completitud: 0 };

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

  async function startLinkedInImport(slug: string) {
    if (!slug) return;
    setImportAttempt(n => n + 1);
    setImportSource('linkedin');
    setImportError(false);
    setInitialLinkedinUrl(slug);
    setView('procesando');
    try {
      const res = await fetch('/api/profile/hydrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: `linkedin.com/in/${slug}` }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setImportError(true); return; }
      setImportedFields(data.patch || {});
      const { counts, completitud } = await fetchImportSummary();
      setImportResult({ source: 'linkedin', completitud, counts });
      setView('confirmacion');
    } catch {
      setImportError(true);
    }
  }

  async function startCVImport(file: File) {
    setImportAttempt(n => n + 1);
    setImportSource('cv');
    setImportError(false);
    setImportedFields({});
    setView('procesando');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/parse-document', { method: 'POST', body: fd });
      if (!res.ok) { setImportError(true); return; }
      const { counts, completitud } = await fetchImportSummary();
      setImportResult({ source: 'cv', completitud, counts });
      setView('confirmacion');
    } catch {
      setImportError(true);
    }
  }

  // "Reintentar" vuelve a la pantalla de elección para decidir (LinkedIn u otro CV),
  // en vez de repetir el mismo import y caer en un bucle si el error persiste.
  function retryImport() {
    setImportError(false);
    setView('eleccion');
  }

  if (initLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  if (view === 'eleccion') {
    const firstName = userMeta.nombre?.split(' ')[0] || userEmail.split('@')[0] || '';
    return (
      <OnboardingChoice
        firstName={firstName}
        provider={authProvider}
        onManual={() => { setInitialLinkedinUrl(''); setView('formulario'); }}
        onLinkedIn={(slug) => startLinkedInImport(slug)}
        onUploadCV={(file) => startCVImport(file)}
      />
    );
  }

  if (view === 'procesando') {
    return (
      <ProcessingView
        key={importAttempt}
        source={importSource}
        error={importError}
        onRetry={retryImport}
        onManual={() => { setImportError(false); setView('formulario'); }}
      />
    );
  }

  if (view === 'confirmacion' && importResult) {
    return (
      <ConfirmationView
        result={importResult}
        detectedName={[importedFields.nombre, importedFields.apellido].filter(Boolean).join(' ')}
        onContinue={() => setView('formulario')}
      />
    );
  }

  return (
    <OnboardingForm
      email={userEmail}
      initialNombre={importedFields.nombre || userMeta.nombre}
      initialApellido={importedFields.apellido || userMeta.apellido}
      initialProfesion={importedFields.profesion || ''}
      initialCiudad={importedFields.ciudad || ''}
      initialPais={importedFields.pais || ''}
      initialFotoUrl={importedFields.foto_url || ''}
      oauthFotoUrl={userMeta.foto_url}
      initialLinkedinUrl={initialLinkedinUrl}
      importedFrom={importSource}
      onImportLinkedIn={(slug) => startLinkedInImport(slug)}
      onImportCV={(file) => startCVImport(file)}
      onContinue={(data) => handleFormContinue(data)}
    />
  );
}

/* ── Step 0: Choice screen (overlay a pantalla completa con blur) ─────── */
function OnboardingChoice({
  firstName,
  provider,
  onManual,
  onLinkedIn,
  onUploadCV,
}: {
  firstName: string;
  provider: AuthProvider;
  onManual: () => void;
  onLinkedIn: (slug: string) => void;
  onUploadCV: (file: File) => void;
}) {
  const [liUrl, setLiUrl]     = useState('');
  const [liFocus, setLiFocus] = useState(false);
  const [cvError, setCvError] = useState('');
  const [cvDrag, setCvDrag]   = useState(false);
  const [hoverCard, setHoverCard] = useState<'none' | 'linkedin' | 'cv'>('none');
  const cvInputRef = useRef<HTMLInputElement>(null);

  function handleCvFile(file: File) {
    const err = validateCvFile(file);
    if (err) { setCvError(err); return; }
    setCvError('');
    onUploadCV(file);
  }
  function onCVSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (file) handleCvFile(file);
  }

  const name = firstName ? `, ${firstName}` : '';
  const greeting = provider === 'linkedin_oidc'
    ? {
        title: `Hola${name}`,
        subtitle: 'Ya nos conocemos. Para crear tu CV en segundos, importa el resto de tu perfil de LinkedIn o sube un CV que ya tengas.',
      }
    : {
        title: `Bienvenido${name}`,
        subtitle: '¿Cómo quieres empezar? Importa tu LinkedIn o sube tu CV actual y rellenamos los datos automáticamente.',
      };

  const liSlug = linkedInSlugFromInput(liUrl);

  const cardBase: React.CSSProperties = {
    background: 'var(--surface-2)', borderRadius: 16, padding: 24,
    display: 'flex', flexDirection: 'column', gap: 18,
    transition: 'all .2s var(--ease)',
  };

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', padding: 24, overflowY: 'auto' }}>
      {/* Backdrop oscurecido + blur (cubre el sidebar) */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />

      {/* Card contenedora */}
      <div style={{
        position: 'relative', zIndex: 1, margin: 'auto', width: '100%', maxWidth: 760,
        background: 'var(--surface)', borderRadius: 22, padding: '38px 40px',
        boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 8px 24px rgba(15,23,42,.1)',
        animation: 'fadeUp .4s var(--ease) both',
      }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 25, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
            {greeting.title}
          </h1>
          <p style={{ margin: '0 auto', maxWidth: 480, color: 'var(--mute)', fontSize: 14.5, lineHeight: 1.5 }}>
            {greeting.subtitle}
          </p>
        </div>

        {/* Two cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 28 }}>
          {/* LinkedIn */}
          <div
            onMouseEnter={() => setHoverCard('linkedin')}
            onMouseLeave={() => setHoverCard('none')}
            style={{
              ...cardBase,
              border: `1.5px solid ${hoverCard === 'linkedin' || liFocus ? 'var(--blue)' : 'var(--line)'}`,
              boxShadow: hoverCard === 'linkedin' ? 'var(--sh-2)' : 'none',
              transform: hoverCard === 'linkedin' ? 'translateY(-2px)' : 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: '#0A66C2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(10,102,194,.22)' }}>
                <LinkedInIcon size={26} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.01em' }}>Importar de LinkedIn</div>
                <div style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.45, marginTop: 2 }}>Pega tu URL y rellenamos tu perfil.</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'stretch', height: 46, overflow: 'hidden',
                background: 'var(--surface)',
                border: `1.5px solid ${liFocus ? 'var(--blue)' : 'var(--line)'}`,
                borderRadius: 11,
                boxShadow: liFocus ? '0 0 0 3px rgba(75,107,251,.12)' : 'none',
                transition: 'all .15s var(--ease)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 13, paddingRight: 8, fontSize: 13.5, color: 'var(--mute)', whiteSpace: 'nowrap', userSelect: 'none' }}>linkedin.com/in/</span>
                <input
                  value={liUrl}
                  onChange={e => setLiUrl(linkedInSlugFromInput(e.target.value))}
                  onFocus={() => setLiFocus(true)}
                  onBlur={() => setLiFocus(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && liSlug) onLinkedIn(liSlug); }}
                  placeholder="tu-nombre"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', paddingRight: 12, fontSize: 13.5, color: 'var(--ink)', minWidth: 0 }}
                />
              </div>
              <button type="button" disabled={!liSlug} onClick={() => onLinkedIn(liSlug)}
                style={{
                  width: '100%', height: 46, borderRadius: 11, border: 'none',
                  background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 14.5,
                  cursor: liSlug ? 'pointer' : 'not-allowed', opacity: liSlug ? 1 : .55,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all .15s var(--ease)',
                }}>
                Importar perfil <ChevRIcon size={16} />
              </button>
            </div>
          </div>

          {/* CV */}
          <div
            onMouseEnter={() => setHoverCard('cv')}
            onMouseLeave={() => setHoverCard('none')}
            style={{
              ...cardBase,
              border: `1.5px solid ${hoverCard === 'cv' || cvDrag ? 'var(--blue)' : 'var(--line)'}`,
              boxShadow: hoverCard === 'cv' ? 'var(--sh-2)' : 'none',
              transform: hoverCard === 'cv' ? 'translateY(-2px)' : 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'var(--deep)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(26,31,54,.22)' }}>
                <DocIcon size={25} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.01em' }}>Subir un CV</div>
                <div style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.45, marginTop: 2 }}>Extraemos tus datos de un PDF o Word.</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
              {cvError && <div style={{ fontSize: 12.5, color: 'var(--danger)', lineHeight: 1.45 }}>{cvError}</div>}
              <input ref={cvInputRef} type="file" accept={CV_ACCEPT} onChange={onCVSelected} style={{ display: 'none' }} />
              <div
                onClick={() => cvInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setCvDrag(true); }}
                onDragLeave={() => setCvDrag(false)}
                onDrop={e => { e.preventDefault(); setCvDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleCvFile(f); }}
                style={{
                  border: `1.5px dashed ${cvDrag ? 'var(--blue)' : 'var(--line)'}`,
                  borderRadius: 12, padding: '16px',
                  background: cvDrag ? 'var(--blue-50)' : 'var(--surface)',
                  textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  height: 102, transition: 'all .15s var(--ease)',
                }}>
                <span style={{ color: cvDrag ? 'var(--blue)' : 'var(--mute)' }}><UploadIcon size={24} /></span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--deep)' }}>
                  Arrastra o <span style={{ color: 'var(--blue)' }}>haz clic para subir</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>PDF o Word · Máx 10 MB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 24px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500 }}>o si prefieres</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {/* Manual + tip */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <button type="button" onClick={onManual}
            style={{
              padding: '12px 26px', borderRadius: 12,
              border: '1.5px solid var(--line)', background: 'var(--surface)',
              color: 'var(--ink)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--line)'; }}>
            Completar manualmente <ChevRIcon size={15} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--mute)', fontSize: 13 }}>
            <IdeaIcon size={14} />
            Podrás importar tus datos también más adelante.
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

/* ── Step 2: Processing (carrusel de pasos, sin datos numéricos) ──────── */
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

function ProcessingView({
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

  // El padre remonta esta vista en cada intento (key=importAttempt), por lo que el
  // estado arranca fresco (current=0, slow=false) sin necesidad de resets síncronos.
  useEffect(() => {
    if (error) return;
    // Carrusel estimado: avanza por los pasos y se queda en el último hasta que
    // el import real termine (el padre desmonta esta vista al pasar a confirmación).
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
      {/* Header */}
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

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px',
              opacity: done || active ? 1 : .45, transition: 'opacity .3s var(--ease)',
            }}>
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
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : 500,
                color: done ? 'var(--ink)' : active ? 'var(--deep)' : 'var(--mute)',
              }}>
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

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', padding: 24, overflowY: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', zIndex: 1, margin: 'auto', width: '100%', maxWidth: 460 }}>
        {inner}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

/* ── Step 3: Confirmation (resumen del import, copy según completitud) ── */
function ConfirmationView({
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
    ? {
        title: '¡Listo! Tu perfil quedó muy completo',
        message: <>Revisa que todo esté correcto y continúa<br />para crear tu CV.</>,
        cta: 'Verificar mis datos',
      }
    : completitud >= 30
    ? {
        title: 'Importamos tu perfil',
        message: 'Tenemos una buena base. Revisa tus datos y completa lo que falte en el siguiente paso.',
        cta: 'Continuar',
      }
    : {
        title: 'Importamos algunos datos',
        message: 'Pudimos extraer algo de información, pero aún falta bastante. Lo completas en el siguiente paso.',
        cta: 'Completar mi perfil',
      };

  const barColor = completitud >= 70 ? 'var(--success)' : completitud >= 30 ? 'var(--blue)' : 'var(--warn)';

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', padding: 24, overflowY: 'auto' }}>
      {/* Backdrop oscurecido + blur (cubre el sidebar) */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />

      {/* Card centrada — compacta, sin scroll interno */}
      <div style={{
        position: 'relative', zIndex: 1, margin: 'auto', width: '100%', maxWidth: 460,
        background: 'var(--surface)', borderRadius: 22, padding: '30px 32px',
        boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 8px 24px rgba(15,23,42,.1)',
        animation: 'fadeUp .4s var(--ease) both',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 60, height: 60, margin: '0 auto 14px', borderRadius: '50%',
            background: 'var(--success-50)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 5px rgba(34,197,94,.08)',
          }}>
            <CheckIcon size={30} />
          </div>
          <h2 style={{ margin: '0 0 7px', fontSize: 21, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
            {variant.title}
          </h2>
          <p style={{ margin: '0 auto', maxWidth: 360, color: 'var(--mute)', fontSize: 14, lineHeight: 1.5 }}>
            {variant.message}
          </p>
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
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

/* ── Step 1: Form ────────────────────────────────────────────────────── */
function OnboardingForm({
  email,
  initialNombre = '',
  initialApellido = '',
  initialProfesion = '',
  initialCiudad = '',
  initialPais = '',
  initialFotoUrl = '',
  oauthFotoUrl = '',
  initialLinkedinUrl = '',
  importedFrom = null,
  onImportLinkedIn,
  onImportCV,
  onContinue,
}: {
  email: string;
  initialNombre?: string;
  initialApellido?: string;
  initialProfesion?: string;
  initialCiudad?: string;
  initialPais?: string;
  initialFotoUrl?: string;   // URL ya alojada en nuestro Storage (p.ej. import de LinkedIn) — se usa directa
  oauthFotoUrl?: string;     // URL externa del proveedor OAuth — se descarga y re-sube a Storage
  initialLinkedinUrl?: string;
  importedFrom?: ImportSource | null;
  onImportLinkedIn: (slug: string) => void;
  onImportCV: (file: File) => void;
  onContinue: (d: FormData) => void;
}) {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);
  const { registerGuard, unregisterGuard, setSaveAndContinue } = useNavigationGuard();

  const [form, setForm] = useState<FormData>({
    nombre: initialNombre, apellido: initialApellido, profesion: initialProfesion,
    emailCv: email || '',
    linkedinUrl: initialLinkedinUrl,
    telefono: '', ciudad: initialCiudad, pais: initialPais, foto_url: initialFotoUrl,
  });
  const [photoHover, setPhotoHover]       = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [dirty, setDirty]                 = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportedBanner, setShowImportedBanner] = useState(true);

  // Al montar: leer el perfil real de la BD (fuente de verdad tras un import) y
  // fusionar todos los campos sobre los valores iniciales. La foto se resuelve una
  // sola vez aquí para evitar carreras: si ya hay foto (BD o import interno) se usa;
  // si no hay ninguna, se descarga la del proveedor OAuth (URL externa).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!mounted) return;

      if (p) {
        setForm(f => ({
          ...f,
          nombre:      p.nombre?.trim()           || f.nombre,
          apellido:    p.apellido?.trim()         || f.apellido,
          profesion:   p.profesion_perfil?.trim() || f.profesion,
          emailCv:     p.email_cv?.trim()         || f.emailCv,
          telefono:    p.telefono?.trim()         || f.telefono,
          ciudad:      p.ciudad?.trim()           || f.ciudad,
          pais:        p.pais?.trim()             || f.pais,
          linkedinUrl: slugFromLinkedInUrl(p.linkedin_url) || f.linkedinUrl,
          foto_url:    p.foto_url                 || f.foto_url,
        }));
      }

      const hasPhoto = !!(p?.foto_url || initialFotoUrl);
      if (!hasPhoto && oauthFotoUrl) {
        setUploading(true);
        try {
          const res = await fetch('/api/profile/avatar-from-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: oauthFotoUrl }),
          });
          const data = await res.json();
          // Actualización programática: setForm directo para no marcar el formulario "dirty".
          if (data.url && mounted) setForm(f => ({ ...f, foto_url: data.url }));
        } catch { /* ignore */ }
        finally { if (mounted) setUploading(false); }
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [liFocus, setLiFocus]             = useState(false);

  // Cualquier cambio del usuario marca el formulario como "dirty" para avisar
  // antes de reemplazar datos con una importación.
  function set(k: keyof FormData, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const blobUrl = URL.createObjectURL(f);
    set('foto_url', blobUrl);
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext  = f.name.split('.').pop();
      const path = `${user.id}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
      if (error) {
        // Upload failed — remove the temporary blobUrl so it isn't saved to the DB
        set('foto_url', '');
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      set('foto_url', publicUrl);
    } catch {
      set('foto_url', '');
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto(e: React.MouseEvent) {
    e.stopPropagation();
    set('foto_url', '');
    if (fileRef.current) fileRef.current.value = '';
  }

  const emailValid   = /^\S+@\S+\.\S+$/.test(form.emailCv);
  const canContinue  = !!form.nombre && !!form.apellido && emailValid && !uploading;

  // Refs con el estado más reciente para que la callback del guard (registrada una
  // sola vez al montar) siempre lea los valores actuales del formulario.
  const formRef = useRef(form);
  const canContinueRef = useRef(canContinue);
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    formRef.current = form;
    canContinueRef.current = canContinue;
    onContinueRef.current = onContinue;
  });

  // Guard del onboarding: si el usuario intenta salir por el sidebar sin guardar,
  // el popup ofrece "Guardar y continuar", que ejecuta esta callback.
  useEffect(() => {
    registerGuard('onboarding');
    setSaveAndContinue(async () => {
      if (!canContinueRef.current) return false;
      await onContinueRef.current(formRef.current);
      return true;
    });
    return () => { unregisterGuard(); setSaveAndContinue(null); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    onContinue(form);
  }

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
            Vamos a crear tu CV
          </h2>
          <p style={{ margin: 0, color: 'var(--mute)', fontSize: 13.5, lineHeight: 1.55 }}>
            Primero, cuéntanos sobre ti. Estos datos nos ayudarán a generar tu CV profesional.
          </p>
        </div>

        <div style={{ padding: '28px 40px 32px' }}>
          {/* Banner de contexto post-import — informa la fuente, descartable */}
          {importedFrom && showImportedBanner && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', marginBottom: 16,
              background: 'var(--success-50)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 10,
            }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: 'var(--success)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={11} />
              </span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--deep)' }}>
                Campos importados desde {importedFrom === 'cv' ? 'tu CV' : 'LinkedIn'} · Puedes editar cualquier dato.
              </span>
              <button type="button" onClick={() => setShowImportedBanner(false)} aria-label="Cerrar"
                style={{ border: 'none', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', padding: 2, flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}

          {/* Importar datos — siempre visible, permite traer LinkedIn/CV sin volver atrás */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', marginBottom: 24,
            background: 'var(--lav)', border: '1px solid var(--line)', borderRadius: 12,
          }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'var(--surface)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)' }}>
              <IdeaIcon size={17} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--deep)' }}>
                {importedFrom ? '¿Actualizar tus datos?' : '¿Tienes LinkedIn o un CV?'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>
                {importedFrom
                  ? 'Vuelve a importar desde LinkedIn o un CV anterior.'
                  : 'Impórtalo y te ahorras rellenar todo a mano.'}
              </div>
            </div>
            <button type="button" onClick={() => setShowImportModal(true)}
              style={{
                flexShrink: 0, padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}>
              <UploadIcon size={14} /> {importedFrom ? 'Actualizar datos' : 'Importar datos'}
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
                {/* Inner circle — overflow:hidden only here so the camera badge isn't clipped */}
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
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    background: 'var(--hover)', color: 'var(--mute)', border: '1px solid var(--line)',
                  }}>Opcional</span>
                </div>
                <div style={{ color: 'var(--mute)', fontSize: 12.5, lineHeight: 1.5 }}>
                  Una buena foto aumenta la confianza de los reclutadores.<br />
                  Formato JPG o PNG · mínimo 200×200 px.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                      border: '1px solid var(--line)', background: 'var(--surface)',
                      color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <UploadIcon size={13} />
                    {form.foto_url ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {form.foto_url && (
                    <button type="button" onClick={clearPhoto}
                      style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                        border: 'none', background: 'transparent', color: 'var(--mute)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
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
              <button type="submit" disabled={!canContinue}
                style={{
                  minWidth: 200, padding: '13px 22px', borderRadius: 10,
                  background: canContinue ? 'var(--blue)' : 'var(--line)',
                  color: canContinue ? '#fff' : 'var(--mute)',
                  fontWeight: 600, fontSize: 15, border: 'none',
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all .18s var(--ease)',
                  boxShadow: canContinue ? '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.4)' : 'none',
                }}>
                Guardar y continuar
                <ChevRIcon size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

      {showImportModal && typeof document !== 'undefined' && createPortal(
        <ImportDataModal
          dirty={dirty}
          onClose={() => setShowImportModal(false)}
          onImportLinkedIn={onImportLinkedIn}
          onImportCV={onImportCV}
        />,
        document.body,
      )}
    </>
  );
}

/* ── Modal: Importar datos (LinkedIn / CV) desde el formulario ────────── */
function ImportDataModal({
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

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: 'var(--surface)', borderRadius: 18, boxShadow: '0 20px 60px -15px rgba(15,23,42,.35)', overflow: 'hidden', animation: 'fadeUp .2s var(--ease) both' }}>
        {/* Header */}
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
            {/* LinkedIn */}
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

            {/* CV */}
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
    </div>
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

/* ── Inline SVG icons ────────────────────────────────────────────────── */
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
function DocIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>;
}
function IdeaIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>;
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
function ChevRIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;
}
function CheckIcon({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 6"/></svg>;
}
