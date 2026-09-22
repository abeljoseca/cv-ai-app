'use client'

import { useState, useEffect, useRef } from 'react'
import type { Layer, TextLayer, RectLayer, CircleLayer, LineLayer, PolygonLayer, StarLayer, PathLayer, ImageLayer, FrameLayer } from '../../types/layer.types'
import { ICONS, iconToDataUrl } from '../../lib/icon-registry'
import type { AlignAction } from '../../lib/align-utils'

const FONTS = [
  'Poppins', 'Inter', 'Roboto', 'Montserrat', 'Lato',
  'Open Sans', 'Raleway', 'Oswald', 'Nunito', 'Ubuntu',
  'Playfair Display', 'Merriweather', 'Georgia', 'Arial',
  'Times New Roman', 'Courier New',
]

interface Props {
  layer: Layer | null
  selectedCount: number
  pageBackground?: string
  onPageBackgroundChange?: (color: string) => void
  onUpdate: (id: string, updates: Partial<Layer>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onReorder: (id: string, dir: 'up' | 'down' | 'top' | 'bottom') => void
  onAlign: (action: AlignAction) => void
}

export function ContextBar({ layer, selectedCount, pageBackground, onPageBackgroundChange, onUpdate, onDelete, onDuplicate, onReorder, onAlign }: Props) {
  if (!layer) {
    if (selectedCount > 1) {
      return (
        <div className="flex items-center flex-shrink-0 bg-white border-b border-[#e8eaed] px-3 gap-1" style={{ height: 44, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <span className="text-[11px] text-[#4B6BFB] font-medium flex-shrink-0 mr-2">
            {selectedCount} seleccionados
          </span>
          <Divider />
          <AlignmentButtons onAlign={onAlign} showDistribute={selectedCount >= 3} />
        </div>
      )
    }
    return (
      <div className="flex items-center flex-shrink-0 bg-white border-b border-[#e8eaed] px-4 gap-3" style={{ height: 44 }}>
        <span className="text-[11px] text-[#c0c8d4] mr-auto">Selecciona un elemento · Doble clic en texto para editar · Ctrl+clic para selección múltiple</span>
        {onPageBackgroundChange && (
          <>
            <Divider />
            <span className="text-[10px] text-[#94a3b8] font-semibold">Página</span>
            <Swatch value={pageBackground ?? '#ffffff'} onChange={onPageBackgroundChange} label="Fondo" paletteKey="bg" />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center flex-shrink-0 bg-white border-b border-[#e8eaed] px-2 gap-1"
      style={{ height: 44, boxShadow: '0 1px 3px rgba(0,0,0,.04)', overflowX: 'auto', scrollbarWidth: 'none' }}
    >
      {/* ── Type controls ── */}
      {layer.type === 'text'    && <TextControls    layer={layer as TextLayer}    onUpdate={onUpdate} />}
      {layer.type === 'rect'    && <RectControls    layer={layer as RectLayer}    onUpdate={onUpdate} />}
      {layer.type === 'circle'  && <CircleControls  layer={layer as CircleLayer}  onUpdate={onUpdate} />}
      {layer.type === 'polygon' && <PolygonControls layer={layer as PolygonLayer} onUpdate={onUpdate} />}
      {layer.type === 'star'    && <StarControls    layer={layer as StarLayer}    onUpdate={onUpdate} />}
      {layer.type === 'path'    && <PathControls    layer={layer as PathLayer}    onUpdate={onUpdate} />}
      {layer.type === 'line'    && <LineControls    layer={layer as LineLayer}    onUpdate={onUpdate} />}
      {layer.type === 'image'   && <ImageControls   layer={layer as ImageLayer}   onUpdate={onUpdate} />}
      {layer.type === 'frame'   && <FrameControls   layer={layer as FrameLayer}   onUpdate={onUpdate} />}

      <Divider />

      {/* ── Position & size ── */}
      <NumInput label="X" value={layer.x} onChange={v => onUpdate(layer.id, { x: v })} w={50} />
      <NumInput label="Y" value={layer.y} onChange={v => onUpdate(layer.id, { y: v })} w={50} />
      {!['circle', 'line', 'polygon', 'star'].includes(layer.type) && layer.width  != null && (() => {
        const isIcon = layer.type === 'image' && !!(layer as ImageLayer).iconId
        return <>
          <NumInput label="W" value={layer.width}  onChange={v => { const s = Math.max(4, v); onUpdate(layer.id, isIcon ? { width: s, height: s } : { width: s }) }} w={50} />
          <NumInput label="H" value={layer.height ?? layer.width} onChange={v => { const s = Math.max(4, v); onUpdate(layer.id, isIcon ? { width: s, height: s } : { height: s }) }} w={50} />
        </>
      })()}
      {layer.type !== 'line' &&
        <NumInput label="°" value={layer.rotation ?? 0} onChange={v => onUpdate(layer.id, { rotation: v })} w={46} min={-360} max={360} />}

      <Divider />

      {/* ── Opacity ── */}
      <NumInput label="%" value={Math.round((layer.opacity ?? 1) * 100)} onChange={v => onUpdate(layer.id, { opacity: Math.min(1, Math.max(0, v / 100)) })} w={44} min={0} max={100} />

      <Divider />

      {/* ── Z-order ── */}
      <div className="flex items-center gap-px flex-shrink-0">
        <IcoBtn title="Al frente" onClick={() => onReorder(layer.id, 'top')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17,11 12,6 7,11"/><polyline points="17,18 12,13 7,18"/></svg>
        </IcoBtn>
        <IcoBtn title="Subir" onClick={() => onReorder(layer.id, 'up')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18,15 12,9 6,15"/></svg>
        </IcoBtn>
        <IcoBtn title="Bajar" onClick={() => onReorder(layer.id, 'down')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,9 12,15 18,9"/></svg>
        </IcoBtn>
        <IcoBtn title="Al fondo" onClick={() => onReorder(layer.id, 'bottom')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="7,6 12,11 17,6"/><polyline points="7,13 12,18 17,13"/></svg>
        </IcoBtn>
      </div>

      <Divider />

      {/* ── Align to page ── */}
      <AlignmentButtons onAlign={onAlign} showDistribute={false} />

      <Divider />

      {/* ── Actions ── */}
      <IcoBtn title="Duplicar (Ctrl+D)" onClick={() => onDuplicate(layer.id)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </IcoBtn>
      <IcoBtn title="Eliminar (Delete)" onClick={() => onDelete(layer.id)} disabled={!!layer.locked} danger>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/></svg>
      </IcoBtn>
    </div>
  )
}

// ── Type controls ──────────────────────────────────────

function TextControls({ layer, onUpdate }: { layer: TextLayer; onUpdate: Props['onUpdate'] }) {
  const isBold   = layer.fontWeight === '700' || layer.fontWeight === 'bold'
  const isItalic = layer.fontStyle === 'italic'
  return (
    <>
      <select
        value={layer.fontFamily ?? 'Poppins'}
        onChange={e => onUpdate(layer.id, { fontFamily: e.target.value } as Partial<TextLayer>)}
        className="h-7 text-[11px] border border-[#e2e8f0] rounded-md pl-2 pr-6 focus:outline-none focus:border-[#4B6BFB] bg-white cursor-pointer flex-shrink-0"
        style={{ width: 116 }}
      >
        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <NumInput label="px" value={layer.fontSize ?? 12} onChange={v => onUpdate(layer.id, { fontSize: Math.max(6, v) } as Partial<TextLayer>)} w={40} min={6} max={120} />
      <Divider />
      <TglBtn active={isBold}   onClick={() => onUpdate(layer.id, { fontWeight: isBold   ? '400' : '700'    } as Partial<TextLayer>)}><span className="font-bold   text-[13px] leading-none">B</span></TglBtn>
      <TglBtn active={isItalic} onClick={() => onUpdate(layer.id, { fontStyle:  isItalic ? 'normal' : 'italic' } as Partial<TextLayer>)}><span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, lineHeight: 1 }}>I</span></TglBtn>
      <Divider />
      {(['left', 'center', 'right', 'justify'] as const).map(a => (
        <TglBtn key={a} active={layer.align === a} onClick={() => onUpdate(layer.id, { align: a } as Partial<TextLayer>)}><AlignIcon a={a} /></TglBtn>
      ))}
      <Divider />
      <Swatch value={layer.fill ?? '#000'} onChange={v => onUpdate(layer.id, { fill: v } as Partial<TextLayer>)} label="Color" paletteKey="fill" />
    </>
  )
}

function RectControls({ layer, onUpdate }: { layer: RectLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <>
      <Swatch value={layer.fill ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { fill: v } as Partial<RectLayer>)} label="Relleno" allowTransparent paletteKey="fill" />
      <Swatch value={layer.stroke ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<RectLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
      <NumInput label="B" value={layer.strokeWidth ?? 0} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<RectLayer>)} w={38} min={0} max={20} />
      <NumInput label="R" value={layer.cornerRadius ?? 0} onChange={v => onUpdate(layer.id, { cornerRadius: v } as Partial<RectLayer>)} w={38} min={0} max={200} />
    </>
  )
}

function CircleControls({ layer, onUpdate }: { layer: CircleLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <>
      <Swatch value={layer.fill ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { fill: v } as Partial<CircleLayer>)} label="Relleno" allowTransparent paletteKey="fill" />
      <Swatch value={layer.stroke ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<CircleLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
      <NumInput label="B" value={layer.strokeWidth ?? 0} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<CircleLayer>)} w={38} min={0} max={20} />
      <NumInput label="r" value={layer.radius} onChange={v => onUpdate(layer.id, { radius: Math.max(4, v) } as Partial<CircleLayer>)} w={46} min={4} max={500} />
    </>
  )
}

function PolygonControls({ layer, onUpdate }: { layer: PolygonLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <>
      <Swatch value={layer.fill ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { fill: v } as Partial<PolygonLayer>)} label="Relleno" allowTransparent paletteKey="fill" />
      <Swatch value={layer.stroke ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<PolygonLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
      <NumInput label="B"    value={layer.strokeWidth ?? 0} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<PolygonLayer>)} w={38} min={0} max={20} />
      <NumInput label="Lad." value={layer.sides} onChange={v => onUpdate(layer.id, { sides: Math.max(3, Math.min(12, Math.round(v))) } as Partial<PolygonLayer>)} w={38} min={3} max={12} />
    </>
  )
}

function StarControls({ layer, onUpdate }: { layer: StarLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <>
      <Swatch value={layer.fill ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { fill: v } as Partial<StarLayer>)} label="Relleno" allowTransparent paletteKey="fill" />
      <Swatch value={layer.stroke ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<StarLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
      <NumInput label="B"   value={layer.strokeWidth ?? 0} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<StarLayer>)} w={38} min={0} max={20} />
      <NumInput label="Pts" value={layer.numPoints} onChange={v => onUpdate(layer.id, { numPoints: Math.max(3, Math.min(12, Math.round(v))) } as Partial<StarLayer>)} w={38} min={3} max={12} />
    </>
  )
}

function PathControls({ layer, onUpdate }: { layer: PathLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <>
      <Swatch value={layer.fill ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { fill: v } as Partial<PathLayer>)} label="Relleno" allowTransparent paletteKey="fill" />
      <Swatch value={layer.stroke ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<PathLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
      <NumInput label="B" value={layer.strokeWidth ?? 0} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<PathLayer>)} w={38} min={0} max={20} />
    </>
  )
}

