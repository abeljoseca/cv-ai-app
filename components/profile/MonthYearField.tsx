'use client';

import { useEffect, useRef, useState } from 'react';
import { hasMonth } from '@/lib/profile-date';

// Month + year picker for profile dates. Emits the canonical value ('AAAA-MM', or 'AAAA'
// when only the year is set, or '' when empty) — see lib/profile-date.ts.
// The month is asked for but not forced: without it the CV shows only the year, and a
// subtle hint says so. A month is never invented.

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FIRST_YEAR = 1950;
const CANONICAL = /^(\d{4})(?:-(\d{2}))?$/;

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  // Future years allowed for expected graduation dates.
  futureYears?: number;
}

function split(value: string): { month: string; year: string } {
  const m = value.match(CANONICAL);
  return { month: m?.[2] ?? '', year: m?.[1] ?? '' };
}

export default function MonthYearField({ label, value, onChange, disabled, futureYears = 0 }: Props) {
  // Local picks, so a month chosen before the year is remembered (the canonical value
  // can't hold a month without a year).
  const [month, setMonth] = useState(() => split(value).month);
  const [year, setYear] = useState(() => split(value).year);

  // Re-sync only when the value changed from OUTSIDE (form reset, another item opened).
  // If it is exactly what we last emitted — including '' while only a month is picked —
  // the local picks are already right and must be kept.
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const next = split(value);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  // A legacy value we can't read (e.g. free text) is shown so the user can replace it.
  const unreadable = !!value && !CANONICAL.test(value);

  const lastYear = new Date().getFullYear() + futureYears;
  const years: string[] = [];
  for (let y = lastYear; y >= FIRST_YEAR; y--) years.push(String(y));

  function pick(nextMonth: string, nextYear: string) {
    setMonth(nextMonth);
    setYear(nextYear);
    const next = nextYear ? (nextMonth ? `${nextYear}-${nextMonth}` : nextYear) : '';
    lastEmitted.current = next;
    onChange(next);
  }

  const selectStyle: React.CSSProperties = {
    flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--line)',
    background: disabled ? 'var(--hover)' : 'var(--surface)', color: disabled ? 'var(--mute)' : 'var(--ink)',
    fontSize: 13, fontFamily: 'inherit', minHeight: 36, outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--deep)', fontWeight: 500, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <select aria-label={`${label}: mes`} value={month} disabled={disabled}
          onChange={e => pick(e.target.value, year)} style={selectStyle}>
          <option value="">Mes</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
        </select>
        <select aria-label={`${label}: año`} value={year} disabled={disabled}
          onChange={e => pick(month, e.target.value)} style={selectStyle}>
          <option value="">Año</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {!disabled && unreadable && (
        <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 4 }}>
          Fecha guardada como «{value}». Elige mes y año para corregirla.
        </div>
      )}
      {!disabled && month && !year && (
        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4 }}>
          Elige también el año.
        </div>
      )}
      {!disabled && year && !hasMonth(value) && !unreadable && (
        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4 }}>
          Agrega el mes: sin él, tu CV mostrará solo el año.
        </div>
      )}
    </div>
  );
}
