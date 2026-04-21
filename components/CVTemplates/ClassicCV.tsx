interface ClassicCVProps {
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

export default function ClassicCV({ data }: ClassicCVProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-12 text-gray-900 font-sans">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-gray-900">{data.nombre}</h1>
        {data.titulo && (
          <p className="text-xl text-gray-600 mt-2">{data.titulo}</p>
        )}
      </div>

      {/* Contact */}
      {data.contacto && (
        <div className="flex gap-4 text-sm mb-6 text-gray-700">
          {data.contacto.email && <span>{data.contacto.email}</span>}
          {data.contacto.telefono && <span>|</span>}
          {data.contacto.telefono && <span>{data.contacto.telefono}</span>}
          {data.contacto.ubicacion && <span>|</span>}
          {data.contacto.ubicacion && <span>{data.contacto.ubicacion}</span>}
        </div>
      )}

      {/* Resumen */}
      {data.resumen && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Resumen Profesional</h2>
          <p className="text-gray-700">{data.resumen}</p>
        </div>
      )}

      {/* Experiencia */}
      {data.experiencias && data.experiencias.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Experiencia Profesional</h2>
          <div className="space-y-4">
            {data.experiencias.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-gray-900">{exp.cargo}</p>
                  <p className="text-sm text-gray-600">
                    {exp.fecha_inicio} {exp.fecha_fin ? `- ${exp.fecha_fin}` : '- Presente'}
                  </p>
                </div>
                <p className="text-gray-600">{exp.empresa}</p>
                {exp.descripcion && (
                  <p className="text-gray-700 text-sm mt-1">{exp.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educación */}
      {data.educacion && data.educacion.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Educación</h2>
          <div className="space-y-3">
            {data.educacion.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-gray-900">{edu.titulo}</p>
                  <p className="text-sm text-gray-600">{edu.fecha}</p>
                </div>
                <p className="text-gray-600">{edu.institucion}</p>
                {edu.area && <p className="text-sm text-gray-600">{edu.area}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habilidades */}
      {data.habilidades && data.habilidades.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Habilidades</h2>
          <p className="text-gray-700 text-sm">{data.habilidades.join(', ')}</p>
        </div>
      )}

      {/* Idiomas */}
      {data.idiomas && data.idiomas.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Idiomas</h2>
          <ul className="text-gray-700 text-sm space-y-1">
            {data.idiomas.map((idioma, idx) => (
              <li key={idx}>
                {idioma.nombre} {idioma.nivel && `- ${idioma.nivel}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Logros */}
      {data.logros && data.logros.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Logros</h2>
          <ul className="text-gray-700 text-sm space-y-1">
            {data.logros.map((logro, idx) => (
              <li key={idx}>• {logro}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
