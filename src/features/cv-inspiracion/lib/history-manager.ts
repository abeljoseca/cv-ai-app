import type { CanvasState } from '../types/canvas.types'
import type { HistoryEntry } from '../types/canvas.types'

const MAX_HISTORY = 50

export class HistoryManager {
  private stack: HistoryEntry[] = []
  private pointer = -1

  push(state: CanvasState, action: string): void {
    // Drop any redo history
    this.stack = this.stack.slice(0, this.pointer + 1)
    this.stack.push({ state: structuredClone(state), timestamp: Date.now(), action })
    if (this.stack.length > MAX_HISTORY) this.stack.shift()
    this.pointer = this.stack.length - 1
  }

  undo(): CanvasState | null {
    if (this.pointer <= 0) return null
    this.pointer--
    return structuredClone(this.stack[this.pointer].state)
  }

  redo(): CanvasState | null {
    if (this.pointer >= this.stack.length - 1) return null
    this.pointer++
    return structuredClone(this.stack[this.pointer].state)
  }

  canUndo(): boolean {
    return this.pointer > 0
  }

  canRedo(): boolean {
    return this.pointer < this.stack.length - 1
  }

  clear(): void {
    this.stack = []
    this.pointer = -1
  }
}