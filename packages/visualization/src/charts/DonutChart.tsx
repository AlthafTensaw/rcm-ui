import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { chartFont, seriesColor } from '../utils/palette';
import { EmptyChart } from './EmptyChart';
import { resolveFormatter } from './resolveFormatter';
import type { ValueFormat } from './types';

export interface DonutSegment {
  /** Display label. */
  label: string;
  /** Numeric value. */
  value: number;
  /** Color override. Default rotates through palette. */
  color?: string;
}

export interface DonutChartProps {
  data: DonutSegment[];
  height?: number;
  /** Format for tooltip and center stat. Default 'integer'. */
  format?: ValueFormat;
  /**
   * If set, renders a center stat. Pass a string for a custom label or `true`
   * to use the formatted total. Default true.
   */
  centerStat?: string | true | false;
  /** Custom secondary text below the center stat. */
  centerSubtitle?: string;
  showLegend?: boolean;
  emptyMessage?: string;
}

/**
 * Donut (ring) chart with center statistic. Used on the Reports screen for
 * 30-day Status / 30-day Service breakdowns.
 *
 * For multi-segment categorical data; not for KPI primary visualization (use
 * KpiCard for that).
 */
export function DonutChart({
  data,
  height = 280,
  format = 'integer',
  centerStat = true,
  centerSubtitle,
  showLegend = true,
  emptyMessage,
}: DonutChartProps) {
  if (data.length === 0) {
    return <EmptyChart message={emptyMessage} height={height} />;
  }

  const formatter = resolveFormatter(format);
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="#FFFFFF"
            strokeWidth={2}
          >
            {data.map((segment, i) => (
              <Cell key={segment.label} fill={segment.color ?? seriesColor(i)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatter(value as number), name]}
            contentStyle={{
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: chartFont.size.tooltipBody,
            }}
          />
          {showLegend ? (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: chartFont.size.legend, paddingLeft: 16 }}
              iconType="circle"
            />
          ) : null}
        </PieChart>
      </ResponsiveContainer>
      {centerStat !== false ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // Center over the pie, accounting for legend on the right.
            paddingRight: showLegend ? '30%' : 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: chartFont.color.label,
              fontFamily: chartFont.family,
            }}
          >
            {centerStat === true ? formatter(total) : centerStat}
          </div>
          {centerSubtitle ? (
            <div
              style={{
                fontSize: 12,
                color: chartFont.color.axis,
                fontFamily: chartFont.family,
                marginTop: 2,
              }}
            >
              {centerSubtitle}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
