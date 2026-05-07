/**
 * Combobox — text input + dropdown.
 *
 * Built on `cmdk` for keyboard navigation + filtering. Two modes:
 *   - Static: pass `options` and the user filters by typing
 *   - Async: pass `search(query)` returning a promise; debounced by
 *     `searchDebounceMs` (default 250 ms)
 *
 * Trigger renders the selected option's label (or `placeholder`). Opens a
 * Popover containing a search input plus the result list. `renderOption`
 * lets consumers render rich rows (e.g., NPI lookup with provider name +
 * address).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

export interface ComboboxOption<T> {
  value: T;
  label: string;
  data?: unknown;
}

export interface ComboboxProps<T> {
  value: T | null;
  onValueChange: (value: T | null) => void;
  /** Static option list. Mutually exclusive with `search`. */
  options?: ComboboxOption<T>[];
  /** Async search. Mutually exclusive with `options`. */
  search?: (query: string) => Promise<ComboboxOption<T>[]>;
  searchDebounceMs?: number;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  renderOption?: (option: ComboboxOption<T>) => ReactNode;
  disabled?: boolean;
  error?: boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
  width?: string | number;
}

/**
 * Stable string key for an option. Combobox allows generic T but cmdk's
 * value attribute is string-only, so we stringify with a `__sep__` guard.
 */
function keyOf(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return JSON.stringify(v);
}

export function Combobox<T>({
  value,
  onValueChange,
  options,
  search,
  searchDebounceMs = 250,
  placeholder = 'Select…',
  emptyText = 'No results.',
  loadingText = 'Loading…',
  renderOption,
  disabled,
  error,
  'aria-label': ariaLabel,
  id,
  className,
  width,
}: ComboboxProps<T>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [asyncResults, setAsyncResults] = useState<ComboboxOption<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  // Async search effect.
  useEffect(() => {
    if (!search) return;
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const reqId = ++reqIdRef.current;
      void search(query).then((results) => {
        // Discard out-of-order responses.
        if (reqId !== reqIdRef.current) return;
        setAsyncResults(results);
        setLoading(false);
      });
    }, searchDebounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, search, searchDebounceMs]);

  // Eagerly seed async results once on open so the user sees something.
  useEffect(() => {
    if (open && search && asyncResults.length === 0 && !loading) {
      const reqId = ++reqIdRef.current;
      setLoading(true);
      void search('').then((results) => {
        if (reqId !== reqIdRef.current) return;
        setAsyncResults(results);
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const list: ComboboxOption<T>[] = useMemo(() => {
    if (search) return asyncResults;
    return options ?? [];
  }, [search, asyncResults, options]);

  const valueKey = value !== null && value !== undefined ? keyOf(value) : null;

  const selectedLabel = useMemo(() => {
    if (valueKey === null) return null;
    const inList = list.find((o) => keyOf(o.value) === valueKey);
    if (inList) return inList.label;
    // Static fallback: search the original options for the label even if the
    // current `list` (filtered cmdk view) doesn't contain it.
    const fromStatic = options?.find((o) => keyOf(o.value) === valueKey);
    return fromStatic?.label ?? null;
  }, [valueKey, list, options]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : 'border-input',
          className,
        )}
        style={width ? { width } : undefined}
      >
        <span
          className={cn(
            'truncate',
            selectedLabel === null && 'text-muted-foreground',
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          )}
        >
          <Command shouldFilter={!search} label={ariaLabel ?? 'Combobox'}>
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search…"
              className="w-full border-b border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Command.List className="max-h-60 overflow-y-auto p-1">
              {loading && (
                <Command.Loading>
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {loadingText}
                  </div>
                </Command.Loading>
              )}
              {!loading && list.length === 0 && (
                <Command.Empty className="px-2 py-3 text-center text-sm text-muted-foreground">
                  {emptyText}
                </Command.Empty>
              )}
              {list.map((opt) => {
                const k = keyOf(opt.value);
                const selected = valueKey === k;
                return (
                  <Command.Item
                    key={k}
                    value={k}
                    keywords={[opt.label]}
                    onSelect={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {selected && <Check className="h-4 w-4" />}
                    </span>
                    {renderOption ? renderOption(opt) : opt.label}
                  </Command.Item>
                );
              })}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
Combobox.displayName = 'Combobox';
