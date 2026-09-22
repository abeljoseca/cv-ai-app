export interface EditorState {
  selectedLayerId: string | null
  isDragging: boolean
  isEditing: boolean
  zoom: number
  panX: number
  panY: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

export type EditorTool = 'select' | 'text' | 'rect' | 'image' | 'pan'

export interface CVInspirationRecord {
  id: string
  user_id: string
  template_id: string
  canvas_state: import('./canvas.types').CanvasState
  thumbnail_url?: string
  created_at: string
  updated_at: string
}