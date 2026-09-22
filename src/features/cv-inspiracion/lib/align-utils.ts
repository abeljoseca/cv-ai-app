import type { Layer, CircleLayer, PolygonLayer, StarLayer, LineLayer } from '../types/layer.types'

export type AlignAction =
  | 'align-left' | 'align-center-h' | 'align-right'
  | 'align-top'  | 'align-center-v' | 'align-bottom'
  | 'distribute-h' | 'distribute-v'

interface BBox { left: number; top: number; width: number; height: number }

function getLayerBBox(layer: Layer): BBox {
  switch (layer.type) {
    case 'circle':
    case 'polygon': {
      const l = layer as CircleLayer | PolygonLayer
      return { left: l.x - l.radius, top: l.y - l.radius, width: l.radius * 2, height: l.radius * 2 }
    }
    case 'star': {
      const s = layer as StarLayer
      return { left: s.x - s.outerRadius, top: s.y - s.outerRadius, width: s.outerRadius * 2, height: s.outerRadius * 2 }
    }
    case 'line': {
      const ll = layer as LineLayer
      const pts = ll.points
      const xs = pts.filter((_, i) => i % 2 === 0)
      const ys = pts.filter((_, i) => i % 2 !== 0)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      return { left: ll.x + minX, top: ll.y + minY, width: maxX - minX, height: maxY - minY }
    }
    default:
      return { left: layer.x, top: layer.y, width: layer.width ?? 0, height: layer.height ?? 0 }
  }
}

// Convert desired bounding-box top-left back to layer x/y (handles center-origin shapes)
function bboxToLayerPos(layer: Layer, newLeft?: number, newTop?: number): Partial<Layer> {
  const updates: Partial<Layer> = {}
  switch (layer.type) {
    case 'circle':
    case 'polygon': {
      const l = layer as CircleLayer | PolygonLayer
      if (newLeft !== undefined) updates.x = newLeft + l.radius
      if (newTop  !== undefined) updates.y = newTop  + l.radius
      break
    }
    case 'star': {
      const s = layer as StarLayer
      if (newLeft !== undefined) updates.x = newLeft + s.outerRadius
      if (newTop  !== undefined) updates.y = newTop  + s.outerRadius
      break
    }
    case 'line': {
      const ll = layer as LineLayer
      const pts = ll.points
      const xs = pts.filter((_, i) => i % 2 === 0)
      const ys = pts.filter((_, i) => i % 2 !== 0)
      if (newLeft !== undefined) updates.x = newLeft - Math.min(...xs)
      if (newTop  !== undefined) updates.y = newTop  - Math.min(...ys)
      break
    }
    default:
      if (newLeft !== undefined) updates.x = newLeft
      if (newTop  !== undefined) updates.y = newTop
  }
  return updates
}

export type AlignUpdate = { id: string } & Partial<Layer>

export function alignLayers(
  layers: Layer[],
  selectedIds: string[],
  action: AlignAction,
  canvasWidth: number,
  canvasHeight: number,
): AlignUpdate[] {
  const selected = layers.filter(l => selectedIds.includes(l.id) && !l.locked)
  if (selected.length === 0) return []

  const boxes = selected.map(l => ({ layer: l, ...getLayerBBox(l) }))

  // Single element → align to page
  if (selected.length === 1) {
    const { layer, width, height } = boxes[0]
    let newLeft: number | undefined
    let newTop:  number | undefined
    switch (action) {
      case 'align-left':     newLeft = 0; break
      case 'align-center-h': newLeft = Math.round((canvasWidth  - width)  / 2); break
      case 'align-right':    newLeft = Math.round(canvasWidth  - width); break
      case 'align-top':      newTop  = 0; break
      case 'align-center-v': newTop  = Math.round((canvasHeight - height) / 2); break
      case 'align-bottom':   newTop  = Math.round(canvasHeight - height); break
      default: return []
    }
    return [{ id: layer.id, ...bboxToLayerPos(layer, newLeft, newTop) }]
  }

  // Multiple elements → align relative to selection bounding box
  const minLeft   = Math.min(...boxes.map(b => b.left))
  const maxRight  = Math.max(...boxes.map(b => b.left + b.width))
  const minTop    = Math.min(...boxes.map(b => b.top))
  const maxBottom = Math.max(...boxes.map(b => b.top  + b.height))
  const centerX   = (minLeft + maxRight) / 2
  const centerY   = (minTop  + maxBottom) / 2

  switch (action) {
    case 'align-left':
      return boxes.map(({ layer }) => ({ id: layer.id, ...bboxToLayerPos(layer, minLeft) }))
    case 'align-center-h':
      return boxes.map(({ layer, width }) => ({ id: layer.id, ...bboxToLayerPos(layer, Math.round(centerX - width / 2)) }))
    case 'align-right':
      return boxes.map(({ layer, width }) => ({ id: layer.id, ...bboxToLayerPos(layer, Math.round(maxRight - width)) }))
    case 'align-top':
      return boxes.map(({ layer }) => ({ id: layer.id, ...bboxToLayerPos(layer, undefined, minTop) }))
    case 'align-center-v':
      return boxes.map(({ layer, height }) => ({ id: layer.id, ...bboxToLayerPos(layer, undefined, Math.round(centerY - height / 2)) }))
    case 'align-bottom':
      return boxes.map(({ layer, height }) => ({ id: layer.id, ...bboxToLayerPos(layer, undefined, Math.round(maxBottom - height)) }))

    case 'distribute-h': {
      if (boxes.length < 3) return []
      const sorted  = [...boxes].sort((a, b) => a.left - b.left)
      const first   = sorted[0]
      const last    = sorted[sorted.length - 1]
      const totalW  = sorted.reduce((s, b) => s + b.width, 0)
      const gap     = ((last.left + last.width) - first.left - totalW) / (sorted.length - 1)
      let cursor    = first.left + first.width + gap
      return sorted.slice(1, -1).map(({ layer, width }) => {
        const newLeft = Math.round(cursor)
        cursor += width + gap
        return { id: layer.id, ...bboxToLayerPos(layer, newLeft) }
      })
    }
    case 'distribute-v': {
      if (boxes.length < 3) return []
      const sorted  = [...boxes].sort((a, b) => a.top - b.top)
      const first   = sorted[0]
      const last    = sorted[sorted.length - 1]
      const totalH  = sorted.reduce((s, b) => s + b.height, 0)
      const gap     = ((last.top + last.height) - first.top - totalH) / (sorted.length - 1)
      let cursor    = first.top + first.height + gap
      return sorted.slice(1, -1).map(({ layer, height }) => {
        const newTop = Math.round(cursor)
        cursor += height + gap
        return { id: layer.id, ...bboxToLayerPos(layer, undefined, newTop) }
      })
    }
    default:
      return []
  }
}