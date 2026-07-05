import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useThemeContext } from 'context/ThemeProvider';

export interface LineSeries {
  label: string;
  data: number[];
  color: string;
}

interface LineChartProps {
  series: LineSeries[];
  /** full label array; start / middle / end shown beneath */
  labels?: string[];
  height?: number;
  showLegend?: boolean;
}

/** Custom SVG multi-series line chart — for comparisons (e.g. sales vs collected). */
export default function LineChart({
  series,
  labels,
  height = 150,
  showLegend = true,
}: LineChartProps) {
  const { colors } = useThemeContext();
  const [w, setW] = useState(0);

  const all = series.flatMap((s) => s.data);
  if (!all.length) return null;
  const max = Math.max(...all);
  const min = Math.min(...all, 0);
  const span = max - min || 1;
  const padX = 4;
  const padY = 8;

  const ptsFor = (data: number[]) => {
    const n = data.length;
    const stepX = (w - padX * 2) / Math.max(1, n - 1);
    return data.map((v, i) => {
      const x = padX + i * stepX;
      const y = padY + (1 - (v - min) / span) * (height - padY * 2);
      return [x, y] as const;
    });
  };
  const pathFor = (pts: readonly (readonly [number, number])[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  const ends =
    labels && labels.length > 1
      ? [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]]
      : null;

  return (
    <View>
      <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            {series.map((s, si) => {
              if (s.data.length < 2) return null;
              const pts = ptsFor(s.data);
              const last = pts[pts.length - 1];
              return (
                <React.Fragment key={`${s.label}-${si}`}>
                  <Path
                    d={pathFor(pts)}
                    stroke={s.color}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <Circle cx={last[0]} cy={last[1]} r={3} fill={s.color} />
                </React.Fragment>
              );
            })}
          </Svg>
        ) : (
          <View style={{ height }} />
        )}
      </View>

      {ends ? (
        <View className="mt-1 flex-row justify-between">
          {ends.map((l, i) => (
            <Text key={`${l}-${i}`} style={{ color: colors.muted, fontSize: 10 }}>
              {l}
            </Text>
          ))}
        </View>
      ) : null}

      {showLegend ? (
        <View className="mt-2 flex-row flex-wrap">
          {series.map((s) => (
            <View key={s.label} className="mr-4 flex-row items-center">
              <View
                className="mr-1.5 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <Text className="text-xs" style={{ color: colors.muted }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
