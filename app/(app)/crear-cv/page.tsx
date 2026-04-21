'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Experiencia } from '@/types';
import { calcularPuntajeCompletitud, getMensajeCompletitud, canGenerateCV } from '@/lib/completitud';

export default function CrearCVPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [completitud, setCompletitud] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: expData } = await supabase
        .from('experiencia')
        .select('*')
        .eq('user_id', user.id);

      if (profileData) {
        setProfile(profileData as Profile);

        // Cargar todos los datos necesarios para completitud
        const { data: eduData } = await supabase
          .from('educacion')
          .select('*')
          .eq('user_id', user.id);

        const { data: habData } = await supabase
          .from('habilidades')
          .select('*')
          .eq('user_id', user.id);

        const { data: logroData } = await supabase
          .from('logros')
          .select('*')
          .eq('user_id', user.id);

        const { data: idiomaData } = await supabase
          .from('idiomas')
          .select('*')
          .eq('user_id', user.id);

        const puntaje = calcularPuntajeCompletitud(
          profileData as Profile,
          expData || [],
          eduData || [],
          habData || [],
          logroData || [],
          idiomaData || []
        );

        setCompletitud(puntaje);
        setExperiencias(expData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  const mensaje = getMensajeCompletitud(completitud);
  const puedeContinuar = canGenerateCV(completitud);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear CV</h1>
      <p className="text-gray-600 mb-8">
        Genera un CV profesional en minutos
      </p>

      {/* Evaluación de Completitud */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Completitud del perfil</h2>
            <span className="text-2xl font-bold text-blue-600">{completitud}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${completitud}%` }}
            />
          </div>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-lg ${
            completitud < 30
              ? 'bg-red-50 text-red-700 border border-red-200'
              : completitud < 35
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {mensaje}
          </div>
        )}
      </div>

      {/* Bloqueo si completitud < 30 */}
      {!puedeContinuar && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-red-900 mb-2">
            Perfil muy incompleto
          </h3>
          <p className="text-red-700 text-sm mb-4">
            Necesitas completar más información para generar un CV de calidad.
          </p>
          <button
            onClick={() => router.push('/perfil')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Ir a completar perfil
          </button>
        </div>
      )}

      {/* Selección de Intención */}
      {puedeContinuar && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            ¿Qué tipo de CV quieres crear?
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Modo General */}
            <button
              onClick={() => router.push('/crear-cv/general')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <div className="text-3xl mb-2">📄</div>
              <h3 className="font-semibold text-gray-900 text-left">CV General</h3>
              <p className="text-sm text-gray-600 text-left mt-2">
                Un CV versátil para aplicar a múltiples posiciones
              </p>
            </button>

            {/* Modo Vacante */}
            <button
              onClick={() => router.push('/crear-cv/vacante')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group"
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 text-left">CV para Vacante</h3>
              <p className="text-sm text-gray-600 text-left mt-2">
                Optimizado para una posición específica
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
