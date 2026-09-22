'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { TopBar } from './TopBar'
import { CanvasArea } from './CanvasArea'
import { ContextBar } from './ContextBar'
import { LeftIconStrip, LeftPanel } from './LeftPanel'
import type { SectionId } from './LeftPanel'
import { useCanvas } from '../../hooks/useCanvas'
import { useHistory } from '../../hooks/useHistory'
import { useSelection } from '../../hooks/useSelection'
import { useExport } from '../../hooks/useExport'
import { getLayerById, reorderLayer as reorderLayerFn } from '../../lib/konva-utils'
import { parseSVGToLayers } from '../../lib/svg-importer'
import { injectDataIntoCanvasState } from '../../lib/data-injector'
import { updateCanvasState } from '../../lib/supabase-cv-service'
import { defaultGuides } from '../../lib/canvas-serializer'
import { alignLayers } from '../../lib/align-utils'
import type { AlignAction } from '../../lib/align-utils'
import type { GuidesState } from '../../types/canvas.types'
import { useProfile } from '@/contexts/ProfileContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { ExportTemplateModal } from './ExportTemplateModal'
import { SaveTemplateModal } from './SaveTemplateModal'
import PaymentModal from '@/components/PaymentModal'
import type { CanvasState } from '../../types/canvas.types'
import type { Layer, FrameLayer } from '../../types/layer.types'
import type { TemplateDataMarkers } from '../../types/template.types'
import type { NodeBounds } from '../canvas/KonvaCanvas'

interface Props {
  cvId: string
  initialState: CanvasState
  userData: TemplateDataMarkers
  sourceTemplateId?: string
}

