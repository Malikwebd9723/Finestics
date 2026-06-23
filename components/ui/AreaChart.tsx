import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

interface AreaChartProps {
  data: number[];
  width: number;
  height?: number;
  color: string;
  showLastDot?: boolean;
}

/**
 * Custom SVG area chart — soft gradient fill, single series, no axes.
 * Hand-drawn so it doesn't carry a charting library's default look.
 */
export default function AreaChart({
  data,
  width,
  height = 130,
  color,
  showLastDot = true,
}: AreaChartProps) {
  if (!data || data.length < 2 || width <= 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const padX = 2;
  const padY = 8;
  const stepX = (width - padX * 2) / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (v - min) / span) * (height - padY * 2);
    return [x, y] as const;
  });

  const line = pts
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const gid = `ac-${color.replace('#', '')}`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${gid})`} />
      <Path
        d={line}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showLastDot ? <Circle cx={last[0]} cy={last[1]} r={3.5} fill={color} /> : null}
    </Svg>
  );
}