function LineControls({ layer, onUpdate }: { layer: LineLayer; onUpdate: Props['onUpdate'] }) {
  const startCap = layer.startCap ?? 'none'
  const endCap   = layer.endCap   ?? 'none'

  function setStart(s: LineLayer['startCap']) {
    onUpdate(layer.id, { startCap: s } as Partial<LineLayer>)
  }
  function setEnd(s: LineLayer['endCap']) {
    onUpdate(layer.id, { endCap: s } as Partial<LineLayer>)
  }

  return (
    <>
      <Swatch value={layer.stroke ?? '#1A2B4C'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<LineLayer>)} label="Color" paletteKey="stroke" />
      <NumInput label="px" value={layer.strokeWidth ?? 1} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<LineLayer>)} w={38} min={0.5} max={20} step={0.5} />
      <Divider />
      <span className="text-[9px] text-[#94a3b8] font-semibold uppercase tracking-wide flex-shrink-0 select-none">Inicio</span>
      <TglBtn active={startCap === 'none'}  title="Sin extremo" onClick={() => setStart('none')}>
        <svg width="15" height="10" viewBox="0 0 15 10"><line x1="1" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </TglBtn>
      <TglBtn active={startCap === 'arrow'} title="Flecha" onClick={() => setStart('arrow')}>
        <svg width="15" height="10" viewBox="0 0 15 10"><line x1="7" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.6"/><polyline points="8,1 1,5 8,9" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round"/></svg>
      </TglBtn>
      <TglBtn active={startCap === 'dot'}   title="Círculo" onClick={() => setStart('dot')}>
        <svg width="15" height="10" viewBox="0 0 15 10"><line x1="6" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="2.5" cy="5" r="2.5" fill="currentColor"/></svg>
      </TglBtn>
      <Divider />
      <span className="text-[9px] text-[#94a3b8] font-semibold uppercase tracking-wide flex-shrink-0 select-none">Fin</span>
      <TglBtn active={endCap === 'none'}  title="Sin extremo" onClick={() => setEnd('none')}>
        <svg width="15" height="10" viewBox="0 0 15 10"><line x1="1" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </TglBtn>
      <TglBtn active={endCap === 'arrow'} title="Flecha" onClick={() => setEnd('arrow')}>
        <svg width="15" height="10" viewBox="0 0 15 10"><line x1="1" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.6"/><polyline points="7,1 14,5 7,9" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round"/></svg>
      </TglBtn>
      <TglBtn active={endCap === 'dot'}   title="Círculo" onClick={() => setEnd('dot')}>
        <svg width="15" height="10" viewBox="0 0 15 10"><line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12.5" cy="5" r="2.5" fill="currentColor"/></svg>
      </TglBtn>
    </>
  )
}

