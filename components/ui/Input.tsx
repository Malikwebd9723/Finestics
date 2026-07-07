// components/ui/Input.tsx
// The canonical text field: label, optional leading icon, error state, and a
// built-in show/hide toggle for passwords. Replaces per-screen input styling.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Leading MaterialCommunityIcons glyph. */
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export default function Input({
  label,
  error,
  icon,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const { colors } = useThemeContext();
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 6,
          }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          // Card fill so fields stand off background-colored screens
          // (background-on-background left them border-only and "invisible").
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          paddingHorizontal: 12,
        }}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={19}
            color={error ? colors.error : colors.muted}
            style={{ marginRight: 8 }}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.placeholder}
          secureTextEntry={hidden}
          style={[
            {
              flex: 1,
              color: colors.text,
              fontSize: 15,
              paddingVertical: 13,
            },
            style,
          ]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <MaterialCommunityIcons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 5 }}>{error}</Text>
      ) : null}
    </View>
  );
}
