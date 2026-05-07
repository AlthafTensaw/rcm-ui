import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartFont, seriesColor } from '../utils/palette';
import { EmptyChart } from './EmptyChart';
import { resolveFormatter } from './resolveFormatter';
import type { BaseChartProps, ChartLineSeries, ValueFormat } from './types';

export interface ComboChartProps<T> extends Omit<BaseChartProps<T>, 'series'> {
  series: ChartLineSeries[];
  /** Format for the right (secondary) y-axis. Default 'percent'. */
  rightAxisFormat?: ValueFormat;
}

/**
 * Combo chart: bars on the left axis (absolute values), line on the right
 * axis (rate or percent). The Compare screen uses this for "Total Denials by
 * Payer (bars) + Denial Rate (line)".
 *
 * Set `asLine: true` and optionally `yAxis: 'right'` on a series to render it
 * as a line instead of a bar.
 */
export function ComboChart<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  height = 320,
  showLegend = true,
  showGrid = true,
  yAxisFormat = 'money-compact',
  rightAxisFormat = 'percent',
  emptyMessage,
}: ComboChartProps<T>) {
  if (data.length === 0) {
    return <EmptyChart message={emptyMessage} height={height} />;
  }

  const leftFormatter = resolveFormatter(yAxisFormat);
  const rightFormatter = resolveFormatter(rightAxisFormat);
  const hasRightAxis = series.some((s) => s.yAxis === 'right');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
        {showGrid ? <CartesianGrid stroke={chartFont.color.grid} vertical={false} /> : null}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
          tickLine={false}
          axisLine={{ stroke: chartFont.color.grid }}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(v) => leftFormatter(v as number)}
          tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
          tickLine={false}
          axisLine={false}
        />
        {hasRightAxis ? (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => rightFormatter(v as number)}
            tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
            tickLine={false}
            axisLine={false}
          />
        ) : null}
        <Tooltip
          formatter={(value, _name, item) => {
            const s = series.find((sx) => sx.dataKey === item.dataKey);
            const fmt = resolveFormatter(s?.format ?? (s?.yAxis === 'right' ? rightAxisFormat : yAxisFormat));
            return [fmt(value as number), s?.label ?? item.dataKey];
          }}
          contentStyle={{
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: chartFont.size.tooltipBody,
          }}
          labelStyle={{ fontWeight: 600, color: chartFont.color.label }}
        />
        {showLegend ? (
          <Legend
            wrapperStyle={{ fontSize: chartFont.size.legend, paddingTop: 8 }}
            iconType="circle"
          />
        ) : null}
        {series.map((s, i) =>
          s.asLine ? (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              yAxisId={s.yAxis ?? 'left'}
              stroke={s.color ?? seriesColor(i)}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ) : (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.label}
              yAxisId={s.yAxis ?? 'left'}
              fill={s.color ?? seriesColor(i)}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          ),
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
