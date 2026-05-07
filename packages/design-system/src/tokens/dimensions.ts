/**
 * Dimension tokens.
 *
 * Numeric scales for spacing, typography, radius, and breakpoints. From the
 * UI Standards: 4px base unit, 24px widget padding, 16px field gap, 44px
 * table header height, 12px container radius, 8px input radius.
 */

/** 4px base unit. Multiply for any spacing decision. */
export const SPACING_BASE = 4;

export const spacing = {
  0: '0px',
  1: `${SPACING_BASE}px`, //  4
  2: `${SPACING_BASE * 2}px`, //  8
  3: `${SPACING_BASE * 3}px`, // 12
  4: `${SPACING_BASE * 4}px`, // 16  ← field gap
  5: `${SPACING_BASE * 5}px`, // 20
  6: `${SPACING_BASE * 6}px`, // 24  ← widget padding
  8: `${SPACING_BASE * 8}px`, // 32
  10: `${SPACING_BASE * 10}px`, // 40
  12: `${SPACING_BASE * 12}px`, // 48
  16: `${SPACING_BASE * 16}px`, // 64
  20: `${SPACING_BASE * 20}px`, // 80
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Density mode controls vertical compactness for tables and dense forms.
 * Each component reads token values via the active density via CSS vars.
 */
export const density = {
  comfortable: {
    rowHeight: '44px',
    inputHeight: '40px',
    buttonHeight: '40px',
    padding: '16px 20px',
  },
  compact: {
    rowHeight: '32px',
    inputHeight: '32px',
    buttonHeight: '32px',
    padding: '8px 12px',
  },
} as const;

export type Density = keyof typeof density;

export const radius = {
  none: '0px',
  sm: '4px',
  md: '8px', //  ← input radius
  lg: '12px', // ← container/widget radius
  xl: '16px',
  full: '9999px',
} as const;

export type RadiusKey = keyof typeof radius;

export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px', // ← input + table cell + table header
    md: '15px',
    lg: '16px',
    xl: '18px', // ← widget title
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
    '5xl': '36px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.02em',
  },
} as const;

/** Breakpoints (min-width, mobile-first). */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;
