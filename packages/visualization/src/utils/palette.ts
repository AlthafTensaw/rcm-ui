/**
 * Chart palette and theme bridge.
 *
 * Every chart component reads its colors from here, never from raw hex. This
 * keeps chart styling consistent with the design tokens and supports future
 * dark mode without per-chart changes.
 *
 * The palette is derived from `@tensaw/design-system` tokens — primary teal
 * for the focused/current series, paired light teal for the comparison
 * series, and an accent rotation for multi-series charts (by-payer breakdowns
 * etc.).
 */

/**
 * Chart palette — token-aware names. The actual hex values come from the
 * design-system token CSS variables at runtime via `var(--tw-color-...)`.
 *
 * For Recharts (which doesn't accept CSS variables in all props), we fall
 * back to literal hex values that match the token defaults. When dark mode
 * is added, this file picks up the swap centrally.
 */
export const chartPalette = {
  /** Current period — primary brand teal. */
  current: '#14B8A6',
  /** Prior period — muted teal pair for comparison overlays. */
  prior: '#A7F3D0',
  /** Variance/rate line overlay — accent teal. */
  variance: '#218D8D',
  /** Reference / target lines. */
  reference: '#9CA3AF',
  /** Positive bars (when explicitly directional). */
  positive: '#10B981',
  /** Negative bars. */
  negative: '#DC2626',
  /** Neutral fallback. */
  neutral: '#6B7280',
  /**
   * Multi-series rotation. Used when a chart shows N payers / N clinics. The
   * order is: teal → blue → amber → purple → coral → green → indigo. Avoids
   * red/green pairing to stay color-blind friendly.
   */
  series: [
    '#14B8A6', // teal-500
    '#3B82F6', // blue-500
    '#F59E0B', // amber-500
    '#8B5CF6', // violet-500
    '#F97316', // orange-500
    '#10B981', // emerald-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
  ],
} as const;

/** Pick a series color by index, looping if there are more series than entries. */
export function seriesColor(index: number): string {
  return chartPalette.series[index % chartPalette.series.length] ?? chartPalette.neutral;
}

/**
 * Chart typography defaults. Recharts inherits from <text> SVG elements; these
 * are passed via `tick` and `label` props.
 */
export const chartFont = {
  family: 'system-ui, sans-serif',
  size: {
    axis: 12,
    label: 13,
    legend: 13,
    tooltipTitle: 13,
    tooltipBody: 12,
  },
  color: {
    axis: '#6B7280',
    label: '#374151',
    grid: '#E5E7EB',
  },
} as const;
