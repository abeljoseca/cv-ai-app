'use client';

export default function MisCVsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis CVs</h1>
      <p className="text-gray-600 mb-8">
        Historial de todos tus CVs generados
      </p>

      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">Aún no has generado ningún CV</p>
      </div>
    </div>
  );
}
