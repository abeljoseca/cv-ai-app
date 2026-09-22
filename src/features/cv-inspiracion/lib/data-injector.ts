import type { TemplateDataMarkers } from '../types/template.types'
import type { Layer, TextLayer, ImageLayer } from '../types/layer.types'
import type { CanvasState } from '../types/canvas.types'

const PLACEHOLDER = ''

function injectIntoString(text: string, data: TemplateDataMarkers): string {
  let result = text
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(key, value ?? PLACEHOLDER)
  }
  // Remove any remaining unresolved markers
  result = result.replace(/USUARIO_[A-Z0-9_]+/g, PLACEHOLDER)
  return result
}

function injectIntoLayer(layer: Layer, data: TemplateDataMarkers): Layer {
  if (layer.type === 'text') {
    const t = layer as TextLayer
    return { ...t, text: injectIntoString(t.text, data) }
  }
  if (layer.type === 'image') {
    const img = layer as ImageLayer
    return { ...img, src: injectIntoString(img.src, data) }
  }
  if (layer.type === 'frame') {
    const frame = layer as import('../types/layer.types').FrameLayer
    if (!frame.imageSrc) return layer
    return { ...frame, imageSrc: injectIntoString(frame.imageSrc, data) }
  }
  return layer
}

export function injectDataIntoLayers(layers: Layer[], data: TemplateDataMarkers): Layer[] {
  return layers.map(layer => injectIntoLayer(layer, data))
}

export function injectDataIntoCanvasState(state: CanvasState, data: TemplateDataMarkers): CanvasState {
  const injectedLayers = injectDataIntoLayers(state.layers, data)
  const injectedPages  = state.pages?.map(p => ({ ...p, layers: injectDataIntoLayers(p.layers, data) }))
  return {
    ...state,
    layers: injectedLayers,
    ...(injectedPages && { pages: injectedPages }),
  }
}

export function injectDataIntoHTML(html: string, data: TemplateDataMarkers): string {
  return injectIntoString(html, data)
}