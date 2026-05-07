/**
 * Select — single-select dropdown.
 *
 * Wraps `@radix-ui/react-select` with a Tensaw shape: pass `options` as data
 * and let the component render the trigger + content + items. When no
 * selection is made, `placeholder` is shown; when made, the matching label.
 *
 * Controlled only — pass `value` and `onValueChange`. For form integration,
 * compose inside `<FormField>` (§8.1.9).
 */
import {
  forwardRef,
  type ElementRef,
} from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
}

const TRIGGER_SIZE = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3 text-base',
} as const;

export interface SelectProps<T extends string = string> {
  value: T | null;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: keyof typeof TRIGGER_SIZE;
  width?: string | number;
  'aria-label'?: string;
  /** Optional id for label association. */
  id?: string;
  className?: string;
  /** Optional name (helpful when used inside `<form>`). */
  name?: string;
}

export const Select = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  SelectProps
>(function Select(
  {
    value,
    onValueChange,
    options,
    placeholder,
    disabled,
    error,
    size = 'md',
    width,
    'aria-label': ariaLabel,
    id,
    className,
    name,
  },
  ref,
) {
  return (
    <SelectPrimitive.Root
      value={value ?? undefined}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        className={cn(
          'flex w-full items-center justify-between rounded-md border bg-background shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[placeholder]:text-muted-foreground',
          TRIGGER_SIZE[size],
          error ? 'border-destructive' : 'border-input',
          className,
        )}
        style={width ? { width } : undefined}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  'focus:bg-accent focus:text-accent-foreground',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                {opt.description && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                )}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}) as <T extends string = string>(
  props: SelectProps<T> & { ref?: React.Ref<HTMLButtonElement> },
) => JSX.Element;
