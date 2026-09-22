'use client'

import { useRef, useCallback } from 'react'
import { HistoryManager } from '../lib/history-manager'
import type { CanvasState } from '../types/canvas.types'

export function useHistory(onRestore: (state: CanvasState) => void) {
  const manager = useRef(new HistoryManager())

  const push = useCallback((state: CanvasState, action: string) => {
    manager.current.push(state, action)
  }, [])

  const undo = useCallback(() => {
    const prev = manager.current.undo()
    if (prev) onRestore(prev)
  }, [onRestore])

  const redo = useCallback(() => {
    const next = manager.current.redo()
    if (next) onRestore(next)
  }, [onRestore])

  const canUndo = () => manager.current.canUndo()
  const canRedo = () => manager.current.canRedo()

  return { push, undo, redo, canUndo, canRedo }
}