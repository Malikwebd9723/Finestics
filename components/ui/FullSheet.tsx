// components/ui/FullSheet.tsx
// The canonical full-screen detail sheet: opaque background, safe-area aware,
// one header style (title + close). Replaces the ad-hoc full-screen modals.
import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fonts } from 'constants/design';

interface FullSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Extra node rendered on the right of the header, before the close button. */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function FullSheet({
  visible,
  onClose,
  title,
  headerRight,
  children,
}: FullSheetProps) {
  const { colors } = useThemeContext();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
          <Text
            style={{ color: colors.text, fontSize: 18, fontFamily: fonts.bold, flex: 1 }}
            numberOfLines={1}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {headerRight}
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
}
