'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { EstiloCard, ESTILOS } from '@/components/create-cv/StyleCard';

// Development-only preview of the style selector cards (visual checks without a session).
export default function SelectorPreview() {
  const [selected, setSelected] = useState<string | null>('europass');
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: 32 }}>
      <div id="grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {ESTILOS.map(e => (
          <EstiloCard key={e.id} estilo={e} selected={selected === e.id} locked={e.isPro} onSelect={() => setSelected(e.id)} onVerEjemplo={() => {}} />
        ))}
      </div>
    </div>
  );
}
