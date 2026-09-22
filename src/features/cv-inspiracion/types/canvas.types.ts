import type { Layer } from './layer.types'

export interface GuidesState {
  vertical: number[]
  horizontal: number[]
  locked: boolean
  visible: boolean
}

export interface Page {
  id: string
  layers: Layer[]
  name?: string
  backgroundColor?: string
}

export interface CanvasState {
  templateId: string
  canvasWidth: number
  canvasHeight: number
  layers: Layer[]
  pages?: Page[]
  guides?: GuidesState
  version: number
}

export interface HistoryEntry {
  state: CanvasState
  timestamp: number
  action: string
}