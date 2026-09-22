import EditableField from './EditableField'
import { CVEditProps, CVContent } from './index'
import { formatPhone } from '@/lib/format-phone'
import { shouldShowArea } from '@/lib/format-education'
import SkillsBlock from './SkillsBlock'

interface EuropassCVProps extends CVEditProps {
  data: CVContent
}

function formatDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return fin || ''
  return fin ? `${inicio} – ${fin}` : inicio
}

const EU_BLUE = '#003399'
const EU_BLUE_BAND = '#003399'

export default function EuropassCV({ data, isEditMode = false, onFieldChange, accentColor }: EuropassCVProps) {
  const em = isEditMode
  const ofc = onFieldChange
  const accent = accentColor || EU_BLUE

  const SectionBand = ({ label }: { label: string }) => (
    <div style={{
      backgroundColor: accent, color: '#fff', padding: '5px 14px',
      fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.05em', marginTop: '18px', marginBottom: '10px'
    }}>
      {label}
    </div>
  )

  return (
    <div
      className="max-w-4xl mx-auto bg-white"
      style={{ fontFamily: 'Calibri, Arial, "Helvetica Neue", sans-serif', fontSize: '10.5pt', lineHeight: 1.5, color: '#1A1A1A' }}
    >
      {/* EU Header Banner */}
      <div style={{ backgroundColor: accent, padding: '16px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '18pt', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{data.nombre}</h1>
          {data.titulo && (
            <p style={{ fontSize: '11pt', color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>{data.titulo}</p>
          )}
        </div>
        {/* Photo slot */}
        {data.contacto && (
          <div style={{
            width: '80px', height: '100px', border: '2px solid rgba(255,255,255,0.4)',
            backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '2px', flexShrink: 0
          }}>
            <span style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '4px' }}>
              Foto
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '0 24px 32px' }}>

        {/* Personal Information */}
        <SectionBand label="Información personal" />
        {data.contacto && (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '4px 16px', marginLeft: '8px' }}>
            {data.contacto.telefono && (
              <>
                <span style={{ color: '#555', fontSize: '9.5pt', fontWeight: 600 }}>Teléfono:</span>
                <span style={{ fontSize: '9.5pt' }}>{formatPhone(data.contacto.telefono)}</span>
              </>
            )}
            {data.contacto.email && (
              <>
                <span style={{ color: '#555', fontSize: '9.5pt', fontWeight: 600 }}>Correo:</span>
                <span style={{ fontSize: '9.5pt' }}>{data.contacto.email}</span>
              </>
            )}
            {data.contacto.ubicacion && (
              <>
                <span style={{ color: '#555', fontSize: '9.5pt', fontWeight: 600 }}>Domicilio:</span>
                <span style={{ fontSize: '9.5pt' }}>{data.contacto.ubicacion}</span>
              </>
            )}
            {data.contacto.linkedin && (
              <>
                <span style={{ color: '#555', fontSize: '9.5pt', fontWeight: 600 }}>LinkedIn:</span>
                <span style={{ fontSize: '9.5pt' }}>{data.contacto.linkedin}</span>
              </>
            )}
          </div>
        )}

        {/* Personal Statement */}
        {data.resumen && (
          <>
            <SectionBand label="Perfil profesional" />
            <div style={{ marginLeft: '8px' }}>
              <EditableField tag="p" value={data.resumen} path="resumen" isEditMode={em} onFieldChange={ofc}
                style={{ fontSize: '10.5pt', color: '#1A1A1A', lineHeight: 1.6 }} />
            </div>
          </>
        )}

        {/* Work Experience */}
        {data.experiencias.length > 0 && (
          <>
            <SectionBand label="Experiencia laboral" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginLeft: '8px' }}>
              {data.experiencias.map((exp, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 16px', breakInside: 'avoid' }}>
                  <div>
                    <p style={{ fontSize: '9.5pt', color: '#555', fontWeight: 600 }}>
                      {formatDate(exp.fecha_inicio, exp.fecha_fin)}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '2px' }}>
                      <EditableField tag="span" value={exp.cargo} path={`experiencias.${idx}.cargo`}
                        isEditMode={em} onFieldChange={ofc}
                        style={{ fontWeight: 700, fontSize: '11pt', color: '#000' }} />
                    </div>
                    <EditableField tag="div" value={exp.empresa} path={`experiencias.${idx}.empresa`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontSize: '10pt', color: accent, fontWeight: 600, marginBottom: '4px' }} />
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                        {exp.bullets.map((b, bi) => (
                          <li key={bi} style={{ fontSize: '10pt', color: '#333', marginBottom: '2px', listStyle: 'disc' }}>
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
                </div>
              ))}
            </div>
          </>
        )}

        {/* Education */}
        {data.educacion.length > 0 && (
          <>
            <SectionBand label="Educación y formación" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '8px' }}>
              {data.educacion.map((edu, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0 16px', breakInside: 'avoid' }}>
                  <p style={{ fontSize: '9.5pt', color: '#555', fontWeight: 600 }}>
                    {formatDate(edu.fecha_inicio, edu.fecha_fin)}
                  </p>
                  <div>
                    <EditableField tag="div" value={edu.titulo} path={`educacion.${idx}.titulo`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontWeight: 700, fontSize: '10.5pt', color: '#000' }} />
                    <p style={{ fontSize: '10pt', color: accent, fontWeight: 600 }}>{edu.institucion}</p>
                    {shouldShowArea(edu.titulo, edu.area) && <p style={{ fontSize: '9.5pt', color: '#555' }}>{edu.area}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Languages — CEFR table */}
        {data.idiomas.length > 0 && (
          <>
            <SectionBand label="Idiomas" />
            <div style={{ marginLeft: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                <thead>
                  <tr style={{ backgroundColor: `${accent}18` }}>
                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 700, color: accent, width: '20%' }}>Idioma</th>
                    <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: accent, width: '16%' }}>Comprensión<br /><span style={{ fontWeight: 400 }}>Auditiva</span></th>
                    <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: accent, width: '16%' }}>Comprensión<br /><span style={{ fontWeight: 400 }}>Lectora</span></th>
                    <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: accent, width: '16%' }}>Interacción<br /><span style={{ fontWeight: 400 }}>Oral</span></th>
                    <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: accent, width: '16%' }}>Expresión<br /><span style={{ fontWeight: 400 }}>Oral</span></th>
                    <th style={{ textAlign: 'center', padding: '5px 8px', fontWeight: 700, color: accent, width: '16%' }}>Expresión<br /><span style={{ fontWeight: 400 }}>Escrita</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.idiomas.map((lang, idx) => {
                    const cefr = lang.nivel_cefr
                    const isNative = lang.nivel === 'Nativo' || lang.nivel === 'Nativa'
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: '#1A1A1A' }}>{lang.nombre}</td>
                        {isNative ? (
                          <td colSpan={5} style={{ padding: '5px 8px', textAlign: 'center', color: '#555', fontStyle: 'italic' }}>
                            Lengua materna
                          </td>
                        ) : cefr ? (
                          <>
                            <td style={{ textAlign: 'center', padding: '5px 8px', color: '#374151' }}>{cefr.comprension_auditiva}</td>
                            <td style={{ textAlign: 'center', padding: '5px 8px', color: '#374151' }}>{cefr.comprension_lectora}</td>
                            <td style={{ textAlign: 'center', padding: '5px 8px', color: '#374151' }}>{cefr.interaccion_oral}</td>
                            <td style={{ textAlign: 'center', padding: '5px 8px', color: '#374151' }}>{cefr.expresion_oral}</td>
                            <td style={{ textAlign: 'center', padding: '5px 8px', color: '#374151' }}>{cefr.expresion_escrita}</td>
                          </>
                        ) : (
                          <td colSpan={5} style={{ padding: '5px 8px', textAlign: 'center', color: '#555' }}>
                            {lang.nivel || '—'}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Skills */}
        {data.habilidades.length > 0 && (
          <>
            <SectionBand label="Competencias y aptitudes" />
            <div style={{ marginLeft: '8px' }}>
              <SkillsBlock
                habilidades={data.habilidades}
                tecnicas={data.habilidades_tecnicas}
                blandas={data.habilidades_blandas}
                textStyle={{ fontSize: '10pt', color: '#333' }}
                labelStyle={{ fontWeight: 700 }}
                separator="  ·  "
              />
            </div>
          </>
        )}

        {/* Certifications */}
        {data.certificaciones && data.certificaciones.length > 0 && (
          <>
            <SectionBand label="Certificaciones y títulos" />
            <div style={{ marginLeft: '8px' }}>
              {data.certificaciones.map((c, idx) => (
                <p key={idx} style={{ fontSize: '10pt', color: '#333', marginBottom: '3px' }}>• {c}</p>
              ))}
            </div>
          </>
        )}

        {/* Driving licence + Additional */}
        {data.permiso_conduccion && (
          <>
            <SectionBand label="Información adicional" />
            <div style={{ marginLeft: '8px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '4px 16px' }}>
              <span style={{ color: '#555', fontSize: '9.5pt', fontWeight: 600 }}>Permiso de conducción:</span>
              <span style={{ fontSize: '9.5pt' }}>{data.permiso_conduccion}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
