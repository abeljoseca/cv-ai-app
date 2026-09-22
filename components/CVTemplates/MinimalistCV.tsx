import EditableField from './EditableField'
import { CVEditProps, CVContent } from './index'
import { formatPhone } from '@/lib/format-phone'
import SkillsBlock from './SkillsBlock'

interface MinimalistCVProps extends CVEditProps {
  data: CVContent
}

function formatDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return fin || ''
  return fin ? `${inicio} – ${fin}` : inicio
}

export default function MinimalistCV({ data, isEditMode = false, onFieldChange, accentColor }: MinimalistCVProps) {
  const em = isEditMode
  const ofc = onFieldChange
  const accent = accentColor || '#000000'

  // Section headers: tiny uppercase, wide letter-spacing, no dividers
  const SectionLabel = ({ label }: { label: string }) => (
    <p style={{
      fontSize: '8pt', fontWeight: 400, textTransform: 'uppercase',
      letterSpacing: '0.2em', color: '#888888', marginBottom: '14px', marginTop: '28px'
    }}>
      {label}
    </p>
  )

  return (
    <div
      className="max-w-3xl mx-auto bg-white"
      style={{ fontFamily: '"Helvetica Neue", "Arial", sans-serif', padding: '60px 64px', fontSize: '10.5pt', lineHeight: 1.65, color: '#1A1A1A' }}
    >
      {/* Header — large, light-weight name */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28pt', fontWeight: 300, letterSpacing: '-0.02em', color: '#1A1A1A', lineHeight: 1.1 }}>
          {data.nombre}
        </h1>
        {data.titulo && (
          <p style={{ fontSize: '11pt', color: '#888888', marginTop: '6px', fontWeight: 400 }}>{data.titulo}</p>
        )}
        {data.contacto && (
          <p style={{ fontSize: '9pt', color: '#888888', marginTop: '10px' }}>
            {[data.contacto.email, formatPhone(data.contacto.telefono), data.contacto.ubicacion]
              .filter(Boolean).join('  ·  ')}
          </p>
        )}
      </div>

      {/* Positioning line — 1 sentence, replaces traditional summary */}
      {data.resumen && (
        <div style={{ marginBottom: '8px' }}>
          <EditableField tag="p" value={data.resumen} path="resumen" isEditMode={em} onFieldChange={ofc}
            style={{ fontSize: '12pt', fontWeight: 300, color: '#1A1A1A', lineHeight: 1.5, fontStyle: 'italic' }} />
        </div>
      )}

      {/* Experience */}
      {data.experiencias.length > 0 && (
        <div>
          <SectionLabel label="Experiencia" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.experiencias.map((exp, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0 24px', breakInside: 'avoid' }}>
                {/* Date column */}
                <div style={{ paddingTop: '2px' }}>
                  <p style={{ fontSize: '9pt', color: '#888888', whiteSpace: 'nowrap' }}>
                    {formatDate(exp.fecha_inicio, exp.fecha_fin)}
                  </p>
                </div>
                {/* Content column */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1px' }}>
                    <EditableField tag="span" value={exp.cargo} path={`experiencias.${idx}.cargo`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontWeight: 600, fontSize: '10.5pt', color: '#1A1A1A' }} />
                  </div>
                  <EditableField tag="div" value={exp.empresa} path={`experiencias.${idx}.empresa`}
                    isEditMode={em} onFieldChange={ofc}
                    style={{ fontSize: '10pt', color: '#888888', marginBottom: '6px' }} />
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', breakInside: 'avoid' }}>
                          <span style={{ color: '#888888', marginTop: '3px', flexShrink: 0, fontSize: '8pt' }}>—</span>
                          <EditableField tag="span" value={b} path={`experiencias.${idx}.bullets.${bi}`}
                            isEditMode={em} onFieldChange={ofc}
                            style={{ fontSize: '10pt', color: '#333', lineHeight: 1.55 }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {!exp.bullets?.length && exp.descripcion && (
                    <EditableField tag="p" value={exp.descripcion} path={`experiencias.${idx}.descripcion`}
                      isEditMode={em} onFieldChange={ofc}
                      style={{ fontSize: '10pt', color: '#333' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.proyectos && data.proyectos.length > 0 && (
        <div>
          <SectionLabel label="Proyectos Destacados" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.proyectos.map((p, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0 24px', breakInside: 'avoid' }}>
                <p style={{ fontSize: '9pt', color: '#888888' }}>{p.fecha || ''}</p>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '10.5pt' }}>{p.nombre}</span>
                  {p.tecnologias.length > 0 && (
                    <span style={{ fontSize: '9pt', color: '#888888' }}> / {p.tecnologias.join(', ')}</span>
                  )}
                  <p style={{ fontSize: '10pt', color: '#333', marginTop: '2px' }}>{p.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.educacion.length > 0 && (
        <div>
          <SectionLabel label="Educación" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.educacion.map((edu, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0 24px', breakInside: 'avoid' }}>
                <p style={{ fontSize: '9pt', color: '#888888' }}>{formatDate(edu.fecha_inicio, edu.fecha_fin)}</p>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '10.5pt' }}>{edu.titulo}</span>
                  <span style={{ fontSize: '10pt', color: '#888888' }}>, {edu.institucion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills — comma list, ultra minimal */}
      {data.habilidades.length > 0 && (
        <div>
          <SectionLabel label="Habilidades" />
          <SkillsBlock
            habilidades={data.habilidades}
            tecnicas={data.habilidades_tecnicas}
            blandas={data.habilidades_blandas}
            textStyle={{ fontSize: '10pt', color: '#333' }}
            labelStyle={{ fontWeight: 600 }}
            separator="  /  "
          />
        </div>
      )}

      {/* Languages */}
      {data.idiomas.length > 0 && (
        <div>
          <SectionLabel label="Idiomas" />
          <p style={{ fontSize: '10pt', color: '#333' }}>
            {data.idiomas.map(l => l.nivel ? `${l.nombre} · ${l.nivel}` : l.nombre).join('   ')}
          </p>
        </div>
      )}

      {/* Recognition */}
      {data.logros.length > 0 && (
        <div>
          <SectionLabel label="Logros" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.logros.map((logro, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', breakInside: 'avoid' }}>
                <span style={{ color: '#888888', flexShrink: 0 }}>—</span>
                <EditableField tag="span" value={logro} path={`logros.${idx}`}
                  isEditMode={em} onFieldChange={ofc}
                  style={{ fontSize: '10pt', color: '#333' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
