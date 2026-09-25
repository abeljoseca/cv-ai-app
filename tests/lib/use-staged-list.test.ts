import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { isTempId, useStagedList } from '@/lib/use-staged-list'

type Row = { id: string; nombre: string }
const saved: Row[] = [{ id: 'a', nombre: 'Uno' }, { id: 'b', nombre: 'Dos' }]

describe('useStagedList', () => {
  it('stages adds and updates without touching the saved rows', () => {
    const { result } = renderHook(() => useStagedList<Row>())
    expect(result.current.isDirty).toBe(false)

    act(() => result.current.add({ nombre: 'Tres' }))
    act(() => result.current.update({ id: 'a', nombre: 'Uno editado' }))

    const view = result.current.view(saved)
    expect(view.map(r => r.nombre)).toEqual(['Uno editado', 'Dos', 'Tres'])
    expect(isTempId(view[2].id)).toBe(true)
    expect(result.current.isDirty).toBe(true)
    expect(result.current.updates).toEqual([{ id: 'a', nombre: 'Uno editado' }])
    expect(saved[0].nombre).toBe('Uno')
  })

  it('edits and removes unsaved items in place', () => {
    const { result } = renderHook(() => useStagedList<Row>())
    act(() => result.current.add({ nombre: 'Nuevo' }))
    const tempId = result.current.adds[0].id
    act(() => result.current.update({ id: tempId, nombre: 'Nuevo editado' }))
    expect(result.current.adds).toEqual([{ id: tempId, nombre: 'Nuevo editado' }])
    expect(result.current.updates).toEqual([])
    act(() => result.current.removeAdd(tempId))
    expect(result.current.isDirty).toBe(false)
  })

  it('reset discards everything', () => {
    const { result } = renderHook(() => useStagedList<Row>())
    act(() => result.current.add({ nombre: 'X' }))
    act(() => result.current.update({ id: 'b', nombre: 'Y' }))
    act(() => result.current.reset())
    expect(result.current.isDirty).toBe(false)
    expect(result.current.view(saved)).toEqual(saved)
  })
})
