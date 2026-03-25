import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface BirthDateSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SEL_CLS = 'h-7 text-sm text-neutral-100 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors';

function getDaysInMonth(month: number, year: number): number {
  if (!month) return 31;
  if (!year) {
    // No year selected: use a leap year to allow 29 Feb
    return new Date(2000, month, 0).getDate();
  }
  return new Date(year, month, 0).getDate();
}

export default function BirthDateSelect({ value, onChange }: BirthDateSelectProps) {
  const { t, i18n } = useTranslation();

  const parts = (value || '').split('-');
  const yearStr = parts[0] ?? '';
  const monthStr = parts[1] ?? '';
  const dayStr = parts[2] ?? '';

  const yearNum = yearStr ? parseInt(yearStr, 10) : 0;
  const monthNum = monthStr ? parseInt(monthStr, 10) : 0;
  const dayNum = dayStr ? parseInt(dayStr, 10) : 0;

  const maxDay = getDaysInMonth(monthNum, yearNum);

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

  const update = (d: number, m: number, y: number) => {
    if (y && m && d) {
      // Clamp day if it exceeds the max for selected month/year
      const clamped = Math.min(d, getDaysInMonth(m, y));
      onChange(`${String(y)}-${String(m).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`);
    } else if (!y && !m && !d) {
      onChange('');
    }
    // Partial selection: keep building the value
    else {
      const yPart = y ? String(y) : '';
      const mPart = m ? String(m).padStart(2, '0') : '';
      const dPart = d ? String(d).padStart(2, '0') : '';
      if (yPart && mPart && dPart) {
        onChange(`${yPart}-${mPart}-${dPart}`);
      }
      // Don't emit incomplete values — wait until all three are set
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Day */}
      <select
        value={dayStr}
        onChange={e => {
          const newDay = e.target.value ? parseInt(e.target.value, 10) : 0;
          update(newDay, monthNum, yearNum);
        }}
        className={SEL_CLS}
      >
        <option value="">{t('profile.day')}</option>
        {days.map(d => (
          <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={monthStr}
        onChange={e => {
          const newMonth = e.target.value ? parseInt(e.target.value, 10) : 0;
          // Clamp day if needed
          const clampedDay = dayNum ? Math.min(dayNum, getDaysInMonth(newMonth, yearNum)) : dayNum;
          update(clampedDay, newMonth, yearNum);
        }}
        className={SEL_CLS}
      >
        <option value="">{t('profile.month')}</option>
        {months.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={yearStr}
        onChange={e => {
          const newYear = e.target.value ? parseInt(e.target.value, 10) : 0;
          // Clamp day if needed (for leap year changes)
          const clampedDay = dayNum ? Math.min(dayNum, getDaysInMonth(monthNum, newYear)) : dayNum;
          update(clampedDay, monthNum, newYear);
        }}
        className={SEL_CLS}
      >
        <option value="">{t('profile.year')}</option>
        {years.map(y => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}
