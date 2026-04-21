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

export default function VacantePage() {
  const [descripcionVacante, setDescripcionVacante] = useState('');
  const [estiloSeleccionado, setEstiloSeleccionado] = useState('');
  const router = useRouter();

  function handleContinuar() {
    if (!descripcionVacante.trim() || !estiloSeleccionado) return;
    // En el futuro: redirigir a preview con parámetros
    router.push('/crear-cv/preview');
  }

  const puedeContinuar = descripcionVacante.trim().length > 0 && estiloSeleccionado;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">CV para Vacante Específica</h1>
      <p className="text-gray-600 mb-8">
        Optimizaremos tu CV para la posición que buscas
      </p>

      {/* Descripción de la Vacante */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Descripción de la vacante
        </label>
        <textarea
          value={descripcionVacante}
          onChange={(e) => setDescripcionVacante(e.target.value)}
          placeholder="Pega aquí la descripción completa de la posición que te interesa..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
          rows={6}
        />
        <p className="text-sm text-gray-500 mt-2">
          {descripcionVacante.length} caracteres
        </p>
      </div>

      {/* Selección de Estilo */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Elige el estilo de CV
        </label>

        <div className="grid grid-cols-2 gap-4">
          {ESTILOS.map((estilo) => (
            <button
              key={estilo.id}
              onClick={() => setEstiloSeleccionado(estilo.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
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
      </div>

      <button
        onClick={handleContinuar}
        disabled={!puedeContinuar}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previsualizar CV
      </button>
    </div>
  );
}
