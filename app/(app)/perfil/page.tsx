'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, Experiencia, Educacion, Habilidad, Logro, Idioma } from '@/types';
import { calcularPuntajeCompletitud } from '@/lib/completitud';
import Chat from '@/components/Chat';

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [educaciones, setEducaciones] = useState<Educacion[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [idiomas, setIdiomas] = useState<Idioma[]>([]);
  const [loading, setLoading] = useState(true);
  const [completitud, setCompletitud] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function initPage() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Si no hay usuario, el layout lo redirige
        if (!user) {
          return;
        }

        // Cargar datos del usuario
        if (isMounted) {
          await loadProfileData();
        }
      } catch (error) {
        console.error('Error in perfil page:', error);
        // El error lo maneja el layout
      }
    }

    initPage();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadProfileData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Cargar experiencias
      const { data: expData } = await supabase
        .from('experiencia')
        .select('*')
        .eq('user_id', user.id);

      if (expData) {
        setExperiencias(expData as Experiencia[]);
      }

      // Cargar educaciones
      const { data: eduData } = await supabase
        .from('educacion')
        .select('*')
        .eq('user_id', user.id);

      if (eduData) {
        setEducaciones(eduData as Educacion[]);
      }

      // Cargar habilidades
      const { data: habData } = await supabase
        .from('habilidades')
        .select('*')
        .eq('user_id', user.id);

      if (habData) {
        setHabilidades(habData as Habilidad[]);
      }

      // Cargar logros
      const { data: logroData } = await supabase
        .from('logros')
        .select('*')
        .eq('user_id', user.id);

      if (logroData) {
        setLogros(logroData as Logro[]);
      }

      // Cargar idiomas
      const { data: idiomaData } = await supabase
        .from('idiomas')
        .select('*')
        .eq('user_id', user.id);

      if (idiomaData) {
        setIdiomas(idiomaData as Idioma[]);
      }

      // Calcular completitud
      if (profileData) {
        const puntaje = calcularPuntajeCompletitud(
          profileData as Profile,
          expData || [],
          eduData || [],
          habData || [],
          logroData || [],
          idiomaData || []
        );
        setCompletitud(puntaje);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando tu perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Error al cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          {profile.nombre} {profile.apellido}
        </p>
      </div>

      {/* Completitud Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Completitud del perfil</h2>
          <span className="text-2xl font-bold text-blue-600">{completitud}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${completitud}%` }}
          />
        </div>
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-2 gap-6">
        {/* Contacto */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600">Email</p>
              <p className="text-gray-900 font-medium">{profile.email_cv}</p>
            </div>
            {profile.telefono && (
              <div>
                <p className="text-gray-600">Teléfono</p>
                <p className="text-gray-900 font-medium">{profile.telefono}</p>
              </div>
            )}
            {(profile.ciudad || profile.pais) && (
              <div>
                <p className="text-gray-600">Ubicación</p>
                <p className="text-gray-900 font-medium">
                  {profile.ciudad && profile.ciudad}
                  {profile.ciudad && profile.pais ? ', ' : ''}
                  {profile.pais && profile.pais}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Habilidades */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Habilidades ({habilidades.length})
          </h3>
          {habilidades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {habilidades.map((hab) => (
                <span
                  key={hab.id}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  {hab.nombre}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aún no hay habilidades</p>
          )}
        </div>

        {/* Experiencia */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Experiencia ({experiencias.length})
          </h3>
          {experiencias.length > 0 ? (
            <div className="space-y-4">
              {experiencias.map((exp) => (
                <div key={exp.id} className="border-l-2 border-blue-300 pl-4">
                  <p className="font-medium text-gray-900">{exp.cargo}</p>
                  <p className="text-sm text-gray-600">{exp.empresa}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aún no hay experiencia</p>
          )}
        </div>

        {/* Educación */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Educación ({educaciones.length})
          </h3>
          {educaciones.length > 0 ? (
            <div className="space-y-4">
              {educaciones.map((edu) => (
                <div key={edu.id} className="border-l-2 border-green-300 pl-4">
                  <p className="font-medium text-gray-900">{edu.titulo}</p>
                  <p className="text-sm text-gray-600">{edu.institucion}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aún no hay educación</p>
          )}
        </div>

        {/* Idiomas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Idiomas ({idiomas.length})
          </h3>
          {idiomas.length > 0 ? (
            <div className="space-y-2">
              {idiomas.map((idioma) => (
                <div key={idioma.id} className="flex justify-between text-sm">
                  <p className="text-gray-900 font-medium">{idioma.nombre}</p>
                  <p className="text-gray-600">{idioma.nivel || 'Sin especificar'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aún no hay idiomas</p>
          )}
        </div>

        {/* Logros */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Logros ({logros.length})
          </h3>
          {logros.length > 0 ? (
            <ul className="space-y-2">
              {logros.map((logro) => (
                <li key={logro.id} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 font-bold">•</span>
                  {logro.descripcion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Aún no hay logros</p>
          )}
        </div>
      </div>

        </div>

        {/* Chat Column */}
        <div className="col-span-1">
          <Chat mode="perfil" />
        </div>
      </div>
    </div>
  );
}
