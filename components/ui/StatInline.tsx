import React from 'react';
import { View, Text } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';

export interface StatItem {
  label: string;
  value: string;
  /** money in = success, money out / overdue = error, everything else = default */
  tone?: 'default' | 'success' | 'error';
}

/**
 * A row of 2–3 label/value pairs separated by hairline dividers.
 * Replaces grids of tinted metric cards — quieter, reads like a statement line.
 */
export default function StatInline({ items }: { items: StatItem[] }) {
  const { colors } = useThemeContext();

  const toneColor = (tone: StatItem['tone']) =>
    tone === 'success' ? colors.success : tone === 'error' ? colors.error : colors.text;

  return (
    <View
      className="flex-row rounded-2xl px-1 py-3"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      {items.map((item, i) => (
        <View
          key={item.label}
          className="flex-1 px-3"
          style={
            i > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border } : undefined
          }>
          <Text style={[typo.stat, { color: toneColor(item.tone) }]} numberOfLines={1}>
            {item.value}
          </Text>
          <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
