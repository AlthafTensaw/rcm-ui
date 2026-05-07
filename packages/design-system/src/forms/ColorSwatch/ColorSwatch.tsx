/**
 * ColorSwatch — preset color picker.
 *
 * v1 ships a preset-based selector: a row of swatches the user clicks. No
 * full HSL/RGB picker (deferred to v2 per spec §8.1.7). `defaultColors` is
 * the canonical Tensaw palette; `customColors` augments it for tenant
 * overrides.
 *
 * Controlled — pass `value` (a hex string or null) and `onValueChange`. The
 * selected swatch shows a check mark.
 */
import { forwardRef } from 'react';
import { Check } from 'lucide-react';

import { cn } from '../../utils/cn';

const TENSAW_DEFAULT_COLORS = [
  '#149A9A', // teal (Tensaw primary)
  '#0F888D',
  '#218D8D',
  '#1F2937',
  '#6B7280',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
];

export interface ColorSwatchProps {
  value: string | null;
  onValueChange: (color: string) => void;
  /** Default palette. Defaults to the Tensaw 10-color palette. */
  defaultColors?: string[];
  /** Additional swatches appended after defaults. */
  customColors?: string[];
  disabled?: boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
}

export const ColorSwatch = forwardRef<HTMLDivElement, ColorSwatchProps>(
  function ColorSwatch(
    {
      value,
      onValueChange,
      defaultColors = TENSAW_DEFAULT_COLORS,
      customColors,
      disabled,
      'aria-label': ariaLabel = 'Color',
      id,
      className,
    },
    ref,
  ) {
    const all = customColors
      ? [...defaultColors, ...customColors]
      : defaultColors;

    return (
      <div
        ref={ref}
        id={id}
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex flex-wrap items-center gap-1.5',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        {all.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color}
              disabled={disabled}
              onClick={() => { onValueChange(color); }}
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selected ? 'border-foreground' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
            >
              {selected && (
                <Check
                  className="h-3.5 w-3.5"
                  // White check on dark swatches; dark on light. Approximate
                  // by computing perceived luminance.
                  style={{ color: pickContrast(color) }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  },
);
ColorSwatch.displayName = 'ColorSwatch';

/**
 * Approximate luminance check for picking a check-mark color that contrasts
 * with the swatch fill. Threshold tuned for hex inputs the spec lists.
 */
function pickContrast(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return '#fff';
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Rec. 709 luminance approximation
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 140 ? '#1F2937' : '#fff';
}
