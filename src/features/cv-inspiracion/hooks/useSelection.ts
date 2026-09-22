'use client'

import { useState, useCallback } from 'react'

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const select = useCallback((id: string | null) =>
    setSelectedIds(id ? [id] : []), [])

  const toggleSelect = useCallback((id: string) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    ), [])

  const selectMany = useCallback((ids: string[]) => setSelectedIds(ids), [])

  const deselect = useCallback(() => setSelectedIds([]), [])

  return {
    selectedIds,
    selectedId: selectedIds[0] ?? null,
    select,
    toggleSelect,
    selectMany,
    deselect,
  }
}