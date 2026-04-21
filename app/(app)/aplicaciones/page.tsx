'use client';

export default function AplicacionesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Seguimiento de Aplicaciones</h1>
      <p className="text-gray-600 mb-8">
        Mantén el control de tus candidaturas
      </p>

      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">Aún no has registrado ninguna aplicación</p>
      </div>
    </div>
  );
}
