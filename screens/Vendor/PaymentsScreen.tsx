// screens/Vendor/PaymentsScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';

export default function PaymentsScreen() {
  const { colors } = useThemeContext();

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: colors.background }}>
      <View
        className="mb-4 rounded-full p-4"
        style={{ backgroundColor: colors.success + '15' }}>
        <MaterialCommunityIcons name="cash-plus" size={48} color={colors.success} />
      </View>
      <Text className="mb-2 text-xl font-bold" style={{ color: colors.text }}>
        Payments
      </Text>
      <Text className="text-center" style={{ color: colors.muted }}>
        Manage customer payments and transactions. Coming soon!
      </Text>
    </View>
  );
}
