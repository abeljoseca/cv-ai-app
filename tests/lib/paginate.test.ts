import { describe, expect, it } from 'vitest'
import { applyPrintBreaks, computeBreaks, CONTENT_H, MM } from '@/lib/cv/paginate'

// jsdom has no layout: build a sheet whose blocks report the heights we give them.
function sheet(blocks: Array<{ tag?: string; h: number; gapAfter?: number; editorOnly?: boolean }>) {
  const page = document.createElement('div')
  page.className = 'ep2-page'
  page.style.paddingTop = `${22 * MM}px`
  const header = document.createElement('header')
  page.appendChild(header)
  const section = document.createElement('section')
  page.appendChild(section)
  const pad = 22 * MM
  let y = pad
  const place = (el: HTMLElement, h: number) => {
    const top = y
    el.getBoundingClientRect = () => ({ top, bottom: top + h, left: 0, right: 0, width: 0, height: h, x: 0, y: top, toJSON() {} }) as DOMRect
    y = top + h
  }
  page.getBoundingClientRect = () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} }) as DOMRect
  place(header, 100)
  for (const b of blocks) {
    const el = document.createElement(b.tag ?? 'div')
    if (b.editorOnly) el.className = 'ep2-capsula'
    section.appendChild(el)
    place(el, b.h)
    y += b.gapAfter ?? 10
  }
  document.body.appendChild(page)
  return page
}

describe('paginator', () => {
  it('everything that fits stays on one page', () => {
    expect(computeBreaks(sheet([{ h: 200 }, { h: 200 }]))).toEqual({ breaks: [], pages: 1 })
  })

  it('a block that would cross the page bottom starts the next page', () => {
    const r = computeBreaks(sheet([{ h: 400 }, { h: 400 }, { h: 200 }]))
    expect(r).toEqual({ breaks: [3], pages: 2 }) // index 0 is the header
  })

  it('a section title travels with its first block', () => {
    const r = computeBreaks(sheet([{ h: 700 }, { tag: 'h2', h: 30 }, { h: 200 }]))
    expect(r.breaks).toEqual([2]) // the title, not the block after it
  })

  it('a block taller than a page flows on its own and adds pages', () => {
    const r = computeBreaks(sheet([{ h: CONTENT_H * 1.5 }]))
    expect(r.breaks).toEqual([1])
    expect(r.pages).toBe(3)
  })

  it('print breaks go on the computed blocks, editor-only elements are ignored', () => {
    const page = sheet([{ h: 400 }, { h: 30, editorOnly: true }, { h: 400 }, { h: 200 }])
    const r = computeBreaks(page)
    applyPrintBreaks(page, r.breaks)
    const printed = Array.from(page.querySelectorAll<HTMLElement>(':scope > header, :scope > section > *')).filter(e => !e.classList.contains('ep2-capsula'))
    expect(printed.filter(e => e.style.breakBefore === 'page')).toHaveLength(r.breaks.length)
  })
})
