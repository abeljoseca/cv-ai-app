'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CVRenderer from '@/components/CVTemplates';
import { parseVisualConfig } from '@/lib/cv/visual-config';

export default function ImprimirPage() {
  const params = useParams();
  const cvId = params.id as string;
  const supabase = createClient();
  const [cv, setCv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: cvData } = await supabase.from('cvs').select('*').eq('id', cvId).single();
      if (cvData) setCv(cvData);
      setLoading(false);
    }
    load();
  }, [cvId]);

  // Auto-trigger print once the CV is rendered
  useEffect(() => {
    if (!loading && cv) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [loading, cv]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
        Preparando CV para imprimir...
      </div>
    );
  }

  if (!cv) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
        CV no encontrado.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          html, body { margin: 0; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cv-container { background: #ffffff !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
        @media screen {
          body { background: #e5e7eb; margin: 0; }
          .cv-container { max-width: 794px; margin: 0 auto; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
          .print-bar { background: #1d4ed8; color: white; text-align: center; padding: 12px; }
          .print-bar button { background: white; color: #1d4ed8; border: none; padding: 8px 28px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; }
          .print-bar button:hover { background: #eff6ff; }
        }
      `}</style>

      <div className="no-print print-bar">
        <button onClick={() => window.print()}>
          Imprimir / Guardar como PDF
        </button>
      </div>

      <div className="cv-container">
        <CVRenderer
          estilo={cv.estilo}
          data={cv.contenido_json}
          accentColor={parseVisualConfig(cv.visual_config).accent_color ?? undefined}
        />
      </div>
    </>
  );
}
