'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Profile } from '@/types';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isMounted) {
            setError(true);
            router.replace('/login');
          }
          return;
        }

        const { data: profileData, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (dbError || !profileData) {
          if (isMounted) {
            setError(true);
            router.replace('/login');
          }
          return;
        }

        // Si no completó onboarding, redirigir (excepto si ya está en /onboarding)
        if (!profileData.onboarding_completado && !window.location.pathname.includes('/onboarding')) {
          if (isMounted) {
            router.replace('/onboarding');
          }
          return;
        }

        if (isMounted) {
          setProfile(profileData as Profile);
          setError(false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (isMounted) {
          setError(true);
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-500">Cargando aplicación...</p>
      </div>
    );
  }

  if (error || !profile) {
    return null; // El router.replace ya redirige a /login
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
