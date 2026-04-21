'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ESTILOS = [
  { id: 'classic', nombre: 'Clásico', descripcion: 'Formal y profesional' },
  { id: 'modern', nombre: 'Moderno', descripcion: 'Contemporáneo y limpio' },
  { id: 'minimal', nombre: 'Minimal', descripcion: 'Minimalista y elegante' },
  { id: 'bold', nombre: 'Bold', descripcion: 'Audaz y destacado' },
  { id: 'executive', nombre: 'Ejecutivo', descripcion: 'Premium y ejecutivo' },
];

export default function GeneralPage() {
  const [estiloSeleccionado, setEstiloSeleccionado] = useState('');
  const router = useRouter();

  function handleContinuar() {
    if (!estiloSeleccionado) return;
    // En el futuro: redirigir a preview con parámetros
    router.push('/crear-cv/preview');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">CV General</h1>
      <p className="text-gray-600 mb-8">
        Elige el estilo que mejor te representa
      </p>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {ESTILOS.map((estilo) => (
          <button
            key={estilo.id}
            onClick={() => setEstiloSeleccionado(estilo.id)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              estiloSeleccionado === estilo.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900">{estilo.nombre}</h3>
            <p className="text-sm text-gray-600">{estilo.descripcion}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinuar}
        disabled={!estiloSeleccionado}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuar
      </button>
    </div>
  );
}
