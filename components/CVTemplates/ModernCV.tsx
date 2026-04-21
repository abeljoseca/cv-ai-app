interface ModernCVProps {
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

export default function ModernCV({ data }: ModernCVProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/3 bg-blue-600 text-white p-8">
          <h1 className="text-3xl font-bold mb-2">{data.nombre}</h1>
          {data.titulo && <p className="text-blue-100 mb-6">{data.titulo}</p>}

          {/* Contact */}
          {data.contacto && (
            <div className="mb-8 text-sm space-y-1">
              {data.contacto.email && <p>{data.contacto.email}</p>}
              {data.contacto.telefono && <p>{data.contacto.telefono}</p>}
              {data.contacto.ubicacion && <p>{data.contacto.ubicacion}</p>}
            </div>
          )}

          {/* Habilidades */}
          {data.habilidades && data.habilidades.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3">Habilidades</h3>
              <div className="space-y-2">
                {data.habilidades.map((hab, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    <span className="text-sm">{hab}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idiomas */}
          {data.idiomas && data.idiomas.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Idiomas</h3>
              <div className="space-y-1 text-sm">
                {data.idiomas.map((idioma, idx) => (
                  <p key={idx}>{idioma.nombre}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="w-2/3 p-8 text-gray-900">
          {/* Resumen */}
          {data.resumen && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">
                Resumen
              </h2>
              <p className="text-gray-700">{data.resumen}</p>
            </div>
          )}

          {/* Experiencia */}
          {data.experiencias && data.experiencias.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">
                Experiencia
              </h2>
              <div className="space-y-5">
                {data.experiencias.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-gray-900">{exp.cargo}</p>
                      <p className="text-sm text-gray-600">
                        {exp.fecha_inicio} {exp.fecha_fin ? `- ${exp.fecha_fin}` : '- Presente'}
                      </p>
                    </div>
                    <p className="text-blue-600 text-sm font-medium">{exp.empresa}</p>
                    {exp.descripcion && (
                      <p className="text-gray-700 text-sm mt-2">{exp.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educación */}
          {data.educacion && data.educacion.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">
                Educación
              </h2>
              <div className="space-y-4">
                {data.educacion.map((edu, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-gray-900">{edu.titulo}</p>
                      <p className="text-sm text-gray-600">{edu.fecha}</p>
                    </div>
                    <p className="text-gray-600">{edu.institucion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logros */}
          {data.logros && data.logros.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">
                Logros
              </h2>
              <ul className="text-gray-700 text-sm space-y-2">
                {data.logros.map((logro, idx) => (
                  <li key={idx}>• {logro}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
