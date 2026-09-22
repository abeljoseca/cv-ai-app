'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calcularPuntajeCompletitud } from '@/lib/completitud';

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

        const [
          { data: profile },
          { data: experiencias },
          { data: educaciones },
          { data: habilidades },
          { data: logros },
          { data: idiomas },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('experiencia').select('*').eq('user_id', user.id),
          supabase.from('educacion').select('*').eq('user_id', user.id),
          supabase.from('habilidades').select('*').eq('user_id', user.id),
          supabase.from('logros').select('*').eq('user_id', user.id),
          supabase.from('idiomas').select('*').eq('user_id', user.id),
        ]);

        if (isMounted) {
          let hasProgress = profile?.onboarding_completado ?? false;

          if (!hasProgress && profile) {
            const puntaje = calcularPuntajeCompletitud(
              profile,
              experiencias ?? [],
              educaciones ?? [],
              habilidades ?? [],
              logros ?? [],
              idiomas ?? []
            );
            hasProgress = puntaje >= 30;
          }

          if (hasProgress) {
            if (!profile?.onboarding_completado) {
              supabase.from('profiles').update({ onboarding_completado: true }).eq('id', user.id).then(() => {});
            }
            router.replace('/profile');
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
        <div className="text-4xl font-bold text-blue-600 mb-4">Momentum</div>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}