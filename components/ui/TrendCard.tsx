import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { typo, radius } from 'constants/design';
import AreaChart from './AreaChart';

interface TrendCardProps {
  title: string;
  /** preformatted headline value for the charted period */
  value: string;
  delta?: { pct: number } | null;
  data: number[];
  /** full label array; the card shows start / middle / end only */
  labels?: string[];
  /** chart accent; defaults to primary */
  color?: string;
  /** 'card' = bordered surface; 'plain' = borderless for airy layouts */
  variant?: 'card' | 'plain';
  onPress?: () => void;
}

/** A featured trend chart — the screen's one rich graph. */
export default function TrendCard({
  title,
  value,
  delta,
  data,
  labels,
  color,
  variant = 'card',
  onPress,
}: TrendCardProps) {
  const { colors } = useThemeContext();
  const [w, setW] = useState(0);
  const plain = variant === 'plain';
  const accent = color || colors.primary;
  const up = (delta?.pct ?? 0) >= 0;
  const deltaColor = up ? colors.success : colors.error;
  const Wrapper: any = onPress ? TouchableOpacity : View;

  const ends =
    labels && labels.length > 1
      ? [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]]
      : null;

  return (
    <Wrapper
      activeOpacity={0.9}
      onPress={onPress}
      className={plain ? '' : 'p-4'}
      style={
        plain
          ? undefined
          : {
              backgroundColor: colors.card,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.border,
            }
      }>
      <View className="flex-row items-end justify-between">
        <View>
          <Text style={[typo.eyebrow, { color: colors.muted }]}>{title.toUpperCase()}</Text>
          <Text className="mt-1" style={[typo.stat, { color: colors.text, fontSize: 22 }]}>
            {value}
          </Text>
        </View>
        {delta ? (
          <View
            className="flex-row items-center rounded-full px-2 py-1"
            style={{ backgroundColor: deltaColor + '14' }}>
            <Text style={{ color: deltaColor, fontSize: 12, fontVariant: ['tabular-nums'] }}>
              {up ? '▲' : '▼'} {Math.abs(delta.pct).toFixed(0)}%
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-3" onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && data.length > 1 ? (
          <AreaChart data={data} width={w} color={accent} />
        ) : (
          <View style={{ height: 130 }} />
        )}
      </View>

      {ends ? (
        <View className="mt-1 flex-row justify-between">
          {ends.map((l, i) => (
            <Text key={`${l}-${i}`} style={{ color: colors.muted, fontSize: 11, fontWeight: '500' }}>
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </Wrapper>
  );
}
