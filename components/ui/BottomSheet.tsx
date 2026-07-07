// components/ui/BottomSheet.tsx
// The canonical bottom-sheet shell. Standardizes scrim, top radius and header
// so form/detail sheets stop drifting (backdrops 0.4–0.7, radii 2xl/3xl/24…).
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fonts, radius } from 'constants/design';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Optional header title; renders a title row with a close button. */
  title?: string;
  /** Extra node rendered on the right of the header, before the close button. */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  /** Cap sheet height as a fraction of the screen. Defaults to 92%. */
  maxHeightRatio?: number;
}

export default function BottomSheet({
  visible,
  onClose,
  title,
  headerRight,
  children,
  maxHeightRatio = 0.92,
}: BottomSheetProps) {
  const { colors } = useThemeContext();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.text + '55' }}>
        {/* Tap on the scrim dismisses; the sheet itself swallows touches. */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.card,
            borderTopRightRadius: radius.card,
            padding: 16,
            paddingBottom: 28,
            maxHeight: `${Math.round(maxHeightRatio * 100)}%` as `${number}%`,
          }}>
          {title ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <Text style={{ color: colors.text, fontSize: 17, fontFamily: fonts.bold }}>
                {title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {headerRight}
                <Pressable onPress={onClose} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
