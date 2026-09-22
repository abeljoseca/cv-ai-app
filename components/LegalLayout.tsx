'use client';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-8 h-16 flex items-center">
          <a href="/">
            <img src="/momentum-logo.svg" alt="Momentum" style={{ height: 26 }} />
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-14 sm:py-20">
        <a href="/" className="text-sm font-medium inline-flex items-center gap-1.5 mb-8" style={{ color: 'var(--mute)' }}>
          ← Volver a Momentum
        </a>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--ink)' }}>{title}</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--mute)' }}>
          Última actualización: <strong>[PENDIENTE — fecha de publicación real]</strong>
        </p>

        <div className="rounded-xl p-4 mb-10 text-sm leading-relaxed" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
          Esta página es un borrador estructural. El contenido legal definitivo debe ser redactado o
          revisado por el equipo de Momentum o su asesoría legal antes de publicarse.
        </div>

        <div className="space-y-8">{children}</div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 sm:px-8 py-8 text-xs" style={{ borderTop: '1px solid var(--line)', color: 'var(--mute)' }}>
        © {new Date().getFullYear()} Momentum CV.
      </footer>
    </div>
  );
}

export function PlaceholderSection({ heading }: { heading: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--ink)' }}>{heading}</h2>
      <p className="text-sm italic" style={{ color: 'var(--mute)' }}>
        [PENDIENTE — contenido a redactar por el CEO o asesoría legal]
      </p>
    </section>
  );
}
