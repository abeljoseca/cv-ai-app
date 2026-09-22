'use client'

import { useRef, useState, useMemo } from 'react'
import type { Layer, TextLayer, RectLayer, CircleLayer, LineLayer, ImageLayer, PolygonLayer, StarLayer, PathLayer, FrameLayer } from '../../types/layer.types'
import type { Page } from '../../types/canvas.types'
import { ICONS, ICON_CATEGORIES, iconToDataUrl } from '../../lib/icon-registry'

export type SectionId = 'text' | 'elements' | 'images' | 'icons' | 'layers' | 'pages' | 'variables'

// ── Icon Strip ────────────────────────────────────────────────────────────────

interface StripProps {
  active: SectionId | null
  onToggle: (s: SectionId) => void
  isAdmin?: boolean
}

const BASE_SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Texto', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  { id: 'elements', label: 'Formas', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17.5" cy="6.5" r="3.5"/><polyline points="4,21 8,14 12,21"/><line x1="15" y1="16" x2="22" y2="16"/></svg> },
  { id: 'images', label: 'Imágenes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg> },
  { id: 'icons', label: 'Iconos', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="8.5" x2="22" y2="8.5"/><line x1="2" y1="15.5" x2="22" y2="15.5"/></svg> },
  { id: 'layers', label: 'Capas', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12,2 22,8.5 12,15 2,8.5"/><polyline points="2,15.5 12,22 22,15.5"/><polyline points="2,12 12,18.5 22,12"/></svg> },
  { id: 'pages', label: 'Páginas', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="2" width="13" height="20" rx="1"/><rect x="8" y="5" width="13" height="17" rx="1" fill="white"/><rect x="8" y="5" width="13" height="17" rx="1"/><line x1="11" y1="10" x2="18" y2="10"/><line x1="11" y1="14" x2="18" y2="14"/></svg> },
]

const ADMIN_SECTION: { id: SectionId; label: string; icon: React.ReactNode } = {
  id: 'variables', label: 'Variables',
  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h4l2 10 2-10h4"/><circle cx="19" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="17" r="1" fill="currentColor" stroke="none"/></svg>,
}

export function LeftIconStrip({ active, onToggle, isAdmin }: StripProps) {
  const sections = isAdmin ? [...BASE_SECTIONS, ADMIN_SECTION] : BASE_SECTIONS
  return (
    <div className="flex flex-col items-center pt-2 pb-4 gap-1 flex-shrink-0 border-r border-[#e8eaed] bg-white" style={{ width: 60 }}>
      {sections.map(s => (
        <button
          key={s.id}
          onClick={() => onToggle(s.id)}
          title={s.label}
          className={[
            'flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl transition-all',
            active === s.id ? 'bg-[#EEF2FF] text-[#4B6BFB]' : 'text-[#94a3b8] hover:text-[#475569] hover:bg-[#f8fafc]',
          ].join(' ')}
        >
          {s.icon}
          <span className="text-[9px] font-medium leading-none">{s.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Panel container ───────────────────────────────────────────────────────────

interface PanelProps {
  section: SectionId
  layers: Layer[]
  selectedIds: string[]
  pages: Page[]
  currentPageIdx: number
  canvasWidth: number
  canvasHeight: number
  isAdmin?: boolean
  onAddLayer: (layer: Layer) => void
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void
  onSelect: (id: string | null) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onReorder: (id: string, dir: 'up' | 'down' | 'top' | 'bottom') => void
  onImageUpload: (dataUrl: string) => void
  onAddPage: () => void
  onRemovePage: (idx: number) => void
  onSwitchPage: (idx: number) => void
  onPageBackgroundChange: (color: string) => void
}

function genId() {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function LeftPanel(props: PanelProps) {
  const { section, layers, selectedIds, pages, currentPageIdx, canvasWidth, canvasHeight,
          isAdmin, onAddLayer, onUpdateLayer, onSelect, onToggleVisibility, onToggleLock, onReorder,
          onImageUpload, onAddPage, onRemovePage, onSwitchPage, onPageBackgroundChange } = props
  return (
    <div className="flex flex-col flex-shrink-0 bg-white border-r border-[#e8eaed] overflow-hidden" style={{ width: 240 }}>
      {section === 'text'      && <TextPanel      onAddLayer={onAddLayer} />}
      {section === 'elements'  && <ElementsPanel  onAddLayer={onAddLayer} />}
      {section === 'images'    && <ImagesPanel    layers={layers} onImageUpload={onImageUpload} />}
      {section === 'icons'     && <IconsPanel     onAddLayer={onAddLayer} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />}
      {section === 'layers'    && <LayersPanel    layers={layers} selectedIds={selectedIds} onSelect={onSelect} onToggleVisibility={onToggleVisibility} onToggleLock={onToggleLock} onReorder={onReorder} />}
      {section === 'pages'     && <PagesPanel     pages={pages} currentPageIdx={currentPageIdx} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onAddPage={onAddPage} onRemovePage={onRemovePage} onSwitchPage={onSwitchPage} onPageBackgroundChange={onPageBackgroundChange} />}
      {section === 'variables' && isAdmin && <VariablesPanel layers={layers} selectedIds={selectedIds} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onAddLayer={onAddLayer} onUpdateLayer={onUpdateLayer} />}
    </div>
  )
}

// ── Text Panel ────────────────────────────────────────────────────────────────

function TextPanel({ onAddLayer }: { onAddLayer: (l: Layer) => void }) {
  const presets: { label: string; layer: Partial<TextLayer> }[] = [
    { label: 'Título',      layer: { text: 'Título',       fontSize: 28, fontWeight: '700' } },
    { label: 'Subtítulo',   layer: { text: 'Subtítulo',    fontSize: 18, fontWeight: '600' } },
    { label: 'Cuerpo',      layer: { text: 'Texto cuerpo', fontSize: 12, fontWeight: '400' } },
    { label: 'Pequeño',     layer: { text: 'Texto peq.',   fontSize: 9,  fontWeight: '400' } },
    { label: 'Negrita',     layer: { text: 'Texto negrita',fontSize: 14, fontWeight: '700' } },
    { label: 'Cursiva',     layer: { text: 'Texto cursivo',fontSize: 12, fontStyle: 'italic' } },
  ]

  function addText(p: Partial<TextLayer>) {
    const layer: TextLayer = {
      id: genId(), type: 'text', x: 180, y: 80,
      width: 220, height: 40,
      text: p.text ?? 'Texto', fontSize: p.fontSize ?? 14,
      fontFamily: 'Poppins', fontWeight: p.fontWeight ?? '400',
      fontStyle: p.fontStyle ?? 'normal', fill: '#1A2B4C', align: 'left',
    }
    onAddLayer(layer)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader title="Texto" />
      <div className="p-3 flex flex-col gap-1.5">
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => addText(p.layer)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#e8eaed] hover:border-[#4B6BFB] hover:bg-[#f8faff] transition-all text-left group"
          >
            <span
              className="flex-1 text-[#1A2B4C] truncate"
              style={{ fontSize: Math.min(p.layer.fontSize ?? 14, 15), fontWeight: p.layer.fontWeight ?? 400, fontStyle: p.layer.fontStyle ?? 'normal' }}
            >
              {p.label}
            </span>
            <span className="text-[10px] text-[#c7d2fe] group-hover:text-[#4B6BFB] flex-shrink-0 font-medium">+</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Elements Panel ────────────────────────────────────────────────────────────
// 2 per row, no border, Resumint brand colors

function ElementsPanel({ onAddLayer }: { onAddLayer: (l: Layer) => void }) {
  function rect(fill: string, stroke?: string, sw = 0, cr = 0, w = 140, h = 70) {
    onAddLayer({ id: genId(), type: 'rect', x: 150, y: 100, width: w, height: h, fill, stroke, strokeWidth: sw, cornerRadius: cr } as RectLayer)
  }
  function circle(fill: string, sw = 0) {
    onAddLayer({ id: genId(), type: 'circle', x: 220, y: 160, radius: 40, fill, strokeWidth: sw } as CircleLayer)
  }
  function polygon(sides: number, fill: string) {
    onAddLayer({ id: genId(), type: 'polygon', x: 220, y: 180, sides, radius: 50, fill } as PolygonLayer)
  }
  function star() {
    onAddLayer({ id: genId(), type: 'star', x: 220, y: 180, numPoints: 5, innerRadius: 25, outerRadius: 55, fill: '#F59E0B' } as StarLayer)
  }
  function path(data: string, fill: string, sc = 1.4) {
    onAddLayer({ id: genId(), type: 'path', x: 150, y: 120, data, fill, scaleX: sc, scaleY: sc } as PathLayer)
  }
  function line(stroke: string, sw: number, dash?: number[], endCap?: LineLayer['endCap'], startCap?: LineLayer['startCap'], lineCap?: 'round') {
    onAddLayer({ id: genId(), type: 'line', x: 80, y: 200, points: [0, 0, 280, 0], stroke, strokeWidth: sw, dash, endCap, startCap, lineCap } as LineLayer)
  }

  const RECTS = [
    { title: 'Rectángulo',   svg: <rect x="2" y="6" width="44" height="24" rx="1" fill="#4B6BFB"/>,                                                    onClick: () => rect('#4B6BFB') },
    { title: 'Cuadrado',     svg: <rect x="9" y="3" width="30" height="30" rx="1" fill="#6366f1"/>,                                                    onClick: () => rect('#6366f1', undefined, 0, 0, 90, 90) },
    { title: 'Redondeado',   svg: <rect x="2" y="6" width="44" height="24" rx="10" fill="#10B981"/>,                                                   onClick: () => rect('#10B981', undefined, 0, 10) },
    { title: 'Solo borde',   svg: <rect x="2" y="6" width="44" height="24" rx="1" fill="none" stroke="#4B6BFB" strokeWidth="2.5"/>,                    onClick: () => rect('transparent', '#4B6BFB', 2) },
    { title: 'Con arco',     svg: <path d="M2 30 L2 14 Q24 2 46 14 L46 30 Z" fill="#8B5CF6"/>,                                                        onClick: () => path('M0 100 L0 40 Q50 0 100 40 L100 100 Z', '#8B5CF6') },
  ]
  const SHAPES = [
    { title: 'Círculo',      svg: <circle cx="24" cy="18" r="15" fill="#4B6BFB"/>,                                                                     onClick: () => circle('#4B6BFB') },
    { title: 'Círculo borde',svg: <circle cx="24" cy="18" r="14" fill="none" stroke="#4B6BFB" strokeWidth="2.5"/>,                                    onClick: () => circle('transparent', 2) },
    { title: 'Triángulo',    svg: <polygon points="24,2 46,34 2,34" fill="#10B981"/>,                                                                  onClick: () => polygon(3, '#10B981') },
    { title: 'Triáng. rect.',svg: <polygon points="2,34 2,2 46,34" fill="#F59E0B"/>,                                                                   onClick: () => path('M0 0 L0 100 L100 100 Z', '#F59E0B') },
    { title: 'Rombo',        svg: <polygon points="24,2 46,18 24,34 2,18" fill="#EF4444"/>,                                                            onClick: () => path('M50 0 L100 50 L50 100 L0 50 Z', '#EF4444') },
    { title: 'Pentágono',    svg: <polygon points="24,2 45,15 37,34 11,34 3,15" fill="#EC4899"/>,                                                      onClick: () => polygon(5, '#EC4899') },
    { title: 'Trapecio',     svg: <polygon points="10,3 38,3 46,33 2,33" fill="#0ea5e9"/>,                                                             onClick: () => path('M20 0 L80 0 L100 100 L0 100 Z', '#0ea5e9') },
    { title: 'Estrella',     svg: <polygon points="24,2 28,14 40,14 30,21 33,33 24,26 15,33 18,21 8,14 20,14" fill="#F59E0B"/>,                       onClick: star },
  ]
  const LINES = [
    { title: 'Línea fina',    svg: <line x1="4" y1="18" x2="44" y2="18" stroke="#1A2B4C" strokeWidth="2"/>,                                           onClick: () => line('#1A2B4C', 1.5) },
    { title: 'Línea gruesa',  svg: <line x1="4" y1="18" x2="44" y2="18" stroke="#1A2B4C" strokeWidth="6"/>,                                           onClick: () => line('#1A2B4C', 4) },
    { title: 'Punteada',      svg: <line x1="4" y1="18" x2="44" y2="18" stroke="#1A2B4C" strokeWidth="2" strokeDasharray="5,4"/>,                     onClick: () => line('#1A2B4C', 1.5, [6, 4]) },
    { title: 'Separador',     svg: <line x1="4" y1="18" x2="44" y2="18" stroke="#94a3b8" strokeWidth="1.5"/>,                                         onClick: () => line('#94a3b8', 0.8) },
    { title: 'Flecha →',      svg: <><line x1="4" y1="18" x2="36" y2="18" stroke="#4B6BFB" strokeWidth="2"/><polygon points="33,13 44,18 33,23" fill="#4B6BFB"/></>,  onClick: () => line('#4B6BFB', 1.5, undefined, 'arrow') },
    { title: 'Flecha ←→',     svg: <><line x1="11" y1="18" x2="37" y2="18" stroke="#4B6BFB" strokeWidth="2"/><polygon points="14,13 3,18 14,23" fill="#4B6BFB"/><polygon points="34,13 45,18 34,23" fill="#4B6BFB"/></>,  onClick: () => line('#4B6BFB', 1.5, undefined, 'arrow', 'arrow') },
    { title: 'Punta círculo', svg: <line x1="6" y1="18" x2="42" y2="18" stroke="#8B5CF6" strokeWidth="7" strokeLinecap="round"/>,                    onClick: () => line('#8B5CF6', 6, undefined, undefined, undefined, 'round') },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader title="Formas" />
      <div className="p-3 flex flex-col gap-4">
        <ShapeGroup label="Rectángulos" items={RECTS} />
        <ShapeGroup label="Formas básicas" items={SHAPES} />
        <ShapeGroup label="Líneas" items={LINES} wide />
      </div>
    </div>
  )
}

function ShapeGroup({ label, items, wide = false }: {
  label: string
  items: { title: string; svg: React.ReactNode; onClick: () => void }[]
  wide?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <button
            key={item.title}
            title={item.title}
            onClick={item.onClick}
            className="flex items-center justify-center rounded-xl bg-[#f8fafc] hover:bg-[#eef2ff] transition-all"
            style={{ height: wide ? 44 : 56 }}
          >
            <svg viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: wide ? 84 : 76, height: wide ? 36 : 48 }}>
              {item.svg}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Images Panel ──────────────────────────────────────────────────────────────

function ImagesPanel({ layers, onImageUpload }: {
  layers: Layer[]; onImageUpload: (dataUrl: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const imageLayers = layers.filter(l => l.type === 'image') as ImageLayer[]

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (typeof ev.target?.result === 'string') onImageUpload(ev.target.result) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader title="Imágenes" />
      <div className="p-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-[#c7d2fe] text-[#4B6BFB] text-sm font-medium hover:bg-[#f8faff] hover:border-[#4B6BFB] transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Subir imagen
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {imageLayers.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">En el canvas</p>
            <div className="grid grid-cols-3 gap-1.5">
              {imageLayers.map(l => (
                <div
                  key={l.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('image-src', (l as ImageLayer).src)}
                  className="aspect-square rounded-lg overflow-hidden border border-[#e8eaed] bg-[#f8fafc] cursor-grab active:cursor-grabbing hover:border-[#4B6BFB] transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(l as ImageLayer).src} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-[#cbd5e1] text-center">Sube imágenes para incluirlas en tu CV</p>
        )}
      </div>
    </div>
  )
}

// ── Icons Panel ───────────────────────────────────────────────────────────────
// 4-column grid, icon only (no names), search + category filter

function IconsPanel({ onAddLayer, canvasWidth, canvasHeight }: { onAddLayer: (l: Layer) => void; canvasWidth: number; canvasHeight: number }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Todos')

  const categories = ['Todos', ...ICON_CATEGORIES]

  const filtered = ICONS.filter(icon => {
    const matchSearch = search === '' ||
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.id.toLowerCase().includes(search.toLowerCase())
    const matchCat = cat === 'Todos' || icon.category === cat
    return matchSearch && matchCat
  })

  function addIcon(iconId: string) {
    const icon = ICONS.find(i => i.id === iconId)
    if (!icon) return
    const iconColor = '#1A2B4C'
    const src = iconToDataUrl(icon, iconColor)
    const size = 40
    onAddLayer({ id: genId(), type: 'image',
      x: Math.round(canvasWidth / 2 - size / 2),
      y: Math.round(canvasHeight / 2 - size / 2),
      width: size, height: size, src, iconId, iconColor } as ImageLayer)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader title="Iconos" />
      <div className="p-2.5 border-b border-[#f1f5f9]">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-8 text-xs border border-[#e2e8f0] rounded-lg px-3 focus:outline-none focus:border-[#4B6BFB] transition-colors"
        />
      </div>
      <div className="px-2.5 py-2 flex flex-wrap gap-1 border-b border-[#f1f5f9]">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-colors ${cat === c ? 'bg-[#4B6BFB] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-4 gap-2">
          {filtered.map(icon => (
            <button
              key={icon.id}
              onClick={() => addIcon(icon.id)}
              title={icon.name}
              className="flex items-center justify-center rounded-xl bg-[#f8fafc] hover:bg-[#eef2ff] transition-all group"
              style={{ height: 52 }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#4B6BFB] transition-colors">
                {icon.paths.map((d, i) => <path key={i} d={d} />)}
              </svg>
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-xs text-[#cbd5e1] text-center py-6">Sin resultados</p>}
      </div>
    </div>
  )
}

// ── Layers Panel ──────────────────────────────────────────────────────────────

function typeIcon(type: string): React.ReactNode {
  const map: Record<string, [string, string]> = {
    text:    ['#4B6BFB', 'M4,7v-3h16v3M9,20h6M12,4v16'],
    rect:    ['#10B981', 'M3,3h18v18H3z'],
    line:    ['#64748b', 'M5,19L19,5'],
    polygon: ['#EC4899', 'M12,2l10,7v7l-10,7L2,16V9z'],
    star:    ['#F59E0B', 'M12,2l3,6.27L22,9.27l-5,4.87L18.18,21 12,17.77 5.82,21 7,14.14 2,9.27l6.91-1.01z'],
    path:    ['#0ea5e9', 'M3,20h18L12,4z'],
  }
  if (type === 'circle') return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>
  if (type === 'image')  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21,15 16,10 5,21"/></svg>
  const c = map[type]
  if (!c) return null
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c[0]} strokeWidth="2" strokeLinecap="round"><path d={c[1]}/></svg>
}

function layerLabel(layer: Layer): string {
  if (layer.name) return layer.name
  if (layer.type === 'text') return ((layer as TextLayer).text ?? '').slice(0, 24) || 'Texto'
  const map: Record<string, string> = { rect: 'Rectángulo', circle: 'Círculo', image: 'Imagen', line: 'Línea', polygon: 'Polígono', star: 'Estrella', path: 'Forma' }
  return map[layer.type] ?? layer.type
}

function LayersPanel({ layers, selectedIds, onSelect, onToggleVisibility, onToggleLock, onReorder }: {
  layers: Layer[]; selectedIds: string[]
  onSelect: (id: string | null) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onReorder: (id: string, dir: 'up' | 'down' | 'top' | 'bottom') => void
}) {
  const reversed   = [...layers].reverse()
  const singleSel  = selectedIds.length === 1 ? selectedIds[0] : null
  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Capas" count={layers.length} />
      <div className="flex-1 overflow-y-auto">
        {reversed.length === 0 && <p className="text-xs text-[#cbd5e1] text-center py-8">Sin elementos</p>}
        {reversed.map(layer => {
          const isSel = selectedIds.includes(layer.id)
          const isVis = layer.visible !== false
          const isLkd = !!layer.locked
          return (
            <div
              key={layer.id}
              onClick={() => onSelect(isSel && selectedIds.length === 1 ? null : layer.id)}
              className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-[#f8fafc] transition-colors ${isSel ? 'bg-[#EEF2FF]' : 'hover:bg-[#f8fafc]'}`}
            >
              <span className="flex-shrink-0">{typeIcon(layer.type)}</span>
              <span className={`flex-1 min-w-0 text-xs truncate ${isSel ? 'text-[#4B6BFB] font-medium' : 'text-[#334155]'} ${!isVis ? 'opacity-40' : ''}`}>
                {layerLabel(layer)}
              </span>
              <div className={`flex items-center gap-0.5 ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <SmBtn title={isVis ? 'Ocultar' : 'Mostrar'} onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id) }} active={!isVis}>
                  {isVis
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </SmBtn>
                <SmBtn title={isLkd ? 'Desbloquear' : 'Bloquear'} onClick={e => { e.stopPropagation(); onToggleLock(layer.id) }} active={isLkd} activeColor="text-[#f59e0b]">
                  {isLkd
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  }
                </SmBtn>
              </div>
            </div>
          )
        })}
      </div>
      {singleSel && (
        <div className="border-t border-[#e8eaed] p-2 flex items-center gap-1">
          <span className="text-[10px] text-[#94a3b8] mr-auto">Orden Z</span>
          {(['top','up','down','bottom'] as const).map(dir => (
            <button key={dir} title={dir === 'top' ? 'Frente' : dir === 'bottom' ? 'Fondo' : dir === 'up' ? 'Subir' : 'Bajar'}
              onClick={() => onReorder(singleSel, dir)}
              className="w-7 h-7 text-xs flex items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#4B6BFB] transition-colors font-medium">
              {dir === 'top' ? '↑↑' : dir === 'up' ? '↑' : dir === 'down' ? '↓' : '↓↓'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pages Panel ───────────────────────────────────────────────────────────────

function PageColorSwatch({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <div className="relative flex-shrink-0" title="Color de fondo">
      <input
        type="color"
        value={!color || color === 'transparent' ? '#ffffff' : color}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        style={{ zIndex: 1 }}
        onClick={e => e.stopPropagation()}
      />
      <div
        className="w-5 h-5 rounded border border-black/15 shadow-sm pointer-events-none"
        style={{ background: color || '#ffffff' }}
      />
    </div>
  )
}

function PagesPanel({ pages, currentPageIdx, canvasWidth, canvasHeight, onAddPage, onRemovePage, onSwitchPage, onPageBackgroundChange }: {
  pages: Page[]; currentPageIdx: number; canvasWidth: number; canvasHeight: number
  onAddPage: () => void; onRemovePage: (idx: number) => void; onSwitchPage: (idx: number) => void
  onPageBackgroundChange: (color: string) => void
}) {
  const thumbH = Math.round(196 * (canvasHeight / canvasWidth))
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader title="Páginas" count={pages.length} />
      <div className="p-3 flex flex-col gap-3">
        {pages.map((page, idx) => (
          <div key={page.id} onClick={() => onSwitchPage(idx)} className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${idx === currentPageIdx ? 'border-[#4B6BFB] shadow-md shadow-[#4B6BFB]/10' : 'border-transparent hover:border-[#c7d2fe]'}`}>
            <div
              className="relative flex items-center justify-center"
              style={{ height: thumbH, background: page.backgroundColor || '#ffffff' }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="flex flex-col gap-1.5 w-2/3">
                  {[100, 80, 90, 60, 85, 70].map((w, i) => <div key={i} className="h-1 bg-slate-400 rounded" style={{ width: `${w}%` }} />)}
                </div>
              </div>
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                {idx === currentPageIdx && (
                  <PageColorSwatch color={page.backgroundColor || '#ffffff'} onChange={onPageBackgroundChange} />
                )}
                {pages.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); onRemovePage(idx) }}
                    className="w-5 h-5 flex items-center justify-center bg-white/90 rounded-full border border-[#e2e8f0] text-[#94a3b8] hover:text-red-500 hover:border-red-300 transition-colors text-sm leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className={`px-2 py-1.5 text-center text-[11px] font-medium ${idx === currentPageIdx ? 'bg-[#EEF2FF] text-[#4B6BFB]' : 'bg-[#f8fafc] text-[#475569]'}`}>
              {page.name ?? `Página ${idx + 1}`}
            </div>
          </div>
        ))}
        <button onClick={onAddPage} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#c7d2fe] text-[#4B6BFB] text-xs font-medium hover:bg-[#f8faff] hover:border-[#4B6BFB] transition-all">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar página
        </button>
      </div>
    </div>
  )
}

// ── Frames Panel ─────────────────────────────────────────────────────────────

function FramesPanel({ onAddLayer }: { onAddLayer: (l: Layer) => void }) {
  const FRAMES: { title: string; shape: FrameLayer['shape']; w: number; h: number; cr?: number; preview: React.ReactNode }[] = [
    {
      title: 'Rectángulo',
      shape: 'rect', w: 200, h: 140,
      preview: <rect x="4" y="8" width="40" height="28" rx="2" fill="#EEF2FF" stroke="#4B6BFB" strokeWidth="2"/>,
    },
    {
      title: 'Cuadrado',
      shape: 'rect', w: 160, h: 160, cr: 0,
      preview: <rect x="9" y="3" width="30" height="30" rx="2" fill="#EEF2FF" stroke="#4B6BFB" strokeWidth="2"/>,
    },
    {
      title: 'Círculo',
      shape: 'circle', w: 160, h: 160,
      preview: <circle cx="24" cy="18" r="14" fill="#EEF2FF" stroke="#4B6BFB" strokeWidth="2"/>,
    },
    {
      title: 'Pentágono',
      shape: 'pentagon', w: 160, h: 160,
      preview: <polygon points="24,3 44,16 37,34 11,34 4,16" fill="#EEF2FF" stroke="#4B6BFB" strokeWidth="2"/>,
    },
  ]

  function addFrame(f: typeof FRAMES[number]) {
    const layer: FrameLayer = {
      id: genId(), type: 'frame',
      shape: f.shape,
      x: 200, y: 120,
      width: f.w, height: f.h,
      cornerRadius: f.cr,
      stroke: '#4B6BFB', strokeWidth: 2,
    }
    onAddLayer(layer)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <PanelHeader title="Marcos" />
      <div className="p-3">
        <p className="text-[10px] text-[#94a3b8] mb-3 leading-relaxed">
          Añade un marco y arrastra una imagen encima para recortarla con esa forma.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FRAMES.map(f => (
            <button
              key={f.title}
              title={f.title}
              onClick={() => addFrame(f)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#f8fafc] hover:bg-[#eef2ff] transition-all"
            >
              <svg viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 76, height: 48 }}>
                {f.preview}
              </svg>
              <span className="text-[10px] text-[#475569] font-medium">{f.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Variables Panel (admin only) ──────────────────────────────────────────────

function expGroup(n: number) {
  const p = `USUARIO_EXP${n}_`
  return { group: `Experiencia ${n}`, expandable: true, expandKey: 'exp', vars: [
    { key: `${p}EMPRESA`,   label: 'Empresa' },
    { key: `${p}CARGO`,     label: 'Cargo' },
    { key: `${p}FECHAS`,    label: 'Fechas' },
    { key: `${p}FECHA_FIN`, label: 'Fecha fin' },
    { key: `${p}DESC1`,     label: 'Descripción 1' },
    { key: `${p}DESC2`,     label: 'Descripción 2' },
    { key: `${p}DESC3`,     label: 'Descripción 3' },
  ]}
}
function eduGroup(n: number) {
  const p = `USUARIO_EDU${n}_`
  return { group: `Educación ${n}`, expandable: true, expandKey: 'edu', vars: [
    { key: `${p}INSTITUCION`, label: 'Institución' },
    { key: `${p}TITULO`,      label: 'Título' },
    { key: `${p}FECHAS`,      label: 'Fechas' },
  ]}
}


const PLUS_ICON = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

function VariablesPanel({ layers, selectedIds, canvasWidth, canvasHeight, onAddLayer, onUpdateLayer }: {
  layers: Layer[]
  selectedIds: string[]
  canvasWidth: number
  canvasHeight: number
  onAddLayer: (l: Layer) => void
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void
}) {
  const [extraExp,    setExtraExp]    = useState(0)
  const [extraEdu,    setExtraEdu]    = useState(0)
  const [extraIdioma, setExtraIdioma] = useState(0)
  const [extraLogro,  setExtraLogro]  = useState(0)

  const selId          = selectedIds.length === 1 ? selectedIds[0] : null
  const selectedLayer  = selId ? layers.find(l => l.id === selId) : null
  const isTextSelected = selectedLayer?.type === 'text'

  const usedKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const layer of layers) {
      if (layer.type === 'text') {
        const t = layer as TextLayer
        if (t.text && /^USUARIO_/.test(t.text)) keys.add(t.text)
      }
      if (layer.type === 'frame') {
        const f = layer as FrameLayer
        if (f.imageSrc && /^USUARIO_/.test(f.imageSrc)) keys.add(f.imageSrc)
      }
    }
    return keys
  }, [layers])

  const groups = [
    { group: 'Perfil', vars: [
      { key: 'USUARIO_NOMBRE',    label: 'Nombre' },
      { key: 'USUARIO_APELLIDO',  label: 'Apellido' },
      { key: 'USUARIO_PROFESION', label: 'Profesión' },
      { key: 'USUARIO_EMAIL',     label: 'Email' },
      { key: 'USUARIO_TELEFONO',  label: 'Teléfono' },
      { key: 'USUARIO_CIUDAD',    label: 'Ciudad' },
      { key: 'USUARIO_PAIS',      label: 'País' },
      { key: 'USUARIO_RESUMEN',   label: 'Resumen profesional' },
      { key: 'USUARIO_FOTO',      label: 'Foto (marco imagen)' },
    ]},
    ...Array.from({ length: 3 + extraExp }, (_, i) => expGroup(i + 1)),
    ...Array.from({ length: 2 + extraEdu }, (_, i) => eduGroup(i + 1)),
    { group: 'Habilidades (todas)', vars: Array.from({ length: 6 }, (_, i) => ({ key: `USUARIO_HABILIDAD_${i + 1}`, label: `Habilidad ${i + 1}` })) },
    { group: 'Habilidades técnicas', vars: Array.from({ length: 6 }, (_, i) => ({ key: `USUARIO_HABILIDAD_TECNICA_${i + 1}`, label: `Técnica ${i + 1}` })) },
    { group: 'Habilidades blandas',  vars: Array.from({ length: 6 }, (_, i) => ({ key: `USUARIO_HABILIDAD_BLANDA_${i + 1}`,  label: `Blanda ${i + 1}` })) },
    { group: 'Idiomas', vars: Array.from({ length: 3 + extraIdioma }, (_, i) => ({ key: `USUARIO_IDIOMA_${i + 1}`, label: `Idioma ${i + 1}` })) },
    { group: 'Logros',  vars: Array.from({ length: 4 + extraLogro  }, (_, i) => ({ key: `USUARIO_LOGRO_${i + 1}`,  label: `Logro ${i + 1}` })) },
  ]

  function applyVariable(key: string) {
    const cx = Math.round(canvasWidth  / 2)
    const cy = Math.round(canvasHeight / 2)
    if (key === 'USUARIO_FOTO') {
      const size = 80
      onAddLayer({ id: genId(), type: 'frame', shape: 'circle',
        x: cx - size / 2, y: cy - size / 2, width: size, height: size,
        imageSrc: key, stroke: '#4B6BFB', strokeWidth: 2,
      } as FrameLayer)
      return
    }
    if (isTextSelected && selId) {
      onUpdateLayer(selId, { text: key } as Partial<TextLayer>)
    } else {
      const w = 220
      onAddLayer({ id: genId(), type: 'text',
        x: cx - w / 2, y: cy - 12, width: w, height: 24,
        text: key, fontSize: 12,
        fontFamily: 'Poppins', fontWeight: '400',
        fontStyle: 'normal', fill: '#1A2B4C', align: 'left',
      } as TextLayer)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader title="Variables de plantilla" />

      <div className={`mx-3 mt-3 mb-1 px-3 py-2 rounded-lg text-[10px] leading-relaxed flex-shrink-0 ${isTextSelected ? 'bg-[#EEF2FF] text-[#4B6BFB]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
        {isTextSelected
          ? <>Capa seleccionada — clic para <strong>asignar variable</strong></>
          : <>Sin selección — clic para <strong>crear nueva capa</strong></>
        }
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map(group => (
          <div key={group.group} className="mt-3">
            <p className="text-[9px] font-semibold text-[#94a3b8] uppercase tracking-widest mb-1.5 px-1">{group.group}</p>
            <div className="flex flex-col gap-0.5">
              {group.vars.map(v => {
                const used = usedKeys.has(v.key)
                return (
                <button
                  key={v.key}
                  onClick={() => !used && applyVariable(v.key)}
                  disabled={used}
                  title={used ? 'Ya está en el canvas' : undefined}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left ${used ? 'opacity-35 cursor-not-allowed' : 'hover:bg-[#EEF2FF] group cursor-pointer'}`}
                >
                  <span className={`text-[11px] font-medium truncate ${used ? 'text-[#94a3b8]' : 'text-[#475569] group-hover:text-[#4B6BFB]'}`}>{v.label}</span>
                  <span className={`text-[9px] font-mono ml-2 flex-shrink-0 truncate max-w-[100px] ${used ? 'text-[#c7d2fe]' : 'text-[#94a3b8] group-hover:text-[#4B6BFB]/70'}`}>{v.key}</span>
                </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-4 flex flex-col gap-1.5">
          <button onClick={() => setExtraExp(n => n + 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#c7d2fe] text-[#4B6BFB] text-[11px] font-medium hover:bg-[#f8faff] transition-colors">
            {PLUS_ICON} Añadir Experiencia {4 + extraExp}
          </button>
          <button onClick={() => setExtraEdu(n => n + 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#c7d2fe] text-[#4B6BFB] text-[11px] font-medium hover:bg-[#f8faff] transition-colors">
            {PLUS_ICON} Añadir Educación {3 + extraEdu}
          </button>
          <button onClick={() => setExtraIdioma(n => n + 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#c7d2fe] text-[#4B6BFB] text-[11px] font-medium hover:bg-[#f8faff] transition-colors">
            {PLUS_ICON} Añadir Idioma {4 + extraIdioma}
          </button>
          <button onClick={() => setExtraLogro(n => n + 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#c7d2fe] text-[#4B6BFB] text-[11px] font-medium hover:bg-[#f8faff] transition-colors">
            {PLUS_ICON} Añadir Logro {5 + extraLogro}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function PanelHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="px-4 py-3 border-b border-[#f1f5f9] flex items-center gap-2 flex-shrink-0">
      <span className="text-sm font-semibold text-[#1A2B4C]">{title}</span>
      {count != null && <span className="text-xs text-[#94a3b8]">({count})</span>}
    </div>
  )
}

function SmBtn({ children, onClick, title, active, activeColor }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title?: string; active?: boolean; activeColor?: string
}) {
  return (
    <button title={title} onClick={onClick}
      className={['w-5 h-5 flex items-center justify-center rounded transition-colors',
        active ? (activeColor ?? 'text-[#4B6BFB]') + ' bg-[#EEF2FF]' : 'text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9]',
      ].join(' ')}>
      {children}
    </button>
  )
}