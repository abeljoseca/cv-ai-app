'use client'

import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer as KonvaLayer, Transformer, Rect, Line } from 'react-konva'
import type Konva from 'konva'
import { LayerRenderer } from './LayerRenderer'
import type { CanvasState, GuidesState } from '../../types/canvas.types'
import type { Layer, TextLayer, StarLayer, PathLayer, LineLayer, FrameLayer, ImageLayer } from '../../types/layer.types'

export interface NodeBounds {
  screenX: number
  screenY: number
  width: number
  height: number
}

interface Props {
  state: CanvasState
  backgroundColor?: string
  selectedIds: string[]
  scale: number
  guides?: GuidesState
  onGuidesChange?: (g: GuidesState) => void
  onSelect: (id: string | null) => void
  onToggle?: (id: string) => void
  onSelectMany?: (ids: string[]) => void
  onLayerChange: (id: string, updates: Partial<Layer>) => void
  onNodeBounds: (bounds: NodeBounds | null) => void
  onImageDrop?: (src: string, x: number, y: number) => void
}

function rectIntersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return (
    a.x < b.x + b.width  && a.x + a.width  > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
  )
}

type AxisSnap = { snapped: boolean; linePos: number | null; offset: number | null }
type SnapState = {
  dragId: string
  x: AxisSnap; y: AxisSnap
  bboxOffX: number; bboxOffY: number
  bboxW: number; bboxH: number
}

const SNAP_IN_PX  = 5
const SNAP_OUT_PX = 9
const GUIDE_COLOR = '#4B6BFB'  // Resumint primary — ruler guides

