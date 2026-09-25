'use client';

import { useEffect, useRef, useState } from 'react';
import { Select } from '@/components/Select';
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
  const yearOptions = [];
  for (let y = lastYear; y >= FIRST_YEAR; y--) yearOptions.push({ value: String(y), label: String(y) });
  const monthOptions = MONTHS.map((m, i) => ({ value: String(i + 1).padStart(2, '0'), label: m }));

  function pick(nextMonth: string, nextYear: string) {
    setMonth(nextMonth);
    setYear(nextYear);
    const next = nextYear ? (nextMonth ? `${nextYear}-${nextMonth}` : nextYear) : '';
    lastEmitted.current = next;
    onChange(next);
  }

  const triggerStyle: React.CSSProperties = { fontSize: 13, borderRadius: 8, border: '1.5px solid var(--line)', padding: '8px 10px 8px 12px', minHeight: 36 };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--deep)', fontWeight: 500, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Select
          ariaLabel={`${label}: mes`}
          value={month}
          onChange={v => pick(v, year)}
          // Once a month is set, offer a way to clear it (year-only date).
          options={month ? [{ value: '', label: 'Sin mes' }, ...monthOptions] : monthOptions}
          placeholder="Mes"
          disabled={disabled}
          style={{ flex: 1, minWidth: 0 }}
          triggerStyle={triggerStyle}
        />
        <Select
          ariaLabel={`${label}: año`}
          value={year}
          onChange={v => pick(month, v)}
          options={year ? [{ value: '', label: 'Sin año' }, ...yearOptions] : yearOptions}
          placeholder="Año"
          disabled={disabled}
          style={{ flex: 1, minWidth: 0 }}
          triggerStyle={triggerStyle}
        />
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
