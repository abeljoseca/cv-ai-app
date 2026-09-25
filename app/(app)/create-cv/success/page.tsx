'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CV, Profile } from '@/types';
import PaymentModal from '@/components/PaymentModal';
import { downloadCvPdf } from '@/lib/cv/download-pdf';

export default function ExitoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cv, setCv] = useState<CV | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const cvId = sessionStorage.getItem('cv_created_id');
    if (!cvId) { router.replace('/cvs'); return; }
    loadData(cvId);
    const t = setTimeout(() => setConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  async function loadData(cvId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: cvData }, { data: profileData }, { data: pagoData }] = await Promise.all([
        supabase.from('cvs').select('*').eq('id', cvId).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('pagos').select('id').eq('cv_id', cvId).eq('estado', 'confirmado').limit(1).single(),
      ]);
      if (cvData) setCv(cvData as CV);
      if (profileData) setProfile(profileData as Profile);
      if (pagoData) setHasPaid(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const confettiPieces = useMemo(() => Array.from({ length: 120 }, () => ({
    size: 7 + Math.random() * 7,
    round: Math.random() > 0.4,
    color: ['#4B6BFB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#06B6D4', '#F97316'][Math.floor(Math.random() * 7)],
    left: Math.random() * 100,
    drift: (Math.random() - 0.5) * 120,
    rot: (Math.random() - 0.5) * 720,
    duration: 2.2 + Math.random() * 1.8,
    delay: Math.random() * 2.5,
  })), []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  const isPro = profile?.plan === 'pro';
  const canDownload = isPro || hasPaid;

  async function startDownload(cvId: string) {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadCvPdf(cvId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setDownloading(false);
    }
  }

  function handleDownloadPDF() {
    if (!cv || downloading) return;
    if (!canDownload) { setShowPayment(true); return; }
    startDownload(cv.id);
  }

  function handlePaymentSuccess() {
    setShowPayment(false);
    setHasPaid(true);
    if (cv) startDownload(cv.id);
  }

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 24px', position: 'relative' }}>

      {/* Confetti rain */}
      {confetti && (
        <>
          <style>{`
            @keyframes confetti-fall {
              0%   { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
              80%  { opacity: 1; }
              100% { opacity: 0; transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rot)); }
            }
          `}</style>
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
            {confettiPieces.map((p, i) => (
              <div key={i} style={{
                position: 'absolute', top: '-10px', left: `${p.left}%`,
                width: p.size, height: p.size,
                borderRadius: p.round ? '50%' : '2px',
                background: p.color,
                '--drift': `${p.drift}px`,
                '--rot': `${p.rot}deg`,
                animation: `confetti-fall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
              } as React.CSSProperties} />
            ))}
          </div>
        </>
      )}

      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', animation: 'fadeUp .4s var(--ease)' }}>

        {/* Success icon */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%',
          background: 'var(--success-50)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <CheckCircleIcon size={44} />
        </div>

        <h1 style={{ margin: '0 0 10px', fontSize: 32, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.02em' }}>
          ¡Tu CV está listo!
        </h1>
        <p style={{ margin: '0 0 32px', color: 'var(--mute)', fontSize: 15, lineHeight: 1.65 }}>
          Lo guardamos automáticamente en <strong style={{ color: 'var(--deep)' }}>Mis CVs</strong>.<br />
          Descárgalo o envíalo por correo cuando quieras.
        </p>

        {/* Download card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 18, padding: 26, boxShadow: 'var(--sh-2)',
        }}>
          <button
            onClick={handleDownloadPDF}
            disabled={!cv || downloading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 20px', borderRadius: 12, border: 'none',
              background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 15,
              cursor: !cv ? 'not-allowed' : downloading ? 'wait' : 'pointer', opacity: cv && !downloading ? 1 : .6,
              boxShadow: '0 1px 2px rgba(15,23,42,.06), 0 6px 14px -6px rgba(75,107,251,.45)',
              marginBottom: 12,
            }}
          >
            <DownloadIcon size={18} />
            {downloading ? 'Generando PDF…' : 'Descargar PDF'}
          </button>
          {downloadError && (
            <p role="alert" style={{ margin: '0 0 12px', fontSize: 13, color: '#DC2626' }}>{downloadError}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <SecondaryBtn icon={<MailIcon size={15} />} label="Enviar por email" onClick={() => {}} />
            <SecondaryBtn icon={<PlusIcon size={15} />} label="Generar otro" onClick={() => {
              sessionStorage.removeItem('cv_created_id');
              router.push('/create-cv');
            }} />
            <SecondaryBtn icon={<FolderIcon size={15} />} label="Ver Mis CVs" onClick={() => {
              sessionStorage.removeItem('cv_created_id');
              router.push('/cvs');
            }} />
          </div>
        </div>

      </div>
    </div>

    {showPayment && cv && (
      <PaymentModal
        cvId={cv.id}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    )}
    </>
  );
}

function SecondaryBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      padding: '10px 8px', borderRadius: 10, border: '1px solid var(--line)',
      background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 500,
      cursor: 'pointer', transition: 'background .15s var(--ease)',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
    >
      {icon} {label}
    </button>
  );
}

/* Icons */
function CheckCircleIcon({ size = 44 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function DownloadIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function MailIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function PlusIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function FolderIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
