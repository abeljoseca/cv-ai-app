import { CVContent } from '@/lib/cv/types/cv-content'
import HarvardCV from './HarvardCV'
import StanfordCV from './StanfordCV'
import SiliconValleyCV from './SiliconValleyCV'
import TechCV from './TechCV'
import MinimalistCV from './MinimalistCV'
import EuropassCV from './EuropassCV'
import ExecutiveCV from './ExecutiveCV'

export type { CVContent }

export interface CVEditProps {
  isEditMode?: boolean
  onFieldChange?: (path: string, value: string) => void
  accentColor?: string
}

export interface CVRendererProps extends CVEditProps {
  estilo: 'harvard' | 'stanford' | 'silicon-valley' | 'tech' | 'minimalist' | 'europass' | 'executive'
  data: CVContent
}

export const styleAccentColors: Record<string, string[]> = {
  'harvard':       ['#1F3A5F', '#000000', '#595959'],
  'stanford':      ['#8C1515', '#000000', '#1F3A5F'],
  'silicon-valley':['#2563EB', '#0A0A0A', '#16A34A', '#7C3AED'],
  'tech':          ['#1F3A5F', '#0F766E', '#2563EB'],
  'minimalist':    ['#000000', '#1A1A1A', '#4A4A4A', '#C8B97A'],
  'europass':      ['#003399', '#1A2B4C', '#006EBF'],
  'executive':     ['#1F3A5F', '#8B0000', '#1A1A1A'],
}

export default function CVRenderer({ estilo, data, isEditMode, onFieldChange, accentColor }: CVRendererProps) {
  const editProps: CVEditProps = { isEditMode, onFieldChange, accentColor }

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
