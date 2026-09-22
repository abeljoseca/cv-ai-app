import EditableField from './EditableField'
import { CVEditProps, CVContent } from './index'
import { formatPhone } from '@/lib/format-phone'
import { shouldShowArea } from '@/lib/format-education'

interface SiliconValleyCVProps extends CVEditProps {
  data: CVContent
}

function formatDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return fin || ''
  return fin ? `${inicio} – ${fin}` : inicio
}

export default function SiliconValleyCV({ data, isEditMode = false, onFieldChange, accentColor }: SiliconValleyCVProps) {
  const em = isEditMode
  const ofc = onFieldChange
  const accent = accentColor || '#2563EB'

  const sectionHeader = (label: string) => (
    <div style={{ marginBottom: '10px' }}>
      <p style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: accent }}>
        {label}
      </p>
      <div style={{ borderBottom: `1px solid ${accent}`, opacity: 0.25, marginTop: '3px' }} />
    </div>
  )

  return (
    <div
      className="max-w-4xl mx-auto bg-white"
      style={{ fontFamily: 'Inter, "Helvetica Neue", sans-serif', padding: '44px 52px', fontSize: '10.5pt', lineHeight: 1.55, color: '#0A0A0A' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '22pt', fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A' }}>{data.nombre}</h1>
        {data.titulo && (
          <p style={{ fontSize: '12pt', color: '#6B7280', marginTop: '2px' }}>{data.titulo}</p>
        )}
        {data.contacto && (
          <p style={{ fontSize: '9.5pt', color: '#6B7280', marginTop: '8px' }}>
            {[data.contacto.email, formatPhone(data.contacto.telefono), data.contacto.ubicacion,
              data.contacto.github, data.contacto.linkedin].filter(Boolean).join('  ·  ')}
          </p>
        )}
      </div>

      {/* Summary — optional, max 2 lines */}
      {data.resumen && (
        <div style={{ marginBottom: '20px' }}>
          <EditableField tag="p" value={data.resumen} path="resumen" isEditMode={em} onFieldChange={ofc}
            style={{ fontSize: '10.5pt', color: '#374151', lineHeight: 1.6, borderLeft: `3px solid ${accent}`, paddingLeft: '12px' }} />
        </div>
      )}

      {/* Tech Stack — MANDATORY, shown before experience */}
      {data.tech_stack && Object.keys(data.tech_stack).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {sectionHeader('Stack Tecnológico')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(data.tech_stack).map(([category, tools], idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '9pt', fontWeight: 700, color: '#6B7280', minWidth: '120px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {category}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {tools.map((tool, ti) => (
                    <span key={ti} style={{
                      fontSize: '9pt', color: '#0A0A0A', backgroundColor: '#F3F4F6',
                      padding: '1px 7px', borderRadius: '4px', border: '1px solid #E5E7EB'
                    }}>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If no tech_stack but has habilidades — render as chips */}
      {!data.tech_stack && data.habilidades.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {sectionHeader('Stack Tecnológico')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {data.habilidades.map((h, idx) => (
              <span key={idx} style={{
                fontSize: '9pt', color: '#0A0A0A', backgroundColor: '#F3F4F6',
                padding: '2px 8px', borderRadius: '4px', border: '1px solid #E5E7EB'
              }}>{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experiencias.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {sectionHeader('Experiencia')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.experiencias.map((exp, idx) => (
              <div key={idx} style={{ breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <EditableField tag="span" value={exp.cargo} path={`experiencias.${idx}.cargo`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontWeight: 700, fontSize: '11pt', color: '#0A0A0A' }} />
                    <span style={{ fontSize: '10pt', color: '#6B7280' }}> · </span>
                    <EditableField tag="span" value={exp.empresa} path={`experiencias.${idx}.empresa`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontSize: '10pt', color: '#6B7280' }} />
                  </div>
                  <span style={{ fontSize: '9.5pt', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {formatDate(exp.fecha_inicio, exp.fecha_fin)}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul style={{ margin: '5px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ fontSize: '10pt', color: '#374151', marginBottom: '3px', display: 'flex', gap: '8px', breakInside: 'avoid' }}>
                        <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>–</span>
                        <EditableField tag="span" value={b} path={`experiencias.${idx}.bullets.${bi}`}
                          isEditMode={em} onFieldChange={ofc} />
                      </li>
                    ))}
                  </ul>
                )}
                {!exp.bullets?.length && exp.descripcion && (
                  <EditableField tag="p" value={exp.descripcion} path={`experiencias.${idx}.descripcion`}
                    isEditMode={em} onFieldChange={ofc} style={{ fontSize: '10pt', color: '#374151', marginTop: '4px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.proyectos && data.proyectos.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {sectionHeader('Proyectos')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.proyectos.map((p, idx) => (
              <div key={idx} style={{ breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '10.5pt', color: '#0A0A0A' }}>{p.nombre}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {p.tecnologias.slice(0, 4).map((t, ti) => (
                      <span key={ti} style={{
                        fontSize: '8.5pt', color: '#6B7280', backgroundColor: '#F9FAFB',
                        padding: '1px 6px', borderRadius: '3px', border: '1px solid #E5E7EB'
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '10pt', color: '#374151', marginTop: '2px' }}>{p.descripcion}</p>
                {p.url && <p style={{ fontSize: '9pt', color: accent, marginTop: '2px' }}>{p.url}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.educacion.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {sectionHeader('Educación')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.educacion.map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', breakInside: 'avoid' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '10.5pt' }}>{edu.titulo}</span>
                  <span style={{ color: '#6B7280', fontSize: '10pt' }}>, {edu.institucion}</span>
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

      {/* Languages */}
      {data.idiomas.length > 0 && (
        <div>
          {sectionHeader('Idiomas')}
          <p style={{ fontSize: '10pt', color: '#374151' }}>
            {data.idiomas.map(l => l.nivel ? `${l.nombre} (${l.nivel})` : l.nombre).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
