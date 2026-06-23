import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';

interface SectionProps {
  /** optional eyebrow label */
  title?: string;
  /** optional right-aligned link, e.g. { label: 'See all', onPress } */
  action?: { label: string; onPress: () => void };
  /** removes the top margin for the first section on a screen */
  first?: boolean;
  children: React.ReactNode;
}

/**
 * The only sanctioned way to add a screen section — keeps spacing rhythm
 * consistent and makes the "≤4 sections per screen" rule easy to honor.
 */
export default function Section({ title, action, first, children }: SectionProps) {
  const { colors } = useThemeContext();

  return (
    <View className="px-4" style={{ marginTop: first ? 8 : 28 }}>
      {(title || action) && (
        <View className="mb-3 flex-row items-center justify-between">
          {title ? (
            <Text style={[typo.eyebrow, { color: colors.muted }]}>{title.toUpperCase()}</Text>
          ) : (
            <View />
          )}
          {action ? (
            <TouchableOpacity onPress={action.onPress} hitSlop={8}>
              <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}
