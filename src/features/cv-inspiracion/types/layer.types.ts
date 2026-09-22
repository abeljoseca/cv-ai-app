export type LayerType = 'rect' | 'text' | 'image' | 'circle' | 'line' | 'polygon' | 'star' | 'path' | 'frame'

export interface BaseLayer {
  id: string
  type: LayerType
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  name?: string
  dataKey?: string
}

export interface RectLayer extends BaseLayer {
  type: 'rect'
  fill?: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  fontWeight?: string
  fill?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  letterSpacing?: number
  wrap?: 'word' | 'char' | 'none'
}

export interface ImageLayer extends BaseLayer {
  type: 'image'
  src: string
  clipShape?: 'circle' | 'pentagon'
  cornerRadius?: number
  stroke?: string
  strokeWidth?: number
  iconId?: string
  iconColor?: string
}

export interface CircleLayer extends BaseLayer {
  type: 'circle'
  radius: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}

export interface PolygonLayer extends BaseLayer {
  type: 'polygon'
  sides: number
  radius: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
}

export interface StarLayer extends BaseLayer {
  type: 'star'
  numPoints: number
  innerRadius: number
  outerRadius: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}

export interface PathLayer extends BaseLayer {
  type: 'path'
  data: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  scaleX?: number
  scaleY?: number
}

export type LineCap = 'none' | 'arrow' | 'dot'

export interface LineLayer extends BaseLayer {
  type: 'line'
  points: number[]
  stroke?: string
  strokeWidth?: number
  dash?: number[]
  startCap?: LineCap
  endCap?: LineCap
  pointerLength?: number
  pointerWidth?: number
  lineCap?: 'butt' | 'round' | 'square'
}

export interface FrameLayer extends BaseLayer {
  type: 'frame'
  shape: 'rect' | 'circle' | 'pentagon'
  width: number
  height: number
  imageSrc?: string
  imageX?: number
  imageY?: number
  imageScale?: number
  cornerRadius?: number
  stroke?: string
  strokeWidth?: number
}

export type Layer =
  | RectLayer
  | TextLayer
  | ImageLayer
  | CircleLayer
  | PolygonLayer
  | StarLayer
  | PathLayer
  | LineLayer
  | FrameLayer