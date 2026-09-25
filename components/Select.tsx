'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

export interface SelectOption {
  value: string
  label: string
  // Optional helper line shown under the label inside the dropdown only (not in the trigger).
  description?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Applied to the outer wrapper (controls width) */
  style?: React.CSSProperties
  /** Applied to the trigger button (override typography, size, etc.) */
  triggerStyle?: React.CSSProperties
  placeholder?: string
  disabled?: boolean
  /** Accessible name for the trigger when there is no visible <label> */
  ariaLabel?: string
}

const PANEL_MAX_HEIGHT = 300
const GAP = 4

// The dropdown panel is rendered in a portal with fixed positioning, so it is never
// clipped by a scrolling/overflow container (e.g. the CV Studio toolbar) and opens
// upwards when there is not enough room below the trigger.
export function Select({
  value,
  onChange,
  options,
  style,
  triggerStyle,
  placeholder,
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  // Position the panel against the trigger (below, or above when it doesn't fit).
  useLayoutEffect(() => {
    if (!open || !ref.current) return
    function place() {
      const r = ref.current!.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom - GAP - 8
      const spaceAbove = r.top - GAP - 8
      const openUp = spaceBelow < Math.min(PANEL_MAX_HEIGHT, 160) && spaceAbove > spaceBelow
      setPos(openUp
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + GAP, maxHeight: Math.min(PANEL_MAX_HEIGHT, spaceAbove) }
        : { left: r.left, width: r.width, top: r.bottom + GAP, maxHeight: Math.min(PANEL_MAX_HEIGHT, spaceBelow) })
    }
    place()
    // Any scroll (including inside scroll containers) or resize moves the trigger: close
    // instead of letting the panel drift away from it.
    function close(e: Event) {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // Long lists (e.g. years) open scrolled to the selected option. Only the panel scrolls.
  useEffect(() => {
    const panel = panelRef.current
    if (!open || !pos || !panel) return
    const sel = panel.querySelector<HTMLElement>('[aria-selected="true"]')
    if (sel) panel.scrollTop = Math.max(0, sel.offsetTop - panel.clientHeight / 2 + sel.offsetHeight / 2)
  }, [open, pos])

  // Close on outside click (the panel lives in a portal, so it is checked separately)
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '9px 12px 9px 14px',
          borderRadius: 10,
          border: `1px solid ${open ? 'var(--blue)' : 'var(--line)'}`,
          background: 'var(--surface)',
          color: selected ? 'var(--ink)' : 'var(--mute)',
          fontSize: 13.5,
          fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'border-color .15s, box-shadow .15s',
          boxShadow: open ? '0 0 0 3px rgba(75,107,251,.12)' : 'none',
          opacity: disabled ? 0.55 : 1,
          ...triggerStyle,
        }}
      >
        <span style={{
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--mute)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform .15s var(--ease)',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown panel (portal) */}
      {open && pos && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={{
            position: 'fixed',
            left: pos.left,
            top: pos.top,
            bottom: pos.bottom,
            minWidth: pos.width,
            maxHeight: pos.maxHeight,
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            boxShadow: '0 4px 6px rgba(15,23,42,.04), 0 12px 32px -4px rgba(15,23,42,.14)',
            zIndex: 1000,
            animation: 'fadeUp .12s var(--ease)',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: isSelected ? 'var(--lav)' : 'transparent',
                  color: isSelected ? 'var(--blue)' : 'var(--ink)',
                  border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: 'inherit',
                  transition: 'background .1s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--hover)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span style={{ fontSize: 11.5, fontWeight: 400, color: '#9CA3AF', whiteSpace: 'normal', lineHeight: 1.35 }}>{opt.description}</span>
                  )}
                </span>
                {isSelected && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}
