import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { radius } from 'constants/design';

export interface Action {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  /** the one filled, emphasized action */
  primary?: boolean;
}

/**
 * Slim row of quick actions. One primary (filled), the rest quiet (outlined).
 */
export default function ActionBar({ actions }: { actions: Action[] }) {
  const { colors } = useThemeContext();

  return (
    <View className="flex-row gap-3">
      {actions.map((a) => {
        const filled = !!a.primary;
        return (
          <TouchableOpacity
            key={a.label}
            activeOpacity={0.85}
            onPress={a.onPress}
            className="flex-1 flex-row items-center justify-center py-3.5"
            style={{
              borderRadius: radius.chip,
              backgroundColor: filled ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: filled ? colors.primary : colors.border,
            }}>
            <MaterialCommunityIcons
              name={a.icon}
              size={18}
              color={filled ? '#FFFFFF' : colors.text}
            />
            <Text
              className="ml-2 text-[13px] font-semibold"
              style={{ color: filled ? '#FFFFFF' : colors.text }}>
              {a.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