function FrameControls({ layer, onUpdate }: { layer: FrameLayer; onUpdate: Props['onUpdate'] }) {
  const SHAPES: Array<{ shape: FrameLayer['shape']; title: string; svg: React.ReactNode }> = [
    { shape: 'circle', title: 'Círculo',  svg: <circle cx="12" cy="12" r="9"/> },
    { shape: 'rect',   title: 'Cuadrado', svg: <rect x="3" y="3" width="18" height="18" rx="1"/> },
  ]
  return (
    <>
      <span className="text-[9px] text-[#94a3b8] font-semibold uppercase tracking-wide flex-shrink-0 select-none">Forma</span>
      {SHAPES.map(s => (
        <TglBtn key={s.shape} active={layer.shape === s.shape} title={s.title}
          onClick={() => onUpdate(layer.id, { shape: s.shape } as Partial<FrameLayer>)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{s.svg}</svg>
        </TglBtn>
      ))}
      <Divider />
      <Swatch value={layer.stroke ?? '#4B6BFB'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<FrameLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
      <NumInput label="px" value={layer.strokeWidth ?? 2} onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<FrameLayer>)} w={38} min={0} max={30} />
      {layer.shape === 'rect' && (
        <NumInput label="R" value={layer.cornerRadius ?? 0} onChange={v => onUpdate(layer.id, { cornerRadius: v } as Partial<FrameLayer>)} w={38} min={0} max={100} />
      )}
    </>
  )
}

