import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width: number;
  height?: number;
  color?: string;
  /** optional area fill under the line (e.g. a translucent white on a dark hero) */
  fillColor?: string;
  strokeWidth?: number;
}

/**
 * Minimal, dependency-light trend line. One series, no axes, no gridlines —
 * the house style for sparklines (see SKILL.md §charts).
 */
export default function Sparkline({
  data,
  width,
  height = 44,
  color = '#FFFFFF',
  fillColor,
  strokeWidth = 2,
}: SparklineProps) {
  if (!data || data.length < 2 || width <= 0) {
    return <View style={{ height }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pad = strokeWidth + 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');

  const area = fillColor
    ? `${line} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`
    : null;

  return (
    <Svg width={width} height={height}>
      {area ? <Path d={area} fill={fillColor} /> : null}
      <Path
        d={line}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
