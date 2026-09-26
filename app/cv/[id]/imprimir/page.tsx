import { notFound, redirect } from 'next/navigation';
import CVRenderer from '@/components/CVTemplates';
import { CV_PRINT_CSS, EUROPASS_PRINT_CSS } from '@/components/CVTemplates/print';
import { createClient } from '@/lib/supabase/server';
import { canDownloadCV } from '@/lib/cv/entitlement';
import { parseVisualConfig } from '@/lib/cv/visual-config';
import type { CV } from '@/types';
import { isEuropassV2 } from '@/lib/cv/content';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadIdentitySafe } from '@/lib/identity';
import { withIdentity } from '@/lib/cv/styles/europass/identity-view';
import type { StoredCVContent } from '@/lib/cv/types/pipeline';

// Print-ready render of a CV. It is also the page headless Chromium loads to produce the
// server-side PDF (/api/cv/[id]/pdf), so what the user sees here is exactly what the PDF
// contains. Access is checked on the server: owner only, and only if the CV is paid/Pro —
// the same rule the download buttons show, but not bypassable by typing this URL.

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ImprimirPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { id } = await params;
  const { modo } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cv } = await supabase
    .from('cvs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle<CV>();
  if (!cv) notFound();

  if (!(await canDownloadCV(supabase, user.id, id))) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100vh', fontFamily: 'sans-serif', color: '#374151', textAlign: 'center', padding: 24 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Este CV todavía no está desbloqueado para descarga.</p>
        <a href="/cvs" style={{ color: '#1d4ed8', fontSize: 14 }}>Ir a Mis CVs para desbloquearlo</a>
      </div>
    );
  }

  const isPdfRender = modo === 'pdf';
  const visual = parseVisualConfig(cv.visual_config);
  const stored = cv.contenido_json as unknown as StoredCVContent;
  // Europass identity values live only encrypted; they are decrypted here, on the server,
  // for the owner (this page already checked ownership and payment).
  const content = isEuropassV2(stored)
    ? withIdentity(stored, await loadIdentitySafe(createAdminClient(), user.id))
    : stored;
  const printCss = isEuropassV2(content) ? EUROPASS_PRINT_CSS : CV_PRINT_CSS;

  return (
    <>
      <style>{`
        ${printCss}
        @media screen {
          body { background: #e5e7eb; margin: 0; }
          .cv-container { max-width: 794px; margin: 0 auto; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
          .print-bar { background: #1d4ed8; color: white; text-align: center; padding: 12px; }
          .print-bar a { display: inline-block; background: white; color: #1d4ed8; padding: 8px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; font-family: sans-serif; }
          .print-bar a:hover { background: #eff6ff; }
        }
      `}</style>

      {!isPdfRender && (
        <div className="no-print print-bar">
          <a href={`/api/cv/${cv.id}/pdf`}>Descargar PDF</a>
        </div>
      )}

      {/* data-cv-ready tells the PDF renderer the CV is ready to print. Europass v2 sets it
          itself, only after its pages are computed (spec change 32). */}
      <div className="cv-container" data-cv-ready={isEuropassV2(content) ? undefined : 'true'}>
        <CVRenderer
          estilo={cv.estilo as Exclude<CV['estilo'], 'mirror'>}
          data={content}
          accentColor={visual.accent_color ?? undefined}
          densidad={visual.densidad}
          fotoTam={visual.foto_tam}
          paginate={isEuropassV2(content) ? 'print' : undefined}
        />
      </div>
    </>
  );
}
