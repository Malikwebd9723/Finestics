import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';

/**
 * Placeholder notifications inbox — honest empty state until a real
 * notifications feed is wired up. Reached from the header bell on every screen.
 */
export default function NotificationsScreen() {
  const { colors } = useThemeContext();
  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: colors.background }}>
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.gray }}>
        <MaterialCommunityIcons name="bell-outline" size={30} color={colors.muted} />
      </View>
      <Text style={[typo.title, { color: colors.text, fontSize: 18 }]}>You're all caught up</Text>
      <Text className="mt-1 text-center text-sm" style={{ color: colors.muted }}>
        No new notifications right now. We'll let you know when something needs your attention.
      </Text>
    </View>
  );
}
