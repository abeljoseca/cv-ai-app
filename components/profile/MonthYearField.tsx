'use client';

import { hasMonth } from '@/lib/profile-date';

// Month + year picker for profile dates. Emits the canonical value ('AAAA-MM', or 'AAAA'
// when only the year is set, or '' when empty) — see lib/profile-date.ts.
// The month is asked for but not forced: without it the CV shows only the year, and a
// subtle hint says so. A month is never invented.

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FIRST_YEAR = 1950;

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  // Future years allowed for expected graduation dates.
  futureYears?: number;
}

export default function MonthYearField({ label, value, onChange, disabled, futureYears = 0 }: Props) {
  const match = value.match(/^(\d{4})(?:-(\d{2}))?$/);
  const year = match?.[1] ?? '';
  const month = match?.[2] ?? '';
  // A legacy value we can't read (e.g. free text) is shown so the user can replace it.
  const unreadable = !!value && !match;

  const lastYear = new Date().getFullYear() + futureYears;
  const years: string[] = [];
  for (let y = lastYear; y >= FIRST_YEAR; y--) years.push(String(y));

  function emit(nextMonth: string, nextYear: string) {
    if (!nextYear) { onChange(''); return; }
    onChange(nextMonth ? `${nextYear}-${nextMonth}` : nextYear);
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
          onChange={e => emit(e.target.value, year)} style={selectStyle}>
          <option value="">Mes</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
        </select>
        <select aria-label={`${label}: año`} value={year} disabled={disabled}
          onChange={e => emit(month, e.target.value)} style={selectStyle}>
          <option value="">Año</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {!disabled && unreadable && (
        <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 4 }}>
          Fecha guardada como «{value}». Elige mes y año para corregirla.
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
