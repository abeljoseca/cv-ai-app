'use client'

import { useRef, useState } from 'react'

// Pending (unsaved) changes for a list shown in an editable profile card.
// "Añadir" and "Actualizar" only stage changes; the card's "Guardar cambios" persists
// them all at once and "Cancelar" discards them. Deletions are tracked by the caller
// (pendingXDeleteIds) — a staged-but-unsaved item is simply removed from `adds`.

const TEMP_PREFIX = 'tmp-'

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_PREFIX)
}

export function useStagedList<T extends { id: string }>() {
  const [adds, setAdds] = useState<T[]>([])
  const [updates, setUpdates] = useState<Record<string, T>>({})
  const seq = useRef(0)

  return {
    adds,
    updates: Object.values(updates),
    isDirty: adds.length > 0 || Object.keys(updates).length > 0,

    // Stage a new item (gets a temporary id until it is saved).
    add(row: Omit<T, 'id'>) {
      seq.current += 1
      const id = `${TEMP_PREFIX}${seq.current}`
      setAdds(prev => [...prev, { ...row, id } as T])
    },

    // Stage an edit: temporary items are edited in place, saved ones become an update.
    update(row: T) {
      if (isTempId(row.id)) setAdds(prev => prev.map(x => (x.id === row.id ? row : x)))
      else setUpdates(prev => ({ ...prev, [row.id]: row }))
    },

    removeAdd(id: string) {
      setAdds(prev => prev.filter(x => x.id !== id))
    },

    reset() {
      setAdds([])
      setUpdates({})
    },

    // The list as the user should see it: saved rows with their staged edits, then new ones.
    view(rows: T[]): T[] {
      return [...rows.map(r => updates[r.id] ?? r), ...adds]
    },
  }
}

export type StagedList<T extends { id: string }> = ReturnType<typeof useStagedList<T>>
