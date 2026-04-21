'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

export default function CuentaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error loading profile:', error);
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mejorar Cuenta</h1>
      <p className="text-gray-600 mb-8">
        Gestiona tu plan y acceso a funcionalidades premium
      </p>

      {/* Plan Actual */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Actual</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">Plan</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {profile?.plan === 'gratuito' ? 'Gratuito' : 'Pro'}
            </p>
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Próximamente
          </button>
        </div>
      </div>

      {/* Comparativa de Planes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Comparativa de Planes</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Gratuito */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Gratuito</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ 2 CVs generales/mes</li>
              <li>✓ 2 CVs para vacante/mes</li>
              <li>✓ 2 estilos disponibles</li>
              <li>✓ PDF con branding</li>
              <li>✓ Últimos 3 CVs</li>
              <li>✓ Máx. 5 aplicaciones</li>
            </ul>
          </div>

          {/* Pro */}
          <div className="border-2 border-blue-600 rounded-lg p-6 bg-blue-50">
            <h3 className="font-semibold text-gray-900 mb-4">Pro - $9.99/mes</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ CVs ilimitados</li>
              <li>✓ 5 estilos disponibles</li>
              <li>✓ PDF + DOCX</li>
              <li>✓ Sin branding</li>
              <li>✓ Historial completo</li>
              <li>✓ Aplicaciones ilimitadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
