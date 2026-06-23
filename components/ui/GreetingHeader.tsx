import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fonts, typo } from 'constants/design';

interface GreetingHeaderProps {
  greeting: string;
  name: string;
  initials: string;
  onProfilePress?: () => void;
  onBellPress?: () => void;
}

/** Personalized top bar: avatar + greeting on the left, a quiet bell on the right. */
export default function GreetingHeader({
  greeting,
  name,
  initials,
  onProfilePress,
  onBellPress,
}: GreetingHeaderProps) {
  const { colors } = useThemeContext();

  return (
    <View className="flex-row items-center px-4 pt-3">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onProfilePress}
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.primary }}>
        <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 }}>{initials}</Text>
      </TouchableOpacity>

      <View className="ml-3 flex-1">
        <Text className="text-xs" style={{ color: colors.muted }}>
          {greeting}
        </Text>
        <Text style={[typo.title, { color: colors.text, fontSize: 18 }]} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onBellPress}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}
