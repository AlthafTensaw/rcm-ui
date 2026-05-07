import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartFont, seriesColor } from '../utils/palette';
import { EmptyChart } from './EmptyChart';
import { resolveFormatter } from './resolveFormatter';
import type { BaseChartProps } from './types';

export interface BarChartProps<T> extends BaseChartProps<T> {
  /**
   * Layout: 'vertical' has bars rising from the x-axis (default).
   * 'horizontal' has bars extending right from the y-axis.
   */
  layout?: 'vertical' | 'horizontal';
}

/**
 * Bar chart with single or multi-series support. For comparison patterns
 * (current vs prior period), pass both as separate series — Recharts groups
 * them automatically.
 *
 * Used by:
 *   - Compare view (Total Denials by Payer, current vs prior)
 *   - Report view (Denials by Payer trend with monthly bars)
 *   - Dashboard tiles
 */
export function BarChart<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  height = 320,
  showLegend = true,
  showGrid = true,
  yAxisFormat = 'money-compact',
  emptyMessage,
  layout = 'vertical',
}: BarChartProps<T>) {
  if (data.length === 0) {
    return <EmptyChart message={emptyMessage} height={height} />;
  }

  const yFormatter = resolveFormatter(yAxisFormat);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout === 'horizontal' ? 'vertical' : 'horizontal'}
        margin={{ top: 16, right: 24, bottom: 8, left: 12 }}
      >
        {showGrid ? <CartesianGrid stroke={chartFont.color.grid} vertical={false} /> : null}
        {layout === 'vertical' ? (
          <>
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
              tickLine={false}
              axisLine={{ stroke: chartFont.color.grid }}
            />
            <YAxis
              tickFormatter={(v) => yFormatter(v as number)}
              tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
              tickLine={false}
              axisLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tickFormatter={(v) => yFormatter(v as number)}
              tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              tick={{ fill: chartFont.color.axis, fontSize: chartFont.size.axis }}
              tickLine={false}
              axisLine={{ stroke: chartFont.color.grid }}
              width={120}
            />
          </>
        )}
        <Tooltip
          formatter={(value, _name, item) => {
            const s = series.find((sx) => sx.dataKey === item.dataKey);
            const fmt = resolveFormatter(s?.format ?? yAxisFormat);
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
        {series.map((s, i) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label}
            fill={s.color ?? seriesColor(i)}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
