interface ExecutiveCVProps {
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

export default function ExecutiveCV({ data }: ExecutiveCVProps) {
  return (
    <div className="max-w-5xl mx-auto bg-white">
      <div className="flex">
        {/* Sidebar Premium */}
        <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-12">
          <h1 className="text-4xl font-black mb-1 leading-tight">{data.nombre}</h1>
          {data.titulo && (
            <p className="text-lg font-bold text-slate-300 mb-8">{data.titulo}</p>
          )}

          {/* Contacto */}
          {data.contacto && (
            <div className="mb-10 pb-8 border-b border-slate-600 text-sm space-y-2">
              {data.contacto.email && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold">EMAIL</p>
                  <p className="text-white">{data.contacto.email}</p>
                </div>
              )}
              {data.contacto.telefono && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold">TELÉFONO</p>
                  <p className="text-white">{data.contacto.telefono}</p>
                </div>
              )}
              {data.contacto.ubicacion && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold">UBICACIÓN</p>
                  <p className="text-white">{data.contacto.ubicacion}</p>
                </div>
              )}
            </div>
          )}

          {/* Habilidades */}
          {data.habilidades && data.habilidades.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                Habilidades
              </p>
              <div className="space-y-2">
                {data.habilidades.slice(0, 6).map((hab, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm">{hab}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idiomas */}
          {data.idiomas && data.idiomas.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Idiomas
              </p>
              <div className="space-y-1">
                {data.idiomas.map((idioma, idx) => (
                  <p key={idx} className="text-sm">
                    {idioma.nombre}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-12 text-gray-900">
          {/* Resumen */}
          {data.resumen && (
            <div className="mb-12">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4 pb-2 border-b-2 border-blue-600">
                Resumen Ejecutivo
              </h2>
              <p className="text-gray-700 leading-relaxed">{data.resumen}</p>
            </div>
          )}

          {/* Experiencia */}
          {data.experiencias && data.experiencias.length > 0 && (
            <div className="mb-12">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-6 pb-2 border-b-2 border-blue-600">
                Experiencia Profesional
              </h2>
              <div className="space-y-8">
                {data.experiencias.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-2">
                      <p className="font-black text-lg text-gray-900">
                        {exp.cargo}
                      </p>
                      <p className="text-xs text-slate-600 font-semibold">
                        {exp.fecha_inicio} {exp.fecha_fin ? `– ${exp.fecha_fin}` : ''}
                      </p>
                    </div>
                    <p className="text-blue-600 font-bold text-sm mb-2">
                      {exp.empresa}
                    </p>
                    {exp.descripcion && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {exp.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educación */}
          {data.educacion && data.educacion.length > 0 && (
            <div className="mb-12">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-6 pb-2 border-b-2 border-blue-600">
                Formación Académica
              </h2>
              <div className="space-y-5">
                {data.educacion.map((edu, idx) => (
                  <div key={idx}>
                    <p className="font-bold text-gray-900">{edu.titulo}</p>
                    <p className="text-blue-600 font-semibold text-sm">
                      {edu.institucion}
                    </p>
                    <p className="text-xs text-slate-600">{edu.fecha}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logros */}
          {data.logros && data.logros.length > 0 && (
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4 pb-2 border-b-2 border-blue-600">
                Logros Destacados
              </h2>
              <ul className="space-y-2">
                {data.logros.map((logro, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-blue-600 font-black">◆</span>
                    <span className="text-gray-700 text-sm">{logro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
