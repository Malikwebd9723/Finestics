import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { typo, radius } from 'constants/design';

interface StatCellProps {
  label: string;
  value: string;
  /** money in = success, money out / overdue = error, else default */
  tone?: 'default' | 'success' | 'error';
  /** shown only in boxed mode */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** boxed = bordered card surface; default = borderless for airy layouts */
  boxed?: boolean;
  onPress?: () => void;
}

/** Metric (value over label). Borderless by default, or a bordered card when `boxed`. */
export default function StatCell({
  label,
  value,
  tone = 'default',
  icon,
  boxed,
  onPress,
}: StatCellProps) {
  const { colors } = useThemeContext();
  const valueColor =
    tone === 'success' ? colors.success : tone === 'error' ? colors.error : colors.text;
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      activeOpacity={0.8}
      onPress={onPress}
      className={boxed ? 'p-4' : ''}
      style={
        boxed
          ? {
              backgroundColor: colors.card,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.border,
            }
          : undefined
      }>
      {boxed && icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.muted}
          style={{ marginBottom: 8 }}
        />
      ) : null}
      <Text style={[typo.stat, { color: valueColor, fontSize: 20 }]} numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-1 text-[13px] font-medium" style={{ color: colors.muted }}>
        {label}
      </Text>
    </Wrapper>
  );
}
