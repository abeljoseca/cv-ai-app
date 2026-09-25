'use client';

// Client side of the Europass editor (step 5b). Every change goes to
// /api/cv/[id]/europass as ONE operation, strictly one after another (a queue), and the
// screen always shows what the server confirmed it saved. The client never writes the
// CV row itself: it holds decrypted identity values that must never be stored in it.

import { useCallback, useRef, useState } from 'react';
import type { EuropassContent } from '@/lib/cv/styles/europass/schema';
import type { VisualConfig } from '@/lib/cv/visual-config';

export interface EuropassOpResult { ok: boolean; error?: string; vacio?: boolean }

interface ServerState { content: EuropassContent; visual: VisualConfig; identidad_disponible: boolean }

export function useEuropassEditor(cvId: string | null, onServerState: (s: ServerState) => void) {
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [identidadDisponible, setIdentidadDisponible] = useState(true);

  const apply = useCallback((s: ServerState) => {
    setIdentidadDisponible(s.identidad_disponible);
    onServerState(s);
  }, [onServerState]);

  const load = useCallback(async (): Promise<boolean> => {
    if (!cvId) return false;
    try {
      const res = await fetch(`/api/cv/${cvId}/europass`, { cache: 'no-store' });
      if (!res.ok) return false;
      apply(await res.json());
      return true;
    } catch { return false; }
  }, [cvId, apply]);

  const send = useCallback((op: Record<string, unknown>): Promise<EuropassOpResult> => {
    if (!cvId) return Promise.resolve({ ok: false, error: 'CV no disponible.' });
    setPending(n => n + 1);
    const run = queue.current.then(async (): Promise<EuropassOpResult> => {
      try {
        const res = await fetch(`/api/cv/${cvId}/europass`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const error = data.error || 'No se pudo guardar el cambio. Inténtalo de nuevo.';
          setLastError(error);
          return { ok: false, error };
        }
        apply(data);
        setLastError(null);
        return { ok: true, vacio: !!data.vacio };
      } catch {
        const error = 'No se pudo guardar el cambio. Revisa tu conexión.';
        setLastError(error);
        return { ok: false, error };
      } finally {
        setPending(n => n - 1);
      }
    });
    queue.current = run;
    return run;
  }, [cvId, apply]);

  // Waits for every queued change. The screen already shows only what the server
  // confirmed, so nothing unsaved can be mistaken for saved.
  const drain = useCallback(async (): Promise<void> => { await queue.current; }, []);

  return { load, send, drain, pending, lastError, identidadDisponible };
}
