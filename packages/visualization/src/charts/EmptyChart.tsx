import type { CSSProperties } from 'react';

interface EmptyChartProps {
  message?: string;
  height?: number;
}

/**
 * Used by every chart when `data.length === 0`. Distinct from a generic
 * EmptyState in that it preserves the chart's footprint (so the layout
 * doesn't jump as data loads).
 */
export function EmptyChart({ message = 'No data available', height = 320 }: EmptyChartProps) {
  const style: CSSProperties = {
    width: '100%',
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(229, 231, 235, 0.4) 6px, rgba(229, 231, 235, 0.4) 12px)',
    border: '1px dashed #E5E7EB',
    borderRadius: 8,
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
  };
  return <div role="status" style={style}>{message}</div>;
}
