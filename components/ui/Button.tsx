// components/ui/Button.tsx
// The canonical button. One filled primary per screen; secondary is outlined;
// ghost is a bare text action. Replaces the per-screen Pressable/Touchable mix.
import React from 'react';
import { Pressable, Text, ActivityIndicator, View, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  /** Leading MaterialCommunityIcons glyph. */
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const { colors } = useThemeContext();
  const blocked = disabled || loading;

  const background =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.card : 'transparent';
  const labelColor = variant === 'primary' ? colors.white : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: background,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
          borderRadius: 12,
          paddingVertical: variant === 'ghost' ? 10 : 14,
          paddingHorizontal: 16,
          opacity: blocked ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={18} color={labelColor} /> : null}
          <Text style={{ color: labelColor, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
