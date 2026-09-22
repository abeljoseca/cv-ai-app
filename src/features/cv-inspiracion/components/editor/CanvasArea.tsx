'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { CanvasState, GuidesState } from '../../types/canvas.types'
import type { Layer } from '../../types/layer.types'
import type { KonvaCanvas as KonvaCanvasImpl, NodeBounds } from '../canvas/KonvaCanvas'

type KonvaCanvasProps = React.ComponentProps<typeof KonvaCanvasImpl>

const KonvaCanvas = dynamic<KonvaCanvasProps>(
  () => import('./KonvaCanvasWrapper').then(m => m.KonvaCanvasWrapper),
  { ssr: false, loading: () => <CanvasPlaceholder width={595.5} height={842.25} /> }
)

const RULER_SIZE = 20

interface Props {
  state: CanvasState
  currentPageIdx: number
  selectedIds: string[]
  scale: number
  guides: GuidesState
  onGuidesChange: (g: GuidesState) => void
  onSelect: (id: string | null) => void
  onToggle?: (id: string) => void
  onSelectMany?: (ids: string[]) => void
  onPageActivate: (idx: number) => void
  onLayerChange: (id: string, updates: Partial<Layer>) => void
  onNodeBounds: (bounds: NodeBounds | null) => void
  onAddPage: () => void
  onImageDrop: (src: string, x: number, y: number) => void
}

