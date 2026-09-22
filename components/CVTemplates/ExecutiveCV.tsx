import EditableField from './EditableField'
import { CVEditProps, CVContent } from './index'
import { formatPhone } from '@/lib/format-phone'

interface ExecutiveCVProps extends CVEditProps {
  data: CVContent
}

function formatDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return fin || ''
  return fin ? `${inicio} – ${fin}` : inicio
}

export default function ExecutiveCV({ data, isEditMode = false, onFieldChange, accentColor }: ExecutiveCVProps) {
  const em = isEditMode
  const ofc = onFieldChange
  const accent = accentColor || '#1F3A5F'
  const sidebarBg = '#1A1A1A'

  const sectionRule = (
    <div style={{ borderBottom: `2px solid ${accent}`, marginBottom: '12px', paddingBottom: '4px' }} />
  )

  return (
    <div className="max-w-5xl mx-auto bg-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <div style={{ display: 'flex' }}>

        {/* Sidebar */}
        <div style={{ width: '260px', backgroundColor: sidebarBg, color: '#fff', padding: '40px 24px', flexShrink: 0 }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '24px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20pt', fontWeight: 700, lineHeight: 1.2, color: '#fff' }}>{data.nombre}</h1>
            {data.titulo && (
              <p style={{ fontSize: '11pt', color: accent === '#1F3A5F' ? '#93C5FD' : accent, marginTop: '6px', fontStyle: 'italic' }}>
                {data.titulo}
              </p>
            )}
          </div>

          {/* Contact */}
          {data.contacto && (
            <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '24px' }}>
              <p style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                Contacto
              </p>
              {data.contacto.email && <p style={{ fontSize: '9pt', color: '#fff', marginBottom: '4px', wordBreak: 'break-all' }}>{data.contacto.email}</p>}
              {data.contacto.telefono && <p style={{ fontSize: '9pt', color: '#fff', marginBottom: '4px' }}>{formatPhone(data.contacto.telefono)}</p>}
              {data.contacto.ubicacion && <p style={{ fontSize: '9pt', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{data.contacto.ubicacion}</p>}
              {data.contacto.linkedin && <p style={{ fontSize: '8.5pt', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{data.contacto.linkedin}</p>}
            </div>
          )}

          {/* Areas of Expertise */}
          {data.areas_expertise && data.areas_expertise.length > 0 && (
            <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '24px' }}>
              <p style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
                Áreas de Especialización
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {data.areas_expertise.map((area, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '4px', backgroundColor: accent, borderRadius: '50%', flexShrink: 0 }} />
                    <span style={{ fontSize: '9.5pt', color: 'rgba(255,255,255,0.85)' }}>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education in sidebar */}
          {data.educacion.length > 0 && (
            <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '24px' }}>
              <p style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
                Educación
              </p>
              {data.educacion.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: '10px', breakInside: 'avoid' }}>
                  <p style={{ fontSize: '9.5pt', fontWeight: 700, color: '#fff' }}>{edu.titulo}</p>
                  <p style={{ fontSize: '9pt', color: 'rgba(255,255,255,0.7)' }}>{edu.institucion}</p>
                  <p style={{ fontSize: '8.5pt', color: 'rgba(255,255,255,0.5)' }}>{formatDate(edu.fecha_inicio, edu.fecha_fin)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {data.idiomas.length > 0 && (
            <div>
              <p style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                Idiomas
              </p>
              {data.idiomas.map((l, idx) => (
                <p key={idx} style={{ fontSize: '9pt', color: 'rgba(255,255,255,0.8)', marginBottom: '3px' }}>
                  {l.nombre}{l.nivel ? ` · ${l.nivel}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '40px 40px', fontSize: '10.5pt', lineHeight: 1.55 }}>

          {/* Executive Summary */}
          {(data.resumen_ejecutivo || data.resumen) && (
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: '6px' }}>
                Resumen Ejecutivo
              </h2>
              {sectionRule}
              <EditableField tag="p" value={data.resumen_ejecutivo || data.resumen || ''}
                path={data.resumen_ejecutivo ? 'resumen_ejecutivo' : 'resumen'}
                isEditMode={em} onFieldChange={ofc}
                style={{ fontSize: '10.5pt', color: '#1A1A1A', lineHeight: 1.65 }} />
            </div>
          )}

          {/* Experience */}
          {data.experiencias.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: '6px' }}>
                Experiencia Profesional
              </h2>
              {sectionRule}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {data.experiencias.map((exp, idx) => (
                  <div key={idx} style={{ breakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <EditableField tag="span" value={exp.cargo} path={`experiencias.${idx}.cargo`}
                        isEditMode={em} onFieldChange={ofc}
                        style={{ fontSize: '12pt', fontWeight: 700, color: '#000' }} />
                      <span style={{ fontSize: '9.5pt', color: '#595959', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                        {formatDate(exp.fecha_inicio, exp.fecha_fin)}
                      </span>
                    </div>
                    <EditableField tag="div" value={exp.empresa} path={`experiencias.${idx}.empresa`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontSize: '10.5pt', fontWeight: 600, color: accent, marginBottom: '6px' }} />
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                        {exp.bullets.map((b, bi) => (
                          <li key={bi} style={{ fontSize: '10pt', color: '#333', marginBottom: '3px', listStyle: 'disc', breakInside: 'avoid' }}>
                            <EditableField tag="span" value={b} path={`experiencias.${idx}.bullets.${bi}`}
                              isEditMode={em} onFieldChange={ofc} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {!exp.bullets?.length && exp.descripcion && (
                      <EditableField tag="p" value={exp.descripcion} path={`experiencias.${idx}.descripcion`}
                        isEditMode={em} onFieldChange={ofc} style={{ fontSize: '10pt', color: '#333' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {data.logros.length > 0 && (
            <div>
              <h2 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: '6px' }}>
                Logros Clave
              </h2>
              {sectionRule}
              <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
                {data.logros.map((logro, idx) => (
                  <li key={idx} style={{ fontSize: '10pt', color: '#333', marginBottom: '4px', listStyle: 'none', display: 'flex', gap: '8px', breakInside: 'avoid' }}>
                    <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>◆</span>
                    <EditableField tag="span" value={logro} path={`logros.${idx}`}
                      isEditMode={em} onFieldChange={ofc} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
