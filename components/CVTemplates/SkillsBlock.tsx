import type { CSSProperties } from 'react'

interface SkillsBlockProps {
  habilidades: string[]
  tecnicas?: string[]
  blandas?: string[]
  textStyle: CSSProperties
  labelStyle: CSSProperties
  labelTecnicas?: string
  labelBlandas?: string
  separator?: string
}

// Renders the técnica/blanda split when available (habilidades_tecnicas/blandas,
// computed at generation time — see lib/skill-classification.ts), falling back to
// the flat `habilidades` line for CVs generated before that field existed.
export default function SkillsBlock({
  habilidades, tecnicas, blandas, textStyle, labelStyle,
  labelTecnicas = 'Herramientas y técnicas', labelBlandas = 'Competencias',
  separator = ' · ',
}: SkillsBlockProps) {
  const hasCategorized = (tecnicas && tecnicas.length > 0) || (blandas && blandas.length > 0)

  if (!hasCategorized) {
    return <p style={textStyle}>{habilidades.join(separator)}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {tecnicas && tecnicas.length > 0 && (
        <p style={textStyle}><span style={labelStyle}>{labelTecnicas}: </span>{tecnicas.join(separator)}</p>
      )}
      {blandas && blandas.length > 0 && (
        <p style={textStyle}><span style={labelStyle}>{labelBlandas}: </span>{blandas.join(separator)}</p>
      )}
    </div>
  )
}
