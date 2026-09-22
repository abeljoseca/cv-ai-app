'use client'

import { useState, useCallback } from 'react'
import type { CanvasState, Page } from '../types/canvas.types'
import type { Layer } from '../types/layer.types'
import { updateLayerById, reorderLayer as reorderLayerFn } from '../lib/konva-utils'

function withPages(s: CanvasState): CanvasState {
  if (s.pages && s.pages.length > 0) return s
  return { ...s, pages: [{ id: 'page_1', layers: s.layers }] }
}

export function useCanvas(initialState: CanvasState) {
  const [state, setState] = useState<CanvasState>(() => withPages(initialState))

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setState(prev => ({ ...prev, layers: updateLayerById(prev.layers, id, updates) }))
  }, [])

  const addLayer = useCallback((layer: Layer) => {
    setState(prev => ({ ...prev, layers: [...prev.layers, layer] }))
  }, [])

  const addLayers = useCallback((newLayers: Layer[]) => {
    setState(prev => ({ ...prev, layers: [...prev.layers, ...newLayers] }))
  }, [])

  const removeLayer = useCallback((id: string) => {
    setState(prev => ({ ...prev, layers: prev.layers.filter(l => l.id !== id) }))
  }, [])

  const removeLayers = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, layers: prev.layers.filter(l => !ids.includes(l.id)) }))
  }, [])

  const reorderLayers = useCallback((id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setState(prev => ({ ...prev, layers: reorderLayerFn(prev.layers, id, direction) }))
  }, [])

  const replaceState = useCallback((next: CanvasState) => {
    setState(withPages(next))
  }, [])

  const addPage = useCallback((currentPageIdx: number) => {
    setState(prev => {
      const pages = prev.pages ?? [{ id: 'page_1', layers: prev.layers }]
      const synced = pages.map((p, i) => i === currentPageIdx ? { ...p, layers: prev.layers } : p)
      const newPage: Page = { id: `page_${Date.now()}`, layers: [] }
      return { ...prev, pages: [...synced, newPage], layers: [] }
    })
  }, [])

  const switchPage = useCallback((fromIdx: number, toIdx: number) => {
    setState(prev => {
      const pages = prev.pages ?? [{ id: 'page_1', layers: prev.layers }]
      const synced = pages.map((p, i) => i === fromIdx ? { ...p, layers: prev.layers } : p)
      return { ...prev, pages: synced, layers: synced[toIdx]?.layers ?? [] }
    })
  }, [])

  const removePage = useCallback((pageIdx: number, newCurrentIdx: number) => {
    setState(prev => {
      const pages = (prev.pages ?? [{ id: 'page_1', layers: prev.layers }]).filter((_, i) => i !== pageIdx)
      return { ...prev, pages, layers: pages[newCurrentIdx]?.layers ?? [] }
    })
  }, [])

  const updatePageBackground = useCallback((pageIdx: number, color: string) => {
    setState(prev => {
      const pages = prev.pages ?? [{ id: 'page_1', layers: prev.layers }]
      return { ...prev, pages: pages.map((p, i) => i === pageIdx ? { ...p, backgroundColor: color } : p) }
    })
  }, [])

  return { state, updateLayer, addLayer, addLayers, removeLayer, removeLayers, reorderLayers, replaceState, addPage, switchPage, removePage, updatePageBackground }
}