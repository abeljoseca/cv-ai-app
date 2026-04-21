interface MinimalCVProps {
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

export default function MinimalCV({ data }: MinimalCVProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-16 text-gray-900 font-sans">
      {/* Nombre */}
      <h1 className="text-5xl font-light tracking-tight mb-1">{data.nombre}</h1>
      {data.titulo && (
        <p className="text-lg text-gray-600 font-light mb-8">{data.titulo}</p>
      )}

      {/* Línea divisora minimalista */}
      <div className="h-px bg-gray-300 mb-8"></div>

      {/* Contacto */}
      {data.contacto && (
        <div className="flex gap-6 text-sm text-gray-600 mb-12">
          {data.contacto.email && <span>{data.contacto.email}</span>}
          {data.contacto.telefono && <span>{data.contacto.telefono}</span>}
          {data.contacto.ubicacion && <span>{data.contacto.ubicacion}</span>}
        </div>
      )}

      {/* Resumen */}
      {data.resumen && (
        <div className="mb-12">
          <p className="text-gray-700 leading-relaxed">{data.resumen}</p>
        </div>
      )}

      {/* Experiencia */}
      {data.experiencias && data.experiencias.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
            Experiencia
          </h2>
          <div className="space-y-6">
            {data.experiencias.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-semibold text-gray-900">{exp.cargo}</p>
                  <p className="text-xs text-gray-600">
                    {exp.fecha_inicio} {exp.fecha_fin ? `– ${exp.fecha_fin}` : ''}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-2">{exp.empresa}</p>
                {exp.descripcion && (
                  <p className="text-sm text-gray-700">{exp.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educación */}
      {data.educacion && data.educacion.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">
            Educación
          </h2>
          <div className="space-y-4">
            {data.educacion.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-gray-900">{edu.titulo}</p>
                  <p className="text-xs text-gray-600">{edu.fecha}</p>
                </div>
                <p className="text-sm text-gray-600">{edu.institucion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habilidades */}
      {data.habilidades && data.habilidades.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
            Habilidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.habilidades.map((hab, idx) => (
              <span key={idx} className="px-2 py-1 text-xs border border-gray-300">
                {hab}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Idiomas */}
      {data.idiomas && data.idiomas.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
            Idiomas
          </h2>
          <div className="text-sm text-gray-700 space-y-1">
            {data.idiomas.map((idioma, idx) => (
              <p key={idx}>{idioma.nombre}</p>
            ))}
          </div>
        </div>
      )}

      {/* Logros */}
      {data.logros && data.logros.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
            Logros
          </h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {data.logros.map((logro, idx) => (
              <li key={idx}>— {logro}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
