import type { ValueFormat } from './types';
import {
  formatIntegerCompact,
  formatInteger,
  formatMoneyCompact,
  formatMoneyUsd,
  formatPercent,
} from '../utils/formatters';

/**
 * Resolve a ValueFormat enum to a formatter function. Used by every chart
 * for axis ticks and tooltip values.
 */
export function resolveFormatter(format: ValueFormat | undefined): (v: number | null | undefined) => string {
  switch (format) {
    case 'money':
      return formatMoneyUsd;
    case 'money-compact':
      return formatMoneyCompact;
    case 'percent':
      return (v) => formatPercent(v ?? null);
    case 'integer':
      return formatInteger;
    case 'integer-compact':
      return formatIntegerCompact;
    default:
      return formatMoneyCompact;
  }
}
