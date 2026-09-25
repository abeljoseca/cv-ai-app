import EditableField from './EditableField'
import { CVEditProps, CVContent } from './index'
import { formatPhone } from '@/lib/format-phone'
import { shouldShowArea } from '@/lib/format-education'
import { CV_FONT } from './fonts'

interface TechCVProps extends CVEditProps {
  data: CVContent
}

function formatDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return fin || ''
  return fin ? `${inicio} – ${fin}` : inicio
}

export default function TechCV({ data, isEditMode = false, onFieldChange, accentColor }: TechCVProps) {
  const em = isEditMode
  const ofc = onFieldChange
  const accent = accentColor || '#1F3A5F'
  const accentLight = `${accent}18`

  const sectionHeader = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <p style={{ fontSize: '9.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, whiteSpace: 'nowrap' }}>
        {label}
      </p>
      <div style={{ flex: 1, borderBottom: `1.5px solid ${accentLight}` }} />
    </div>
  )

  return (
    <div
      className="max-w-4xl mx-auto bg-white"
      style={{ fontFamily: CV_FONT.inter, padding: '40px 48px', fontSize: '10.5pt', lineHeight: 1.55, color: '#111827' }}
    >
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: '16px', marginBottom: '22px' }}>
        <h1 style={{ fontSize: '22pt', fontWeight: 700, letterSpacing: '-0.015em', color: '#0F172A' }}>{data.nombre}</h1>
        {data.titulo && (
          <p style={{ fontSize: '12pt', color: accent, fontWeight: 600, marginTop: '3px' }}>{data.titulo}</p>
        )}
        {data.contacto && (
          <p style={{ fontSize: '9.5pt', color: '#6B7280', marginTop: '8px' }}>
            {[data.contacto.email, formatPhone(data.contacto.telefono), data.contacto.ubicacion,
              data.contacto.github, data.contacto.linkedin].filter(Boolean).join('  ·  ')}
          </p>
        )}
      </div>

      {/* Summary */}
      {data.resumen && (
        <div style={{ marginBottom: '22px' }}>
          <EditableField tag="p" value={data.resumen} path="resumen" isEditMode={em} onFieldChange={ofc}
            style={{ fontSize: '10.5pt', color: '#374151', lineHeight: 1.65 }} />
        </div>
      )}

      {/* Tech Stack — MANDATORY, before Experience */}
      {data.tech_stack && Object.keys(data.tech_stack).length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          {sectionHeader('Stack Tecnológico')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px' }}>
            {Object.entries(data.tech_stack).map(([category, tools], idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '9pt', fontWeight: 700, color: accent, minWidth: '100px', marginTop: '2px' }}>
                  {category}:
                </span>
                <span style={{ fontSize: '9.5pt', color: '#374151' }}>{tools.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data.tech_stack && data.habilidades.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          {sectionHeader('Stack Tecnológico')}
          <p style={{ fontSize: '10pt', color: '#374151' }}>
            {(data.habilidades_tecnicas && data.habilidades_tecnicas.length > 0
              ? data.habilidades_tecnicas
              : data.habilidades
            ).join('  ·  ')}
          </p>
          {data.habilidades_blandas && data.habilidades_blandas.length > 0 && (
            <p style={{ fontSize: '9pt', color: '#6B7280', marginTop: '6px' }}>
              <span style={{ fontWeight: 700 }}>Habilidades blandas: </span>
              {data.habilidades_blandas.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Experience */}
      {data.experiencias.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          {sectionHeader('Experiencia')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.experiencias.map((exp, idx) => (
              <div key={idx} style={{ breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <EditableField tag="span" value={exp.cargo} path={`experiencias.${idx}.cargo`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontWeight: 700, fontSize: '11pt', color: '#0F172A' }} />
                    <br />
                    <EditableField tag="span" value={exp.empresa} path={`experiencias.${idx}.empresa`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontSize: '10pt', color: accent, fontWeight: 600 }} />
                  </div>
                  <span style={{ fontSize: '9.5pt', color: '#9CA3AF', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {formatDate(exp.fecha_inicio, exp.fecha_fin)}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul style={{ margin: '6px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ fontSize: '10pt', color: '#374151', marginBottom: '3px', display: 'flex', gap: '8px', breakInside: 'avoid' }}>
                        <span style={{ color: accent, flexShrink: 0, marginTop: '1px' }}>•</span>
                        <EditableField tag="span" value={b} path={`experiencias.${idx}.bullets.${bi}`}
                          isEditMode={em} onFieldChange={ofc} />
                      </li>
                    ))}
                  </ul>
                )}
                {!exp.bullets?.length && exp.descripcion && (
                  <EditableField tag="p" value={exp.descripcion} path={`experiencias.${idx}.descripcion`}
                    isEditMode={em} onFieldChange={ofc}
                    style={{ fontSize: '10pt', color: '#374151', marginTop: '5px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.proyectos && data.proyectos.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          {sectionHeader('Proyectos')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.proyectos.map((p, idx) => (
              <div key={idx} style={{ breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '10.5pt', color: '#0F172A' }}>{p.nombre}</span>
                  {p.fecha && <span style={{ fontSize: '9.5pt', color: '#9CA3AF' }}>{p.fecha}</span>}
                </div>
                {p.tecnologias.length > 0 && (
                  <p style={{ fontSize: '9.5pt', color: accent, marginBottom: '2px', fontStyle: 'italic' }}>
                    {p.tecnologias.join(', ')}
                  </p>
                )}
                <p style={{ fontSize: '10pt', color: '#374151' }}>{p.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.educacion.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          {sectionHeader('Educación')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.educacion.map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', breakInside: 'avoid' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '10.5pt', color: '#0F172A' }}>{edu.titulo}</span>
                  <span style={{ fontSize: '10pt', color: '#6B7280' }}> · {edu.institucion}</span>
                  {shouldShowArea(edu.titulo, edu.area) && <p style={{ fontSize: '9.5pt', color: '#9CA3AF' }}>{edu.area}</p>}
                </div>
                <span style={{ fontSize: '9.5pt', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                  {formatDate(edu.fecha_inicio, edu.fecha_fin)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certificaciones && data.certificaciones.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          {sectionHeader('Certificaciones')}
          <p style={{ fontSize: '10pt', color: '#374151' }}>{data.certificaciones.join('  ·  ')}</p>
        </div>
      )}

      {/* Languages */}
      {data.idiomas.length > 0 && (
        <div>
          {sectionHeader('Idiomas')}
          <p style={{ fontSize: '10pt', color: '#374151' }}>
            {data.idiomas.map(l => l.nivel ? `${l.nombre} (${l.nivel})` : l.nombre).join('  ·  ')}
          </p>
        </div>
      )}
    </div>
  )
}
