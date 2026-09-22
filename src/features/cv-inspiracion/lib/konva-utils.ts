import type Konva from 'konva'

export const A4_WIDTH = 595.5
export const A4_HEIGHT = 842.25

export function fitStageToContainer(
  stage: Konva.Stage,
  containerWidth: number,
  containerHeight: number
): number {
  const scaleX = containerWidth / A4_WIDTH
  const scaleY = containerHeight / A4_HEIGHT
  const scale = Math.min(scaleX, scaleY)
  stage.scale({ x: scale, y: scale })
  stage.width(A4_WIDTH * scale)
  stage.height(A4_HEIGHT * scale)
  stage.batchDraw()
  return scale
}

export async function loadFont(family: string, url: string, weight = '400', style = 'normal'): Promise<void> {
  const font = new FontFace(family, `url(${url})`, { weight, style })
  const loaded = await font.load()
  document.fonts.add(loaded)
}

export async function loadFonts(fonts: { family: string; url: string; weight?: string; style?: string }[]): Promise<void> {
  await Promise.all(fonts.map(f => loadFont(f.family, f.url, f.weight, f.style)))
}

export function getLayerById(layers: import('../types/layer.types').Layer[], id: string) {
  return layers.find(l => l.id === id) ?? null
}

export function updateLayerById(
  layers: import('../types/layer.types').Layer[],
  id: string,
  updates: Partial<import('../types/layer.types').Layer>
): import('../types/layer.types').Layer[] {
  return layers.map(l => (l.id === id ? { ...l, ...updates } as typeof l : l))
}

export function reorderLayer(
  layers: import('../types/layer.types').Layer[],
  id: string,
  direction: 'up' | 'down' | 'top' | 'bottom'
): import('../types/layer.types').Layer[] {
  const idx = layers.findIndex(l => l.id === id)
  if (idx === -1) return layers
  const arr = [...layers]
  const [item] = arr.splice(idx, 1)
  if (direction === 'top') arr.push(item)
  else if (direction === 'bottom') arr.unshift(item)
  else if (direction === 'up') arr.splice(Math.min(idx + 1, arr.length), 0, item)
  else arr.splice(Math.max(idx - 1, 0), 0, item)
  return arr
}