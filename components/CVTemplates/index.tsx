import { CVContent } from '@/lib/cv/types/cv-content'
import HarvardCV from './HarvardCV'
import StanfordCV from './StanfordCV'
import SiliconValleyCV from './SiliconValleyCV'
import TechCV from './TechCV'
import MinimalistCV from './MinimalistCV'
import EuropassCV from './EuropassCV'
import EuropassV2CV from './EuropassV2CV'
import ExecutiveCV from './ExecutiveCV'
import { cvFontVariables } from './fonts'
import { isEuropassV2 } from '@/lib/cv/content'
import { EUROPASS_ACCENTS, type EuropassDensity, type EuropassPhotoSize } from '@/lib/cv/styles/europass/contract'
import type { StoredCVContent } from '@/lib/cv/types/pipeline'

export type { CVContent }

export interface CVEditProps {
  isEditMode?: boolean
  onFieldChange?: (path: string, value: string) => void
  accentColor?: string
}

export interface CVRendererProps extends CVEditProps {
  estilo: 'harvard' | 'stanford' | 'silicon-valley' | 'tech' | 'minimalist' | 'europass' | 'executive'
  // Legacy CVContent, or a standardized style's own schema (dispatched on data.schema).
  data: StoredCVContent
  // Europass v2 presets (visual_config); ignored by the other templates.
  densidad?: EuropassDensity
  fotoTam?: EuropassPhotoSize
}

export const styleAccentColors: Record<string, string[]> = {
  'harvard':       ['#1F3A5F', '#000000', '#595959'],
  'stanford':      ['#8C1515', '#000000', '#1F3A5F'],
  'silicon-valley':['#2563EB', '#0A0A0A', '#16A34A', '#7C3AED'],
  'tech':          ['#1F3A5F', '#0F766E', '#2563EB'],
  'minimalist':    ['#000000', '#1A1A1A', '#4A4A4A', '#C8B97A'],
  'europass':      [...EUROPASS_ACCENTS],
  'executive':     ['#1F3A5F', '#8B0000', '#1A1A1A'],
}

export default function CVRenderer(props: CVRendererProps) {
  // Font CSS variables must wrap every template (see ./fonts.ts)
  return <div className={cvFontVariables}><StyleTemplate {...props} /></div>
}

function StyleTemplate({ estilo, data: stored, isEditMode, onFieldChange, accentColor, densidad, fotoTam }: CVRendererProps) {
  const editProps: CVEditProps = { isEditMode, onFieldChange, accentColor }

  // Standardized styles render from their own schema; older CVs of the same style keep
  // their original template.
  if (isEuropassV2(stored)) {
    return <EuropassV2CV data={stored} densidad={densidad} fotoTam={fotoTam} {...editProps} />
  }
  const data = stored as CVContent

  switch (estilo) {
    case 'stanford':
      return <StanfordCV data={data} {...editProps} />
    case 'silicon-valley':
      return <SiliconValleyCV data={data} {...editProps} />
    case 'tech':
      return <TechCV data={data} {...editProps} />
    case 'minimalist':
      return <MinimalistCV data={data} {...editProps} />
    case 'europass':
      return <EuropassCV data={data} {...editProps} />
    case 'executive':
      return <ExecutiveCV data={data} {...editProps} />
    case 'harvard':
    default:
      return <HarvardCV data={data} {...editProps} />
  }
}
