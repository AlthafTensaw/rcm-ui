/**
 * DatePicker — single-date selector.
 *
 * Trigger button shows the formatted date or `placeholder`. Clicking opens a
 * Popover containing the `react-day-picker` v9 calendar. `format` is a
 * date-fns format string (default `'PP'` → "Jan 1, 2026").
 *
 * Controlled — pass `value: Date | null` and `onValueChange`. Use `minDate`
 * and `maxDate` to clamp the selectable range; `disabledDates(date)` returns
 * true for any date that should be uninteractable (e.g., weekends).
 */
import { useMemo, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format as dfFormat } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '../../utils/cn';

export interface DatePickerProps {
  value: Date | null;
  onValueChange: (date: Date | null) => void;
  /** date-fns format string. Default: 'PP' ("Jan 1, 2026"). */
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /** Extra per-date disable predicate. */
  disabledDates?: (date: Date) => boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
}

export function DatePicker({
  value,
  onValueChange,
  format = 'PP',
  minDate,
  maxDate,
  placeholder = 'Pick a date',
  disabled,
  error,
  disabledDates,
  'aria-label': ariaLabel,
  id,
  className,
}: DatePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const disabledMatcher = useMemo(() => {
    const matchers: unknown[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    if (disabledDates) matchers.push((d: Date) => disabledDates(d));
    return matchers.length > 0 ? matchers : undefined;
  }, [minDate, maxDate, disabledDates]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-start gap-2 rounded-md border bg-background px-3 text-sm shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : 'border-input',
          !value && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 opacity-70" aria-hidden="true" />
        <span className="truncate">
          {value ? dfFormat(value, format) : placeholder}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md',
          )}
        >
          <DayPicker
            mode="single"
            selected={value ?? undefined}
            onSelect={(d) => {
              onValueChange(d ?? null);
              if (d) setOpen(false);
            }}
            disabled={
              disabledMatcher as unknown as React.ComponentProps<
                typeof DayPicker
              >['disabled']
            }
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
DatePicker.displayName = 'DatePicker';
