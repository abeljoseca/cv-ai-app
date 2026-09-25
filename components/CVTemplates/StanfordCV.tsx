import EditableField from './EditableField'
import { CVEditProps, CVContent } from './index'
import { formatPhone } from '@/lib/format-phone'
import { shouldShowArea } from '@/lib/format-education'
import SkillsBlock from './SkillsBlock'
import { CV_FONT } from './fonts'

interface StanfordCVProps extends CVEditProps {
  data: CVContent
}

function formatDate(inicio: string | null, fin: string | null): string {
  if (!inicio) return fin || ''
  return fin ? `${inicio} – ${fin}` : inicio
}

export default function StanfordCV({ data, isEditMode = false, onFieldChange, accentColor }: StanfordCVProps) {
  const em = isEditMode
  const ofc = onFieldChange
  const accent = accentColor || '#8C1515'  // Stanford cardinal

  const ruleLine = (
    <div style={{ borderTop: `1.5px solid ${accent}`, marginBottom: '8px', marginTop: '3px' }} />
  )

  return (
    <div
      className="max-w-4xl mx-auto bg-white text-gray-900"
      style={{ fontFamily: CV_FONT.gelasio, padding: '44px 56px', fontSize: '11pt', lineHeight: 1.5 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: `1.5px solid ${accent}`, paddingBottom: '14px' }}>
        <h1 style={{ fontSize: '22pt', fontWeight: 700, letterSpacing: '-0.01em', color: '#000' }}>{data.nombre}</h1>
        {data.titulo && (
          <p style={{ fontSize: '12pt', color: '#444', fontStyle: 'italic', marginTop: '4px' }}>{data.titulo}</p>
        )}
        {data.contacto && (
          <p style={{ fontSize: '9.5pt', color: '#595959', marginTop: '8px' }}>
            {[data.contacto.email, formatPhone(data.contacto.telefono), data.contacto.ubicacion, data.contacto.linkedin]
              .filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Education — Stanford puts education first for grad profiles */}
      {data.educacion.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            Educación
          </h2>
          {ruleLine}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.educacion.map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', breakInside: 'avoid' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '11pt' }}>{edu.titulo}</span>
                  {', '}
                  <span style={{ fontSize: '11pt', color: '#333' }}>{edu.institucion}</span>
                  {shouldShowArea(edu.titulo, edu.area) && <p style={{ fontSize: '10pt', color: '#595959', marginTop: '2px' }}>{edu.area}</p>}
                </div>
                <span style={{ fontSize: '10pt', color: '#595959', whiteSpace: 'nowrap' }}>
                  {formatDate(edu.fecha_inicio, edu.fecha_fin)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary — mid-senior only, 2-3 lines max */}
      {data.resumen && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            Resumen
          </h2>
          {ruleLine}
          <EditableField tag="p" value={data.resumen} path="resumen" isEditMode={em} onFieldChange={ofc}
            style={{ fontSize: '10.5pt', color: '#222' }} />
        </div>
      )}

      {/* Experience */}
      {data.experiencias.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            Experiencia
          </h2>
          {ruleLine}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.experiencias.map((exp, idx) => (
              <div key={idx} style={{ breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <EditableField tag="span" value={exp.empresa} path={`experiencias.${idx}.empresa`}
                    isEditMode={em} onFieldChange={ofc}
                    style={{ fontWeight: 700, fontSize: '11pt', color: '#000' }} />
                  <span style={{ fontSize: '10pt', color: '#595959' }}>{formatDate(exp.fecha_inicio, exp.fecha_fin)}</span>
                </div>
                <EditableField tag="div" value={exp.cargo} path={`experiencias.${idx}.cargo`}
                  isEditMode={em} onFieldChange={ofc}
                  style={{ fontSize: '11pt', fontStyle: 'italic', color: '#333', marginBottom: '4px' }} />
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ fontSize: '10.5pt', color: '#222', marginBottom: '2px', breakInside: 'avoid' }}>
                        <EditableField tag="span" value={b} path={`experiencias.${idx}.bullets.${bi}`}
                          isEditMode={em} onFieldChange={ofc} />
                      </li>
                    ))}
                  </ul>
                )}
                {!exp.bullets?.length && exp.descripcion && (
                  <EditableField tag="p" value={exp.descripcion} path={`experiencias.${idx}.descripcion`}
                    isEditMode={em} onFieldChange={ofc} style={{ fontSize: '10.5pt', color: '#222' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Projects — MANDATORY in Stanford if data exists */}
      {data.proyectos && data.proyectos.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            Proyectos Destacados
          </h2>
          {ruleLine}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.proyectos.map((p, idx) => (
              <div key={idx} style={{ breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '11pt' }}>{p.nombre}</span>
                  {p.fecha && <span style={{ fontSize: '10pt', color: '#595959' }}>{p.fecha}</span>}
                </div>
                {p.tecnologias.length > 0 && (
                  <p style={{ fontSize: '9.5pt', fontStyle: 'italic', color: '#595959', marginBottom: '2px' }}>
                    {p.tecnologias.join(', ')}
                  </p>
                )}
                <p style={{ fontSize: '10.5pt', color: '#222' }}>{p.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.habilidades.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            Habilidades
          </h2>
          {ruleLine}
          <SkillsBlock
            habilidades={data.habilidades}
            tecnicas={data.habilidades_tecnicas}
            blandas={data.habilidades_blandas}
            textStyle={{ fontSize: '10.5pt', color: '#222' }}
            labelStyle={{ fontWeight: 700 }}
          />
        </div>
      )}

      {/* Languages */}
      {data.idiomas.length > 0 && (
        <div>
          <h2 style={{ fontSize: '10pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
            Idiomas
          </h2>
          {ruleLine}
          <p style={{ fontSize: '10.5pt', color: '#222' }}>
            {data.idiomas.map(l => l.nivel ? `${l.nombre} (${l.nivel})` : l.nombre).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
