// components/ui/EmptyState.tsx
// The one empty/error-state pattern: centered muted icon, bold title,
// muted subtitle, optional action. Replaces the per-screen inline copies.
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fonts } from 'constants/design';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  /** optional CTA rendered below the copy, e.g. a Button */
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const { colors } = useThemeContext();

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
      }}>
      <MaterialCommunityIcons name={icon} size={56} color={colors.muted} />
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.bold,
          fontSize: 17,
          marginTop: 16,
          textAlign: 'center',
        }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
          {subtitle}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}
