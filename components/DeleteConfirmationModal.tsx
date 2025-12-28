import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";

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
  title = "Delete Item?",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { colors } = useThemeContext();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View
          className="w-full rounded-3xl p-6"
          style={{ backgroundColor: colors.card, maxWidth: 400 }}
        >
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#ef444420" }}
            >
              <MaterialIcons name="warning" size={32} color="#ef4444" />
            </View>

            <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
              {title}
            </Text>

            <Text className="text-center text-gray-500">
              {message}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.muted,
              }}
            >
              <Text className="font-bold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: "#ef4444" }}
            >
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
