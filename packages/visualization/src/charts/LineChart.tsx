import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartFont, seriesColor } from '../utils/palette';
import { EmptyChart } from './EmptyChart';
import { resolveFormatter } from './resolveFormatter';
import type { BaseChartProps } from './types';

export interface LineChartProps<T> extends BaseChartProps<T> {
  /** Render as an area chart with subtle fill under each line. */
  area?: boolean;
  /** Smooth curves. Default false (straight segments). */
  smooth?: boolean;
}

/**
 * Multi-series line chart. Used for service-type trend, denial rate over
 * time, and any multi-month comparison.
 *
 * For combo bar+line charts (e.g., bars for absolute denials + line for rate),
 * use ComboChart instead.
 */
export function LineChart<T extends Record<string, unknown>>({
  data,
  xAxisKey,
  series,
  height = 320,
  showLegend = true,
  showGrid = true,
  yAxisFormat = 'money-compact',
  emptyMessage,
  area = false,
  smooth = false,
}: LineChartProps<T>) {
  if (data.length === 0) {
    return <EmptyChart message={emptyMessage} height={height} />;
  }

  const yFormatter = resolveFormatter(yAxisFormat);
  const Chart = area ? AreaChart : RechartsLineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 12 }}>
        {showGrid ? <CartesianGrid stroke={chartFont.color.grid} vertical={false} /> : null}
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
            iconType="line"
          />
        ) : null}
        {series.map((s, i) =>
          area ? (
            <Area
              key={s.dataKey}
              type={smooth ? 'monotone' : 'linear'}
              dataKey={s.dataKey}
              name={s.label}
              stroke={s.color ?? seriesColor(i)}
              fill={s.color ?? seriesColor(i)}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ) : (
            <Line
              key={s.dataKey}
              type={smooth ? 'monotone' : 'linear'}
              dataKey={s.dataKey}
              name={s.label}
              stroke={s.color ?? seriesColor(i)}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
