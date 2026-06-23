import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { radius } from 'constants/design';

interface AttentionRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  /** alert = needs money/overdue (error accent); info = neutral nudge */
  tone?: 'alert' | 'info';
  onPress?: () => void;
}

/**
 * One actionable item in the "Needs attention" list. Tinted only when it's a
 * real alert — never decorative color.
 */
export default function AttentionRow({
  icon,
  title,
  subtitle,
  tone = 'info',
  onPress,
}: AttentionRowProps) {
  const { colors } = useThemeContext();
  const accent = tone === 'alert' ? colors.error : colors.muted;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="flex-row items-center p-4"
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: accent + '1A' }}>
        <MaterialCommunityIcons name={icon} size={18} color={accent} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold" style={{ color: colors.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] font-medium" style={{ color: colors.muted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
    </TouchableOpacity>
  );
}
