import type { CanvasState, GuidesState } from '../types/canvas.types'

const CURRENT_VERSION = 1

export const defaultGuides: GuidesState = {
  vertical: [], horizontal: [], locked: false, visible: true,
}

export function serializeCanvasState(state: CanvasState): string {
  return JSON.stringify({ ...state, version: CURRENT_VERSION })
}

export function deserializeCanvasState(json: string): CanvasState {
  const parsed = JSON.parse(json) as CanvasState
  return migrate(parsed)
}

function migrate(state: CanvasState): CanvasState {
  return { ...state, guides: state.guides ?? defaultGuides, version: CURRENT_VERSION }
}

export function createEmptyCanvasState(templateId: string): CanvasState {
  return {
    templateId,
    canvasWidth: 595.5,
    canvasHeight: 842.25,
    layers: [],
    guides: defaultGuides,
    version: CURRENT_VERSION,
  }
}