interface BoldCVProps {
  data: {
    nombre: string;
    titulo?: string;
    resumen?: string;
    contacto?: {
      email: string;
      telefono?: string;
      ubicacion?: string;
    };
    experiencias?: Array<{
      empresa: string;
      cargo: string;
      fecha_inicio: string;
      fecha_fin?: string;
      descripcion?: string;
    }>;
    educacion?: Array<{
      institucion: string;
      titulo: string;
      area?: string;
      fecha: string;
    }>;
    habilidades?: string[];
    idiomas?: Array<{
      nombre: string;
      nivel?: string;
    }>;
    logros?: string[];
  };
}

export default function BoldCV({ data }: BoldCVProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white p-12 mb-8">
        <h1 className="text-5xl font-black mb-2">{data.nombre}</h1>
        {data.titulo && (
          <p className="text-2xl font-bold text-blue-400">{data.titulo}</p>
        )}

        {/* Contacto */}
        {data.contacto && (
          <div className="flex gap-6 mt-6 text-sm">
            {data.contacto.email && <span>{data.contacto.email}</span>}
            {data.contacto.telefono && <span>•</span>}
            {data.contacto.telefono && <span>{data.contacto.telefono}</span>}
            {data.contacto.ubicacion && <span>•</span>}
            {data.contacto.ubicacion && <span>{data.contacto.ubicacion}</span>}
          </div>
        )}
      </div>

      <div className="px-12 pb-12">
        {/* Resumen */}
        {data.resumen && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-900 mb-3 pb-2 border-b-4 border-blue-500">
              PERFIL
            </h2>
            <p className="text-gray-700 leading-relaxed">{data.resumen}</p>
          </div>
        )}

        {/* Experiencia */}
        {data.experiencias && data.experiencias.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-900 mb-5 pb-2 border-b-4 border-blue-500">
              EXPERIENCIA
            </h2>
            <div className="space-y-6">
              {data.experiencias.map((exp, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-black text-gray-900 text-lg">{exp.cargo}</p>
                  <p className="text-blue-600 font-bold">{exp.empresa}</p>
                  <p className="text-sm text-gray-600">
                    {exp.fecha_inicio} {exp.fecha_fin ? `- ${exp.fecha_fin}` : '- Presente'}
                  </p>
                  {exp.descripcion && (
                    <p className="text-gray-700 mt-2">{exp.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educación */}
        {data.educacion && data.educacion.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-900 mb-5 pb-2 border-b-4 border-blue-500">
              EDUCACIÓN
            </h2>
            <div className="space-y-4">
              {data.educacion.map((edu, idx) => (
                <div key={idx}>
                  <p className="font-bold text-gray-900">{edu.titulo}</p>
                  <p className="text-blue-600 font-semibold">{edu.institucion}</p>
                  <p className="text-sm text-gray-600">{edu.fecha}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habilidades */}
        {data.habilidades && data.habilidades.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-4 border-blue-500">
              HABILIDADES
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {data.habilidades.map((hab, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 px-4 py-2 rounded font-semibold text-gray-900"
                >
                  ✓ {hab}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {data.idiomas && data.idiomas.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-4 border-blue-500">
              IDIOMAS
            </h2>
            <div className="space-y-2">
              {data.idiomas.map((idioma, idx) => (
                <p key={idx} className="font-semibold text-gray-900">
                  {idioma.nombre}
                  {idioma.nivel && ` — ${idioma.nivel}`}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Logros */}
        {data.logros && data.logros.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b-4 border-blue-500">
              LOGROS
            </h2>
            <ul className="space-y-2">
              {data.logros.map((logro, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-blue-600 font-black">★</span>
                  <span className="text-gray-700">{logro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
