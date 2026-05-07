/**
 * MultiSelect — multi-selection dropdown with chip display.
 *
 * Radix doesn't ship a multi-select primitive, so this is a Popover wrapping
 * a custom checkbox list. Trigger shows up to `maxDisplay` selected labels
 * as removable chips; overflow renders "+N more". An optional search input
 * filters the option list.
 *
 * Controlled — pass `values` (the selected value array) and `onValuesChange`.
 * Reuses `SelectOption` from `Select` for option shape consistency.
 */
import {
  forwardRef,
  useMemo,
  useState,
  type ElementRef,
} from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, X } from 'lucide-react';

import { Checkbox } from '../../primitives/Checkbox';
import { cn } from '../../utils/cn';
import type { SelectOption } from '../Select';

export interface MultiSelectProps<T extends string = string> {
  values: T[];
  onValuesChange: (values: T[]) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  /** Max chips to show before truncating to "+N more". Default 3. */
  maxDisplay?: number;
  disabled?: boolean;
  error?: boolean;
  /** Show a search input above the option list. */
  searchable?: boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
  width?: string | number;
}

export const MultiSelect = forwardRef<
  ElementRef<typeof PopoverPrimitive.Trigger>,
  MultiSelectProps
>(function MultiSelect(
  {
    values,
    onValuesChange,
    options,
    placeholder = 'Select…',
    maxDisplay = 3,
    disabled,
    error,
    searchable,
    'aria-label': ariaLabel,
    id,
    className,
    width,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const valueSet = useMemo(() => new Set(values), [values]);

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const selectedOptions = useMemo(
    () => options.filter((o) => valueSet.has(o.value)),
    [options, valueSet],
  );

  function toggle(v: string) {
    if (valueSet.has(v)) {
      onValuesChange(values.filter((x) => x !== v));
    } else {
      onValuesChange([...values, v]);
    }
  }

  const overflow = Math.max(selectedOptions.length - maxDisplay, 0);
  const chips = selectedOptions.slice(0, maxDisplay);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        ref={ref}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        disabled={disabled}
        className={cn(
          'flex min-h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-1 text-sm shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : 'border-input',
          className,
        )}
        style={width ? { width } : undefined}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {selectedOptions.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {chips.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
            >
              {opt.label}
              <span
                role="button"
                aria-label={`Remove ${opt.label}`}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(opt.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(opt.value);
                  }
                }}
                className="cursor-pointer rounded hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </span>
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-xs text-muted-foreground">
              +{overflow} more
            </span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          )}
        >
          {searchable && (
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              placeholder="Search…"
              className="mb-1 w-full rounded-sm border border-input bg-background px-2 py-1 text-sm"
              aria-label="Filter options"
            />
          )}
          <div role="listbox" aria-multiselectable="true">
            {visible.length === 0 && (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                No options.
              </div>
            )}
            {visible.map((opt) => {
              const checked = valueSet.has(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    opt.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={opt.disabled}
                    onCheckedChange={() => { toggle(opt.value); }}
                  />
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {opt.description}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}) as <T extends string = string>(
  props: MultiSelectProps<T> & { ref?: React.Ref<HTMLButtonElement> },
) => JSX.Element;
