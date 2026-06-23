import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { typo, radius } from 'constants/design';

interface MetricChipProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  /** money in = success, money out / overdue = error, else default */
  tone?: 'default' | 'success' | 'error';
  onPress?: () => void;
}

/** Compact KPI tile, sized for a horizontal strip. */
export default function MetricChip({ icon, label, value, tone = 'default', onPress }: MetricChipProps) {
  const { colors } = useThemeContext();
  const valueColor =
    tone === 'success' ? colors.success : tone === 'error' ? colors.error : colors.text;
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      activeOpacity={0.85}
      onPress={onPress}
      className="mr-3 p-3.5"
      style={{
        width: 140,
        backgroundColor: colors.card,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.muted} />
      <Text className="mt-2" style={[typo.stat, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-0.5 text-xs" style={{ color: colors.muted }} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
  );
}