export function CanvasArea({
  state, currentPageIdx, selectedIds, scale, guides, onGuidesChange,
  onSelect, onToggle, onSelectMany,
  onPageActivate, onLayerChange, onNodeBounds, onAddPage, onImageDrop,
}: Props) {
  const pages = state.pages ?? [{ id: 'page_1', layers: state.layers }]

  const scrollRef          = useRef<HTMLDivElement>(null)
  const hRulerRef          = useRef<HTMLCanvasElement>(null)
  const vRulerRef          = useRef<HTMLCanvasElement>(null)
  const activeCanvasRef    = useRef<HTMLDivElement>(null)

  // Ruler drag (guide creation from ruler)
  const [rulerDrag, setRulerDrag] = useState<{
    axis: 'V' | 'H'
    docPos: number
    screenX: number
    screenY: number
  } | null>(null)
  const rulerDragRef = useRef(rulerDrag)
  useEffect(() => { rulerDragRef.current = rulerDrag }, [rulerDrag])

  const ctrlRef = useRef(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => { ctrlRef.current = e.ctrlKey || e.metaKey }
    const up   = ()                  => { ctrlRef.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Ruler drawing ─────────────────────────────────────────────────────────
  const guidesRef = useRef(guides)
  useEffect(() => { guidesRef.current = guides }, [guides])

  const drawRulers = useCallback(() => {
    const scrollEl    = scrollRef.current
    const activeEl    = activeCanvasRef.current
    const hCanvas     = hRulerRef.current
    const vCanvas     = vRulerRef.current
    if (!scrollEl || !activeEl || !hCanvas || !vCanvas) return

    const scrollRect  = scrollEl.getBoundingClientRect()
    const canvasRect  = activeEl.getBoundingClientRect()
    const originX     = canvasRect.left - scrollRect.left  // canvas left in ruler coords
    const originY     = canvasRect.top  - scrollRect.top   // canvas top  in ruler coords
    const g           = guidesRef.current
    const steps       = [1, 2, 5, 10, 25, 50, 100, 200, 500]

    // ── Horizontal ruler ──
    const hW = hCanvas.offsetWidth
    if (hCanvas.width !== hW) hCanvas.width = hW
    if (hCanvas.height !== RULER_SIZE) hCanvas.height = RULER_SIZE
    const hCtx = hCanvas.getContext('2d')
    if (hCtx) {
      hCtx.clearRect(0, 0, hW, RULER_SIZE)
      hCtx.fillStyle = '#f1f5f9'
      hCtx.fillRect(0, 0, hW, RULER_SIZE)
      const step = steps.find(s => s * scale >= 50) ?? 500
      const startV = Math.max(0, Math.floor(-originX / scale / step) * step)
      const endV   = Math.ceil((hW - originX) / scale)
      hCtx.font = '9px ui-monospace, monospace'
      for (let v = startV; v <= endV; v += step) {
        const sx = v * scale + originX
        if (sx < 0 || sx > hW) continue
        hCtx.strokeStyle = '#cbd5e1'; hCtx.lineWidth = 1
        hCtx.beginPath(); hCtx.moveTo(sx + 0.5, RULER_SIZE - 5); hCtx.lineTo(sx + 0.5, RULER_SIZE); hCtx.stroke()
        hCtx.fillStyle = '#64748b'; hCtx.textAlign = 'center'
        hCtx.fillText(String(Math.round(v)), sx, RULER_SIZE - 7)
        const halfX = sx + step * scale / 2
        if (halfX > 0 && halfX < hW) {
          hCtx.strokeStyle = '#e2e8f0'
          hCtx.beginPath(); hCtx.moveTo(halfX + 0.5, RULER_SIZE - 3); hCtx.lineTo(halfX + 0.5, RULER_SIZE); hCtx.stroke()
        }
      }
      // Guide markers on ruler
      if (g.visible) {
        for (const gv of g.vertical) {
          const gx = gv * scale + originX
          if (gx < 0 || gx > hW) continue
          hCtx.fillStyle = '#4B6BFB'
          hCtx.fillRect(Math.round(gx) - 0.5, 0, 1, RULER_SIZE)
        }
      }
    }

    // ── Vertical ruler ──
    const vH = vCanvas.offsetHeight
    if (vCanvas.width !== RULER_SIZE) vCanvas.width = RULER_SIZE
    if (vCanvas.height !== vH) vCanvas.height = vH
    const vCtx = vCanvas.getContext('2d')
    if (vCtx) {
      vCtx.clearRect(0, 0, RULER_SIZE, vH)
      vCtx.fillStyle = '#f1f5f9'
      vCtx.fillRect(0, 0, RULER_SIZE, vH)
      const step = steps.find(s => s * scale >= 50) ?? 500
      const startV = Math.max(0, Math.floor(-originY / scale / step) * step)
      const endV   = Math.ceil((vH - originY) / scale)
      vCtx.font = '9px ui-monospace, monospace'
      for (let v = startV; v <= endV; v += step) {
        const sy = v * scale + originY
        if (sy < 0 || sy > vH) continue
        vCtx.strokeStyle = '#cbd5e1'; vCtx.lineWidth = 1
        vCtx.beginPath(); vCtx.moveTo(RULER_SIZE - 5, sy + 0.5); vCtx.lineTo(RULER_SIZE, sy + 0.5); vCtx.stroke()
        vCtx.save()
        vCtx.translate(RULER_SIZE - 7, sy)
        vCtx.rotate(-Math.PI / 2)
        vCtx.fillStyle = '#64748b'; vCtx.textAlign = 'center'
        vCtx.fillText(String(Math.round(v)), 0, 0)
        vCtx.restore()
        const halfY = sy + step * scale / 2
        if (halfY > 0 && halfY < vH) {
          vCtx.strokeStyle = '#e2e8f0'
          vCtx.beginPath(); vCtx.moveTo(RULER_SIZE - 3, halfY + 0.5); vCtx.lineTo(RULER_SIZE, halfY + 0.5); vCtx.stroke()
        }
      }
      if (g.visible) {
        for (const gh of g.horizontal) {
          const gy = gh * scale + originY
          if (gy < 0 || gy > vH) continue
          vCtx.fillStyle = '#4B6BFB'
          vCtx.fillRect(0, Math.round(gy) - 0.5, RULER_SIZE, 1)
        }
      }
    }
  }, [scale])

  // Redraw on scroll, scale, guides, or page changes
  useEffect(() => {
    const scrollEl = scrollRef.current
    let raf: number
    const redraw = () => { raf = requestAnimationFrame(drawRulers) }
    redraw()
    scrollEl?.addEventListener('scroll', redraw)
    window.addEventListener('resize', redraw)
    return () => {
      scrollEl?.removeEventListener('scroll', redraw)
      window.removeEventListener('resize', redraw)
      cancelAnimationFrame(raf)
    }
  }, [drawRulers, guides, currentPageIdx])

  // ── Coordinate conversion ──────────────────────────────────────────────────
  function toDocCoords(screenX: number, screenY: number) {
    const activeEl = activeCanvasRef.current
    if (!activeEl) return { docX: 0, docY: 0 }
    const r = activeEl.getBoundingClientRect()
    return { docX: (screenX - r.left) / scale, docY: (screenY - r.top) / scale }
  }

  function snapGuidePos(pos: number, axis: 'V' | 'H'): number {
    if (ctrlRef.current) return pos
    const SNAP_PX = 5
    const snapIn  = SNAP_PX / scale
    const docSize = axis === 'V' ? state.canvasWidth : state.canvasHeight
    const others  = axis === 'V' ? guides.vertical : guides.horizontal
    for (const t of [0, docSize / 2, docSize, ...others]) {
      if (Math.abs(pos - t) <= snapIn) return t
    }
    return pos
  }

  // ── Ruler drag handlers ────────────────────────────────────────────────────
  function startRulerDrag(axis: 'V' | 'H', e: React.MouseEvent) {
    if (guides.locked) return
    e.preventDefault()
    const { docX, docY } = toDocCoords(e.clientX, e.clientY)
    const docPos = axis === 'V' ? snapGuidePos(docX, 'V') : snapGuidePos(docY, 'H')
    setRulerDrag({ axis, docPos, screenX: e.clientX, screenY: e.clientY })
  }

  useEffect(() => {
    if (!rulerDrag) return
    const { axis } = rulerDrag

    function onMove(e: MouseEvent) {
      const { docX, docY } = toDocCoords(e.clientX, e.clientY)
      const raw    = axis === 'V' ? docX : docY
      const docPos = snapGuidePos(raw, axis)
      setRulerDrag(prev => prev ? { ...prev, docPos, screenX: e.clientX, screenY: e.clientY } : null)
    }

    function onUp(e: MouseEvent) {
      const drag = rulerDragRef.current
      if (!drag) return
      const { docX, docY } = toDocCoords(e.clientX, e.clientY)
      const raw    = drag.axis === 'V' ? docX : docY
      const docPos = snapGuidePos(raw, drag.axis)
      const limit  = drag.axis === 'V' ? state.canvasWidth : state.canvasHeight
      if (raw >= 0 && raw <= limit) {
        if (drag.axis === 'V') {
          onGuidesChange({ ...guides, vertical: [...guides.vertical, docPos] })
        } else {
          onGuidesChange({ ...guides, horizontal: [...guides.horizontal, docPos] })
        }
      }
      setRulerDrag(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulerDrag?.axis, guides, scale, state.canvasWidth, state.canvasHeight, onGuidesChange])

  const showRulers = guides.visible

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#eef0f4' }}>
      {/* ── Ruler top row ── */}
      {showRulers && (
        <div className="flex flex-none" style={{ height: RULER_SIZE, borderBottom: '1px solid #e2e8f0' }}>
          <button
            title={guides.locked ? 'Desbloquear guías' : 'Bloquear guías'}
            onClick={() => onGuidesChange({ ...guides, locked: !guides.locked })}
            style={{ width: RULER_SIZE, height: RULER_SIZE, flexShrink: 0, background: '#eef2ff', borderTop: 'none', borderLeft: 'none', borderBottom: 'none', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            {guides.locked
              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4B6BFB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            }
          </button>
          <div
            style={{ flex: 1, overflow: 'hidden', cursor: 'crosshair' }}
            onMouseDown={e => startRulerDrag('H', e)}
          >
            <canvas ref={hRulerRef} style={{ display: 'block', width: '100%', height: RULER_SIZE }} />
          </div>
        </div>
      )}

      {/* ── Content row ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical ruler */}
        {showRulers && (
          <div
            style={{ width: RULER_SIZE, flexShrink: 0, overflow: 'hidden', cursor: 'crosshair', borderRight: '1px solid #e2e8f0' }}
            onMouseDown={e => startRulerDrag('V', e)}
          >
            <canvas ref={vRulerRef} style={{ display: 'block', width: RULER_SIZE, height: '100%' }} />
          </div>
        )}

        {/* Scrollable canvas area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto relative"
          style={{ background: 'repeating-linear-gradient(45deg,#d8dce3 0,#d8dce3 1px,#dde1e7 0,#dde1e7 50%) 0/20px 20px' }}
          onDragOver={e => e.preventDefault()}
          onClick={e => { if (e.target === e.currentTarget) onSelect(null) }}
        >
          <div
            className="flex flex-col items-center min-w-max px-16"
            onClick={e => { if (e.target === e.currentTarget) onSelect(null) }}
          >
            {pages.map((page, idx) => {
              const isActive = idx === currentPageIdx
              return (
                <div
                  key={page.id}
                  className="mt-8 flex flex-col items-center"
                  onClick={e => { if (!isActive) { e.stopPropagation(); onPageActivate(idx) } }}
                >
                  {pages.length > 1 && (
                    <div className={`mb-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${isActive ? 'text-[#4B6BFB] bg-[#EEF2FF]' : 'text-[#94a3b8] bg-white/60'}`}>
                      {page.name ?? `Página ${idx + 1}`}
                    </div>
                  )}
                  <div
                    ref={isActive ? activeCanvasRef : undefined}
                    className={`transition-all ${!isActive ? 'opacity-70 hover:opacity-90 cursor-pointer' : ''}`}
                    style={isActive ? { filter: 'drop-shadow(0 0 0 2px #4B6BFB)' } : undefined}
                  >
                    <KonvaCanvas
                      state={{ ...state, layers: isActive ? state.layers : page.layers }}
                      backgroundColor={page.backgroundColor ?? '#ffffff'}
                      selectedIds={isActive ? selectedIds : []}
                      scale={scale}
                      onSelect={id => { if (!isActive) onPageActivate(idx); onSelect(id) }}
                      onToggle={isActive ? onToggle : undefined}
                      onSelectMany={isActive ? onSelectMany : undefined}
                      onLayerChange={onLayerChange}
                      onNodeBounds={isActive ? onNodeBounds : () => {}}
                      onImageDrop={isActive ? onImageDrop : undefined}
                      guides={guides}
                      onGuidesChange={isActive ? onGuidesChange : undefined}
                    />
                  </div>
                </div>
              )
            })}

            <div className="my-6">
              <button
                onClick={onAddPage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#e2e8f0] text-sm text-[#475569] font-medium hover:border-[#4B6BFB] hover:text-[#4B6BFB] hover:bg-[#f8faff] transition-all shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar página
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ghost guide during ruler drag (position: fixed, covers viewport) */}
      {rulerDrag && (() => {
        const activeEl = activeCanvasRef.current
        if (!activeEl) return null
        const r = activeEl.getBoundingClientRect()
        if (rulerDrag.axis === 'V') {
          const sx = r.left + rulerDrag.docPos * scale
          return (
            <>
              <div style={{ position: 'fixed', left: sx, top: r.top, width: 1, height: r.height, background: '#4B6BFB', opacity: 0.6, pointerEvents: 'none', zIndex: 9999 }} />
              <div style={{ position: 'fixed', left: sx + 8, top: rulerDrag.screenY - 10, background: '#4B6BFB', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 3, pointerEvents: 'none', zIndex: 9999, fontFamily: 'ui-monospace,monospace' }}>
                {Math.round(rulerDrag.docPos)} px
              </div>
            </>
          )
        } else {
          const sy = r.top + rulerDrag.docPos * scale
          return (
            <>
              <div style={{ position: 'fixed', top: sy, left: r.left, height: 1, width: r.width, background: '#4B6BFB', opacity: 0.6, pointerEvents: 'none', zIndex: 9999 }} />
              <div style={{ position: 'fixed', left: rulerDrag.screenX + 12, top: sy - 22, background: '#4B6BFB', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 3, pointerEvents: 'none', zIndex: 9999, fontFamily: 'ui-monospace,monospace' }}>
                {Math.round(rulerDrag.docPos)} px
              </div>
            </>
          )
        }
      })()}
    </div>
  )
}

function CanvasPlaceholder({ width, height }: { width: number; height: number }) {
  return (
    <div className="my-8">
      <div style={{ width, height }} className="bg-white shadow-2xl rounded-sm animate-pulse" />
    </div>
  )
}