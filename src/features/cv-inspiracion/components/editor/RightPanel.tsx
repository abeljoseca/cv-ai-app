'use client'

import type { Layer, TextLayer, RectLayer, CircleLayer, LineLayer } from '../../types/layer.types'

const FONTS = [
  'Poppins', 'Inter', 'Roboto', 'Montserrat', 'Lato',
  'Open Sans', 'Raleway', 'Oswald', 'Nunito', 'Ubuntu',
  'Playfair Display', 'Merriweather', 'Georgia', 'Arial',
  'Times New Roman', 'Courier New',
]

interface Props {
  layer: Layer | null
  onUpdate: (id: string, updates: Partial<Layer>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function RightPanel({ layer, onUpdate, onDelete, onDuplicate }: Props) {
  if (!layer) {
    return (
      <div className="w-56 border-l border-[#e2e8f0] bg-white flex flex-col flex-shrink-0">
        <div className="px-3 py-2 border-b border-[#e2e8f0]">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Propiedades</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
            Selecciona un elemento en el canvas para editar sus propiedades
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-56 border-l border-[#e2e8f0] bg-white flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#e2e8f0] sticky top-0 bg-white z-10 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Propiedades</p>
          <p className="text-xs font-medium text-[#334155] truncate mt-0.5">{layer.name ?? `${layer.type}`}</p>
        </div>
        {/* Quick actions */}
        <button
          title="Duplicar (Ctrl+D)"
          onClick={() => onDuplicate(layer.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button
          title="Eliminar (Delete)"
          onClick={() => onDelete(layer.id)}
          disabled={!!layer.locked}
          className="w-6 h-6 flex items-center justify-center rounded text-[#94a3b8] hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
          </svg>
        </button>
      </div>

      <div className="p-3 flex flex-col gap-4 pb-8">
        {/* Type-specific properties */}
        {layer.type === 'text' && (
          <TextSection layer={layer as TextLayer} onUpdate={onUpdate} />
        )}
        {layer.type === 'rect' && (
          <ShapeSection layer={layer as RectLayer} onUpdate={onUpdate} />
        )}
        {layer.type === 'circle' && (
          <CircleSection layer={layer as CircleLayer} onUpdate={onUpdate} />
        )}
        {layer.type === 'line' && (
          <LineSection layer={layer as LineLayer} onUpdate={onUpdate} />
        )}

        {/* Position & Size */}
        <PositionSection layer={layer} onUpdate={onUpdate} />

        {/* Opacity */}
        <OpacitySection layer={layer} onUpdate={onUpdate} />
      </div>
    </div>
  )
}

function TextSection({ layer, onUpdate }: { layer: TextLayer; onUpdate: Props['onUpdate'] }) {
  const isBold   = layer.fontWeight === '700' || layer.fontWeight === 'bold'
  const isItalic = layer.fontStyle === 'italic'

  return (
    <div>
      <SectionTitle>Texto</SectionTitle>

      <textarea
        rows={3}
        value={layer.text}
        onChange={e => onUpdate(layer.id, { text: e.target.value } as Partial<TextLayer>)}
        className="w-full text-xs border border-[#e2e8f0] rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#4B6BFB]/40 focus:border-[#4B6BFB] transition-shadow"
        placeholder="Contenido del texto…"
      />

      {/* Font family */}
      <div className="mt-2">
        <FieldLabel>Fuente</FieldLabel>
        <select
          value={layer.fontFamily ?? 'Poppins'}
          onChange={e => onUpdate(layer.id, { fontFamily: e.target.value } as Partial<TextLayer>)}
          className="w-full text-xs border border-[#e2e8f0] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4B6BFB]/40 bg-white"
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Size + Color */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <FieldLabel>Tamaño</FieldLabel>
          <NumberInput
            value={layer.fontSize ?? 12}
            min={6} max={120}
            onChange={v => onUpdate(layer.id, { fontSize: v } as Partial<TextLayer>)}
          />
        </div>
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorInput
            value={layer.fill ?? '#000000'}
            onChange={v => onUpdate(layer.id, { fill: v } as Partial<TextLayer>)}
          />
        </div>
      </div>

      {/* Style toggles */}
      <div className="flex items-center gap-1 mt-2">
        <StyleBtn active={isBold} onClick={() => onUpdate(layer.id, { fontWeight: isBold ? '400' : '700' } as Partial<TextLayer>)}>
          <span className="font-bold text-xs">B</span>
        </StyleBtn>
        <StyleBtn active={isItalic} onClick={() => onUpdate(layer.id, { fontStyle: isItalic ? 'normal' : 'italic' } as Partial<TextLayer>)}>
          <span className="italic text-xs">I</span>
        </StyleBtn>
        <div className="w-px h-4 bg-[#e2e8f0] mx-0.5" />
        {(['left', 'center', 'right'] as const).map(a => (
          <StyleBtn key={a} active={layer.align === a} onClick={() => onUpdate(layer.id, { align: a } as Partial<TextLayer>)}>
            <AlignIcon align={a} />
          </StyleBtn>
        ))}
      </div>

      {/* Line height + Letter spacing */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <FieldLabel>Interlineado</FieldLabel>
          <NumberInput
            value={layer.lineHeight ?? 1.2}
            min={0.5} max={4} step={0.1}
            onChange={v => onUpdate(layer.id, { lineHeight: v } as Partial<TextLayer>)}
          />
        </div>
        <div>
          <FieldLabel>Espaciado</FieldLabel>
          <NumberInput
            value={layer.letterSpacing ?? 0}
            min={-5} max={20} step={0.5}
            onChange={v => onUpdate(layer.id, { letterSpacing: v } as Partial<TextLayer>)}
          />
        </div>
      </div>
    </div>
  )
}

function ShapeSection({ layer, onUpdate }: { layer: RectLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <div>
      <SectionTitle>Forma</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Relleno</FieldLabel>
          <ColorInput
            value={layer.fill ?? '#4B6BFB'}
            onChange={v => onUpdate(layer.id, { fill: v } as Partial<RectLayer>)}
            allowTransparent
          />
        </div>
        <div>
          <FieldLabel>Borde</FieldLabel>
          <ColorInput
            value={layer.stroke ?? '#4B6BFB'}
            onChange={v => onUpdate(layer.id, { stroke: v } as Partial<RectLayer>)}
            allowTransparent
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <FieldLabel>Grosor borde</FieldLabel>
          <NumberInput
            value={layer.strokeWidth ?? 0}
            min={0} max={20}
            onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<RectLayer>)}
          />
        </div>
        <div>
          <FieldLabel>Radio esquinas</FieldLabel>
          <NumberInput
            value={layer.cornerRadius ?? 0}
            min={0} max={100}
            onChange={v => onUpdate(layer.id, { cornerRadius: v } as Partial<RectLayer>)}
          />
        </div>
      </div>
    </div>
  )
}

function CircleSection({ layer, onUpdate }: { layer: CircleLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <div>
      <SectionTitle>Círculo</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Relleno</FieldLabel>
          <ColorInput
            value={layer.fill ?? '#4B6BFB'}
            onChange={v => onUpdate(layer.id, { fill: v } as Partial<CircleLayer>)}
            allowTransparent
          />
        </div>
        <div>
          <FieldLabel>Borde</FieldLabel>
          <ColorInput
            value={layer.stroke ?? '#4B6BFB'}
            onChange={v => onUpdate(layer.id, { stroke: v } as Partial<CircleLayer>)}
            allowTransparent
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <FieldLabel>Radio</FieldLabel>
          <NumberInput
            value={layer.radius}
            min={4} max={500}
            onChange={v => onUpdate(layer.id, { radius: v } as Partial<CircleLayer>)}
          />
        </div>
        <div>
          <FieldLabel>Grosor borde</FieldLabel>
          <NumberInput
            value={layer.strokeWidth ?? 0}
            min={0} max={20}
            onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<CircleLayer>)}
          />
        </div>
      </div>
    </div>
  )
}

function LineSection({ layer, onUpdate }: { layer: LineLayer; onUpdate: Props['onUpdate'] }) {
  return (
    <div>
      <SectionTitle>Línea</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorInput
            value={layer.stroke ?? '#1A2B4C'}
            onChange={v => onUpdate(layer.id, { stroke: v } as Partial<LineLayer>)}
          />
        </div>
        <div>
          <FieldLabel>Grosor</FieldLabel>
          <NumberInput
            value={layer.strokeWidth ?? 1}
            min={0.5} max={20} step={0.5}
            onChange={v => onUpdate(layer.id, { strokeWidth: v } as Partial<LineLayer>)}
          />
        </div>
      </div>
    </div>
  )
}

function PositionSection({ layer, onUpdate }: { layer: Layer; onUpdate: Props['onUpdate'] }) {
  const hasSize = layer.type !== 'circle' && layer.type !== 'line'

  return (
    <div>
      <SectionTitle>Posición</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>X</FieldLabel>
          <NumberInput value={layer.x} onChange={v => onUpdate(layer.id, { x: v })} />
        </div>
        <div>
          <FieldLabel>Y</FieldLabel>
          <NumberInput value={layer.y} onChange={v => onUpdate(layer.id, { y: v })} />
        </div>
      </div>
      {hasSize && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <FieldLabel>Ancho</FieldLabel>
            <NumberInput
              value={layer.width ?? 0}
              min={4}
              onChange={v => onUpdate(layer.id, { width: v })}
            />
          </div>
          <div>
            <FieldLabel>Alto</FieldLabel>
            <NumberInput
              value={layer.height ?? 0}
              min={4}
              onChange={v => onUpdate(layer.id, { height: v })}
            />
          </div>
        </div>
      )}
      {layer.type !== 'line' && (
        <div className="mt-2">
          <FieldLabel>Rotación (°)</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-180}
              max={180}
              value={layer.rotation ?? 0}
              onChange={e => onUpdate(layer.id, { rotation: Number(e.target.value) })}
              className="flex-1 accent-[#4B6BFB]"
            />
            <NumberInput
              value={layer.rotation ?? 0}
              min={-360} max={360}
              onChange={v => onUpdate(layer.id, { rotation: v })}
              className="w-14"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function OpacitySection({ layer, onUpdate }: { layer: Layer; onUpdate: Props['onUpdate'] }) {
  const pct = Math.round((layer.opacity ?? 1) * 100)
  return (
    <div>
      <div className="flex items-center mb-1.5">
        <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Opacidad</span>
        <span className="ml-auto text-[10px] text-[#94a3b8]">{pct}%</span>
      </div>
      <input
        type="range"
        min={0} max={100}
        value={pct}
        onChange={e => onUpdate(layer.id, { opacity: Number(e.target.value) / 100 })}
        className="w-full accent-[#4B6BFB]"
      />
    </div>
  )
}

// ---- Primitives ----

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">{children}</div>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] text-[#94a3b8] mb-1">{children}</label>
}

function NumberInput({ value, min, max, step = 1, onChange, className }: {
  value: number; min?: number; max?: number; step?: number
  onChange: (v: number) => void; className?: string
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
      min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className={`w-full text-xs border border-[#e2e8f0] rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4B6BFB]/40 focus:border-[#4B6BFB] transition-shadow ${className ?? ''}`}
    />
  )
}

function ColorInput({ value, onChange, allowTransparent }: {
  value: string; onChange: (v: string) => void; allowTransparent?: boolean
}) {
  const isTransparent = value === 'transparent' || value === ''
  return (
    <div className="flex items-center gap-1">
      <div className="relative flex-1">
        <input
          type="color"
          value={isTransparent ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div
          className="h-[28px] rounded-md border border-[#e2e8f0] flex items-center px-2 gap-1.5 cursor-pointer hover:border-[#cbd5e1] transition-colors"
        >
          <div
            className="w-4 h-4 rounded-sm border border-black/10 flex-shrink-0"
            style={{ background: isTransparent ? 'transparent' : value, backgroundImage: isTransparent ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0/8px 8px' : undefined }}
          />
          <span className="text-[10px] text-[#475569] font-mono uppercase truncate">
            {isTransparent ? 'Transp.' : value}
          </span>
        </div>
      </div>
      {allowTransparent && (
        <button
          title="Transparente"
          onClick={() => onChange('transparent')}
          className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${isTransparent ? 'border-[#4B6BFB] bg-[#EEF2FF] text-[#4B6BFB]' : 'border-[#e2e8f0] text-[#94a3b8] hover:text-[#475569]'}`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
      )}
    </div>
  )
}

function StyleBtn({ children, active, onClick }: {
  children: React.ReactNode; active?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
        active ? 'bg-[#EEF2FF] text-[#4B6BFB]' : 'text-[#64748b] hover:bg-[#f1f5f9]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function AlignIcon({ align }: { align: 'left' | 'center' | 'right' }) {
  if (align === 'left')   return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
  if (align === 'center') return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
  return                         <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
}