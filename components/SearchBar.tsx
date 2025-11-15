import React from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  onAddPress?: () => void; // optional (+ button)
}

export default function SearchBar({ value, onChange, onAddPress }: SearchBarProps) {
  const { colors } = useThemeContext();

  return (
    <View
      className="flex-row items-center mb-4 rounded-full px-4 py-2"
      style={{ backgroundColor: colors.card }}
    >
      <Ionicons name="search" size={20} color={colors.text} />

      <TextInput
        placeholder="Search"
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChange}
        className="flex-1 ml-2 text-base"
        style={{ color: colors.text }}
      />

      {onAddPress && (
        <Pressable
          onPress={onAddPress}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
