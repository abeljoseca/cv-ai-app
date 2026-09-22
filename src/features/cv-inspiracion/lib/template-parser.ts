import type { CVTemplate } from '../types/template.types'
import type { TemplateDataMarkers } from '../types/template.types'
import { injectDataIntoLayers } from './data-injector'
import type { CanvasState } from '../types/canvas.types'

export function templateToCanvasState(template: CVTemplate): CanvasState {
  return {
    templateId: template.id,
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    layers: template.layers,
    version: 1,
  }
}

export function applyDataToTemplate(template: CVTemplate, data: TemplateDataMarkers): CanvasState {
  return {
    templateId: template.id,
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    layers: injectDataIntoLayers(template.layers, data),
    version: 1,
  }
}