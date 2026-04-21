'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkUserAndRedirect() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            router.replace('/login');
            setIsChecking(false);
          }
          return;
        }

        // Verificar si completó onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completado')
          .eq('id', user.id)
          .single();

        if (isMounted) {
          if (profile?.onboarding_completado) {
            router.replace('/perfil');
          } else {
            router.replace('/onboarding');
          }
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        if (isMounted) {
          router.replace('/login');
          setIsChecking(false);
        }
      }
    }

    checkUserAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (!isChecking) {
    return null;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-4">Resumint</div>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}
