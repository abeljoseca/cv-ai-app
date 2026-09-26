import { notFound } from 'next/navigation';
import CVRenderer from '@/components/CVTemplates';
import { LEGACY_SAMPLE } from '@/lib/cv/samples/legacy-sample';

// Development-only page used by `npm run samples` to photograph the styles that still use
// the shared CVContent templates, with exactly the app's CSS and fonts. Never served in
// production.

const LEGACY_STYLES = ['harvard', 'stanford', 'silicon-valley', 'tech', 'minimalist', 'executive'] as const;
type LegacyStyle = typeof LEGACY_STYLES[number];

export default async function MuestraCV({ params }: { params: Promise<{ estilo: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { estilo } = await params;
  if (!(LEGACY_STYLES as readonly string[]).includes(estilo)) notFound();
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* At least one A4 sheet tall, like paper (1123px = 297mm at 96dpi). */}
      <div id="muestra" style={{ width: 794, minHeight: 1123, background: '#fff' }}>
        <CVRenderer estilo={estilo as LegacyStyle} data={LEGACY_SAMPLE} />
      </div>
    </div>
  );
}
