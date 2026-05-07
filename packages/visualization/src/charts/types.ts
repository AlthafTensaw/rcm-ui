/**
 * Shared chart types.
 *
 * Every chart accepts a `data` array and a `series` config. The series config
 * declares which data keys to render and how to label them. This keeps the
 * call sites declarative — apps never touch Recharts internals directly.
 */

export type ValueFormat = 'money' | 'money-compact' | 'percent' | 'integer' | 'integer-compact';

export interface ChartSeries {
  /** Key in each data point row to read this series' value from. */
  dataKey: string;
  /** Legend / tooltip label. */
  label: string;
  /** Color override. Defaults to palette rotation. */
  color?: string;
  /** Display format for tooltip values. Default 'money-compact'. */
  format?: ValueFormat;
}

export interface ChartLineSeries extends ChartSeries {
  /** Set true to render this series as a line on a combo chart. */
  asLine?: boolean;
  /** Right-axis (secondary) y-axis. Default false. */
  yAxis?: 'left' | 'right';
}

/** Common props shared across chart components. */
export interface BaseChartProps<T> {
  /** Data rows. Each row keyed by xAxisKey + every series.dataKey. */
  data: T[];
  /** Key in each row to use as the x-axis label. */
  xAxisKey: keyof T & string;
  /** Series configuration. */
  series: ChartSeries[];
  /** Optional fixed height. Default 320. */
  height?: number;
  /** Show legend. Default true. */
  showLegend?: boolean;
  /** Show grid lines. Default true. */
  showGrid?: boolean;
  /** Format for the y-axis labels. Default 'money-compact'. */
  yAxisFormat?: ValueFormat;
  /** Optional empty-state message. Shown when data is empty. */
  emptyMessage?: string;
}
