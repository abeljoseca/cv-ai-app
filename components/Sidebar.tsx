'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import { useSidebar } from '@/contexts/SidebarContext';

const NAV = [
  { href: '/profile',      label: 'Mi Perfil',   iconKey: 'user',    disabled: false },
  { href: '/create-cv',    label: 'Crear CV',    iconKey: 'file',    disabled: false },
  { href: '/cvs',          label: 'Mis CVs',     iconKey: 'folder',  disabled: false },
  { href: '/historial',    label: 'Historial',   iconKey: 'history', disabled: true  },
  { href: '/applications', label: 'Seguimiento', iconKey: 'track',   disabled: false },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { profile } = useProfile();
  const { navigate, requestLeave } = useNavigationGuard();
  const isPro = profile.plan === 'pro';
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isEmbajador, setIsEmbajador] = useState(false);
  const { setSidebarOpen } = useSidebar();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('is_admin, is_editor, is_embajador').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.is_admin) setIsAdmin(true);
          if (data?.is_editor) setIsEditor(true);
          if (data?.is_embajador) setIsEmbajador(true);
        });
    });
  }, []);

  // El sidebar permanece activo durante el onboarding. En los pasos con overlay el
  // backdrop bloquea los clics; en el formulario, el guard de navegación intercepta
  // y muestra el popup "Guardar y continuar".
  const navDisabled = false;

  const initials = [profile.nombre?.[0], profile.apellido?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--line)',
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 16px 18px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      {/* Logo + collapse tab */}
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/momentum-logo.svg" alt="Momentum" style={{ height: 40 }} />
        {(isAdmin || isEditor || isEmbajador) && (
          <button
            onClick={() => setSidebarOpen(false)}
            title="Contraer menú"
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--mute)',
              flexShrink: 0,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--mute)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, iconKey, disabled: itemDisabled }) => {
          const isDisabled = itemDisabled || navDisabled;
          const active = !isDisabled && (pathname === href || pathname.startsWith(href + '/'));
          const Icon = ICONS[iconKey as keyof typeof ICONS];
          return (
            <button
              key={href}
              onClick={() => { if (!isDisabled) navigate(href); }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                border: 'none',
                background: active ? 'var(--lav)' : 'transparent',
                color: isDisabled ? '#B6BFCC' : (active ? 'var(--blue)' : 'var(--ink)'),
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                textAlign: 'left',
                transition: 'all .15s var(--ease)',
                width: '100%',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.55 : 1,
              }}
              onMouseEnter={e => { if (!active && !isDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
              onMouseLeave={e => { if (!active && !isDisabled) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon
                size={18}
                color={isDisabled ? '#B6BFCC' : (active ? 'var(--blue)' : 'var(--mute)')}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Admin / Editor / Embajador links */}
      {(isAdmin || isEditor || isEmbajador) && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(isAdmin || isEditor) && (
            <button
              onClick={() => { if (!navDisabled) navigate('/admin'); }}
              disabled={navDisabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                background: pathname.startsWith('/admin') ? 'var(--lav)' : 'transparent',
                color: navDisabled ? '#B6BFCC' : (pathname.startsWith('/admin') ? 'var(--blue)' : 'var(--ink)'),
                fontWeight: pathname.startsWith('/admin') ? 600 : 500,
                fontSize: 14, textAlign: 'left', width: '100%',
                cursor: navDisabled ? 'not-allowed' : 'pointer',
                opacity: navDisabled ? 0.55 : 1,
                transition: 'all .15s var(--ease)',
              }}
              onMouseEnter={e => { if (!pathname.startsWith('/admin') && !navDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
              onMouseLeave={e => { if (!pathname.startsWith('/admin') && !navDisabled) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <AdminIcon size={18} color={navDisabled ? '#B6BFCC' : (pathname.startsWith('/admin') ? 'var(--blue)' : 'var(--mute)')} />
              {isAdmin ? 'Admin' : 'Editor'}
            </button>
          )}
          {isEmbajador && (
            <button
              onClick={() => { if (!navDisabled) navigate('/ambassador'); }}
              disabled={navDisabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                background: pathname.startsWith('/ambassador') ? 'var(--lav)' : 'transparent',
                color: navDisabled ? '#B6BFCC' : (pathname.startsWith('/ambassador') ? 'var(--blue)' : 'var(--ink)'),
                fontWeight: pathname.startsWith('/ambassador') ? 600 : 500,
                fontSize: 14, textAlign: 'left', width: '100%',
                cursor: navDisabled ? 'not-allowed' : 'pointer',
                opacity: navDisabled ? 0.55 : 1,
                transition: 'all .15s var(--ease)',
              }}
              onMouseEnter={e => { if (!pathname.startsWith('/ambassador') && !navDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
              onMouseLeave={e => { if (!pathname.startsWith('/ambassador') && !navDisabled) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <EmbajadorIcon size={18} color={navDisabled ? '#B6BFCC' : (pathname.startsWith('/ambassador') ? 'var(--blue)' : 'var(--mute)')} />
              Embajador
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Upgrade card (free plan only) */}
      {!isPro && (
        <div style={{
          background: 'linear-gradient(180deg, #F7F8FE 0%, #EEF1FE 100%)',
          border: '1px solid #DDE3FE',
          borderRadius: 14, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F59E0B',
            }}>
              <CrownIcon size={16} />
            </span>
            <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--deep)' }}>Mejora tu cuenta</span>
          </div>
          <div style={{ color: 'var(--mute)', fontSize: 12, lineHeight: 1.45, marginBottom: 10 }}>
            Desbloquea más funciones y herramientas premium.
          </div>
          <button
            onClick={() => navigate('/account')}
            style={{
              width: '100%', padding: '8px 14px', borderRadius: 10,
              background: 'var(--blue)', color: '#fff', border: 'none',
              fontWeight: 500, fontSize: 13, cursor: 'pointer',
              transition: 'background .15s var(--ease)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--blue-600)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--blue)'}
          >
            Mejorar ahora
          </button>
        </div>
      )}

      {/* User card → Editar perfil */}
      <div
        onClick={() => { if (!navDisabled) navigate('/edit-profile'); }}
        role="button"
        tabIndex={navDisabled ? -1 : 0}
        onKeyDown={e => { if (!navDisabled && (e.key === 'Enter' || e.key === ' ')) navigate('/edit-profile'); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 10, borderRadius: 12, border: '1px solid var(--line)',
          background: !navDisabled && pathname === '/edit-profile' ? 'var(--lav)' : 'var(--surface)',
          cursor: navDisabled ? 'not-allowed' : 'pointer',
          opacity: navDisabled ? 0.55 : 1,
          transition: 'background .15s var(--ease)',
        }}
        onMouseEnter={e => { if (!navDisabled && pathname !== '/edit-profile') (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
        onMouseLeave={e => { if (!navDisabled && pathname !== '/edit-profile') (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
      >
        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'var(--lav)', color: 'var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
          }}>{initials}</div>
          {profile.foto_url && (
            <img src={profile.foto_url} alt={profile.nombre}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: 'var(--deep)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {profile.nombre} {profile.apellido}
          </div>
          <div style={{
            fontSize: 12,
            color: pathname === '/edit-profile' ? 'var(--blue)' : 'var(--mute)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            Editar perfil <ChevRIcon size={11} />
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={() => requestLeave(handleLogout)} disabled={navDisabled} style={{
        marginTop: 10,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        border: '1px solid var(--line)',
        background: 'transparent', color: 'var(--ink)',
        fontWeight: 500, fontSize: 13.5,
        width: '100%', textAlign: 'left',
        cursor: navDisabled ? 'not-allowed' : 'pointer',
        opacity: navDisabled ? 0.55 : 1,
      }}>
        <LogoutIcon size={17} />
        Cerrar sesión
      </button>

    </aside>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────────────── */
const iconBase = (size = 20, color = 'currentColor') => ({
  width: size, height: size, viewBox: '0 0 24 24' as const,
  fill: 'none', stroke: color,
  strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

const ICONS = {
  user: ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg {...iconBase(size, color)}>
      <circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.8-3.6 5-5 7.5-5s5.7 1.4 7.5 5"/>
    </svg>
  ),
  file: ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg {...iconBase(size, color)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>
    </svg>
  ),
  folder: ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg {...iconBase(size, color)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  history: ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg {...iconBase(size, color)}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>
    </svg>
  ),
  track: ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg {...iconBase(size, color)}>
      <path d="M4 6h16M4 12h10M4 18h16"/><circle cx="18" cy="12" r="2"/>
    </svg>
  ),
};

function CrownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M3 7l4 3 5-6 5 6 4-3-2 12H5z"/>
    </svg>
  );
}

function ChevRIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  );
}

function LogoutIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
    </svg>
  );
}

function AdminIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function EmbajadorIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
