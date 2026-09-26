// One paginator for the Europass preview AND the PDF (spec change 32).
//
// It measures the real layout (real font, real width) and decides where each page
// starts. The preview draws A4 sheets at those points; the print page (which headless
// Chromium turns into the PDF) forces page breaks at exactly the same points. Because a
// page never gets more than fits, Chromium never needs a break of its own, so what the
// user sees is what they download.
//
// Rules (spec §10): a block (header, job, study, CEFR table, sub-group, list…) never
// splits; a section title travels with its first block. A block taller than a whole page
// is left to flow naturally (it can't fit anywhere).

export const MM = 96 / 25.4
export const PAGE_MM = 297
export const MARGIN_MM = 22
export const CONTENT_H = (PAGE_MM - 2 * MARGIN_MM) * MM

// Flow children of the CV sheet: the header and every direct child of a section.
// includeEditorOnly=false gives exactly what is printed.
export function flowChildren(page: HTMLElement, includeEditorOnly: boolean): HTMLElement[] {
  const all = Array.from(page.querySelectorAll<HTMLElement>(':scope > header, :scope > section > *'))
  return includeEditorOnly ? all : all.filter(el => !el.classList.contains('ep2-capsula'))
}

const isTitle = (el: HTMLElement) => el.tagName === 'H2'

interface Box { top: number; bottom: number }

// Unscaled CSS px relative to the top of the sheet's border box.
function measure(page: HTMLElement, el: HTMLElement, scale: number): Box {
  const p = page.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  return { top: (r.top - p.top) / scale, bottom: (r.bottom - p.top) / scale }
}

export interface Pagination {
  // Indexes (into the printed flow children) of the blocks that start a new page.
  breaks: number[]
  pages: number
}

// `page` must show the printed markup (no editor-only elements) with no breaks applied.
export function computeBreaks(page: HTMLElement, scale = 1): Pagination {
  const padTop = parseFloat(getComputedStyle(page).paddingTop) || 0
  const blocks = flowChildren(page, false).map(el => {
    const b = measure(page, el, scale)
    return { el, top: b.top - padTop, bottom: b.bottom - padTop }
  })
  const breaks: number[] = []
  let pageStart = 0
  let extra = 0
  // A block taller than a whole page can't fit anywhere: it flows over the next page(s)
  // on its own. Count those pages and continue from where it ends (approximate, and in
  // practice never reached: it would take a single job over 25 cm long).
  const overflow = (b: { top: number; bottom: number }) => {
    const n = Math.floor((b.bottom - b.top) / (CONTENT_H + 0.5))
    if (n > 0) { extra += n; pageStart = b.top + n * CONTENT_H }
  }
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].bottom - pageStart <= CONTENT_H + 0.5) continue
    // Keep a section title with its first block.
    const k = isTitle(blocks[i - 1].el) && blocks[i - 1].top > pageStart + 0.5 ? i - 1 : i
    if (blocks[k].top <= pageStart + 0.5) { overflow(blocks[k]); continue }
    breaks.push(k)
    pageStart = blocks[k].top
    overflow(blocks[k])
    i = k
  }
  return { breaks, pages: breaks.length + 1 + extra }
}

// Print: forced page breaks at the computed blocks.
export function applyPrintBreaks(page: HTMLElement, breaks: number[]): void {
  const blocks = flowChildren(page, false)
  blocks.forEach(el => { el.style.breakBefore = ''; el.style.marginTop = '' })
  for (const k of breaks) if (blocks[k]) blocks[k].style.breakBefore = 'page'
}

export interface SheetLayout {
  // Gaps between sheets (px from the top of the CV sheet, unscaled).
  gaps: Array<{ top: number; height: number }>
  // Minimum height of the sheet element so the last page is a full A4.
  minHeight: number
}

// Preview: pushes each page-starting block to the top of the next sheet (after the
// bottom margin, a visible gap and the top margin). Editor-only elements (capsules) may
// make a sheet a bit taller on screen; they are never printed.
export function applyScreenBreaks(page: HTMLElement, breaks: number[], scale: number, gapPx: number): SheetLayout {
  const all = flowChildren(page, true)
  const blocks = flowChildren(page, false)
  all.forEach(el => { el.style.marginTop = ''; el.style.breakBefore = '' })
  page.style.minHeight = ''
  const pageH = PAGE_MM * MM
  const pad = MARGIN_MM * MM
  const gaps: SheetLayout['gaps'] = []
  let sheetTop = 0
  for (const k of breaks) {
    const target = blocks[k]
    if (!target) continue
    const idx = all.indexOf(target)
    if (idx <= 0) continue
    const prevBottom = measure(page, all[idx - 1], scale).bottom
    const sheetBottom = Math.max(sheetTop + pageH, prevBottom + pad)
    // Adjacent vertical margins collapse, so the block's margin-top is measured from the
    // previous block's border edge: top = prevBottom + marginTop.
    target.style.marginTop = `${sheetBottom + gapPx + pad - prevBottom}px`
    gaps.push({ top: sheetBottom, height: gapPx })
    sheetTop = sheetBottom + gapPx
  }
  const last = all[all.length - 1]
  const lastBottom = last ? measure(page, last, scale).bottom : 0
  const minHeight = Math.max(sheetTop + pageH, lastBottom + pad)
  page.style.minHeight = `${minHeight}px`
  return { gaps, minHeight }
}
