'use client';

export default function PreviewPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Vista Previa del CV</h1>
      <p className="text-gray-600 mb-8">
        Aquí se mostrará tu CV generado
      </p>

      <div className="grid grid-cols-3 gap-6">
        {/* Preview del CV */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm p-8 min-h-96">
          <div className="text-gray-500 text-center py-16">
            Generando CV...
          </div>
        </div>

        {/* Opciones */}
        <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Editar
            </button>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Crear CV
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Atrás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
