'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Chat from '@/components/Chat';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email_cv: '',
    profesion_perfil: '',
    telefono: '',
    ciudad: '',
    pais: '',
    foto_url: '',
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            router.replace('/login');
          }
          return;
        }

        if (isMounted) {
          setInitLoading(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (isMounted) {
          router.replace('/login');
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const requiredFields = ['nombre', 'apellido', 'email_cv', 'profesion_perfil'];

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData].trim()) {
        newErrors[field] = 'Este campo es obligatorio';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email_cv: formData.email_cv,
          profesion_perfil: formData.profesion_perfil,
          telefono: formData.telefono || null,
          ciudad: formData.ciudad || null,
          pais: formData.pais || null,
          foto_url: formData.foto_url || null,
          onboarding_completado: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      router.push('/perfil');
    } catch (err: any) {
      setErrors({
        submit: err.message || 'Ocurrió un error al guardar tu perfil',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  if (initLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="grid grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Form */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vamos a crear tu CV
        </h1>
        <p className="text-gray-600 mb-8">
          Primero, cuéntanos sobre ti. Estos datos nos ayudarán a generar tu CV profesional.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange(e, 'nombre')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Juan"
              />
              {errors.nombre && (
                <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => handleChange(e, 'apellido')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Pérez"
              />
              {errors.apellido && (
                <p className="text-red-600 text-sm mt-1">{errors.apellido}</p>
              )}
            </div>
          </div>

          {/* Email CV */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email para el CV *
            </label>
            <input
              type="email"
              value={formData.email_cv}
              onChange={(e) => handleChange(e, 'email_cv')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="juan@email.com"
            />
            {errors.email_cv && (
              <p className="text-red-600 text-sm mt-1">{errors.email_cv}</p>
            )}
          </div>

          {/* Profesión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu profesión *
            </label>
            <input
              type="text"
              value={formData.profesion_perfil}
              onChange={(e) => handleChange(e, 'profesion_perfil')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Ej: Ingeniero de Software"
            />
            {errors.profesion_perfil && (
              <p className="text-red-600 text-sm mt-1">
                {errors.profesion_perfil}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => handleChange(e, 'telefono')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="+34 600 123 456"
            />
          </div>

          {/* Ciudad y País */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad (opcional)
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => handleChange(e, 'ciudad')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Madrid"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País (opcional)
              </label>
              <input
                type="text"
                value={formData.pais}
                onChange={(e) => handleChange(e, 'pais')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="España"
              />
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Continuar'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          * Campos obligatorios
        </p>
        </div>

        {/* Chat */}
        <div className="col-span-1">
          <Chat mode="onboarding" />
        </div>
      </div>
    </div>
  );
}
