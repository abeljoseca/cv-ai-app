'use client'

import { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
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
}

export function Select({
  value,
  onChange,
  options,
  style,
  triggerStyle,
  placeholder,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          minWidth: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(15,23,42,.04), 0 12px 32px -4px rgba(15,23,42,.14)',
          zIndex: 200,
          overflow: 'hidden',
          animation: 'fadeUp .12s var(--ease)',
        }}>
          {options.map((opt, i) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                {opt.label}
                {isSelected && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}