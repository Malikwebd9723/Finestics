import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}

/** Custom SVG donut/pie — proportional ring segments with a centered label. */
export default function DonutChart({
  segments,
  size = 140,
  thickness = 22,
  centerTop,
  centerBottom,
}: DonutChartProps) {
  const { colors } = useThemeContext();
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={r} stroke={colors.gray} strokeWidth={thickness} fill="none" />
          {segments.map((s, i) => {
            if (s.value <= 0) return null;
            const len = (s.value / total) * C;
            const circle = (
              <Circle
                key={`${s.label}-${i}`}
                cx={cx}
                cy={cy}
                r={r}
                stroke={s.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                strokeLinecap="butt"
              />
            );
            acc += len;
            return circle;
          })}
        </G>
      </Svg>
      {centerTop || centerBottom ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {centerTop ? (
            <Text style={[typo.stat, { color: colors.text, fontSize: 22 }]}>{centerTop}</Text>
          ) : null}
          {centerBottom ? (
            <Text style={{ color: colors.muted, fontSize: 11 }}>{centerBottom}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