function OverflowBadge({ x, y, onSelect }: { x: number; y: number; onSelect: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  const D = 22
  return (
    <div
      style={{ position: 'absolute', left: x, top: y, width: D, height: D, pointerEvents: 'auto', zIndex: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <div style={{
        width: D, height: D, borderRadius: '50%',
        background: 'linear-gradient(135deg, #4B6BFB 0%, #6B8AFF 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hovered ? '0 2px 8px rgba(75,107,251,0.7)' : '0 1px 5px rgba(75,107,251,0.45)',
        cursor: 'pointer',
        transform: hovered ? 'scale(1.12)' : 'scale(1)',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}>
        {/* Lucide scissors icon */}
        <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <path d="M8.12 8.12 12 12" />
          <path d="M20 4 8.12 15.88" />
          <circle cx="6" cy="18" r="3" />
          <path d="M14.8 14.8 20 20" />
        </svg>
      </div>
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: D + 7,
          right: 0,
          background: '#1e293b',
          color: '#f1f5f9',
          fontSize: 11,
          lineHeight: '1.5',
          padding: '5px 9px',
          borderRadius: 7,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 30,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          letterSpacing: '0.01em',
        }}>
          Texto recortado por espacio limitado.<br />
          Amplía el contenedor para verlo completo.
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '')
  if (c.length === 3) {
    return { r: parseInt(c[0]+c[0],16), g: parseInt(c[1]+c[1],16), b: parseInt(c[2]+c[2],16) }
  }
  return { r: parseInt(c.slice(0,2),16)||255, g: parseInt(c.slice(2,4),16)||255, b: parseInt(c.slice(4,6),16)||255 }
}

export function KonvaCanvas({
  state, backgroundColor = '#ffffff', selectedIds, scale,
  guides, onGuidesChange,
  onSelect, onToggle, onSelectMany, onLayerChange, onNodeBounds, onImageDrop,
}: Props) {
  const stageRef     = useRef<Konva.Stage>(null)
  const trRef        = useRef<Konva.Transformer>(null)
  const layersRef    = useRef(state.layers)
  const snapStateRef = useRef<SnapState | null>(null)
  const canvasSzRef  = useRef({ w: state.canvasWidth, h: state.canvasHeight })

  // Active snap lines — positions of reference lines currently snapping an element
  const activeSnapRef      = useRef<{ v: number | null; h: number | null }>({ v: null, h: null })
  const activeSnapFrameRef = useRef<number | null>(null)
  const [activeSnap, setActiveSnap] = useState<{ v: number | null; h: number | null }>({ v: null, h: null })

  // Guide interaction
  const [hoveredGuide, setHoveredGuide] = useState<string | null>(null)
  const [guideLabel, setGuideLabel]     = useState<{ axis: 'V' | 'H'; value: number; sx: number; sy: number } | null>(null)

  // Overflow indicators
  const overflowSetRef = useRef<Set<string>>(new Set())
  const [overflowIds, setOverflowIds] = useState<Set<string>>(new Set())

  // Rubber-band selection
  const [selRect, setSelRect]   = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const selRectRef              = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const isSelecting             = useRef(false)
  const selStart                = useRef({ x: 0, y: 0 })
  const hasMoved                = useRef(false)

  // Ctrl key — add-to-selection AND snap disable
  const ctrlRef = useRef(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => { ctrlRef.current = e.ctrlKey || e.metaKey }
    const up   = ()                  => { ctrlRef.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => { layersRef.current = state.layers }, [state.layers])
  useEffect(() => { canvasSzRef.current = { w: state.canvasWidth, h: state.canvasHeight } }, [state.canvasWidth, state.canvasHeight])

  // Throttle activeSnap state to at most one update per animation frame
  function pushSnapUpdate(v: number | null, h: number | null) {
    activeSnapRef.current = { v, h }
    if (activeSnapFrameRef.current !== null) cancelAnimationFrame(activeSnapFrameRef.current)
    activeSnapFrameRef.current = requestAnimationFrame(() => {
      setActiveSnap({ ...activeSnapRef.current })
      activeSnapFrameRef.current = null
    })
  }
  function clearSnapUpdate() {
    if (activeSnapFrameRef.current !== null) {
      cancelAnimationFrame(activeSnapFrameRef.current)
      activeSnapFrameRef.current = null
    }
    activeSnapRef.current = { v: null, h: null }
    setActiveSnap({ v: null, h: null })
  }

  // ── Element snap engine ───────────────────────────────────────────────────
  const handleDragBound = useCallback((id: string, pos: { x: number; y: number }): { x: number; y: number } => {
    if (selectedIds.length > 1) return pos
    const stage = stageRef.current
    if (!stage) return pos
    const node = stage.findOne(`#${id}`)
    if (!node) return pos

    if (ctrlRef.current) { pushSnapUpdate(null, null); return pos }

    const cx = pos.x / scale
    const cy = pos.y / scale
    const snapIn  = SNAP_IN_PX  / scale
    const snapOut = SNAP_OUT_PX / scale

    let st = snapStateRef.current
    if (!st || st.dragId !== id) {
      const nodeAbs = node.absolutePosition()
      const bbox    = node.getClientRect({ relativeTo: stage })
      st = {
        dragId: id,
        x: { snapped: false, linePos: null, offset: null },
        y: { snapped: false, linePos: null, offset: null },
        bboxOffX: bbox.x / scale - nodeAbs.x / scale,
        bboxOffY: bbox.y / scale - nodeAbs.y / scale,
        bboxW: bbox.width  / scale,
        bboxH: bbox.height / scale,
      }
      snapStateRef.current = st
    }

    const { bboxOffX, bboxOffY, bboxW, bboxH } = st
    const { w: cw, h: ch } = canvasSzRef.current

    // Reference lines: canvas edges/center + ruler guides + other elements
    type RL = { pos: number }
    const vLines: RL[] = [
      { pos: 0 }, { pos: cw / 2 }, { pos: cw },
      ...(guides?.visible ? guides.vertical.map(p => ({ pos: p })) : []),
    ]
    const hLines: RL[] = [
      { pos: 0 }, { pos: ch / 2 }, { pos: ch },
      ...(guides?.visible ? guides.horizontal.map(p => ({ pos: p })) : []),
    ]
    for (const layer of layersRef.current) {
      if (layer.id === id || layer.visible === false || layer.locked) continue
      const other = stage.findOne(`#${layer.id}`)
      if (!other) continue
      const cr = other.getClientRect({ relativeTo: stage })
      const ox = cr.x / scale, oy = cr.y / scale
      const ow = cr.width / scale, oh = cr.height / scale
      vLines.push({ pos: ox }, { pos: ox + ow / 2 }, { pos: ox + ow })
      hLines.push({ pos: oy }, { pos: oy + oh / 2 }, { pos: oy + oh })
    }

    const ptsX = [
      { v: cx + bboxOffX,            off: -bboxOffX              },
      { v: cx + bboxOffX + bboxW/2,  off: -(bboxOffX + bboxW/2)  },
      { v: cx + bboxOffX + bboxW,    off: -(bboxOffX + bboxW)    },
    ]
    const ptsY = [
      { v: cy + bboxOffY,            off: -bboxOffY              },
      { v: cy + bboxOffY + bboxH/2,  off: -(bboxOffY + bboxH/2)  },
      { v: cy + bboxOffY + bboxH,    off: -(bboxOffY + bboxH)    },
    ]

    const findBest = (pts: typeof ptsX, lines: RL[], thr: number) => {
      let best: { pos: number; off: number; dist: number } | null = null
      for (const ln of lines) {
        for (const pt of pts) {
          const d = Math.abs(ln.pos - pt.v)
          if (d <= thr && (!best || d < best.dist)) best = { pos: ln.pos, off: pt.off, dist: d }
        }
      }
      return best
    }

    let finalCX = cx
    let finalCY = cy

    const ax = st.x
    if (ax.snapped) {
      if (Math.abs(cx - ax.offset! - ax.linePos!) > snapOut) ax.snapped = false
      else finalCX = ax.linePos! + ax.offset!
    }
    if (!ax.snapped) {
      const best = findBest(ptsX, vLines, snapIn)
      if (best) { ax.snapped = true; ax.linePos = best.pos; ax.offset = best.off; finalCX = best.pos + best.off }
    }

    const ay = st.y
    if (ay.snapped) {
      if (Math.abs(cy - ay.offset! - ay.linePos!) > snapOut) ay.snapped = false
      else finalCY = ay.linePos! + ay.offset!
    }
    if (!ay.snapped) {
      const best = findBest(ptsY, hLines, snapIn)
      if (best) { ay.snapped = true; ay.linePos = best.pos; ay.offset = best.off; finalCY = best.pos + best.off }
    }

    // Publish active snap lines for visual feedback
    pushSnapUpdate(ax.snapped ? ax.linePos : null, ay.snapped ? ay.linePos : null)

    return { x: finalCX * scale, y: finalCY * scale }
  }, [scale, selectedIds, guides])

  // ── Guide drag handlers ────────────────────────────────────────────────────
  const handleGuideDragBound = useCallback((
    axis: 'V' | 'H', idx: number, p: { x: number; y: number }
  ) => {
    const { w: cw, h: ch } = canvasSzRef.current
    const snapIn = SNAP_IN_PX / scale

    if (axis === 'V') {
      let docX = p.x / scale
      if (!ctrlRef.current) {
        const others = guides?.vertical.filter((_, i) => i !== idx) ?? []
        for (const t of [0, cw / 2, cw, ...others]) {
          if (Math.abs(docX - t) <= snapIn) { docX = t; break }
        }
      }
      return { x: docX * scale, y: 0 }
    } else {
      let docY = p.y / scale
      if (!ctrlRef.current) {
        const others = guides?.horizontal.filter((_, i) => i !== idx) ?? []
        for (const t of [0, ch / 2, ch, ...others]) {
          if (Math.abs(docY - t) <= snapIn) { docY = t; break }
        }
      }
      return { x: 0, y: docY * scale }
    }
  }, [scale, guides])

  const handleGuideDragMove = useCallback((axis: 'V' | 'H', e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const abs  = node.absolutePosition()
    if (axis === 'V') {
      setGuideLabel({ axis: 'V', value: Math.round(node.x()), sx: abs.x, sy: abs.y + (canvasSzRef.current.h * scale) / 2 })
    } else {
      setGuideLabel({ axis: 'H', value: Math.round(node.y()), sx: abs.x + (canvasSzRef.current.w * scale) / 2, sy: abs.y })
    }
  }, [scale])

  const handleGuideDragEnd = useCallback((axis: 'V' | 'H', idx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    setGuideLabel(null)
    if (!guides || !onGuidesChange) return
    const { w: cw, h: ch } = canvasSzRef.current
    if (axis === 'V') {
      const newX = e.target.x()
      onGuidesChange(newX < 0 || newX > cw
        ? { ...guides, vertical: guides.vertical.filter((_, i) => i !== idx) }
        : { ...guides, vertical: guides.vertical.map((v, i) => i === idx ? newX : v) })
    } else {
      const newY = e.target.y()
      onGuidesChange(newY < 0 || newY > ch
        ? { ...guides, horizontal: guides.horizontal.filter((_, i) => i !== idx) }
        : { ...guides, horizontal: guides.horizontal.map((v, i) => i === idx ? newY : v) })
    }
  }, [guides, onGuidesChange])

  // ── Overflow indicators ───────────────────────────────────────────────────
  const handleOverflow = useCallback((id: string, has: boolean) => {
    const prev = overflowSetRef.current.has(id)
    if (prev === has) return
    const next = new Set(overflowSetRef.current)
    if (has) next.add(id)
    else next.delete(id)
    overflowSetRef.current = next
    setOverflowIds(new Set(next))
  }, [])

  // ── Transformer sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const tr = trRef.current; const stage = stageRef.current
    if (!tr) return
    if (selectedIds.length > 0 && stage) {
      const nodes = selectedIds.map(id => stage.findOne(`#${id}`)).filter((n): n is Konva.Node => {
        if (!n) return false
        return !layersRef.current.find(l => l.id === n.id())?.locked
      })
      if (nodes.length > 0) {
        tr.nodes(nodes); tr.getLayer()?.batchDraw()
        if (nodes.length === 1) emitBounds(stage, nodes[0])
        else onNodeBounds(null)
        return
      }
    }
    tr.nodes([]); tr.getLayer()?.batchDraw(); onNodeBounds(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, scale])

  function emitBounds(stage: Konva.Stage, node: Konva.Node) {
    const box = stage.container().getBoundingClientRect()
    const abs = node.absolutePosition()
    const shape = node as Konva.Shape
    onNodeBounds({ screenX: box.left + abs.x, screenY: box.top + abs.y, width: (shape.width?.() ?? 0) * scale, height: (shape.height?.() ?? 0) * scale })
  }

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    snapStateRef.current = null
    clearSnapUpdate()
    onLayerChange(id, { x, y })
    if (selectedIds.length <= 1) {
      const stage = stageRef.current
      if (stage) { const node = stage.findOne(`#${id}`); if (node) emitBounds(stage, node) }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLayerChange, scale, selectedIds])

  const handleTransformEnd = useCallback((id: string) => {
    const stage = stageRef.current; if (!stage) return
    const node = stage.findOne(`#${id}`) as Konva.Shape | null; if (!node) return
    const sx = node.scaleX(), sy = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    const layerDef = layersRef.current.find(l => l.id === id)
    const updates: Partial<Layer> = { x: node.x(), y: node.y(), rotation: node.rotation() }
    if (layerDef?.type === 'circle' || layerDef?.type === 'polygon') {
      (updates as any).radius = Math.max(4, (layerDef as any).radius * Math.max(sx, sy))
    } else if (layerDef?.type === 'star') {
      const star = layerDef as StarLayer; const sc = Math.max(sx, sy)
      ;(updates as any).innerRadius = Math.max(4, star.innerRadius * sc)
      ;(updates as any).outerRadius = Math.max(4, star.outerRadius * sc)
    } else if (layerDef?.type === 'path') {
      const path = layerDef as PathLayer
      ;(updates as any).scaleX = (path.scaleX ?? 1) * sx; (updates as any).scaleY = (path.scaleY ?? 1) * sy
    } else if (layerDef?.type === 'line') {
      ;(updates as any).points = (layerDef as LineLayer).points.map((v, i) => i % 2 === 0 ? v * sx : v * sy)
    } else if (layerDef?.type === 'frame') {
      const f = layerDef as FrameLayer
      ;(updates as any).width = Math.max(20, (f.width ?? 160) * sx); (updates as any).height = Math.max(20, (f.height ?? 160) * sy)
    } else if (layerDef?.type === 'image' && (layerDef as ImageLayer).clipShape) {
      const img = layerDef as ImageLayer
      updates.width = Math.max(8, (img.width ?? 80) * sx); updates.height = Math.max(8, (img.height ?? 80) * sy)
    } else {
      updates.width = Math.max(8, node.width() * sx); updates.height = Math.max(8, node.height() * sy)
    }
    onLayerChange(id, updates)
  }, [onLayerChange])

  const handleTextDblClick = useCallback((layer: TextLayer, konvaText: Konva.Text) => {
    if (layer.locked) return
    const stage = stageRef.current; if (!stage) return
    const box = stage.container().getBoundingClientRect()
    const abs = konvaText.absolutePosition()
    const ta = document.createElement('textarea')
    document.body.appendChild(ta)
    const fs = (layer.fontSize ?? 12) * scale
    const w  = Math.max(60, (layer.width ?? 200) * scale)
    Object.assign(ta.style, {
      position: 'fixed', top: `${box.top + abs.y}px`, left: `${box.left + abs.x}px`,
      width: `${w}px`, minHeight: `${fs * (layer.lineHeight ?? 1.3) * 2}px`,
      fontSize: `${fs}px`, fontFamily: `${layer.fontFamily ?? 'Poppins'}, sans-serif`,
      fontWeight: layer.fontWeight ?? '400', fontStyle: layer.fontStyle ?? 'normal',
      color: layer.fill ?? '#000', lineHeight: String(layer.lineHeight ?? 1.3),
      textAlign: layer.align ?? 'left', letterSpacing: `${layer.letterSpacing ?? 0}px`,
      background: 'transparent', border: 'none',
      outline: '1.5px dashed rgba(75,107,251,0.55)', outlineOffset: '2px',
      padding: '0', resize: 'none', overflow: 'hidden', zIndex: '9999', boxSizing: 'border-box',
    } as CSSStyleDeclaration)
    ta.value = layer.text; konvaText.hide(); trRef.current?.nodes([])
    ta.focus(); ta.setSelectionRange(0, ta.value.length)
    const resize = () => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 4}px` }
    ta.addEventListener('input', resize); resize()
    let done = false
    const finish = () => {
      if (done) return; done = true
      const next = ta.value; konvaText.show(); konvaText.getLayer()?.batchDraw(); ta.remove()
      if (next !== layer.text) onLayerChange(layer.id, { text: next })
      setTimeout(() => {
        if (!trRef.current || !stageRef.current) return
        const n = stageRef.current.findOne(`#${layer.id}`)
        if (n) trRef.current.nodes([n]); trRef.current.getLayer()?.batchDraw()
      }, 30)
    }
    ta.addEventListener('blur', finish)
    ta.addEventListener('keydown', e => { if (e.key === 'Escape') { ta.value = layer.text; finish() } })
  }, [scale, onLayerChange])

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const src = e.dataTransfer.getData('image-src')
    if (!src || !onImageDrop) return
    const rect = e.currentTarget.getBoundingClientRect()
    onImageDrop(src, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale)
  }

  const handleNodeSelect = useCallback((id: string) => {
    if (ctrlRef.current && onToggle) onToggle(id)
    else onSelect(id)
  }, [onSelect, onToggle])

  // ── Rubber-band ───────────────────────────────────────────────────────────
  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== e.target.getStage()) return
    // getPointerPosition() already returns canvas coords (Konva divides internally by scaleX)
    const pos = e.target.getStage()!.getPointerPosition()!
    isSelecting.current = true; hasMoved.current = false; selRectRef.current = null
    selStart.current = { x: pos.x, y: pos.y }
    setSelRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }
  function handleStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isSelecting.current) return
    const pos = e.target.getStage()!.getPointerPosition()!
    const cx = pos.x, cy = pos.y
    const rx = Math.min(cx, selStart.current.x), ry = Math.min(cy, selStart.current.y)
    const rw = Math.abs(cx - selStart.current.x), rh = Math.abs(cy - selStart.current.y)
    if (rw > 3 || rh > 3) hasMoved.current = true
    const next = { x: rx, y: ry, w: rw, h: rh }
    selRectRef.current = next; setSelRect(next)
  }
  function handleStageMouseUp() {
    if (!isSelecting.current) return
    isSelecting.current = false
    const moved = hasMoved.current, rect = selRectRef.current
    selRectRef.current = null; setSelRect(null)
    if (!moved || !rect || (rect.w < 5 && rect.h < 5)) return
    const stage = stageRef.current; if (!stage || !onSelectMany) return
    const box = { x: rect.x, y: rect.y, width: rect.w, height: rect.h }
    const ids: string[] = []
    for (const layer of layersRef.current) {
      if (layer.visible === false || layer.locked) continue
      const node = stage.findOne(`#${layer.id}`); if (!node) continue
      // getClientRect({ relativeTo: stage }) returns canvas coords — no scale division needed
      const cr = node.getClientRect({ relativeTo: stage })
      if (rectIntersects(box, { x: cr.x, y: cr.y, width: cr.width, height: cr.height })) ids.push(layer.id)
    }
    if (ids.length > 0) onSelectMany(ids)
  }

  const guidesVisible = guides?.visible ?? false
  const guidesLocked  = guides?.locked  ?? false
  const hitW          = guidesLocked ? 0 : 12 / scale
  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      style={{ display: 'inline-block', lineHeight: 0, position: 'relative' }}
    >
      <Stage
        ref={stageRef}
        width={state.canvasWidth * scale} height={state.canvasHeight * scale}
        scaleX={scale} scaleY={scale}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={(e: any) => { if (e.target === e.target.getStage() && !hasMoved.current) onSelect(null) }}
        onTap={(e: any) => { if (e.target === e.target.getStage()) onSelect(null) }}
        style={{ display: 'block', boxShadow: '0 4px 32px rgba(0,0,0,0.14)' }}
      >
        {/* ── Main content layer ── */}
        <KonvaLayer>
          <Rect x={0} y={0} width={state.canvasWidth} height={state.canvasHeight} fill={backgroundColor} listening={false} />
          {state.layers.map(layer => (
            <LayerRenderer
              key={layer.id} layer={layer}
              isSelected={selectedIds.includes(layer.id)}
              onSelect={handleNodeSelect}
              onDragBound={handleDragBound}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
              onTextDblClick={handleTextDblClick}
              onOverflow={handleOverflow}
            />
          ))}
          <Transformer
            ref={trRef} rotateEnabled flipEnabled={false}
            boundBoxFunc={(_, n) => (n.width < 4 && n.height < 4) ? _ : n}
            anchorSize={8} anchorCornerRadius={3}
            borderStroke="#4B6BFB" borderStrokeWidth={1.5}
            anchorStroke="#4B6BFB" anchorFill="#fff" anchorStrokeWidth={1.5}
            rotateAnchorOffset={28}
          />
          {selRect && selRect.w > 2 && (
            <Rect x={selRect.x} y={selRect.y} width={selRect.w} height={selRect.h}
              fill="rgba(75,107,251,0.08)" stroke="#4B6BFB" strokeWidth={1 / scale} listening={false} />
          )}
        </KonvaLayer>

        {/* ── Overflow indicators ── */}
        <KonvaLayer listening={false}>
          {state.layers.map(layer => {
            if (layer.type !== 'text' || layer.visible === false || !overflowIds.has(layer.id)) return null
            const tl = layer as TextLayer
            const w = tl.width ?? 0, h = tl.height ?? 0
            if (!w || !h) return null
            const bg   = backgroundColor ?? '#ffffff'
            const rgb  = hexToRgb(bg)
            const fade = Math.min(36, h * 0.4)
            return (
              <Rect
                key={layer.id + '_ov_fade'}
                x={tl.x} y={tl.y + h - fade}
                width={w} height={fade}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: fade }}
                fillLinearGradientColorStops={[
                  0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`,
                  1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.97)`,
                ]}
                listening={false}
              />
            )
          })}
        </KonvaLayer>

        {/* ── Guides + snap feedback overlay ── */}
        {guidesVisible && (
          <KonvaLayer>
            {/* Ruler guide lines */}
            {(guides?.vertical ?? []).map((pos, i) => {
              const gid = `vg-${i}`
              const isActive = activeSnap.v !== null && Math.abs(activeSnap.v - pos) < 0.5
              return (
                <Line key={gid}
                  x={pos} y={0} points={[0, 0, 0, state.canvasHeight]}
                  stroke={GUIDE_COLOR} strokeWidth={1} strokeScaleEnabled={false}
                  hitStrokeWidth={hitW}
                  draggable={!guidesLocked}
                  opacity={isActive ? 1 : hoveredGuide === gid ? 0.9 : 0.55}
                  shadowEnabled={isActive} shadowColor={GUIDE_COLOR} shadowBlur={6} shadowOpacity={0.5} shadowOffsetX={0} shadowOffsetY={0}
                  dragBoundFunc={(p) => handleGuideDragBound('V', i, p)}
                  onDragMove={(e) => handleGuideDragMove('V', e)}
                  onDragEnd={(e) => handleGuideDragEnd('V', i, e)}
                  onMouseEnter={(e) => {
                    if (!guidesLocked) e.target.getStage()!.container().style.cursor = 'ew-resize'
                    setHoveredGuide(gid)
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage()!.container().style.cursor = ''
                    setHoveredGuide(null)
                  }}
                  listening={!guidesLocked}
                />
              )
            })}
            {(guides?.horizontal ?? []).map((pos, i) => {
              const gid = `hg-${i}`
              const isActive = activeSnap.h !== null && Math.abs(activeSnap.h - pos) < 0.5
              return (
                <Line key={gid}
                  x={0} y={pos} points={[0, 0, state.canvasWidth, 0]}
                  stroke={GUIDE_COLOR} strokeWidth={1} strokeScaleEnabled={false}
                  hitStrokeWidth={hitW}
                  draggable={!guidesLocked}
                  opacity={isActive ? 1 : hoveredGuide === gid ? 0.9 : 0.55}
                  shadowEnabled={isActive} shadowColor={GUIDE_COLOR} shadowBlur={6} shadowOpacity={0.5} shadowOffsetX={0} shadowOffsetY={0}
                  dragBoundFunc={(p) => handleGuideDragBound('H', i, p)}
                  onDragMove={(e) => handleGuideDragMove('H', e)}
                  onDragEnd={(e) => handleGuideDragEnd('H', i, e)}
                  onMouseEnter={(e) => {
                    if (!guidesLocked) e.target.getStage()!.container().style.cursor = 'ns-resize'
                    setHoveredGuide(gid)
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage()!.container().style.cursor = ''
                    setHoveredGuide(null)
                  }}
                  listening={!guidesLocked}
                />
              )
            })}

          </KonvaLayer>
        )}
      </Stage>

      {/* HTML overlay — scissors badges for overflow text layers */}
      {overflowIds.size > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
          {state.layers.map(layer => {
            if (layer.type !== 'text' || !overflowIds.has(layer.id) || layer.visible === false) return null
            const tl = layer as TextLayer
            const w = tl.width ?? 0, h = tl.height ?? 0
            if (!w || !h) return null
            const D = 22
            return (
              <OverflowBadge
                key={layer.id + '_ov_btn'}
                x={(tl.x + w) * scale - D / 2 - 3}
                y={(tl.y + h) * scale - D / 2 - 3}
                onSelect={() => onSelect(layer.id)}
              />
            )
          })}
        </div>
      )}

      {/* Floating label during guide drag */}
      {guideLabel && (
        <div style={{
          position: 'absolute',
          left: guideLabel.axis === 'V' ? guideLabel.sx + 8  : guideLabel.sx - 30,
          top:  guideLabel.axis === 'H' ? guideLabel.sy - 22 : guideLabel.sy + 8,
          background: GUIDE_COLOR, color: '#fff',
          fontSize: 10, padding: '2px 6px', borderRadius: 3,
          pointerEvents: 'none', zIndex: 20,
          fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', lineHeight: '1.4',
        }}>
          {guideLabel.value} px
        </div>
      )}
    </div>
  )
}