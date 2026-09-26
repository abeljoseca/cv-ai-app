'use client';

// Europass v2 with real pages (spec change 32). One paginator (lib/cv/paginate.ts):
// - preview: an invisible copy with exactly the printed markup is measured; the visible
//   CV (with editor controls) shows A4 sheets split at those points, scaled to fit;
// - print: the page measures itself and forces page breaks at the same points, then sets
//   data-cv-ready so the PDF renderer prints it (never before pagination).

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import EuropassV2CV, { type EuropassV2Props } from './EuropassV2CV';
import { applyPrintBreaks, applyScreenBreaks, computeBreaks, flowChildren, MM, type SheetLayout } from '@/lib/cv/paginate';

const SHEET_W = 210 * MM;
const GAP = 28;

interface Props extends EuropassV2Props {
  mode: 'preview' | 'print';
  onPages?: (pages: number) => void;
}

const sheetOf = (root: HTMLElement | null) => root?.querySelector<HTMLElement>('.ep2-page') ?? null;

export default function PaginatedEuropass({ mode, onPages, ...cv }: Props) {
  const visibleRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [layout, setLayout] = useState<SheetLayout & { pages: number } | null>(null);
  const [ready, setReady] = useState(false);
  const lastKey = useRef('');

  // Measure only with the real font loaded (fallback fonts have other metrics).
  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => { if (alive) setFontsReady(true); });
    return () => { alive = false; };
  }, []);

  // Preview: scale the fixed-width A4 sheets down to the available width.
  useEffect(() => {
    if (mode !== 'preview' || !boxRef.current) return;
    const el = boxRef.current;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / SHEET_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  // Runs after every render (no deps on purpose): any edit, density or section change can
  // move the page breaks. Measuring the DOM and then setting state is what layout effects
  // are for; the state only changes when the result changes, so it settles in one pass.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!fontsReady) return;
    const visible = sheetOf(visibleRef.current);
    if (!visible) return;

    if (mode === 'print') {
      applyPrintBreaks(visible, []);
      const { breaks, pages } = computeBreaks(visible);
      applyPrintBreaks(visible, breaks);
      onPages?.(pages);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- set once, after measuring
      if (!ready) setReady(true);
      return;
    }

    const clone = sheetOf(cloneRef.current);
    if (!clone) return;
    const { breaks, pages } = computeBreaks(clone);
    // Same printed blocks on both copies, or no page split at all (never a wrong one).
    const safe = flowChildren(clone, false).length === flowChildren(visible, false).length ? breaks : [];
    const sheets = applyScreenBreaks(visible, safe, scale, GAP);
    const next = { ...sheets, pages };
    const key = JSON.stringify(next);
    if (key !== lastKey.current) {
      lastKey.current = key;
      setLayout(next);
      onPages?.(pages);
    }
  });

  const cvProps = cv;

  if (mode === 'print') {
    return (
      <div ref={visibleRef} data-cv-ready={ready ? 'true' : undefined}>
        <EuropassV2CV {...cvProps} enlaces />
      </div>
    );
  }

  const height = (layout?.minHeight ?? 297 * MM) * scale;
  return (
    <div ref={boxRef} style={{ width: '100%' }}>
      <div style={{ width: SHEET_W * scale, height, margin: '0 auto', position: 'relative' }}>
        <div ref={visibleRef} style={{ width: SHEET_W, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
          <EuropassV2CV {...cvProps} />
          {layout?.gaps.map((g, i) => (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute', left: 0, right: 0, top: g.top, height: g.height, background: '#E9EDF3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
              fontFamily: 'system-ui, sans-serif', fontSize: 11, color: '#64748B', letterSpacing: '.04em',
              boxShadow: 'inset 0 6px 6px -6px rgba(15,23,42,.12), inset 0 -6px 6px -6px rgba(15,23,42,.12)',
            }}>
              Página {i + 2} de {layout.pages}
            </div>
          ))}
        </div>
      </div>
      {/* The printed markup, measured to decide the pages. Never visible. */}
      {/* Inside a 0×0 clipped box: it is laid out (so it can be measured) but adds no
          height to anything — otherwise it made the whole page scrollable and blank. */}
      <div style={{ position: 'relative', width: 0, height: 0, overflow: 'hidden' }}>
        <div ref={cloneRef} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: SHEET_W, visibility: 'hidden', pointerEvents: 'none' }}>
          <EuropassV2CV data={cv.data} accentColor={cv.accentColor} densidad={cv.densidad} fotoTam={cv.fotoTam} />
        </div>
      </div>
    </div>
  );
}