function ImageControls({ layer, onUpdate }: { layer: ImageLayer; onUpdate: Props['onUpdate'] }) {
  const isClipped = !!layer.clipShape

  return (
    <>
      {/* Icon color — only for icon layers */}
      {layer.iconId && (
        <Swatch
          value={layer.iconColor ?? '#1A2B4C'}
          onChange={v => {
            const icon = ICONS.find(i => i.id === layer.iconId)
            if (!icon) return
            onUpdate(layer.id, { src: iconToDataUrl(icon, v), iconColor: v } as Partial<ImageLayer>)
          }}
          label="Color"
          paletteKey="fill"
        />
      )}
      {!layer.iconId && (
        <>
          <Divider />
          {/* Mask shape buttons */}
          <span className="text-[9px] text-[#94a3b8] font-semibold uppercase tracking-wide flex-shrink-0 select-none">Máscara</span>
          {/* No mask */}
          <TglBtn active={!isClipped} title="Sin máscara"
            onClick={() => onUpdate(layer.id, { clipShape: undefined } as Partial<ImageLayer>)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
          </TglBtn>
          {/* Circle mask */}
          <TglBtn active={layer.clipShape === 'circle'} title="Máscara circular"
            onClick={() => onUpdate(layer.id, { clipShape: 'circle' } as Partial<ImageLayer>)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>
          </TglBtn>
          {/* Pentagon mask */}
          <TglBtn active={layer.clipShape === 'pentagon'} title="Máscara pentagonal"
            onClick={() => onUpdate(layer.id, { clipShape: 'pentagon' } as Partial<ImageLayer>)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 22,8.5 18,20 6,20 2,8.5"/></svg>
          </TglBtn>

          {/* Corner radius — only when no clip shape */}
          {!isClipped && (
            <>
              <Divider />
              <NumInput label="R" value={layer.cornerRadius ?? 0}
                onChange={v => onUpdate(layer.id, { cornerRadius: Math.max(0, v) } as Partial<ImageLayer>)}
                w={42} min={0} max={500} />
            </>
          )}

          {/* Border */}
          <Divider />
          <Swatch value={layer.stroke ?? 'transparent'} onChange={v => onUpdate(layer.id, { stroke: v } as Partial<ImageLayer>)} label="Borde" allowTransparent paletteKey="stroke" />
          <NumInput label="px" value={layer.strokeWidth ?? 0}
            onChange={v => onUpdate(layer.id, { strokeWidth: Math.max(0, v) } as Partial<ImageLayer>)}
            w={38} min={0} max={30} />
        </>
      )}
    </>
  )
}

// ── Shared primitives ──────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-[#e8eaed] mx-1 flex-shrink-0" />
}

function IcoBtn({ children, onClick, title, disabled, danger }: {
  children: React.ReactNode; onClick: () => void; title?: string; disabled?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className={[
        'w-7 h-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0',
        danger ? 'text-[#94a3b8] hover:bg-red-50 hover:text-red-500 disabled:opacity-30'
               : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#4B6BFB]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function TglBtn({ children, active, onClick, title }: {
  children: React.ReactNode; active?: boolean; onClick: () => void; title?: string
}) {
  return (
    <button
      onClick={onClick} title={title}
      className={[
        'w-7 h-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0',
        active ? 'bg-[#EEF2FF] text-[#4B6BFB]' : 'text-[#64748b] hover:bg-[#f1f5f9]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function NumInput({ label, value, onChange, w, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void
  w: number; min?: number; max?: number; step?: number
}) {
  const [raw, setRaw]       = useState(String(Number.isFinite(value) ? Math.round(value * 10) / 10 : 0))
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) setRaw(String(Number.isFinite(value) ? Math.round(value * 10) / 10 : 0))
  }, [value, active])

  function commit() {
    const n = parseFloat(raw)
    if (!isNaN(n)) {
      let clamped = n
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      onChange(clamped)
      setRaw(String(Math.round(clamped * 10) / 10))
    } else {
      setRaw(String(Number.isFinite(value) ? Math.round(value * 10) / 10 : 0))
    }
    setActive(false)
  }

  function inc() {
    const n = (parseFloat(raw) || 0) + step
    const c = max !== undefined ? Math.min(max, n) : n
    onChange(c); setRaw(String(Math.round(c * 10) / 10))
  }
  function dec() {
    const n = (parseFloat(raw) || 0) - step
    const c = min !== undefined ? Math.max(min, n) : n
    onChange(c); setRaw(String(Math.round(c * 10) / 10))
  }

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <span className="text-[9px] text-[#94a3b8] font-semibold select-none uppercase tracking-wide" style={{ minWidth: 10 }}>{label}</span>
      <div className="flex items-stretch h-7 border border-[#e2e8f0] rounded-md overflow-hidden focus-within:border-[#4B6BFB] bg-white transition-colors">
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onFocus={e => { setActive(true); e.target.select() }}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'ArrowUp')   { e.preventDefault(); inc() }
            if (e.key === 'ArrowDown') { e.preventDefault(); dec() }
          }}
          style={{ width: w }}
          className="text-[11px] text-center px-1 focus:outline-none bg-transparent"
        />
        <div className="flex flex-col border-l border-[#e2e8f0]">
          <button
            tabIndex={-1}
            onMouseDown={e => { e.preventDefault(); inc() }}
            className="flex-1 flex items-center justify-center w-4 hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#475569] transition-colors"
          >
            <svg width="7" height="5" viewBox="0 0 7 5" fill="none"><polyline points="0.5,4.5 3.5,1 6.5,4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            tabIndex={-1}
            onMouseDown={e => { e.preventDefault(); dec() }}
            className="flex-1 flex items-center justify-center w-4 hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#475569] transition-colors border-t border-[#e2e8f0]"
          >
            <svg width="7" height="5" viewBox="0 0 7 5" fill="none"><polyline points="0.5,0.5 3.5,4 6.5,0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function Swatch({ value, onChange, label, allowTransparent, paletteKey = 'fill' }: {
  value: string; onChange: (v: string) => void; label: string; allowTransparent?: boolean; paletteKey?: string
}) {
  const storageKey            = `rcv_palette_${paletteKey}`
  const [palette, setPalette] = useState<string[]>([])
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey)
      if (s) setPalette(JSON.parse(s))
    } catch {}
  }, [storageKey])

  // Native 'change' fires only when the user commits (closes picker / lifts mouse)
  // React's onChange fires on every drag step — we use native for palette saving
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    function onCommit(e: Event) {
      const color = (e.target as HTMLInputElement).value
      setPalette(prev => {
        const next = [color, ...prev.filter(c => c !== color)].slice(0, 6)
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
        return next
      })
    }
    el.addEventListener('change', onCommit)
    return () => el.removeEventListener('change', onCommit)
  }, [storageKey])

  const isTransp = value === 'transparent' || value === ''

  return (
    <div className="relative flex items-center gap-0.5 flex-shrink-0" title={label}>
      {/* Hidden native color input */}
      <input
        ref={inputRef}
        type="color"
        value={isTransp ? '#ffffff' : value}
        onChange={e => onChange(e.target.value)}
        className="absolute left-0 top-0 opacity-0 cursor-pointer"
        style={{ width: 'calc(100% - 4px)', height: '100%', zIndex: 1 }}
      />

      {/* Visible swatch button */}
      <div className="h-7 px-1.5 flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white hover:border-[#4B6BFB] transition-colors cursor-pointer pointer-events-none">
        <div
          className="w-3.5 h-3.5 rounded border border-black/10 flex-shrink-0"
          style={{
            background: isTransp ? undefined : value,
            backgroundImage: isTransp ? 'repeating-conic-gradient(#ccc 0% 25%,white 0% 50%) 0/8px 8px' : undefined,
          }}
        />
        <span className="text-[10px] text-[#475569] font-medium leading-none">{label}</span>
      </div>

      {/* Palette chips */}
      {palette.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          className="w-5 h-5 rounded flex-shrink-0 transition-all hover:scale-110 active:scale-95"
          style={{
            zIndex: 2,
            background: c,
            boxShadow: value === c ? '0 0 0 2px white, 0 0 0 3px #4B6BFB' : '0 0 0 1px #d1d5db',
          }}
        />
      ))}

      {allowTransparent && (
        <button
          style={{ zIndex: 2 }}
          onClick={e => { e.preventDefault(); onChange('transparent') }}
          title="Sin relleno"
          className={`relative w-5 h-5 flex items-center justify-center rounded border transition-colors ${isTransp ? 'border-[#4B6BFB] bg-[#EEF2FF] text-[#4B6BFB]' : 'border-[#e2e8f0] text-[#94a3b8] hover:border-[#4B6BFB] hover:text-[#4B6BFB]'}`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="5.64" y1="5.64" x2="18.36" y2="18.36"/></svg>
        </button>
      )}
    </div>
  )
}

