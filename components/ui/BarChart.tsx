import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useThemeContext } from 'context/ThemeProvider';

interface Bar {
  label: string;
  value: number;
}

interface BarChartProps {
  data: Bar[];
  height?: number;
  /** bar color; defaults to primary */
  color?: string;
  /** draw the value above each bar */
  showValues?: boolean;
  /** all = label per bar; sparse = first/mid/last only; none = no labels */
  labelMode?: 'all' | 'sparse' | 'none';
}

/** Custom SVG vertical bar chart — one accent color, value labels, no gridlines. */
export default function BarChart({
  data,
  height = 170,
  color,
  showValues = true,
  labelMode = 'all',
}: BarChartProps) {
  const { colors } = useThemeContext();
  const [w, setW] = useState(0);
  const accent = color || colors.primary;

  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const topPad = showValues ? 16 : 6;
  const plotH = height - topPad;
  const slot = w / n;
  const barW = Math.min(30, slot * 0.5);

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {data.map((d, i) => {
            const barH = (d.value / max) * (plotH - 4);
            const x = slot * i + slot / 2 - barW / 2;
            const y = height - barH;
            return (
              <React.Fragment key={`${d.label}-${i}`}>
                <Rect x={x} y={y} width={barW} height={Math.max(barH, 1)} rx={4} fill={accent} />
                {showValues && d.value > 0 ? (
                  <SvgText
                    x={slot * i + slot / 2}
                    y={y - 4}
                    fontSize={10}
                    fontWeight="600"
                    fill={colors.text}
                    textAnchor="middle">
                    {d.value}
                  </SvgText>
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {labelMode === 'all' ? (
        <View className="mt-1 flex-row">
          {data.map((d, i) => (
            <Text
              key={`${d.label}-${i}`}
              className="text-center"
              style={{ flex: 1, color: colors.muted, fontSize: 11, fontWeight: '500' }}
              numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      ) : labelMode === 'sparse' && data.length > 1 ? (
        <View className="mt-1 flex-row justify-between">
          {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d, i) => (
            <Text key={i} style={{ color: colors.muted, fontSize: 10, fontWeight: '500' }}>
              {d.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
