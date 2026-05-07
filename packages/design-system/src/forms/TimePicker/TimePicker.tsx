/**
 * TimePicker — hour + minute selector.
 *
 * Two-input combo (hours + minutes) with optional AM/PM toggle when
 * `format === '12h'`. Stores the value as a `{ hours, minutes }` object;
 * hours are always 0–23 internally regardless of display format. Step
 * controls the minute granularity (default 1; common alternatives: 5, 15).
 */
import { useMemo, type ChangeEvent } from 'react';

import { cn } from '../../utils/cn';

export interface TimeValue {
  hours: number;
  minutes: number;
}

export interface TimePickerProps {
  value: TimeValue | null;
  onValueChange: (time: TimeValue | null) => void;
  /** 12h shows AM/PM toggle; 24h does not. Default '24h'. */
  format?: '12h' | '24h';
  /** Minute step (1, 5, 15, 30…). Default 1. */
  step?: number;
  disabled?: boolean;
  error?: boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function TimePicker({
  value,
  onValueChange,
  format = '24h',
  step = 1,
  disabled,
  error,
  'aria-label': ariaLabel,
  id,
  className,
}: TimePickerProps): JSX.Element {
  const is12 = format === '12h';

  const display = useMemo(() => {
    if (!value) return { h: '', m: '', period: 'AM' as const };
    const h24 = value.hours;
    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    const hShown = is12 ? ((h24 % 12) || 12) : h24;
    return { h: pad(hShown), m: pad(value.minutes), period };
  }, [value, is12]);

  function emit(nextH: number, nextM: number, nextPeriod: 'AM' | 'PM') {
    let h24 = nextH;
    if (is12) {
      h24 = nextPeriod === 'PM' ? (nextH % 12) + 12 : nextH % 12;
    }
    if (Number.isNaN(h24) || Number.isNaN(nextM)) {
      onValueChange(null);
      return;
    }
    onValueChange({ hours: h24, minutes: nextM });
  }

  function onHoursChange(e: ChangeEvent<HTMLInputElement>) {
    const next = parseInt(e.target.value, 10);
    const cur = value ?? { hours: 0, minutes: 0 };
    emit(next, cur.minutes, display.period);
  }

  function onMinutesChange(e: ChangeEvent<HTMLInputElement>) {
    const next = parseInt(e.target.value, 10);
    const cur = value ?? { hours: 0, minutes: 0 };
    emit(is12 ? Number(display.h) || 12 : cur.hours, next, display.period);
  }

  function onPeriodToggle() {
    const cur = value ?? { hours: 0, minutes: 0 };
    const flipped: 'AM' | 'PM' = display.period === 'AM' ? 'PM' : 'AM';
    emit(Number(display.h) || 12, cur.minutes, flipped);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-md border bg-background px-2 text-sm shadow-sm',
        'focus-within:outline-none focus-within:ring-1 focus-within:ring-ring',
        error ? 'border-destructive' : 'border-input',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      aria-invalid={error || undefined}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={is12 ? 1 : 0}
        max={is12 ? 12 : 23}
        step={1}
        value={display.h}
        onChange={onHoursChange}
        disabled={disabled}
        aria-label="Hours"
        className="w-10 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span aria-hidden="true">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={59}
        step={step}
        value={display.m}
        onChange={onMinutesChange}
        disabled={disabled}
        aria-label="Minutes"
        className="w-10 bg-transparent text-left outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {is12 && (
        <button
          type="button"
          onClick={onPeriodToggle}
          disabled={disabled}
          className="ml-1 rounded px-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
          aria-label={`Toggle ${display.period === 'AM' ? 'PM' : 'AM'}`}
        >
          {display.period}
        </button>
      )}
    </div>
  );
}
TimePicker.displayName = 'TimePicker';
