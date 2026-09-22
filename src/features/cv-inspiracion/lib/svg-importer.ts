import type { Layer, RectLayer, TextLayer, CircleLayer, PathLayer, LineLayer } from '../types/layer.types'

// ─── ID ───────────────────────────────────────────────────────────────────────

function genId() {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── 2D affine matrix [a, b, c, d, e, f]  ────────────────────────────────────
//  | a  c  e |
//  | b  d  f |
//  | 0  0  1 |

type Matrix = [number, number, number, number, number, number]

function identity(): Matrix { return [1, 0, 0, 1, 0, 0] }

function multiply(p: Matrix, c: Matrix): Matrix {
  return [
    p[0]*c[0] + p[2]*c[1],
    p[1]*c[0] + p[3]*c[1],
    p[0]*c[2] + p[2]*c[3],
    p[1]*c[2] + p[3]*c[3],
    p[0]*c[4] + p[2]*c[5] + p[4],
    p[1]*c[4] + p[3]*c[5] + p[5],
  ]
}

function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]]
}

function matrixScale(m: Matrix): [number, number] {
  return [Math.sqrt(m[0]**2 + m[1]**2), Math.sqrt(m[2]**2 + m[3]**2)]
}

function matrixRotation(m: Matrix): number {
  return Math.atan2(m[1], m[0]) * 180 / Math.PI
}

function parseTransformAttr(attr: string | null): Matrix {
  if (!attr) return identity()
  let m = identity()
  const re = /(\w+)\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(attr)) !== null) {
    const fn = match[1]
    const v = match[2].split(/[\s,]+/).map(Number)
    let t: Matrix
    switch (fn) {
      case 'matrix':    t = [v[0], v[1], v[2], v[3], v[4], v[5]]; break
      case 'translate': t = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]; break
      case 'scale':     t = [v[0], 0, 0, v[1] ?? v[0], 0, 0]; break
      case 'rotate': {
        const rad = (v[0] ?? 0) * Math.PI / 180
        const cos = Math.cos(rad), sin = Math.sin(rad)
        const cx = v[1] ?? 0, cy = v[2] ?? 0
        t = [cos, sin, -sin, cos, cx*(1-cos)+cy*sin, cy*(1-cos)-cx*sin]
        break
      }
      default: t = identity()
    }
    m = multiply(m, t)
  }
  return m
}

// ─── Attribute helpers ────────────────────────────────────────────────────────

function cssAttr(el: Element, name: string): string | null {
  const style = el.getAttribute('style') ?? ''
  const m = style.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))
  if (m) return m[1].trim()
  return el.getAttribute(name)
}

// ─── Fix 1: gradient color extraction ────────────────────────────────────────
// Pre-parse all gradients from <defs> and use the first stop color as fallback

function extractGradients(svgEl: Element): Map<string, string> {
  const map = new Map<string, string>()
  for (const grad of svgEl.querySelectorAll('linearGradient, radialGradient')) {
    const id = grad.getAttribute('id')
    if (!id) continue
    // Follow xlink:href / href chain (gradient inheriting stops from another)
    const ref = grad.getAttribute('xlink:href') ?? grad.getAttribute('href')
    if (ref && ref.startsWith('#')) {
      const src = svgEl.querySelector(`#${CSS.escape(ref.slice(1))}`)
      if (src) {
        const stop = src.querySelector('stop')
        const stopColor = cssAttr(stop ?? grad, 'stop-color') ?? stop?.getAttribute('stop-color')
        if (stopColor && stopColor !== 'none') { map.set(id, stopColor); continue }
      }
    }
    const stop = grad.querySelector('stop')
    const stopColor = cssAttr(stop ?? grad, 'stop-color') ?? stop?.getAttribute('stop-color')
    if (stopColor && stopColor !== 'none') map.set(id, stopColor)
  }
  return map
}

function col(val: string | null, grads?: Map<string, string>): string | undefined {
  if (!val || val === 'none' || val === 'transparent') return undefined
  if (val.startsWith('url(#')) {
    const id = val.slice(5, -1)
    return grads?.get(id) ?? '#888888'
  }
  if (val.startsWith('url(')) return '#888888'
  return val
}

function num(val: string | null, def = 0): number {
  if (val === null || val === undefined) return def
  const n = parseFloat(val)
  return isNaN(n) ? def : n
}

// ─── Fix 2: font-size with unit support ──────────────────────────────────────
// pt, em, rem are common in SVG exports from design tools

