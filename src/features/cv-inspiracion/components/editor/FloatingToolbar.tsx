'use client'

import { createPortal } from 'react-dom'
import type { Layer, TextLayer } from '../../types/layer.types'
import type { NodeBounds } from '../canvas/KonvaCanvas'

interface Props {
  layer: Layer | null
  bounds: NodeBounds | null
  onUpdate: (id: string, updates: Partial<Layer>) => void
  onDelete: (id: string) => void
}

export function FloatingToolbar({ layer, bounds, onUpdate, onDelete }: Props) {
  if (!layer || !bounds || typeof document === 'undefined') return null

  const TOOLBAR_H = 40
  const TOOLBAR_W = layer.type === 'text' ? 280 : 120
  const GAP = 8

  // Position above the element; flip below if too close to top
  const top = bounds.screenY - TOOLBAR_H - GAP < 10
    ? bounds.screenY + bounds.height + GAP
    : bounds.screenY - TOOLBAR_H - GAP

  const left = Math.max(8, Math.min(
    bounds.screenX + bounds.width / 2 - TOOLBAR_W / 2,
    window.innerWidth - TOOLBAR_W - 8
  ))

  return createPortal(
    <div
      className="fixed z-[9998] flex items-center gap-0.5 bg-white rounded-xl border border-[#e2e8f0] shadow-xl px-2 py-1.5"
      style={{ top, left, height: TOOLBAR_H, pointerEvents: 'auto' }}
      onMouseDown={e => e.stopPropagation()}
    >
      {layer.type === 'text' && (
        <TextControls layer={layer as TextLayer} onUpdate={onUpdate} />
      )}
      <Sep />
      <ToolBtn
        title="Eliminar elemento"
        onClick={() => onDelete(layer.id)}
        danger
      >
        <TrashIcon />
      </ToolBtn>
    </div>,
    document.body
  )
}

function TextControls({ layer, onUpdate }: { layer: TextLayer; onUpdate: Props['onUpdate'] }) {
  const isBold   = (layer.fontWeight ?? '400') === '700' || (layer.fontWeight ?? '') === 'bold'
  const isItalic = (layer.fontStyle ?? '') === 'italic'

  return (
    <>
      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <ToolBtn title="Reducir tamaño" onClick={() => onUpdate(layer.id, { fontSize: Math.max(6, (layer.fontSize ?? 12) - 1) } as Partial<TextLayer>)}>
          <span className="text-[10px] font-bold">A-</span>
        </ToolBtn>
        <input
          type="number"
          value={Math.round(layer.fontSize ?? 12)}
          min={6}
          max={72}
          onChange={e => onUpdate(layer.id, { fontSize: Number(e.target.value) } as Partial<TextLayer>)}
          className="w-10 text-center text-xs border border-[#e2e8f0] rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-[#4B6BFB]"
        />
        <ToolBtn title="Aumentar tamaño" onClick={() => onUpdate(layer.id, { fontSize: Math.min(72, (layer.fontSize ?? 12) + 1) } as Partial<TextLayer>)}>
          <span className="text-[11px] font-bold">A+</span>
        </ToolBtn>
      </div>

      <Sep />

      {/* Bold / Italic */}
      <ToolBtn
        title="Negrita"
        active={isBold}
        onClick={() => onUpdate(layer.id, { fontWeight: isBold ? '400' : '700' } as Partial<TextLayer>)}
      >
        <span className="font-bold text-sm">B</span>
      </ToolBtn>
      <ToolBtn
        title="Cursiva"
        active={isItalic}
        onClick={() => onUpdate(layer.id, { fontStyle: isItalic ? 'normal' : 'italic' } as Partial<TextLayer>)}
      >
        <span className="italic text-sm">I</span>
      </ToolBtn>

      <Sep />

      {/* Align */}
      <ToolBtn title="Alinear izquierda"  active={layer.align === 'left'}   onClick={() => onUpdate(layer.id, { align: 'left' }   as Partial<TextLayer>)}><AlignLeftIcon /></ToolBtn>
      <ToolBtn title="Centrar"            active={layer.align === 'center'} onClick={() => onUpdate(layer.id, { align: 'center' } as Partial<TextLayer>)}><AlignCenterIcon /></ToolBtn>
      <ToolBtn title="Alinear derecha"    active={layer.align === 'right'}  onClick={() => onUpdate(layer.id, { align: 'right' }  as Partial<TextLayer>)}><AlignRightIcon /></ToolBtn>

      <Sep />

      {/* Color */}
      <div className="relative flex items-center" title="Color de texto">
        <input
          type="color"
          value={layer.fill ?? '#000000'}
          onChange={e => onUpdate(layer.id, { fill: e.target.value } as Partial<TextLayer>)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[#f1f5f9] cursor-pointer">
          <span className="text-xs font-bold" style={{ color: layer.fill ?? '#000' }}>A</span>
          <div className="w-4 h-1.5 rounded-sm border border-gray-200" style={{ background: layer.fill ?? '#000' }} />
        </div>
      </div>
    </>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-[#e2e8f0] mx-0.5 flex-shrink-0" />
}

function ToolBtn({ children, onClick, title, active, danger }: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={[
        'flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-xs flex-shrink-0',
        active  ? 'bg-[#EEF2FF] text-[#4B6BFB]' : '',
        danger  ? 'text-[#94a3b8] hover:bg-red-50 hover:text-red-500' : 'text-[#475569] hover:bg-[#f1f5f9]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" /><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
    </svg>
  )
}
function AlignLeftIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg> }
function AlignCenterIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg> }
function AlignRightIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg> }