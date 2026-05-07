/**
 * DateRangePicker — selects a (from, to) date range.
 *
 * Same Popover + react-day-picker shell as DatePicker, but `mode="range"`.
 * Returns both halves; either may be null while the user is mid-selection.
 * The popover stays open until the user picks both ends.
 */
import { useMemo, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format as dfFormat } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '../../utils/cn';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onValueChange: (range: DateRange) => void;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  disabledDates?: (date: Date) => boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onValueChange,
  format = 'PP',
  minDate,
  maxDate,
  placeholder = 'Pick a range',
  disabled,
  error,
  disabledDates,
  'aria-label': ariaLabel,
  id,
  className,
}: DateRangePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const disabledMatcher = useMemo(() => {
    const matchers: unknown[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    if (disabledDates) matchers.push((d: Date) => disabledDates(d));
    return matchers.length > 0 ? matchers : undefined;
  }, [minDate, maxDate, disabledDates]);

  const label = useMemo(() => {
    if (value.from && value.to) {
      return `${dfFormat(value.from, format)} – ${dfFormat(value.to, format)}`;
    }
    if (value.from) {
      return `${dfFormat(value.from, format)} – …`;
    }
    return null;
  }, [value, format]);

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
          !label && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 opacity-70" aria-hidden="true" />
        <span className="truncate">{label ?? placeholder}</span>
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
            mode="range"
            selected={
              value.from
                ? { from: value.from, to: value.to ?? undefined }
                : undefined
            }
            onSelect={(range) => {
              onValueChange({
                from: range?.from ?? null,
                to: range?.to ?? null,
              });
              if (range?.from && range.to) setOpen(false);
            }}
            numberOfMonths={2}
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
DateRangePicker.displayName = 'DateRangePicker';
