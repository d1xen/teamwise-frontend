import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface BirthDateSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SEL_CLS = 'h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors';

function getDaysInMonth(month: number, year: number): number {
  if (!month) return 31;
  if (!year) return new Date(2000, month, 0).getDate();
  return new Date(year, month, 0).getDate();
}

function parseDate(iso: string): { day: number; month: number; year: number } {
  if (!iso) return { day: 0, month: 0, year: 0 };
  const parts = iso.split('-');
  return {
    year: parts[0] ? parseInt(parts[0], 10) || 0 : 0,
    month: parts[1] ? parseInt(parts[1], 10) || 0 : 0,
    day: parts[2] ? parseInt(parts[2], 10) || 0 : 0,
  };
}

export default function BirthDateSelect({ value, onChange }: BirthDateSelectProps) {
  const { t, i18n } = useTranslation();

  // Local state to track partial selections
  const initial = parseDate(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  // Sync from parent when value changes externally
  useEffect(() => {
    const parsed = parseDate(value);
    setDay(parsed.day);
    setMonth(parsed.month);
    setYear(parsed.year);
  }, [value]);

  // Emit to parent only when all 3 are set (or all cleared)
  const emit = (d: number, m: number, y: number) => {
    if (y && m && d) {
      const clamped = Math.min(d, getDaysInMonth(m, y));
      onChange(`${String(y)}-${String(m).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`);
    } else if (!y && !m && !d) {
      onChange('');
    }
  };

  const maxDay = getDaysInMonth(month, year);

  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: formatter.format(new Date(2000, i, 15)),
    }));
  }, [i18n.language]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() =>
    Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i),
    [currentYear],
  );

  const days = useMemo(() =>
    Array.from({ length: maxDay }, (_, i) => i + 1),
    [maxDay],
  );

  const handleDay = (val: string) => {
    const d = val ? parseInt(val, 10) : 0;
    setDay(d);
    emit(d, month, year);
  };

  const handleMonth = (val: string) => {
    const m = val ? parseInt(val, 10) : 0;
    const clampedDay = day ? Math.min(day, getDaysInMonth(m, year)) : day;
    setMonth(m);
    setDay(clampedDay);
    emit(clampedDay, m, year);
  };

  const handleYear = (val: string) => {
    const y = val ? parseInt(val, 10) : 0;
    const clampedDay = day ? Math.min(day, getDaysInMonth(month, y)) : day;
    setYear(y);
    setDay(clampedDay);
    emit(clampedDay, month, y);
  };

  return (
    <div className="flex items-center gap-1.5">
      <select value={day ? String(day).padStart(2, '0') : ''} onChange={e => handleDay(e.target.value)} className={SEL_CLS}>
        <option value="">{t('profile.day')}</option>
        {days.map(d => (
          <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
        ))}
      </select>

      <select value={month ? String(month).padStart(2, '0') : ''} onChange={e => handleMonth(e.target.value)} className={SEL_CLS}>
        <option value="">{t('profile.month')}</option>
        {months.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select value={year ? String(year) : ''} onChange={e => handleYear(e.target.value)} className={SEL_CLS}>
        <option value="">{t('profile.year')}</option>
        {years.map(y => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}
