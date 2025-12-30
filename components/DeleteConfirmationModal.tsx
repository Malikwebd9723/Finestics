// components/DeleteConfirmationModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';

interface ConfirmDeleteModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  visible,
  title = 'Delete Item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { colors } = useThemeContext();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View
          className="w-full rounded-3xl p-6"
          style={{ backgroundColor: colors.card, maxWidth: 400 }}>
          <View className="mb-4 items-center">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#ef444420' }}>
              <MaterialIcons name="warning" size={32} color="#ef4444" />
            </View>

            <Text className="mb-2 text-xl font-bold" style={{ color: colors.text }}>
              {title}
            </Text>

            <Text className="text-center text-gray-500">{message}</Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 items-center rounded-xl py-3"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.muted,
              }}>
              <Text className="font-bold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: '#ef4444' }}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-bold text-white">Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
