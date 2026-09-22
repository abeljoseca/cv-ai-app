'use client';

import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type GuardMode = 'saved' | 'unsaved' | 'onboarding' | 'edit-unsaved';

interface NavigationGuardContextType {
  navigate: (href: string) => void;
  requestLeave: (action: () => void) => void;
  registerGuard: (mode?: GuardMode) => void;
  unregisterGuard: () => void;
  setGuardMode: (mode: GuardMode) => void;
  setSaveAndContinue: (cb: (() => Promise<boolean>) | null) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  navigate: () => {},
  requestLeave: () => {},
  registerGuard: () => {},
  unregisterGuard: () => {},
  setGuardMode: () => {},
  setSaveAndContinue: () => {},
});

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const guardActive = useRef(false);
  const saveAndContinueRef = useRef<(() => Promise<boolean>) | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [guardMode, setGuardModeState] = useState<GuardMode>('saved');
  const [saving, setSaving] = useState(false);
  const [obError, setObError] = useState('');

  function registerGuard(mode: GuardMode = 'saved') {
    guardActive.current = true;
    setGuardModeState(mode);
  }
  function unregisterGuard() {
    guardActive.current = false;
    setPendingAction(null);
    setObError('');
  }
  function setGuardMode(mode: GuardMode) { setGuardModeState(mode); }
  function setSaveAndContinue(cb: (() => Promise<boolean>) | null) { saveAndContinueRef.current = cb; }

  function requestLeave(action: () => void) {
    if (guardActive.current) {
      setObError('');
      setPendingAction(() => action);
    } else {
      action();
    }
  }
  function navigate(href: string) {
    requestLeave(() => router.push(href));
  }

  // saved / unsaved: continuar = salir (ejecutar la navegación pendiente).
  function confirmLeave() {
    const action = pendingAction;
    guardActive.current = false;
    setPendingAction(null);
    action?.();
  }
  function cancelLeave() {
    setPendingAction(null);
    setObError('');
  }

  // onboarding: guardar y terminar; la callback navega a /perfil por su cuenta.
  async function onboardingSaveAndContinue() {
    const cb = saveAndContinueRef.current;
    if (!cb) { cancelLeave(); return; }
    setSaving(true);
    try {
      const ok = await cb();
      if (!ok) setObError('Completa tu nombre, apellido y correo para continuar.');
    } finally { setSaving(false); }
  }

  // edit-unsaved: guardar los cambios y luego continuar al destino que el usuario eligió.
  async function editSaveAndContinue() {
    const cb = saveAndContinueRef.current;
    if (!cb) { cancelLeave(); return; }
    setSaving(true);
    try {
      const ok = await cb();
      if (!ok) { setObError('Revisa los campos obligatorios para poder guardar.'); return; }
      const action = pendingAction;
      guardActive.current = false;
      setPendingAction(null);
      action?.();
    } finally { setSaving(false); }
  }

  const isSaveMode = guardMode === 'onboarding' || guardMode === 'edit-unsaved';

  const icon = guardMode === 'unsaved'
    ? { bg: '#FEF3C7', border: '#FDE68A', el: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ) }
    : guardMode === 'saved'
    ? { bg: '#EFF6FF', border: '#BFDBFE', el: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ) }
    : { bg: '#EFF6FF', border: '#BFDBFE', el: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>
        </svg>
      ) };

  const copy: { title: string; message: ReactNode } =
    guardMode === 'saved'
      ? { title: '¿Salir de la previsualización?', message: <>Tu CV está guardado. Lo encontrarás en <strong>Mis CVs</strong> cuando quieras continuar o descargarlo.</> }
      : guardMode === 'unsaved'
      ? { title: 'Tienes cambios sin guardar', message: <>Si sales ahora perderás las ediciones de texto. Haz clic en <strong>Guardar y revisar</strong> para conservarlas.</> }
      : guardMode === 'onboarding'
      ? { title: 'Termina de configurar tu perfil', message: <>Antes de ir a otra sección, guarda la información de tu perfil. Pulsa <strong>Guardar y continuar</strong> para terminar.</> }
      : { title: 'Tienes cambios sin guardar', message: <>Guarda tus cambios antes de ir a otra sección. Pulsa <strong>Guardar y continuar</strong> para conservarlos.</> };

  return (
    <NavigationGuardContext.Provider value={{ navigate, requestLeave, registerGuard, unregisterGuard, setGuardMode, setSaveAndContinue }}>
      {children}

      {pendingAction && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          padding: 20, animation: 'fadeIn .15s ease',
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, padding: '24px 26px',
            maxWidth: 440, width: '100%',
            boxShadow: '0 24px 64px rgba(15,23,42,.22)',
            animation: 'fadeUp .18s var(--ease)',
          }}>
            {/* Icono + texto en fila */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                background: icon.bg, border: `1px solid ${icon.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon.el}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <h3 style={{ margin: '0 0 5px', fontSize: 16, fontWeight: 700, color: 'var(--deep)', letterSpacing: '-0.01em' }}>
                  {copy.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)', lineHeight: 1.55 }}>
                  {copy.message}
                </p>
                {isSaveMode && obError && (
                  <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--danger)', lineHeight: 1.5 }}>{obError}</p>
                )}
              </div>
            </div>

            {/* Botones en fila */}
            <div style={{ display: 'flex', gap: 10 }}>
              {isSaveMode ? (
                <>
                  <button
                    onClick={guardMode === 'onboarding' ? onboardingSaveAndContinue : editSaveAndContinue}
                    disabled={saving}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                      background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 600,
                      cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'opacity .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = saving ? '0.7' : '1')}
                  >
                    {saving ? 'Guardando…' : 'Guardar y continuar'}
                  </button>
                  <button
                    onClick={cancelLeave}
                    disabled={saving}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      background: 'transparent', color: 'var(--ink)',
                      border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={cancelLeave}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      background: 'var(--blue)', color: '#fff', border: 'none',
                      cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'opacity .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Seguir aquí
                  </button>
                  <button
                    onClick={confirmLeave}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      background: 'transparent', color: 'var(--ink)',
                      border: '1px solid var(--line)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {guardMode === 'saved' ? 'Salir' : 'Salir y perder cambios'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