function genId() {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function EditorContainer({ cvId, initialState, userData, sourceTemplateId }: Props) {
  const hydratedState = useMemo(
    () => injectDataIntoCanvasState(initialState, userData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { state, updateLayer, addLayer, addLayers, removeLayer, removeLayers, reorderLayers, replaceState, addPage, switchPage, removePage, updatePageBackground } = useCanvas(hydratedState)
  const { profile } = useProfile()
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { selectedIds, selectedId, select, toggleSelect, selectMany } = useSelection()
  const [isSaving, setIsSaving]           = useState(false)
  const [scale, setScale]                 = useState(1.0)
  const [, setNodeBounds]                 = useState<NodeBounds | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId | null>('layers')
  const [clipboard, setClipboard]           = useState<Layer | null>(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [showExportModal, setShowExportModal]             = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [showInspPayment, setShowInspPayment]             = useState(false)
  const [savedTemplateId, setSavedTemplateId]       = useState<string | undefined>(sourceTemplateId)
  const [guides, setGuides] = useState<GuidesState>(initialState.guides ?? defaultGuides)

  const { push: pushHistory, undo, redo, canUndo, canRedo } = useHistory(replaceState)
  const { exportToPDF, isExporting } = useExport(state.templateId)

  useEffect(() => {
    pushHistory(hydratedState, 'initial')
    const vh = window.innerHeight - 52 - 46
    setScale(Math.min(1.0, (vh / 842.25) * 0.94))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); return }

      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        const cx = state.canvasWidth  / 2
        const cy = state.canvasHeight / 2
        setGuides(g => {
          const hasV = g.vertical.some(v   => Math.abs(v - cx) < 1)
          const hasH = g.horizontal.some(h => Math.abs(h - cy) < 1)
          return {
            ...g,
            vertical:   hasV ? g.vertical.filter(v   => Math.abs(v - cx) >= 1) : [...g.vertical, cx],
            horizontal: hasH ? g.horizontal.filter(h => Math.abs(h - cy) >= 1) : [...g.horizontal, cy],
          }
        })
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
        const layer = getLayerById(state.layers, selectedId)
        if (layer) setClipboard(layer)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        const id   = genId()
        const copy = { ...clipboard, id, x: clipboard.x + 16, y: clipboard.y + 16, locked: false } as Layer
        addLayer(copy)
        pushHistory({ ...state, layers: [...state.layers, copy] }, 'paste')
        select(id)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedIds.length > 0) {
        e.preventDefault()
        handleDuplicateMany(selectedIds)
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const toDelete = selectedIds.filter(id => !getLayerById(state.layers, id)?.locked)
        if (toDelete.length > 0) {
          removeLayers(toDelete)
          pushHistory({ ...state, layers: state.layers.filter(l => !toDelete.includes(l.id)) }, 'delete')
          select(null)
          setNodeBounds(null)
        }
        return
      }

      if (e.key === 'Escape') { select(null); return }

      if (e.shiftKey && e.key === 'R') { e.preventDefault(); setGuides(g => ({ ...g, visible: !g.visible })); return }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
        for (const sid of selectedIds) {
          const layer = getLayerById(state.layers, sid)
          if (!layer || layer.locked) continue
          handleLayerChange(sid, { x: layer.x + dx, y: layer.y + dy })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, selectedId, state, undo, redo, clipboard])

  const handleLayerChange = useCallback((id: string, updates: Partial<Layer>) => {
    updateLayer(id, updates)
    pushHistory(
      { ...state, layers: state.layers.map(l => l.id === id ? { ...l, ...updates } as Layer : l) },
      'edit'
    )
  }, [updateLayer, pushHistory, state])

  const handleDelete = useCallback((id: string) => {
    const layer = getLayerById(state.layers, id)
    if (layer?.locked) return
    removeLayer(id)
    select(null)
    setNodeBounds(null)
  }, [state, removeLayer, select])

  const handleDuplicate = useCallback((id: string) => {
    const original = getLayerById(state.layers, id)
    if (!original) return
    const newId = genId()
    const copy  = { ...original, id: newId, x: original.x + 12, y: original.y + 12, locked: false } as Layer
    addLayer(copy)
    pushHistory({ ...state, layers: [...state.layers, copy] }, 'duplicate')
    select(newId)
  }, [state, addLayer, pushHistory, select])

  const handleDuplicateMany = useCallback((ids: string[]) => {
    const copies: Layer[] = []
    const newIds: string[] = []
    for (const id of ids) {
      const original = getLayerById(state.layers, id)
      if (!original) continue
      const newId = genId()
      copies.push({ ...original, id: newId, x: original.x + 12, y: original.y + 12, locked: false } as Layer)
      newIds.push(newId)
    }
    if (copies.length === 0) return
    addLayers(copies)
    pushHistory({ ...state, layers: [...state.layers, ...copies] }, 'duplicate')
    selectMany(newIds)
  }, [state, addLayers, pushHistory, selectMany])

  const handleReorder = useCallback((id: string, dir: 'up' | 'down' | 'top' | 'bottom') => {
    const nextLayers = reorderLayerFn(state.layers, id, dir)
    reorderLayers(id, dir)
    pushHistory({ ...state, layers: nextLayers }, 'reorder')
  }, [reorderLayers, pushHistory, state])

  const handleToggleVisibility = useCallback((id: string) => {
    const layer = getLayerById(state.layers, id)
    if (!layer) return
    handleLayerChange(id, { visible: layer.visible === false ? true : false })
  }, [state, handleLayerChange])

  const handleToggleLock = useCallback((id: string) => {
    const layer = getLayerById(state.layers, id)
    if (!layer) return
    handleLayerChange(id, { locked: !layer.locked })
  }, [state, handleLayerChange])

  const handleAddLayer = useCallback((layer: Layer) => {
    addLayer(layer)
    pushHistory({ ...state, layers: [...state.layers, layer] }, 'add')
    setTimeout(() => select(layer.id), 0)
  }, [state, addLayer, pushHistory, select])

  const handleImageUpload = useCallback((dataUrl: string) => {
    const id    = genId()
    const layer = {
      id, type: 'image' as const,
      x: Math.round(state.canvasWidth  / 2 - 75),
      y: Math.round(state.canvasHeight / 2 - 75),
      width: 150, height: 150,
      src: dataUrl,
    }
    handleAddLayer(layer)
  }, [state, handleAddLayer])

  async function handleExport() {
    const isPro = profile?.plan === 'pro'

    if (isPro) {
      exportToPDF(userData, 'mi-cv.pdf')
      return
    }
    // Plan Inicio: CV Studio se paga desde la primera descarga, sin excepción.
    setShowInspPayment(true)
  }

  const handleExportJSON = useCallback(() => {
    setShowExportModal(true)
  }, [])

  const handleSaveTemplate = useCallback(() => {
    setShowSaveTemplateModal(true)
  }, [])

  const handleImportSVG = useCallback((svgText: string) => {
    let layers: Layer[]
    try {
      layers = parseSVGToLayers(svgText, state.canvasWidth, state.canvasHeight)
    } catch (e) {
      console.error('SVG import error:', e)
      return
    }
    if (layers.length === 0) return
    addLayers(layers)
    pushHistory({ ...state, layers: [...state.layers, ...layers] }, 'add')
    select(layers[layers.length - 1].id)
  }, [state, addLayers, pushHistory, select])

  const handleAddPage = useCallback(() => {
    addPage(currentPageIdx)
    const newIdx = (state.pages?.length ?? 1)
    setCurrentPageIdx(newIdx)
    select(null)
  }, [addPage, currentPageIdx, state.pages?.length, select])

  const handleSwitchPage = useCallback((toIdx: number) => {
    if (toIdx === currentPageIdx) return
    switchPage(currentPageIdx, toIdx)
    setCurrentPageIdx(toIdx)
    select(null)
    setNodeBounds(null)
  }, [switchPage, currentPageIdx, select])

  const handlePageBackgroundChange = useCallback((color: string) => {
    updatePageBackground(currentPageIdx, color)
  }, [updatePageBackground, currentPageIdx])

  const handleAlign = useCallback((action: AlignAction) => {
    const updates = alignLayers(state.layers, selectedIds, action, state.canvasWidth, state.canvasHeight)
    if (updates.length === 0) return
    const nextLayers = state.layers.map(l => {
      const u = updates.find(up => up.id === l.id)
      if (!u) return l
      const { id: _id, ...rest } = u
      return { ...l, ...rest } as Layer
    })
    for (const { id, ...rest } of updates) updateLayer(id, rest as Partial<Layer>)
    pushHistory({ ...state, layers: nextLayers }, 'align')
  }, [state, selectedIds, updateLayer, pushHistory])

  const handleImageDropOnCanvas = useCallback((src: string, x: number, y: number) => {
    const frame = [...state.layers].reverse().find(l => {
      if (l.type !== 'frame') return false
      const f = l as FrameLayer
      return x >= f.x && x <= f.x + (f.width ?? 160) && y >= f.y && y <= f.y + (f.height ?? 160)
    }) as FrameLayer | undefined

    if (frame) {
      handleLayerChange(frame.id, { imageSrc: src } as Partial<Layer>)
    } else {
      handleAddLayer({
        id: genId(), type: 'image' as const,
        x: Math.round(x - 75), y: Math.round(y - 75),
        width: 150, height: 150, src,
      })
    }
  }, [state.layers, handleLayerChange, handleAddLayer])

  const handleRemovePage = useCallback((pageIdx: number) => {
    const pages = state.pages ?? [{ id: 'page_1', layers: state.layers }]
    if (pages.length <= 1) return
    const newIdx = pageIdx >= pages.length - 1 ? pageIdx - 1 : pageIdx
    removePage(pageIdx, newIdx)
    setCurrentPageIdx(newIdx)
    select(null)
  }, [state.pages, state.layers, removePage, select])

  async function handleSave() {
    setIsSaving(true)
    try { await updateCanvasState(cvId, { ...state, guides }) }
    finally { setIsSaving(false) }
  }

  // Show first selected layer's controls in ContextBar only when exactly 1 is selected
  const selectedLayer = selectedIds.length === 1
    ? getLayerById(state.layers, selectedIds[0])
    : null

  const pages = state.pages ?? [{ id: 'page_1', layers: state.layers }]
  const currentPageBackground = pages[currentPageIdx]?.backgroundColor ?? '#ffffff'

  function toggleSection(s: SectionId) {
    setActiveSection(prev => prev === s ? null : s)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#eef0f4]">
      <TopBar
        scale={scale}
        isSaving={isSaving}
        isExporting={isExporting}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onSave={handleSave}
        onExport={handleExport}
        onZoomIn={() => setScale(s => Math.min(s + 0.1, 2.0))}
        onZoomOut={() => setScale(s => Math.max(s - 0.1, 0.25))}
        onZoomReset={() => setScale(1.0)}
        onUndo={undo}
        onRedo={redo}
        isAdmin={!!profile?.is_admin}
        onImportSVG={handleImportSVG}
        onExportJSON={handleExportJSON}
        onSaveTemplate={handleSaveTemplate}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <ContextBar
        layer={selectedLayer}
        selectedCount={selectedIds.length}
        pageBackground={currentPageBackground}
        onPageBackgroundChange={handlePageBackgroundChange}
        onUpdate={handleLayerChange}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onReorder={handleReorder}
        onAlign={handleAlign}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftIconStrip active={activeSection} onToggle={toggleSection} isAdmin={!!profile?.is_admin} />

        {activeSection && (
          <LeftPanel
            section={activeSection}
            layers={state.layers}
            selectedIds={selectedIds}
            pages={pages}
            currentPageIdx={currentPageIdx}
            canvasWidth={state.canvasWidth}
            canvasHeight={state.canvasHeight}
            isAdmin={!!profile?.is_admin}
            onAddLayer={handleAddLayer}
            onUpdateLayer={handleLayerChange}
            onSelect={select}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onReorder={handleReorder}
            onImageUpload={handleImageUpload}
            onAddPage={handleAddPage}
            onRemovePage={handleRemovePage}
            onSwitchPage={handleSwitchPage}
            onPageBackgroundChange={handlePageBackgroundChange}
          />
        )}

        <CanvasArea
          state={state}
          currentPageIdx={currentPageIdx}
          selectedIds={selectedIds}
          scale={scale}
          guides={guides}
          onGuidesChange={setGuides}
          onSelect={select}
          onToggle={toggleSelect}
          onSelectMany={selectMany}
          onPageActivate={handleSwitchPage}
          onLayerChange={handleLayerChange}
          onNodeBounds={setNodeBounds}
          onAddPage={handleAddPage}
          onImageDrop={handleImageDropOnCanvas}
        />
      </div>
      {showExportModal && (
        <ExportTemplateModal
          state={state}
          currentPageIdx={currentPageIdx}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          state={state}
          existingTemplateId={savedTemplateId}
          onClose={() => setShowSaveTemplateModal(false)}
          onSaved={(id) => setSavedTemplateId(id)}
        />
      )}
      {showInspPayment && (
        <PaymentModal
          cvInspirationId={cvId}
          onSuccess={() => {
            setShowInspPayment(false)
            exportToPDF(userData, 'mi-cv.pdf')
          }}
          onClose={() => setShowInspPayment(false)}
        />
      )}
    </div>
  )
}