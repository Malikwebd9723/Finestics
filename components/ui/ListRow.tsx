import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fonts, typo } from 'constants/design';

interface ListRowProps {
  /** short leading text (e.g. initials) — ignored if `icon` is set */
  leading?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  amount?: string;
  /** color the amount (money in = success, money out / overdue = error) */
  amountTone?: 'default' | 'success' | 'error';
  badge?: { label: string; tone?: 'default' | 'success' | 'error' };
  divider?: boolean;
  onPress?: () => void;
}

/** Generic activity row: leading token, title/subtitle, trailing amount + badge. */
export default function ListRow({
  leading,
  icon,
  title,
  subtitle,
  amount,
  amountTone = 'default',
  badge,
  divider,
  onPress,
}: ListRowProps) {
  const { colors } = useThemeContext();
  const badgeColor =
    badge?.tone === 'success'
      ? colors.success
      : badge?.tone === 'error'
        ? colors.error
        : colors.muted;
  const amountColor =
    amountTone === 'success' ? colors.success : amountTone === 'error' ? colors.error : colors.text;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="flex-row items-center py-3"
      style={divider ? { borderTopWidth: 1, borderTopColor: colors.border } : undefined}>
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.primary + '14' }}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
        ) : (
          <Text style={{ color: colors.primary, fontFamily: fonts.bold, fontSize: 12 }}>
            {leading}
          </Text>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-[15px] font-bold" style={{ color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] font-medium" style={{ color: colors.muted }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="ml-2 items-end">
        {amount ? (
          <Text style={[typo.num, { color: amountColor, fontSize: 15 }]}>{amount}</Text>
        ) : null}
        {badge ? (
          <Text className="mt-0.5 text-xs font-medium" style={{ color: badgeColor }}>
            {badge.label}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
