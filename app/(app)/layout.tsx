'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Profile } from '@/types';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { NavigationGuardProvider } from '@/contexts/NavigationGuardContext';
import { SidebarContext } from '@/contexts/SidebarContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isEditor = pathname?.includes('/create-cv/inspiration/editor/') ?? false;
  const [sidebarOpen, setSidebarOpen] = useState(!isEditor);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onOnboarding = pathname?.includes('/onboarding') ?? false;

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          // Real auth failure — clear session with hard navigation so middleware
          // doesn't keep redirecting the (now-expired) session back to a protected page.
          await supabase.auth.signOut();
          window.location.replace('/login');
          return;
        }

        const { data: profileData, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // PGRST116 = "row not found" (new user, no profile yet). Any other code is a
        // real DB/RLS error; in that case, surface the error without signing the user out.
        if (dbError && dbError.code !== 'PGRST116') {
          if (isMounted) setError(true);
          return;
        }

        if (!profileData) {
          // New user — no profile row yet. Send them to onboarding to create one.
          if (isMounted && !onOnboarding) router.replace('/onboarding');
          if (isMounted) setLoading(false);
          return;
        }

        // Only redirect to onboarding for genuinely new users (no nombre set yet).
        // Users who existed before the onboarding feature was introduced will have
        // onboarding_completado = false but already have their data — skip onboarding.
        const isNewUser = !profileData.onboarding_completado && !profileData.nombre;
        if (isNewUser && !onOnboarding) {
          if (isMounted) router.replace('/onboarding');
          return;
        }

        if (isMounted) {
          setProfile(profileData as Profile);
          setError(false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #4B6BFB', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  // Onboarding can render without a profile row — the user is in the process of creating one.
  // All other routes require a profile; while the redirect is in flight, show a spinner.
  if (!profile && !onOnboarding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #4B6BFB', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  // For onboarding with no profile yet, pass an empty stub so ProfileProvider and
  // Sidebar don't crash. They handle undefined fields gracefully.
  const safeProfile = (profile ?? {}) as Profile;

  return (
    <ProfileProvider initial={safeProfile}>
      <NavigationGuardProvider>
        <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }}>
          <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
            {sidebarOpen && (
              <Suspense fallback={null}>
                <Sidebar />
              </Suspense>
            )}

            {/* Floating expand tab — visible only when sidebar is collapsed/hidden and not in editor */}
            {!sidebarOpen && !isEditor && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Expandir menú"
                style={{
                  position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 100,
                  width: 20, height: 56,
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderLeft: 'none',
                  borderRadius: '0 8px 8px 0',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '2px 0 8px rgba(15,23,42,.08)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            )}

            <main style={{
              flex: 1,
              minWidth: 0,
              overflowY: isEditor ? 'hidden' : 'auto',
              scrollbarGutter: 'stable',
              padding: isEditor ? '0' : '28px 36px 24px',
            }}>
              {children}
            </main>
          </div>
        </SidebarContext.Provider>
      </NavigationGuardProvider>
    </ProfileProvider>
  );
}