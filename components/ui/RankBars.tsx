import React from 'react';
import { View, Text } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';

export interface RankItem {
  id: string | number;
  label: string;
  value: number;
}

interface RankBarsProps {
  items: RankItem[];
  /** bar fill; defaults to primary */
  color?: string;
  /** value color tone (money in = success, out = error) */
  valueTone?: 'default' | 'success' | 'error';
  formatValue?: (n: number) => string;
}

/** Horizontal ranking bars — label + value over a proportional bar. */
export default function RankBars({
  items,
  color,
  valueTone = 'success',
  formatValue,
}: RankBarsProps) {
  const { colors } = useThemeContext();
  if (!items.length) return null;

  const max = Math.max(...items.map((i) => i.value), 1);
  const fill = color || colors.primary;
  const valueColor =
    valueTone === 'success' ? colors.success : valueTone === 'error' ? colors.error : colors.text;
  const fmt = formatValue || ((n: number) => String(n));

  return (
    <View>
      {items.map((it) => {
        const pct = Math.max(4, (it.value / max) * 100);
        return (
          <View key={it.id} style={{ paddingVertical: 6 }}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text
                className="flex-1 text-sm font-semibold"
                style={{ color: colors.text }}
                numberOfLines={1}>
                {it.label}
              </Text>
              <Text className="ml-2" style={[typo.num, { color: valueColor, fontSize: 15 }]}>
                {fmt(it.value)}
              </Text>
            </View>
            <View
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: colors.gray }}>
              <View
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: fill }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
