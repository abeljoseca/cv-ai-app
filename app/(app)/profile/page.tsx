'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma, Certificacion } from '@/types';
import { Select } from '@/components/Select';
import { calcularPuntajeCompletitud } from '@/lib/completitud';
import { isLikelySoft } from '@/lib/skill-classification';
import MonthYearField from '@/components/profile/MonthYearField';
import { formatProfileDate, normalizeProfileDate } from '@/lib/profile-date';
import { CEFR_HINTS, CEFR_LABELS, CEFR_LEVELS, CefrLevel, normalizeCefr } from '@/lib/cefr';

interface ChatMessage { role: 'ai' | 'user'; text: string; }
interface ExpForm { empresa: string; cargo: string; fecha_inicio: string; fecha_fin: string; activo: boolean; descripcion: string; }
interface EduForm { institucion: string; titulo: string; area: string; fecha_inicio: string; fecha_fin: string; }
interface IdiomaForm { nombre: string; nivel_cefr: string; }

const CEFR_OPTIONS = CEFR_LEVELS.map(l => ({ value: l, label: CEFR_LABELS[l] }));

function dateRange(inicio: string | null, fin: string | null, activo = false): string {
  const a = formatProfileDate(inicio);
  const b = activo ? 'Actualidad' : formatProfileDate(fin);
  if (!a && !b) return '';
  return `${a || '—'} · ${b || '—'}`;
}
interface CertForm { titulo: string; institucion: string; anio_egreso: string; }

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();
  // Tracks skills explicitly saved as "blanda" this session → survives DB reload reclassification
  const localSoftNamesRef = useRef<Set<string>>(new Set());

  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [educaciones, setEducaciones] = useState<Educacion[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [idiomas, setIdiomas] = useState<Idioma[]>([]);
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completitud, setCompletitud] = useState(0);

  const [editSection, setEditSection] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Habilidades new + pending delete
  const [hardInput, setHardInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [pendingHard, setPendingHard] = useState<string[]>([]);
  const [pendingSoft, setPendingSoft] = useState<string[]>([]);
  const [pendingHardDeleteIds, setPendingHardDeleteIds] = useState<string[]>([]);
  const [pendingSoftDeleteIds, setPendingSoftDeleteIds] = useState<string[]>([]);
  const [expandedHard, setExpandedHard] = useState(false);
  const [expandedSoft, setExpandedSoft] = useState(false);

  // Section add forms
  const emptyExp: ExpForm = { empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', activo: false, descripcion: '' };
  const emptyEdu: EduForm = { institucion: '', titulo: '', area: '', fecha_inicio: '', fecha_fin: '' };
  const emptyCert: CertForm = { titulo: '', institucion: '', anio_egreso: '' };
  const [newExp, setNewExp] = useState<ExpForm>(emptyExp);
  const [newEdu, setNewEdu] = useState<EduForm>(emptyEdu);
  const [newCert, setNewCert] = useState<CertForm>(emptyCert);
  const [newIdioma, setNewIdioma] = useState<IdiomaForm>({ nombre: '', nivel_cefr: '' });
  const [newLogro, setNewLogro] = useState('');
  const [newLogroExpId, setNewLogroExpId] = useState('');

  // Pending deletes per section
  const [pendingExpDeleteIds, setPendingExpDeleteIds] = useState<string[]>([]);
  const [pendingEduDeleteIds, setPendingEduDeleteIds] = useState<string[]>([]);
  const [pendingCertDeleteIds, setPendingCertDeleteIds] = useState<string[]>([]);
  const [pendingIdiomaDeleteIds, setPendingIdiomaDeleteIds] = useState<string[]>([]);
  const [pendingLogroDeleteIds, setPendingLogroDeleteIds] = useState<string[]>([]);

  // Inline edit state for existing entries
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExpForm, setEditExpForm] = useState<ExpForm>(emptyExp);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [editEduForm, setEditEduForm] = useState<EduForm>(emptyEdu);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editCertForm, setEditCertForm] = useState<CertForm>(emptyCert);
  const [editingIdiomaId, setEditingIdiomaId] = useState<string | null>(null);
  const [editIdiomaForm, setEditIdiomaForm] = useState<IdiomaForm>({ nombre: '', nivel_cefr: '' });
  const [editingLogroId, setEditingLogroId] = useState<string | null>(null);
  const [editLogroText, setEditLogroText] = useState('');
  const [editLogroExpId, setEditLogroExpId] = useState('');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatUserIdRef = useRef<string | null>(null);

  useEffect(() => { loadProfileData(); }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  // Persist chat to localStorage whenever messages change
  useEffect(() => {
    const uid = chatUserIdRef.current;
    if (!uid || messages.length === 0) return;
    try { localStorage.setItem(`chat_perfil_${uid}`, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Clear chat on sign out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setMessages([]);
        const uid = chatUserIdRef.current;
        if (uid) { try { localStorage.removeItem(`chat_perfil_${uid}`); } catch {} }
        chatUserIdRef.current = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfileData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load persisted chat on first mount (only if not already loaded)
      if (!chatUserIdRef.current) {
        chatUserIdRef.current = user.id;
        try {
          const stored = localStorage.getItem(`chat_perfil_${user.id}`);
          if (stored) {
            const parsed: ChatMessage[] = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
          }
        } catch {}
      }
      const [
        { data: profileData }, { data: expData }, { data: eduData },
        { data: habData }, { data: logroData }, { data: idiomaData }, { data: certData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('experiencia').select('*').eq('user_id', user.id),
        supabase.from('educacion').select('*').eq('user_id', user.id),
        supabase.from('habilidades').select('*').eq('user_id', user.id),
        supabase.from('logros').select('*').eq('user_id', user.id),
        supabase.from('idiomas').select('*').eq('user_id', user.id),
        supabase.from('certificaciones').select('*').eq('user_id', user.id).order('anio_egreso', { ascending: false }),
      ]);
      if (profileData) setProfile(profileData as Profile);
      if (expData) {
        const sorted = (expData as Experiencia[]).sort((a, b) =>
          (b.fecha_inicio || '').localeCompare(a.fecha_inicio || '')
        );
        setExperiencias(sorted);
      }
      if (eduData) setEducaciones(eduData as Educacion[]);
      if (habData) setHabilidades(habData as Habilidad[]);
      if (logroData) setLogros(logroData as Logro[]);
      if (idiomaData) setIdiomas(idiomaData as Idioma[]);
      if (certData) setCertificaciones(certData as Certificacion[]);
      if (profileData) {
        setCompletitud(calcularPuntajeCompletitud(profileData as Profile, expData || [], eduData || [], habData || [], logroData || [], idiomaData || []));
      }
    } catch (err) { console.error('Error loading profile:', err); }
    finally { setLoading(false); }
  }

  // Classification: session tracking takes priority over heuristic
  function isDisplaySoft(nombre: string) {
    return localSoftNamesRef.current.has(nombre.toLowerCase()) || isLikelySoft(nombre);
  }

  function toggleEdit(section: string) {
    if (editSection === section) {
      setEditSection(null);
      setEditingExpId(null); setEditingEduId(null); setEditingIdiomaId(null); setEditingLogroId(null); setEditingCertId(null);
      // Clear pending deletes (cancel = restore)
      if (section === 'habilidades') { setPendingHardDeleteIds([]); setPendingSoftDeleteIds([]); }
      if (section === 'experiencia') setPendingExpDeleteIds([]);
      if (section === 'educacion') setPendingEduDeleteIds([]);
      if (section === 'certificaciones') setPendingCertDeleteIds([]);
      if (section === 'idiomas') setPendingIdiomaDeleteIds([]);
      if (section === 'logros') setPendingLogroDeleteIds([]);
    } else {
      setEditSection(section);
    }
  }

  function toggleHardDelete(id: string) {
    setPendingHardDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleSoftDelete(id: string) {
    setPendingSoftDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleExpDelete(id: string) {
    setPendingExpDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleEduDelete(id: string) {
    setPendingEduDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleIdiomaDelete(id: string) {
    setPendingIdiomaDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleLogroDelete(id: string) {
    setPendingLogroDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleCertDelete(id: string) {
    setPendingCertDeleteIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function saveHabilidades() {
    setEditSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const allDeleteIds = [...pendingHardDeleteIds, ...pendingSoftDeleteIds];
      if (allDeleteIds.length > 0) {
        await supabase.from('habilidades').delete().in('id', allDeleteIds);
      }
      // Deduplicate against existing before inserting
      const existingNames = habilidades.map(h => h.nombre.toLowerCase());
      const uniqueHard = pendingHard.filter(n => !existingNames.includes(n.toLowerCase()));
      const uniqueSoft = pendingSoft.filter(n => !existingNames.includes(n.toLowerCase()));
      const allNew = [
        ...uniqueHard.map(n => ({ nombre: n, tipo: 'tecnica' as const })),
        ...uniqueSoft.map(n => ({ nombre: n, tipo: 'blanda'  as const })),
      ];
      if (allNew.length > 0) {
        uniqueSoft.forEach(n => localSoftNamesRef.current.add(n.toLowerCase()));
        await supabase.from('habilidades').insert(allNew.map(h => ({ user_id: user.id, ...h })));
      }
      setPendingHard([]); setPendingSoft([]);
      setPendingHardDeleteIds([]); setPendingSoftDeleteIds([]);
      setEditSection(null);
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function saveExperiencia() {
    setEditSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (pendingExpDeleteIds.length > 0) {
        await supabase.from('experiencia').delete().in('id', pendingExpDeleteIds);
        setPendingExpDeleteIds([]);
      }
      if (newExp.empresa && newExp.cargo) {
        await supabase.from('experiencia').insert({
          user_id: user.id, empresa: newExp.empresa, cargo: newExp.cargo,
          fecha_inicio: normalizeProfileDate(newExp.fecha_inicio),
          fecha_fin: newExp.activo ? null : normalizeProfileDate(newExp.fecha_fin),
          activo: newExp.activo, descripcion: newExp.descripcion || null,
        });
        setNewExp(emptyExp);
      }
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function updateExperiencia(id: string) {
    setEditSaving(true);
    try {
      await supabase.from('experiencia').update({
        empresa: editExpForm.empresa, cargo: editExpForm.cargo,
        fecha_inicio: normalizeProfileDate(editExpForm.fecha_inicio),
        fecha_fin: editExpForm.activo ? null : normalizeProfileDate(editExpForm.fecha_fin),
        activo: editExpForm.activo, descripcion: editExpForm.descripcion || null,
      }).eq('id', id);
      setEditingExpId(null);
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function saveEducacion() {
    setEditSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (pendingEduDeleteIds.length > 0) {
        await supabase.from('educacion').delete().in('id', pendingEduDeleteIds);
        setPendingEduDeleteIds([]);
      }
      if (newEdu.institucion && newEdu.titulo) {
        await supabase.from('educacion').insert({
          user_id: user.id, institucion: newEdu.institucion, titulo: newEdu.titulo,
          area: newEdu.area || null,
          fecha_inicio: normalizeProfileDate(newEdu.fecha_inicio),
          fecha_fin: normalizeProfileDate(newEdu.fecha_fin),
        });
        setNewEdu(emptyEdu);
      }
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function updateEducacion(id: string) {
    setEditSaving(true);
    try {
      await supabase.from('educacion').update({
        institucion: editEduForm.institucion, titulo: editEduForm.titulo,
        area: editEduForm.area || null,
        fecha_inicio: normalizeProfileDate(editEduForm.fecha_inicio),
        fecha_fin: normalizeProfileDate(editEduForm.fecha_fin),
      }).eq('id', id);
      setEditingEduId(null);
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function saveIdioma() {
    setEditSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (pendingIdiomaDeleteIds.length > 0) {
        await supabase.from('idiomas').delete().in('id', pendingIdiomaDeleteIds);
        setPendingIdiomaDeleteIds([]);
      }
      if (newIdioma.nombre) {
        const nivelCefr = normalizeCefr(newIdioma.nivel_cefr);
        // The legacy `nivel` label is kept in sync so older readers show the same level.
        await supabase.from('idiomas').insert({ user_id: user.id, nombre: newIdioma.nombre, nivel_cefr: nivelCefr, nivel: nivelCefr });
        setNewIdioma({ nombre: '', nivel_cefr: '' });
      }
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function updateIdioma(id: string) {
    setEditSaving(true);
    try {
      const nivelCefr = normalizeCefr(editIdiomaForm.nivel_cefr);
      // Without a chosen level, the legacy label is left untouched (never overwritten with null).
      await supabase.from('idiomas').update({
        nombre: editIdiomaForm.nombre,
        nivel_cefr: nivelCefr,
        ...(nivelCefr ? { nivel: nivelCefr } : {}),
      }).eq('id', id);
      setEditingIdiomaId(null);
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function saveLogro() {
    setEditSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (pendingLogroDeleteIds.length > 0) {
        await supabase.from('logros').delete().in('id', pendingLogroDeleteIds);
        setPendingLogroDeleteIds([]);
      }
      if (newLogro.trim()) {
        await supabase.from('logros').insert({ user_id: user.id, descripcion: newLogro.trim(), experiencia_id: newLogroExpId || null });
        setNewLogro('');
        setNewLogroExpId('');
      }
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function updateLogro(id: string) {
    if (!editLogroText.trim()) return;
    setEditSaving(true);
    try {
      await supabase.from('logros').update({ descripcion: editLogroText.trim(), experiencia_id: editLogroExpId || null }).eq('id', id);
      setEditingLogroId(null);
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function saveCertificacion() {
    setEditSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (pendingCertDeleteIds.length > 0) {
        await supabase.from('certificaciones').delete().in('id', pendingCertDeleteIds);
        setPendingCertDeleteIds([]);
      }
      if (newCert.titulo.trim() && newCert.institucion.trim()) {
        await supabase.from('certificaciones').insert({
          user_id: user.id,
          titulo: newCert.titulo.trim(),
          institucion: newCert.institucion.trim(),
          anio_egreso: newCert.anio_egreso.trim() || null,
        });
        setNewCert(emptyCert);
      }
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function updateCertificacion(id: string) {
    setEditSaving(true);
    try {
      await supabase.from('certificaciones').update({
        titulo: editCertForm.titulo.trim(),
        institucion: editCertForm.institucion.trim(),
        anio_egreso: editCertForm.anio_egreso.trim() || null,
      }).eq('id', id);
      setEditingCertId(null);
      await loadProfileData();
    } catch (err) { console.error(err); }
    finally { setEditSaving(false); }
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, mode: 'perfil' }),
      });
      const data = await res.json();
      if (res.ok) { setMessages(prev => [...prev, { role: 'ai', text: data.message }]); await loadProfileData(); }
    } catch { setMessages(prev => [...prev, { role: 'ai', text: 'Hubo un error. Intenta de nuevo.' }]); }
    finally { setChatLoading(false); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file || chatLoading) return;
    setChatLoading(true);
    try {
      const formData = new FormData(); formData.append('file', file);
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData });
      setMessages(prev => [...prev, { role: 'ai', text: res.ok ? 'Analicé tu documento e integré la información en tu perfil.' : 'No pude procesar el documento. Intenta de nuevo.' }]);
      if (res.ok) await loadProfileData();
    } finally { setChatLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
    </div>
  );
  if (!profile) return null;

  const initials = [profile.nombre?.[0], profile.apellido?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const firstName = (profile.nombre || 'tú').split(' ')[0];
  const hardSkills = habilidades.filter(h => h.tipo ? h.tipo === 'tecnica' : !isDisplaySoft(h.nombre));
  const softSkills = habilidades.filter(h => h.tipo ? h.tipo === 'blanda'  : isDisplaySoft(h.nombre));

  const isHabilidadesDirty = pendingHard.length > 0 || pendingSoft.length > 0 || pendingHardDeleteIds.length > 0 || pendingSoftDeleteIds.length > 0;

  function addHardPending() {
    const v = hardInput.trim();
    if (!v) return;
    const existing = [...hardSkills.map(h => h.nombre.toLowerCase()), ...pendingHard.map(s => s.toLowerCase())];
    if (!existing.includes(v.toLowerCase())) setPendingHard(p => [...p, v]);
    setHardInput('');
  }

  function addSoftPending() {
    const v = softInput.trim();
    if (!v) return;
    const existing = [...softSkills.map(h => h.nombre.toLowerCase()), ...pendingSoft.map(s => s.toLowerCase())];
    if (!existing.includes(v.toLowerCase())) setPendingSoft(p => [...p, v]);
    setSoftInput('');
  }

  return (
    <div style={{ display: 'flex', gap: 20, maxWidth: 1340, margin: '0 auto' }}>

      {/* ── LEFT ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1A2B4C 0%, #0F1E3A 100%)', borderRadius: 18, padding: '26px 28px', color: '#fff', overflow: 'hidden', boxShadow: 'var(--sh-2)' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .22, pointerEvents: 'none' }}>
            <defs>
              <radialGradient id="glow-p" cx="80%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#4B6BFB" stopOpacity=".8" /><stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#glow-p)" />
            {[[12,15],[25,72],[38,40],[55,18],[67,85],[80,52],[90,28],[18,90],[44,60],[73,10],[85,75],[30,30],[60,45],[92,60],[8,55],[50,82]].map(([x,y],i) => (
              <circle key={i} cx={`${x}%`} cy={`${y}%`} r={1.1} fill="#C8D0FE" opacity={0.4+(i%5)*0.1} />
            ))}
          </svg>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'rgba(75,107,251,.35)', border: '3px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28, color: '#fff' }}>{initials}</div>
              {profile.foto_url && (
                <img src={profile.foto_url} alt={profile.nombre}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover', border: '3px solid rgba(255,255,255,.15)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{profile.nombre} {profile.apellido}</h2>
              {profile.profesion_perfil && <div style={{ marginTop: 5, fontSize: 15, color: 'rgba(255,255,255,.72)' }}>{profile.profesion_perfil}</div>}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(profile.ciudad || profile.pais) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 999, padding: '3px 10px', fontSize: 12.5, color: '#fff' }}>
                    <PinIcon size={11} /> {[profile.ciudad, profile.pais].filter(Boolean).join(', ')}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 999, padding: '3px 10px', fontSize: 12.5, color: '#86EFAC' }}>Disponible</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <HeroRing value={completitud} />
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.7)', marginTop: 8, fontWeight: 500 }}>Completitud</div>
            </div>
          </div>
        </div>

        {/* Información Personal */}
        <InfoCard title="Información Personal" icon={<UserIcon size={15} />}
          isEditing={false} onEdit={() => router.push('/edit-profile')} editLabel="Editar">
          {profile.email_cv && <InfoRow icon={<MailIcon size={15} />} label="Email" value={profile.email_cv} />}
          {profile.linkedin_url && <InfoRow icon={<LinkedInIcon size={15} />} label="LinkedIn" value={profile.linkedin_url} />}
          {profile.telefono && <InfoRow icon={<PhoneIcon size={15} />} label="Teléfono" value={profile.telefono} />}
          {(profile.ciudad || profile.pais) && <InfoRow icon={<PinIcon size={15} />} label="Ubicación" value={[profile.ciudad, profile.pais].filter(Boolean).join(', ')} />}
          {!profile.email_cv && !profile.telefono && !profile.ciudad && !profile.linkedin_url && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Añade datos de contacto en Editar Perfil</p>
          )}
        </InfoCard>

        {/* Habilidades */}
        <InfoCard title="Habilidades" icon={<PuzzleIcon size={15} />}
          isEditing={editSection === 'habilidades'} onEdit={() => toggleEdit('habilidades')}
          onSave={saveHabilidades} saving={editSaving} saveDisabled={!isHabilidadesDirty}>

          {/* Técnicas */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--deep)', fontSize: 13.5, fontWeight: 600 }}>
              <span style={{ color: 'var(--mute)' }}><BrainIcon size={14} /></span> Habilidades Técnicas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: editSection === 'habilidades' ? 10 : 0 }}>
              {(expandedHard ? hardSkills : hardSkills.slice(0, 7)).map(h => {
                const marked = pendingHardDeleteIds.includes(h.id);
                return editSection === 'habilidades' ? (
                  <span key={h.id} style={{ padding: '5px 10px', borderRadius: 999, background: marked ? 'var(--hover)' : 'var(--lav)', color: marked ? 'var(--mute)' : 'var(--blue)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5, opacity: marked ? 0.55 : 1, textDecoration: marked ? 'line-through' : 'none', transition: 'all .15s' }}>
                    {h.nombre}
                    <button onClick={() => toggleHardDelete(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : 'var(--blue)', padding: 0, fontSize: marked ? 12 : 14, lineHeight: 1 }} title={marked ? 'Deshacer' : 'Eliminar'}>{marked ? '↩' : '×'}</button>
                  </span>
                ) : (
                  <span key={h.id} style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--lav)', color: 'var(--blue)', fontSize: 13, fontWeight: 500 }}>{h.nombre}</span>
                );
              })}
              {pendingHard.map((s, i) => (
                <span key={`ph${i}`} style={{ padding: '5px 10px', borderRadius: 999, background: 'var(--lav)', color: 'var(--blue)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5, border: '1.5px dashed var(--blue)', opacity: 0.8 }}>
                  {s}
                  <button onClick={() => setPendingHard(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {hardSkills.length > 7 && editSection !== 'habilidades' && (
                <button onClick={() => setExpandedHard(p => !p)} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '5px 12px', borderRadius: 999, cursor: 'pointer', color: 'var(--mute)', fontSize: 12, fontWeight: 600 }}>
                  {expandedHard ? 'VER MENOS' : `+${hardSkills.length - 7} MÁS`}
                </button>
              )}
            </div>
            {editSection === 'habilidades' && (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={hardInput} onChange={e => setHardInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHardPending(); } }}
                    placeholder="Ej. React, Python, Figma..."
                    style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'var(--surface-2)', color: 'var(--ink)', fontFamily: 'inherit', transition: 'border-color .15s' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                  />
                  <button onClick={addHardPending} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--lav)', color: 'var(--blue)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+</button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.4 }}>
                  Herramientas, tecnologías, lenguajes, metodologías o áreas técnicas específicas.
                </p>
              </>
            )}
            {hardSkills.length === 0 && pendingHard.length === 0 && editSection !== 'habilidades' && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Añade habilidades técnicas en modo edición</p>
            )}
          </div>

          {/* Blandas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--deep)', fontSize: 13.5, fontWeight: 600 }}>
              <span style={{ color: 'var(--mute)' }}><PuzzleIcon size={14} /></span> Habilidades Blandas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: editSection === 'habilidades' ? 10 : 0 }}>
              {(expandedSoft ? softSkills : softSkills.slice(0, 7)).map(h => {
                const marked = pendingSoftDeleteIds.includes(h.id);
                return editSection === 'habilidades' ? (
                  <span key={h.id} style={{ padding: '5px 10px', borderRadius: 999, background: marked ? 'var(--hover)' : '#F0FDF4', border: marked ? '1px solid var(--line)' : '1px solid #BBF7D0', color: marked ? 'var(--mute)' : '#15803D', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5, opacity: marked ? 0.55 : 1, textDecoration: marked ? 'line-through' : 'none', transition: 'all .15s' }}>
                    {h.nombre}
                    <button onClick={() => toggleSoftDelete(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : '#15803D', padding: 0, fontSize: marked ? 12 : 14, lineHeight: 1 }} title={marked ? 'Deshacer' : 'Eliminar'}>{marked ? '↩' : '×'}</button>
                  </span>
                ) : (
                  <span key={h.id} style={{ padding: '5px 12px', borderRadius: 999, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', fontSize: 13, fontWeight: 500 }}>{h.nombre}</span>
                );
              })}
              {pendingSoft.map((s, i) => (
                <span key={`ps${i}`} style={{ padding: '5px 10px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5, border: '1.5px dashed #86EFAC' }}>
                  {s}
                  <button onClick={() => setPendingSoft(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {softSkills.length > 7 && editSection !== 'habilidades' && (
                <button onClick={() => setExpandedSoft(p => !p)} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '5px 12px', borderRadius: 999, cursor: 'pointer', color: 'var(--mute)', fontSize: 12, fontWeight: 600 }}>
                  {expandedSoft ? 'VER MENOS' : `+${softSkills.length - 7} MÁS`}
                </button>
              )}
            </div>
            {editSection === 'habilidades' && (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={softInput} onChange={e => setSoftInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSoftPending(); } }}
                    placeholder="Ej. Liderazgo, Comunicación..."
                    style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'var(--surface-2)', color: 'var(--ink)', fontFamily: 'inherit', transition: 'border-color .15s' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                  />
                  <button onClick={addSoftPending} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+</button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.4 }}>
                  Competencias interpersonales: comunicación, liderazgo, trabajo en equipo, adaptabilidad, etc.
                </p>
              </>
            )}
            {softSkills.length === 0 && pendingSoft.length === 0 && editSection !== 'habilidades' && (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Añade habilidades blandas en modo edición</p>
            )}
          </div>
        </InfoCard>

        {/* Experiencia */}
        <InfoCard title="Experiencia" icon={<BriefcaseIcon size={15} />}
          isEditing={editSection === 'experiencia'} onEdit={() => toggleEdit('experiencia')}
          onSave={saveExperiencia} saving={editSaving}
          saveDisabled={(!newExp.empresa || !newExp.cargo) && pendingExpDeleteIds.length === 0}>
          {experiencias.map((exp, i) => {
            const marked = pendingExpDeleteIds.includes(exp.id);
            return (
              <div key={exp.id} style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', opacity: marked ? 0.45 : 1, transition: 'opacity .15s' }}>
                {editingExpId === exp.id ? (
                  <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <EField label="Empresa *" value={editExpForm.empresa} onChange={v => setEditExpForm(p => ({ ...p, empresa: v }))} placeholder="Ej. Google" />
                      <EField label="Cargo *" value={editExpForm.cargo} onChange={v => setEditExpForm(p => ({ ...p, cargo: v }))} placeholder="Ej. Desarrollador Senior" />
                      <MonthYearField label="Fecha inicio" value={editExpForm.fecha_inicio} onChange={v => setEditExpForm(p => ({ ...p, fecha_inicio: v }))} />
                      <MonthYearField label="Fecha fin" value={editExpForm.activo ? '' : editExpForm.fecha_fin} onChange={v => setEditExpForm(p => ({ ...p, fecha_fin: v }))} disabled={editExpForm.activo} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={editExpForm.activo} onChange={e => setEditExpForm(p => ({ ...p, activo: e.target.checked }))} /> Trabajo actual
                    </label>
                    <EField label="Descripción" value={editExpForm.descripcion} onChange={v => setEditExpForm(p => ({ ...p, descripcion: v }))} placeholder="Responsabilidades y logros..." multiline />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateExperiencia(exp.id)} disabled={editSaving || !editExpForm.empresa || !editExpForm.cargo}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SaveIcon size={12} /> Guardar
                      </button>
                      <button onClick={() => setEditingExpId(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--mute)', fontSize: 12.5, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--lav)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>
                      {exp.empresa?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--deep)', fontSize: 14.5, textDecoration: marked ? 'line-through' : 'none' }}>{exp.cargo}</div>
                          <div style={{ fontSize: 13, color: 'var(--mute)' }}>{exp.empresa}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {(exp.fecha_inicio || exp.fecha_fin) && (
                            <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>{dateRange(exp.fecha_inicio, exp.fecha_fin, exp.activo)}</div>
                          )}
                          {editSection === 'experiencia' && (
                            <>
                              {!marked && (
                                <button onClick={() => { setEditingExpId(exp.id); setEditExpForm({ empresa: exp.empresa || '', cargo: exp.cargo || '', fecha_inicio: exp.fecha_inicio || '', fecha_fin: exp.fecha_fin || '', activo: exp.activo || false, descripcion: exp.descripcion || '' }); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                                  <EditIcon size={13} />
                                </button>
                              )}
                              <button onClick={() => toggleExpDelete(exp.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : '#EF4444', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
                                title={marked ? 'Deshacer' : 'Eliminar'}>
                                {marked ? '↩' : <TrashIcon size={13} />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {exp.descripcion && !marked && <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5, marginTop: 4 }}>{exp.descripcion}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {editSection === 'experiencia' && (
            <div style={{ marginTop: experiencias.length > 0 ? 16 : 0, padding: 16, background: 'var(--surface-2)', borderRadius: 12, border: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--deep)' }}>Añadir experiencia</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EField label="Empresa *" value={newExp.empresa} onChange={v => setNewExp(p => ({ ...p, empresa: v }))} placeholder="Ej. Google" />
                <EField label="Cargo *" value={newExp.cargo} onChange={v => setNewExp(p => ({ ...p, cargo: v }))} placeholder="Ej. Desarrollador Senior" />
                <MonthYearField label="Fecha inicio" value={newExp.fecha_inicio} onChange={v => setNewExp(p => ({ ...p, fecha_inicio: v }))} />
                <MonthYearField label="Fecha fin" value={newExp.activo ? '' : newExp.fecha_fin} onChange={v => setNewExp(p => ({ ...p, fecha_fin: v }))} disabled={newExp.activo} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
                <input type="checkbox" checked={newExp.activo} onChange={e => setNewExp(p => ({ ...p, activo: e.target.checked }))} /> Trabajo actual
              </label>
              <EField label="Descripción" value={newExp.descripcion} onChange={v => setNewExp(p => ({ ...p, descripcion: v }))} placeholder="Responsabilidades y logros..." multiline />
            </div>
          )}
          {experiencias.length === 0 && editSection !== 'experiencia' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Comparte tu historial laboral o haz clic en Editar</p>
          )}
        </InfoCard>

        {/* Educación */}
        <InfoCard title="Educación" icon={<GradCapIcon size={15} />}
          isEditing={editSection === 'educacion'} onEdit={() => toggleEdit('educacion')}
          onSave={saveEducacion} saving={editSaving}
          saveDisabled={(!newEdu.institucion || !newEdu.titulo) && pendingEduDeleteIds.length === 0}>
          {educaciones.map((edu, i) => {
            const marked = pendingEduDeleteIds.includes(edu.id);
            return (
              <div key={edu.id} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', opacity: marked ? 0.45 : 1, transition: 'opacity .15s' }}>
                {editingEduId === edu.id ? (
                  <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <EField label="Institución *" value={editEduForm.institucion} onChange={v => setEditEduForm(p => ({ ...p, institucion: v }))} placeholder="Universidad de..." />
                    <EField label="Título *" value={editEduForm.titulo} onChange={v => setEditEduForm(p => ({ ...p, titulo: v }))} placeholder="Ingeniería en..." />
                    <EField label="Área" value={editEduForm.area} onChange={v => setEditEduForm(p => ({ ...p, area: v }))} placeholder="Informática, Administración..." />
                    <MonthYearField label="Fecha de graduación" value={editEduForm.fecha_fin} onChange={v => setEditEduForm(p => ({ ...p, fecha_fin: v }))} futureYears={6} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateEducacion(edu.id)} disabled={editSaving || !editEduForm.institucion || !editEduForm.titulo}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SaveIcon size={12} /> Guardar
                      </button>
                      <button onClick={() => setEditingEduId(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--mute)', fontSize: 12.5, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--deep)', fontSize: 14, textDecoration: marked ? 'line-through' : 'none' }}>{edu.titulo}</div>
                      <div style={{ fontSize: 13, color: 'var(--mute)' }}>{edu.institucion}</div>
                      {edu.fecha_fin && <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{formatProfileDate(edu.fecha_fin)}</div>}
                    </div>
                    {editSection === 'educacion' && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {!marked && (
                          <button onClick={() => { setEditingEduId(edu.id); setEditEduForm({ institucion: edu.institucion || '', titulo: edu.titulo || '', area: edu.area || '', fecha_inicio: edu.fecha_inicio || '', fecha_fin: edu.fecha_fin || '' }); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                            <EditIcon size={13} />
                          </button>
                        )}
                        <button onClick={() => toggleEduDelete(edu.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : '#EF4444', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
                          title={marked ? 'Deshacer' : 'Eliminar'}>
                          {marked ? '↩' : <TrashIcon size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {editSection === 'educacion' && (
            <div style={{ marginTop: educaciones.length > 0 ? 14 : 0, padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--deep)' }}>Añadir educación</div>
              <EField label="Institución *" value={newEdu.institucion} onChange={v => setNewEdu(p => ({ ...p, institucion: v }))} placeholder="Universidad de..." />
              <EField label="Título *" value={newEdu.titulo} onChange={v => setNewEdu(p => ({ ...p, titulo: v }))} placeholder="Ingeniería en..." />
              <EField label="Área" value={newEdu.area} onChange={v => setNewEdu(p => ({ ...p, area: v }))} placeholder="Informática, Administración..." />
              <MonthYearField label="Fecha de graduación" value={newEdu.fecha_fin} onChange={v => setNewEdu(p => ({ ...p, fecha_fin: v }))} futureYears={6} />
            </div>
          )}
          {educaciones.length === 0 && editSection !== 'educacion' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Añade tu formación académica</p>
          )}
        </InfoCard>

        {/* Cursos y Certificaciones */}
        <InfoCard title="Cursos y Certificaciones" icon={<AwardIcon size={15} />}
          isEditing={editSection === 'certificaciones'} onEdit={() => toggleEdit('certificaciones')}
          onSave={saveCertificacion} saving={editSaving}
          saveDisabled={(!newCert.titulo.trim() || !newCert.institucion.trim()) && pendingCertDeleteIds.length === 0}>
          {certificaciones.map((cert, i) => {
            const marked = pendingCertDeleteIds.includes(cert.id);
            return (
              <div key={cert.id} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', opacity: marked ? 0.45 : 1, transition: 'opacity .15s' }}>
                {editingCertId === cert.id ? (
                  <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <EField label="Título *" value={editCertForm.titulo} onChange={v => setEditCertForm(p => ({ ...p, titulo: v }))} placeholder="Ej. Diplomado de Marketing Digital" />
                    <EField label="Institución *" value={editCertForm.institucion} onChange={v => setEditCertForm(p => ({ ...p, institucion: v }))} placeholder="Ej. Universidad Central" />
                    <EField label="Año de egreso" value={editCertForm.anio_egreso} onChange={v => setEditCertForm(p => ({ ...p, anio_egreso: v }))} placeholder="Ej. 2023" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateCertificacion(cert.id)} disabled={editSaving || !editCertForm.titulo.trim() || !editCertForm.institucion.trim()}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SaveIcon size={12} /> Guardar
                      </button>
                      <button onClick={() => setEditingCertId(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--mute)', fontSize: 12.5, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--deep)', fontSize: 14, textDecoration: marked ? 'line-through' : 'none' }}>{cert.titulo}</div>
                      <div style={{ fontSize: 13, color: 'var(--mute)' }}>{cert.institucion}</div>
                      {cert.anio_egreso && <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{cert.anio_egreso}</div>}
                    </div>
                    {editSection === 'certificaciones' && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {!marked && (
                          <button onClick={() => { setEditingCertId(cert.id); setEditCertForm({ titulo: cert.titulo || '', institucion: cert.institucion || '', anio_egreso: cert.anio_egreso || '' }); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                            <EditIcon size={13} />
                          </button>
                        )}
                        <button onClick={() => toggleCertDelete(cert.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : '#EF4444', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
                          title={marked ? 'Deshacer' : 'Eliminar'}>
                          {marked ? '↩' : <TrashIcon size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {editSection === 'certificaciones' && (
            <div style={{ marginTop: certificaciones.length > 0 ? 14 : 0, padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--deep)' }}>Añadir certificación</div>
              <EField label="Título *" value={newCert.titulo} onChange={v => setNewCert(p => ({ ...p, titulo: v }))} placeholder="Ej. Diplomado de Marketing Digital" />
              <EField label="Institución *" value={newCert.institucion} onChange={v => setNewCert(p => ({ ...p, institucion: v }))} placeholder="Ej. Universidad Central" />
              <EField label="Año de egreso" value={newCert.anio_egreso} onChange={v => setNewCert(p => ({ ...p, anio_egreso: v }))} placeholder="Ej. 2023" />
            </div>
          )}
          {certificaciones.length === 0 && editSection !== 'certificaciones' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Añade tus cursos y certificaciones</p>
          )}
        </InfoCard>

        {/* Idiomas */}
        <InfoCard title="Idiomas" icon={<GlobeIcon size={15} />}
          isEditing={editSection === 'idiomas'} onEdit={() => toggleEdit('idiomas')}
          onSave={saveIdioma} saving={editSaving}
          saveDisabled={!newIdioma.nombre && pendingIdiomaDeleteIds.length === 0}>
          {idiomas.some(i => !i.nivel_cefr) && (
            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#B45309', lineHeight: 1.45 }}>
              Actualiza el nivel de tus idiomas a la escala europea (A1–C2): así tus CVs muestran tu nivel real.
            </p>
          )}
          {idiomas.map((idioma, i) => {
            const marked = pendingIdiomaDeleteIds.includes(idioma.id);
            return (
              <div key={idioma.id} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', opacity: marked ? 0.45 : 1, transition: 'opacity .15s' }}>
                {editingIdiomaId === idioma.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--line-soft)' }}>
                    <EField label="Idioma *" value={editIdiomaForm.nombre} onChange={v => setEditIdiomaForm(p => ({ ...p, nombre: v }))} placeholder="Ej. Inglés" />
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--deep)', fontWeight: 500, marginBottom: 6 }}>Nivel</div>
                      <Select
                        value={editIdiomaForm.nivel_cefr}
                        onChange={v => setEditIdiomaForm(p => ({ ...p, nivel_cefr: v }))}
                        options={CEFR_OPTIONS}
                        placeholder="Elige tu nivel"
                        style={{ width: '100%' }}
                        triggerStyle={{ fontSize: 13, borderRadius: 8, border: '1.5px solid var(--line)' }}
                      />
                      {editIdiomaForm.nivel_cefr && (
                        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4 }}>{CEFR_HINTS[editIdiomaForm.nivel_cefr as CefrLevel]}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateIdioma(idioma.id)} disabled={editSaving || !editIdiomaForm.nombre}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SaveIcon size={12} /> Guardar
                      </button>
                      <button onClick={() => setEditingIdiomaId(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--mute)', fontSize: 12.5, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, color: 'var(--deep)', fontWeight: 500, textDecoration: marked ? 'line-through' : 'none' }}>{idioma.nombre}</span>
                      {idioma.nivel_cefr && !marked && <span style={{ background: 'var(--hover)', color: 'var(--mute)', fontSize: 12, fontWeight: 500, padding: '3px 9px', borderRadius: 6 }}>{CEFR_LABELS[idioma.nivel_cefr]}</span>}
                      {!idioma.nivel_cefr && !marked && (
                        <span title="Elige tu nivel en la escala europea (A1–C2)" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 6 }}>
                          {idioma.nivel ? `${idioma.nivel} · confirma tu nivel` : 'Confirma tu nivel'}
                        </span>
                      )}
                    </div>
                    {editSection === 'idiomas' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!marked && (
                          <button onClick={() => { setEditingIdiomaId(idioma.id); setEditIdiomaForm({ nombre: idioma.nombre || '', nivel_cefr: idioma.nivel_cefr || '' }); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                            <EditIcon size={13} />
                          </button>
                        )}
                        <button onClick={() => toggleIdiomaDelete(idioma.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : '#EF4444', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
                          title={marked ? 'Deshacer' : 'Eliminar'}>
                          {marked ? '↩' : <TrashIcon size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {editSection === 'idiomas' && (
            <div style={{ marginTop: idiomas.length > 0 ? 14 : 0, padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--deep)' }}>Añadir idioma</div>
              <EField label="Idioma *" value={newIdioma.nombre} onChange={v => setNewIdioma(p => ({ ...p, nombre: v }))} placeholder="Ej. Inglés" />
              <div>
                <div style={{ fontSize: 12.5, color: 'var(--deep)', fontWeight: 500, marginBottom: 6 }}>Nivel</div>
                <Select
                        value={newIdioma.nivel_cefr}
                        onChange={v => setNewIdioma(p => ({ ...p, nivel_cefr: v }))}
                        options={CEFR_OPTIONS}
                        placeholder="Elige tu nivel"
                        style={{ width: '100%' }}
                        triggerStyle={{ fontSize: 13, borderRadius: 8, border: '1.5px solid var(--line)' }}
                      />
                      {newIdioma.nivel_cefr && (
                        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4 }}>{CEFR_HINTS[newIdioma.nivel_cefr as CefrLevel]}</div>
                      )}
              </div>
            </div>
          )}
          {idiomas.length === 0 && editSection !== 'idiomas' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Añade tus idiomas</p>
          )}
        </InfoCard>

        {/* Logros */}
        <InfoCard title="Logros" icon={<AwardIcon size={15} />}
          isEditing={editSection === 'logros'} onEdit={() => toggleEdit('logros')}
          onSave={saveLogro} saving={editSaving}
          saveDisabled={!newLogro.trim() && pendingLogroDeleteIds.length === 0}>
          {logros.map((logro, i) => {
            const marked = pendingLogroDeleteIds.includes(logro.id);
            return (
              <div key={logro.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)', alignItems: 'flex-start', opacity: marked ? 0.45 : 1, transition: 'opacity .15s' }}>
                {editingLogroId === logro.id ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea value={editLogroText} onChange={e => setEditLogroText(e.target.value)} rows={2}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--blue)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }}
                    />
                    {experiencias.length > 0 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--mute)' }}>
                        Empleo:
                        <select value={editLogroExpId} onChange={e => setEditLogroExpId(e.target.value)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--mute)', fontSize: 12, fontFamily: 'inherit', padding: '2px 0', cursor: 'pointer', outline: 'none', maxWidth: '100%' }}>
                          <option value="">sin asignar</option>
                          {experiencias.map(e => <option key={e.id} value={e.id}>{e.cargo} · {e.empresa}</option>)}
                        </select>
                      </label>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateLogro(logro.id)} disabled={editSaving || !editLogroText.trim()}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SaveIcon size={12} /> Guardar
                      </button>
                      <button onClick={() => setEditingLogroId(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--mute)', fontSize: 12.5, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success-50)', color: '#148B3D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckIcon size={14} />
                    </span>
                    <div style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5, textDecoration: marked ? 'line-through' : 'none' }}>
                      {logro.descripcion}
                      {(() => {
                        const exp = logro.experiencia_id ? experiencias.find(e => e.id === logro.experiencia_id) : null;
                        return exp ? <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>En {exp.empresa}</div> : null;
                      })()}
                    </div>
                    {editSection === 'logros' && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {!marked && (
                          <button onClick={() => { setEditingLogroId(logro.id); setEditLogroText(logro.descripcion || ''); setEditLogroExpId(logro.experiencia_id || ''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
                            <EditIcon size={13} />
                          </button>
                        )}
                        <button onClick={() => toggleLogroDelete(logro.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: marked ? 'var(--mute)' : '#EF4444', padding: '3px', borderRadius: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
                          title={marked ? 'Deshacer' : 'Eliminar'}>
                          {marked ? '↩' : <TrashIcon size={13} />}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {editSection === 'logros' && (
            <div style={{ marginTop: logros.length > 0 ? 14 : 0, padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px dashed var(--line)' }}>
              <div style={{ fontSize: 12.5, color: 'var(--deep)', fontWeight: 500, marginBottom: 6 }}>Describe tu logro</div>
              <textarea value={newLogro} onChange={e => setNewLogro(e.target.value)}
                placeholder="Ej. Reduje costos operativos en 40% migrando la infraestructura a la nube."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color .15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
              />
              <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.4 }}>
                Usa la fórmula: <strong style={{ fontWeight: 600 }}>Verbo + Resultado + Métrica + Cómo</strong>
              </p>
              <div style={{ marginTop: 6 }}>
                {experiencias.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--mute)' }}>
                    Empleo:
                    <select value={newLogroExpId} onChange={e => setNewLogroExpId(e.target.value)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--mute)', fontSize: 12, fontFamily: 'inherit', padding: '2px 0', cursor: 'pointer', outline: 'none', maxWidth: '100%' }}>
                      <option value="">sin asignar</option>
                      {experiencias.map(e => <option key={e.id} value={e.id}>{e.cargo} · {e.empresa}</option>)}
                    </select>
                  </label>
                )}
              </div>
            </div>
          )}
          {logros.length === 0 && editSection !== 'logros' && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontStyle: 'italic' }}>Comparte tus logros con el asistente</p>
          )}
        </InfoCard>

      </div>

      {/* ── RIGHT: space holder so left column doesn't overflow ── */}
      <div style={{ width: 380, flexShrink: 0 }}>
        {/* Fixed chat – does not move on scroll */}
        <aside style={{ position: 'fixed', right: 36, top: 28, width: 380, height: 'calc(100dvh - 52px)', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>

          {/* Chat card */}
          <div style={{ flex: 1, minHeight: 0, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--sh-2)', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '14px 20px', background: 'linear-gradient(180deg, #F7F8FE 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src="/momentum-assistant.svg" alt="Asistente"
                  style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', display: 'block', boxShadow: '0 4px 12px -4px rgba(75,107,251,.45)' }} />
                <span style={{ position: 'absolute', right: -2, bottom: -2, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid #fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--deep)' }}>Asistente IA</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--lav)', color: 'var(--blue)', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', marginRight: 4 }} />
                    Disponible
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ProfileIntroMessage firstName={firstName} />
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  {m.role === 'ai' ? (
                    <img src="/momentum-assistant.svg" alt="Asistente"
                      style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>{initials}</div>
                      {profile.foto_url && (
                        <img src={profile.foto_url} alt=""
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}
                  <div style={{
                    background: m.role === 'user' ? 'var(--blue)' : 'var(--surface-2)',
                    color: m.role === 'user' ? '#fff' : 'var(--ink)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--line)',
                    padding: '8px 12px', borderRadius: 12,
                    borderTopLeftRadius: m.role === 'user' ? 12 : 4,
                    borderTopRightRadius: m.role === 'user' ? 4 : 12,
                    fontSize: 13, lineHeight: 1.5, maxWidth: '82%',
                  }}>{m.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <img src="/momentum-assistant.svg" alt="Asistente"
                    style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, objectFit: 'cover' }} />
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', padding: '10px 14px', borderRadius: 12, borderTopLeftRadius: 4, display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mute)', animation: `pulse-dot .9s ${i * .2}s infinite` }} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--line-soft)', background: 'var(--surface-2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '6px 6px 6px 12px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Escribe tu mensaje..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--ink)', padding: '4px 0', fontFamily: 'inherit' }}
                />
                <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: chatInput.trim() && !chatLoading ? 'var(--blue)' : 'var(--line)',
                  color: chatInput.trim() && !chatLoading ? '#fff' : 'var(--mute)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default',
                  transition: 'all .15s var(--ease)',
                }}>
                  <SendIcon size={14} />
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <InfoIcon size={12} /> Tus respuestas se guardan automáticamente.
              </div>
            </div>
          </div>

          {/* Adjuntar documento */}
          <button onClick={() => fileInputRef.current?.click()} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 18px', borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--surface)', color: 'var(--deep)', fontWeight: 500, fontSize: 13.5,
            cursor: 'pointer', boxShadow: 'var(--sh-1)', transition: 'background .15s var(--ease)',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}>
            <PaperclipIcon size={15} /> Adjuntar documento
          </button>

          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        </aside>
      </div>
    </div>
  );
}

/* ── ProfileIntroMessage ── */
function ProfileIntroMessage({ firstName }: { firstName: string }) {
  const bullets = [
    'Tu experiencia laboral', 'Tus estudios y logros académicos',
    'Tus habilidades y herramientas', 'Objetivos y resultados alcanzados',
    'Cualquier otro aspecto de tu trayectoria a resaltar',
  ];
  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: 'row' }}>
      <img src="/momentum-assistant.svg" alt="Asistente"
        style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, objectFit: 'cover' }} />
      <div style={{ maxWidth: '85%' }}>
        <div style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)', padding: '12px 14px', borderRadius: 12, borderTopLeftRadius: 4, fontSize: 13.5, lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 10px', color: 'var(--deep)', fontWeight: 500 }}>
            ¡Hola, {firstName}! Estoy aquí para ayudarte a construir tu perfil profesional. Puedes contarme sobre:
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--success-50)', color: '#148B3D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={9} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── InfoCard ── */
interface InfoCardProps {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  isEditing?: boolean; onEdit?: () => void; editLabel?: string;
  onSave?: () => void; saving?: boolean; saveDisabled?: boolean;
}
function InfoCard({ title, icon, children, isEditing, onEdit, editLabel = 'Editar', onSave, saving, saveDisabled }: InfoCardProps) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', boxShadow: 'var(--sh-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', color: 'var(--deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line-soft)' }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--deep)' }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isEditing && onSave && (
            <button onClick={onSave} disabled={saving || saveDisabled} style={{
              background: saving || saveDisabled ? 'var(--line)' : 'var(--blue)',
              color: saving || saveDisabled ? 'var(--mute)' : '#fff',
              border: 'none', padding: '5px 12px', borderRadius: 8,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600, cursor: saving || saveDisabled ? 'not-allowed' : 'pointer',
              transition: 'all .15s var(--ease)',
            }}>
              {saving
                ? <><span style={{ width: 11, height: 11, borderRadius: '50%', border: '1.5px solid #fff', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin .8s linear infinite' }} /> Guardando…</>
                : <><SaveIcon size={12} /> Guardar Cambios</>}
            </button>
          )}
          <button onClick={onEdit} style={{
            background: isEditing ? 'var(--hover)' : 'transparent',
            border: '1px solid var(--line)', color: isEditing ? 'var(--deep)' : 'var(--mute)',
            padding: '5px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, cursor: 'pointer', transition: 'all .15s var(--ease)',
          }}
            onMouseEnter={e => { if (!isEditing) { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--deep)'; } }}
            onMouseLeave={e => { if (!isEditing) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)'; } }}
          >
            {isEditing ? <><XIcon size={12} /> Cancelar</> : <><EditIcon size={12} /> {editLabel}</>}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── InfoRow ── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: '1px solid var(--line-soft)' }}>
      <span style={{ color: 'var(--mute)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--mute)', fontSize: 13, width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--deep)', fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ── EField ── */
function EField({ label, value, onChange, placeholder, disabled, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; multiline?: boolean }) {
  const base: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--line)', background: disabled ? 'var(--hover)' : 'var(--surface)', color: disabled ? 'var(--mute)' : 'var(--ink)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s' };
  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--deep)', fontWeight: 500, marginBottom: 5 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} disabled={disabled} style={{ ...base, resize: 'vertical', lineHeight: 1.5 }} onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--blue)'; }} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ ...base, minHeight: 36 }} onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--blue)'; }} onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')} />}
    </div>
  );
}

/* ── HeroRing ── */
function HeroRing({ value }: { value: number }) {
  const r = 36, circ = 2 * Math.PI * r;
  return (
    <svg width={96} height={96} viewBox="0 0 96 96">
      <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={8} />
      <circle cx={48} cy={48} r={r} fill="none" stroke="#4B6BFB" strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
        strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 1s var(--ease)' }} />
      <text x={48} y={53} textAnchor="middle" fill="#fff" fontSize={18} fontWeight={700} fontFamily="Inter, sans-serif">{value}%</text>
    </svg>
  );
}

/* ── Icons ── */
function UserIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function MailIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>; }
function PhoneIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.48 2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
function LinkedInIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>; }
function PinIcon({ size = 12 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function PuzzleIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
function BrainIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/></svg>; }
function BriefcaseIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function GradCapIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>; }
function GlobeIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function AwardIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>; }
function CheckIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function SparklesIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/><path d="M19 14l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9z"/></svg>; }
function SendIcon({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function PaperclipIcon({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>; }
function EditIcon({ size = 12 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function SaveIcon({ size = 12 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function XIcon({ size = 12 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function InfoIcon({ size = 12 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function TrashIcon({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
