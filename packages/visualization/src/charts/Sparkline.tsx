import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { chartPalette } from '../utils/palette';

export interface SparklineProps {
  /** Array of numeric values, in order. Treats null as gap. */
  data: (number | null)[];
  /** Chart height in px. Default 32. */
  height?: number;
  /** Chart width in px. Default 100. */
  width?: number;
  /** Color. Default chartPalette.current (teal). */
  color?: string;
  /** Auto-detect direction and color: rises green, falls red. Default false. */
  directionalColor?: boolean;
}

/**
 * Tiny inline trend chart for KPI cards, list rows, or report previews.
 *
 * No axes, no grid, no tooltip — just shape. For rich interaction, use
 * LineChart with a small height instead.
 */
export function Sparkline({
  data,
  height = 32,
  width = 100,
  color,
  directionalColor = false,
}: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ width, height }} aria-hidden />;
  }

  // Convert null to a passthrough so Recharts draws a gap. We map to {v: number}
  // so the area shows continuous shape; nulls become 0-baseline.
  const points = data.map((v, i) => ({ x: i, v: v ?? 0 }));

  let resolvedColor = color ?? chartPalette.current;
  if (directionalColor && data.length >= 2) {
    const first = data.find((d): d is number => d !== null);
    const last = [...data].reverse().find((d): d is number => d !== null);
    if (first !== undefined && last !== undefined) {
      resolvedColor =
        last > first ? chartPalette.positive : last < first ? chartPalette.negative : chartPalette.neutral;
    }
  }

  return (
    <div style={{ width, height, display: 'inline-block' }} aria-hidden>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={resolvedColor}
            fill={resolvedColor}
            fillOpacity={0.18}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
