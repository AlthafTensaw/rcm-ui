/**
 * Numeric formatters for charts and KPIs.
 *
 * The platform is US-only and USD-only. These formatters lock conventions:
 *   - Money: `$1,234.56` positive, `-$164.86` negative (leading minus).
 *   - Percent: `14.2%` (one decimal by default).
 *   - Integer / count: `1,234`.
 *   - Compact: `$392K`, `$1.2M` for chart axes where space is tight.
 *
 * Each formatter accepts `null | undefined` and returns `'—'` (em-dash). This
 * matches the design-system convention for missing values.
 */

const EM_DASH = '—';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdNoCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const compactCurrencyK = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 1,
});

const compactInteger = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** `$1,234.56` / `-$164.86` / `'—'` for null. */
export function formatMoneyUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  // Intl returns `-$164.86` already with leading minus on negative values.
  return usd.format(value);
}

/** `$1,234` for full-dollar-only display. */
export function formatMoneyUsdNoCents(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  return usdNoCents.format(value);
}

/**
 * Compact money for chart axes: `$392K`, `$1.2M`. Uses no-cents under $1000.
 */
export function formatMoneyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  if (Math.abs(value) < 1000) return usdNoCents.format(value);
  // Thousands range: no decimals (e.g. $392K). Millions+: keep one decimal (e.g. $1.2M).
  if (Math.abs(value) < 1_000_000) return compactCurrencyK.format(value);
  return compactCurrency.format(value);
}

/** `14.2%` (one decimal). `value` is the raw percent (14.2 not 0.142). */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  return `${value.toFixed(decimals)}%`;
}

/** Integer with thousands separators. */
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  return integer.format(Math.round(value));
}

/** Compact integer for chart axes: `1.2K`, `45K`. */
export function formatIntegerCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  if (Math.abs(value) < 1000) return integer.format(Math.round(value));
  return compactInteger.format(value);
}

/**
 * Format a delta as `↑14.2%` / `↓11.0%`. Sign is encoded in the arrow, not in
 * the number itself, so callers don't need to abs() before passing.
 */
export function formatDeltaPercent(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '·';
  return `${arrow}${Math.abs(value).toFixed(decimals)}%`;
}

/**
 * Money delta as `$24,851` / `-$7,813` (signed). Used on KPI cards and
 * variance columns.
 */
export function formatDeltaMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  return usdNoCents.format(value);
}