function parseFontSize(val: string | null, emBase = 16): number {
  if (!val) return 0
  const str = val.trim()
  const n = parseFloat(str)
  if (isNaN(n) || n === 0) return 0
  if (str.endsWith('pt'))  return n * (4 / 3)      // 1pt = 1.333px
  if (str.endsWith('mm'))  return n * 3.7795        // 1mm ≈ 3.78px
  if (str.endsWith('rem')) return n * 16            // always relative to 16px root
  if (str.endsWith('em'))  return n * emBase
  if (str.endsWith('%'))   return (n / 100) * emBase
  return n                                           // px or unitless
}

function parseFontFamily(val: string | null): string {
  if (!val) return 'Inter'
  return val.split(',')[0].trim().replace(/['"]/g, '') || 'Inter'
}

function textAnchorToAlign(anchor: string | null): 'left' | 'center' | 'right' {
  if (anchor === 'middle') return 'center'
  if (anchor === 'end')    return 'right'
  return 'left'
}

function baseProps(el: Element, m: Matrix) {
  const opacity  = num(cssAttr(el, 'opacity'), 1)
  const rotation = matrixRotation(m)
  return {
    opacity:  opacity  !== 1 ? opacity  : undefined,
    rotation: rotation !== 0 ? rotation : undefined,
  }
}

// ─── Converters ───────────────────────────────────────────────────────────────

function toRect(el: Element, m: Matrix, s: number, grads: Map<string, string>): RectLayer {
  const lx = num(el.getAttribute('x'))
  const ly = num(el.getAttribute('y'))
  const [scX, scY] = matrixScale(m)
  const [wx, wy]   = applyMatrix(m, lx, ly)
  const rx = num(el.getAttribute('rx') ?? el.getAttribute('ry'))
  return {
    id: genId(), type: 'rect',
    x: wx * s, y: wy * s,
    width:  num(el.getAttribute('width'),  100) * scX * s,
    height: num(el.getAttribute('height'), 100) * scY * s,
    fill:        col(cssAttr(el, 'fill'), grads) ?? '#cccccc',
    stroke:      col(cssAttr(el, 'stroke'), grads),
    strokeWidth: (num(cssAttr(el, 'stroke-width')) * Math.min(scX, scY) * s) || undefined,
    cornerRadius: rx ? rx * Math.min(scX, scY) * s : undefined,
    ...baseProps(el, m),
  }
}

function toCircle(el: Element, m: Matrix, s: number, grads: Map<string, string>): CircleLayer {
  const cx = num(el.getAttribute('cx'))
  const cy = num(el.getAttribute('cy'))
  const r  = num(el.getAttribute('r'), 20)
  const [scX] = matrixScale(m)
  const [wx, wy] = applyMatrix(m, cx, cy)
  return {
    id: genId(), type: 'circle',
    x: wx * s, y: wy * s,
    radius: r * scX * s,
    fill:        col(cssAttr(el, 'fill'), grads) ?? '#cccccc',
    stroke:      col(cssAttr(el, 'stroke'), grads),
    strokeWidth: (num(cssAttr(el, 'stroke-width')) * scX * s) || undefined,
    ...baseProps(el, m),
  }
}

function toEllipse(el: Element, m: Matrix, s: number, grads: Map<string, string>): CircleLayer | PathLayer {
  const rx = num(el.getAttribute('rx'), 20)
  const ry = num(el.getAttribute('ry'), 20)
  const cx = num(el.getAttribute('cx'))
  const cy = num(el.getAttribute('cy'))
  const [scX, scY] = matrixScale(m)
  const [wx, wy]   = applyMatrix(m, cx, cy)

  if (Math.abs(rx - ry) / Math.max(rx, ry) < 0.15) {
    return {
      id: genId(), type: 'circle',
      x: wx * s, y: wy * s,
      radius: ((rx + ry) / 2) * scX * s,
      fill:        col(cssAttr(el, 'fill'), grads) ?? '#cccccc',
      stroke:      col(cssAttr(el, 'stroke'), grads),
      strokeWidth: (num(cssAttr(el, 'stroke-width')) * scX * s) || undefined,
      ...baseProps(el, m),
    }
  }

  const [px1, py1] = applyMatrix(m, cx - rx, cy)
  const [px2, py2] = applyMatrix(m, cx + rx, cy)
  return {
    id: genId(), type: 'path',
    x: 0, y: 0,
    data: `M ${px1*s} ${py1*s} A ${rx*scX*s} ${ry*scY*s} 0 1 0 ${px2*s} ${py2*s} A ${rx*scX*s} ${ry*scY*s} 0 1 0 ${px1*s} ${py1*s} Z`,
    fill:        col(cssAttr(el, 'fill'), grads),
    stroke:      col(cssAttr(el, 'stroke'), grads),
    strokeWidth: (num(cssAttr(el, 'stroke-width')) * Math.min(scX, scY) * s) || undefined,
    ...baseProps(el, m),
  }
}

function toPath(el: Element, m: Matrix, s: number, grads: Map<string, string>): PathLayer {
  const [scX, scY] = matrixScale(m)
  return {
    id: genId(), type: 'path',
    x: m[4] * s, y: m[5] * s,
    data:   el.getAttribute('d') ?? '',
    fill:   col(cssAttr(el, 'fill'), grads),
    stroke: col(cssAttr(el, 'stroke'), grads),
    strokeWidth: (num(cssAttr(el, 'stroke-width')) * Math.min(scX, scY)) || undefined,
    scaleX: scX * s,
    scaleY: scY * s,
    ...baseProps(el, m),
  }
}

// ─── Fix 3: proper tspan handling ────────────────────────────────────────────
// Each <tspan> with its own y/dy becomes a separate TextLayer with correct position.
// Adjacent tspans sharing the same x are NOT merged — each line stays editable.

function toTextLayers(el: Element, m: Matrix, s: number, grads: Map<string, string>): TextLayer[] {
  const [scX] = matrixScale(m)

  // Inherit base styles from the <text> parent
  const baseFontSizeSVG = parseFontSize(cssAttr(el, 'font-size'), 16) * scX || 16 * scX
  const baseFill        = col(cssAttr(el, 'fill'), grads) ?? '#000000'
  const baseFontFamily  = parseFontFamily(cssAttr(el, 'font-family'))
  const baseFontWeight  = cssAttr(el, 'font-weight') ?? '400'
  const baseFontStyle   = cssAttr(el, 'font-style')  ?? 'normal'
  const baseAnchor      = cssAttr(el, 'text-anchor')

  const tspans = Array.from(el.children).filter(
    c => c.tagName.toLowerCase().replace(/^.*:/, '') === 'tspan'
  )

  // No tspan children — simple <text> element
  if (tspans.length === 0) {
    const text = (el.textContent ?? '').trim()
    if (!text) return []
    const lx = num(el.getAttribute('x'))
    const ly = num(el.getAttribute('y'))
    const [wx, wy] = applyMatrix(m, lx, ly)
    const fontSize = Math.max(8, baseFontSizeSVG * s)
    return [{
      id: genId(), type: 'text',
      x: wx * s,
      y: wy * s - fontSize * 0.8,
      text, fontSize,
      fontFamily: baseFontFamily, fontWeight: baseFontWeight, fontStyle: baseFontStyle,
      fill: baseFill, align: textAnchorToAlign(baseAnchor),
      ...baseProps(el, m),
    }]
  }

  // Process each tspan individually
  const layers: TextLayer[] = []
  let curX   = num(el.getAttribute('x'))
  let curY   = num(el.getAttribute('y'))
  let curFSV = baseFontSizeSVG // running font-size in SVG units for dy/em resolution

  for (const tspan of tspans) {
    const text = (tspan.textContent ?? '').trim()
    if (!text) continue

    if (tspan.hasAttribute('x')) curX = num(tspan.getAttribute('x'))

    if (tspan.hasAttribute('y')) {
      curY = num(tspan.getAttribute('y'))
    } else if (tspan.hasAttribute('dy')) {
      // dy can be px/pt/em — resolve em against current font size
      const dy = parseFontSize(tspan.getAttribute('dy'), curFSV)
      curY += dy !== 0 ? dy : curFSV * 1.2
    }

    const tspanFSV = parseFontSize(cssAttr(tspan, 'font-size'), curFSV) * scX || curFSV
    curFSV = tspanFSV

    const [wx, wy] = applyMatrix(m, curX, curY)
    const fontSize = Math.max(8, tspanFSV * s)

    layers.push({
      id: genId(), type: 'text',
      x: wx * s,
      y: wy * s - fontSize * 0.8,
      text, fontSize,
      fontFamily: parseFontFamily(cssAttr(tspan, 'font-family')) || baseFontFamily,
      fontWeight: cssAttr(tspan, 'font-weight') ?? baseFontWeight,
      fontStyle:  baseFontStyle,
      fill:  col(cssAttr(tspan, 'fill'), grads) ?? baseFill,
      align: textAnchorToAlign(cssAttr(tspan, 'text-anchor') ?? baseAnchor),
      ...baseProps(el, m),
    })
  }

  return layers
}

function toLine(el: Element, m: Matrix, s: number, grads: Map<string, string>): LineLayer {
  const [wx1, wy1] = applyMatrix(m, num(el.getAttribute('x1')), num(el.getAttribute('y1')))
  const [wx2, wy2] = applyMatrix(m, num(el.getAttribute('x2')), num(el.getAttribute('y2')))
  const [scX] = matrixScale(m)
  return {
    id: genId(), type: 'line',
    x: wx1 * s, y: wy1 * s,
    points: [0, 0, (wx2 - wx1) * s, (wy2 - wy1) * s],
    stroke:      col(cssAttr(el, 'stroke'), grads) ?? '#000000',
    strokeWidth: Math.max(1, num(cssAttr(el, 'stroke-width'), 1) * scX * s),
    ...baseProps(el, m),
  }
}

function toPoly(el: Element, m: Matrix, s: number, closed: boolean, grads: Map<string, string>): PathLayer {
  const raw = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number)
  if (raw.length < 4) return { id: genId(), type: 'path', x: 0, y: 0, data: '' }

  const pts: number[] = []
  for (let i = 0; i < raw.length - 1; i += 2) {
    const [wx, wy] = applyMatrix(m, raw[i], raw[i + 1])
    pts.push(wx * s, wy * s)
  }

  let d = `M ${pts[0]} ${pts[1]}`
  for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`
  if (closed) d += ' Z'

  const [scX] = matrixScale(m)
  return {
    id: genId(), type: 'path',
    x: 0, y: 0, data: d,
    fill:        closed ? (col(cssAttr(el, 'fill'), grads) ?? '#cccccc') : undefined,
    stroke:      col(cssAttr(el, 'stroke'), grads),
    strokeWidth: (num(cssAttr(el, 'stroke-width')) * scX * s) || undefined,
    ...baseProps(el, m),
  }
}

// ─── Walker ───────────────────────────────────────────────────────────────────

function walkEl(el: Element, parentM: Matrix, layers: Layer[], s: number, grads: Map<string, string>) {
  const display    = cssAttr(el, 'display')
  const visibility = cssAttr(el, 'visibility')
  if (display === 'none' || visibility === 'hidden') return

  const m   = multiply(parentM, parseTransformAttr(el.getAttribute('transform')))
  const tag = el.tagName.toLowerCase().replace(/^.*:/, '')

  switch (tag) {
    case 'svg':
    case 'g':
      for (const child of el.children) walkEl(child, m, layers, s, grads)
      break
    case 'rect':     layers.push(toRect(el, m, s, grads));           break
    case 'circle':   layers.push(toCircle(el, m, s, grads));         break
    case 'ellipse':  layers.push(toEllipse(el, m, s, grads));        break
    case 'path':     if ((el.getAttribute('d') ?? '').trim()) layers.push(toPath(el, m, s, grads)); break
    case 'text':     layers.push(...toTextLayers(el, m, s, grads));  break
    case 'line':     layers.push(toLine(el, m, s, grads));           break
    case 'polygon':  layers.push(toPoly(el, m, s, true,  grads));   break
    case 'polyline': layers.push(toPoly(el, m, s, false, grads));   break
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseSVGToLayers(svgText: string, canvasWidth: number, canvasHeight: number): Layer[] {
  const parser = new DOMParser()
  const doc    = parser.parseFromString(svgText, 'image/svg+xml')

  const err = doc.querySelector('parsererror')
  if (err) throw new Error('SVG inválido: ' + (err.textContent ?? '').slice(0, 120))

  const svgEl = doc.documentElement
  const grads = extractGradients(svgEl)

  let scale = 1
  const vb = svgEl.getAttribute('viewBox')
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number)
    const vw = parts[2], vh = parts[3]
    if (vw > 0 && vh > 0) scale = Math.min(canvasWidth / vw, canvasHeight / vh)
  } else {
    const w = parseFloat(svgEl.getAttribute('width')  ?? '0')
    const h = parseFloat(svgEl.getAttribute('height') ?? '0')
    if (w > 0 && h > 0) scale = Math.min(canvasWidth / w, canvasHeight / h)
    else if (w > 0)      scale = canvasWidth  / w
    else if (h > 0)      scale = canvasHeight / h
  }

  const layers: Layer[] = []
  walkEl(svgEl, identity(), layers, scale, grads)
  return layers
}