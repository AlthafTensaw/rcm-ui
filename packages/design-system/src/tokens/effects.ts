/**
 * Effect tokens — shadows, motion, z-index.
 *
 * From UI Standards: shadow `0 2px 8px rgba(15, 118, 110, 0.008)` is the
 * widget shadow.
 */

export const shadow = {
  none: 'none',
  // Widget / card — extremely subtle teal-tinted shadow per UI standards.
  sm: '0 2px 8px rgba(15, 118, 110, 0.08)',
  md: '0 4px 12px rgba(15, 118, 110, 0.1)',
  lg: '0 10px 24px rgba(15, 118, 110, 0.12)',
  // Modal / overlay
  xl: '0 25px 50px rgba(15, 23, 42, 0.25)',
  // Inset (for pressed buttons, recessed wells)
  inset: 'inset 0 2px 4px rgba(15, 23, 42, 0.06)',
  // Focus ring — used on every interactive element
  focusRing: '0 0 0 3px rgba(20, 184, 166, 0.35)',
} as const;

export type ShadowKey = keyof typeof shadow;

export const motion = {
  duration: {
    instant: '0ms',
    fast: '120ms',
    normal: '200ms',
    slow: '320ms',
    slower: '480ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decel: 'cubic-bezier(0, 0, 0.2, 1)',
    accel: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;

/**
 * Z-index scale. Each tier is named so layout decisions are explicit.
 * Surfaces (modal/drawer/popover) use these — never raw z-index numbers.
 */
export const zIndex = {
  base: 0,
  raised: 1,
  sticky: 100,
  fixed: 200,
  dropdown: 1000,
  popover: 1100,
  tooltip: 1200,
  drawer: 1300,
  modal: 1400,
  toast: 1500,
  loadingMask: 1600,
} as const;

export type ZIndexKey = keyof typeof zIndex;