function AlignmentButtons({ onAlign, showDistribute }: { onAlign: (a: AlignAction) => void; showDistribute: boolean }) {
  return (
    <div className="flex items-center gap-px flex-shrink-0">
      <IcoBtn title="Alinear izquierda" onClick={() => onAlign('align-left')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <line x1="2" y1="1.5" x2="2" y2="14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="3" y="2.5" width="10" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="3" y="6.5" width="6.5" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="3" y="10.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
        </svg>
      </IcoBtn>
      <IcoBtn title="Centrar horizontalmente" onClick={() => onAlign('align-center-h')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="3" y="2.5" width="10" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="4.75" y="6.5" width="6.5" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="4" y="10.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
        </svg>
      </IcoBtn>
      <IcoBtn title="Alinear derecha" onClick={() => onAlign('align-right')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <line x1="14" y1="1.5" x2="14" y2="14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="3" y="2.5" width="10" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="6.5" y="6.5" width="6.5" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="5" y="10.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.85"/>
        </svg>
      </IcoBtn>
      <div className="w-px h-4 bg-[#e8eaed] mx-0.5 flex-shrink-0" />
      <IcoBtn title="Alinear arriba" onClick={() => onAlign('align-top')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <line x1="1.5" y1="2" x2="14.5" y2="2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="2" y="3" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="6" y="3" width="3" height="6.5" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="10" y="3" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.85"/>
        </svg>
      </IcoBtn>
      <IcoBtn title="Centrar verticalmente" onClick={() => onAlign('align-center-v')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="2" y="3" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="6" y="4.75" width="3" height="6.5" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="10" y="4" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.85"/>
        </svg>
      </IcoBtn>
      <IcoBtn title="Alinear abajo" onClick={() => onAlign('align-bottom')}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <line x1="1.5" y1="14" x2="14.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <rect x="2" y="3" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="6" y="6.5" width="3" height="6.5" rx="0.5" fill="currentColor" opacity="0.85"/>
          <rect x="10" y="5" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.85"/>
        </svg>
      </IcoBtn>
      {showDistribute && (
        <>
          <div className="w-px h-4 bg-[#e8eaed] mx-0.5 flex-shrink-0" />
          <IcoBtn title="Distribuir horizontalmente" onClick={() => onAlign('distribute-h')}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="1" y1="3.5" x2="1" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="15" y1="3.5" x2="15" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <rect x="2.5" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.85"/>
              <rect x="6.75" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.85"/>
              <rect x="11" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.85"/>
            </svg>
          </IcoBtn>
          <IcoBtn title="Distribuir verticalmente" onClick={() => onAlign('distribute-v')}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <line x1="3.5" y1="1" x2="12.5" y2="1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="3.5" y1="15" x2="12.5" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <rect x="4" y="2.5" width="8" height="2.5" rx="0.5" fill="currentColor" opacity="0.85"/>
              <rect x="4" y="6.75" width="8" height="2.5" rx="0.5" fill="currentColor" opacity="0.85"/>
              <rect x="4" y="11" width="8" height="2.5" rx="0.5" fill="currentColor" opacity="0.85"/>
            </svg>
          </IcoBtn>
        </>
      )}
    </div>
  )
}

function AlignIcon({ a }: { a: 'left' | 'center' | 'right' | 'justify' }) {
  if (a === 'left')    return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
  if (a === 'center')  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
  if (a === 'right')   return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
  return                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}