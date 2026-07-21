'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface DatePickerProps {
  value: string; // ISO yyyy-mm-dd
  onChange: (value: string) => void;
  minDate?: string; // ISO yyyy-mm-dd
  className?: string;
}

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

const toIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseIsoDate = (iso?: string) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

export function DatePicker({ value, onChange, minDate, className }: DatePickerProps) {
  const selectedDate = parseIsoDate(value);
  const minDateObj = useMemo(() => parseIsoDate(minDate), [minDate]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate?.getFullYear(), selectedDate?.getMonth(), selectedDate?.getDate()]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const monthLabel = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekDayMondayBased = (firstDay.getDay() + 6) % 7; // lundi=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; inCurrentMonth: boolean }[] = [];

    for (let i = firstWeekDayMondayBased - 1; i >= 0; i -= 1) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        inCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        date: new Date(year, month, day),
        inCurrentMonth: true,
      });
    }

    while (cells.length < 42) {
      const day = cells.length - (firstWeekDayMondayBased + daysInMonth) + 1;
      cells.push({
        date: new Date(year, month + 1, day),
        inCurrentMonth: false,
      });
    }

    return cells;
  }, [viewDate]);

  const isBeforeMin = (date: Date) => {
    if (!minDateObj) return false;
    return date.getTime() < minDateObj.getTime();
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left',
          'bg-[radial-gradient(120%_90%_at_0%_0%,rgba(255,255,255,0.95)_0%,rgba(250,248,242,1)_55%,rgba(246,242,232,1)_100%)]',
          'transition-all duration-300 ease-out hover:border-beige-300 hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10',
          'focus-visible:border-black focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]',
          open ? 'border-beige-500 shadow-[0_0_0_3px_rgba(176,176,140,0.22)]' : 'border-beige-200'
        )}
      >
        <span className={cn('text-base font-semibold', value ? 'text-neutral-900' : 'text-neutral-400')}>
          {value ? selectedDate?.toLocaleDateString('fr-FR') : 'jj/mm/aaaa'}
        </span>
        <svg className="h-5 w-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-beige-300 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-beige-200 bg-beige-50 px-3 py-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="rounded-lg p-1.5 text-neutral-700 hover:bg-beige-100"
              aria-label="Mois precedent"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="font-semibold capitalize text-neutral-900">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="rounded-lg p-1.5 text-neutral-700 hover:bg-beige-100"
              aria-label="Mois suivant"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="px-3 pb-3 pt-2">
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((d, index) => (
                <div key={`${d}-${index}`} className="py-1 text-center text-xs font-semibold text-neutral-500">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map(({ date, inCurrentMonth }) => {
                const iso = toIsoDate(date);
                const isSelected = value === iso;
                const disabled = isBeforeMin(date);

                return (
                  <button
                    key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={cn(
                      'h-9 rounded-lg text-sm font-medium transition-colors',
                      inCurrentMonth ? 'text-neutral-900' : 'text-neutral-400',
                      !disabled && !isSelected && 'hover:bg-beige-100',
                      disabled && 'cursor-not-allowed text-neutral-300',
                      isSelected && 'bg-beige-700 text-white hover:bg-beige-700'
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-beige-200 pt-3">
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-800"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(toIsoDate(new Date()));
                  setViewDate(new Date());
                  setOpen(false);
                }}
                className="text-sm font-semibold text-beige-700 hover:text-beige-900"
              >
                Aujourd&apos;hui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

