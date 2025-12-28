import React from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  onAddPress?: () => void;
}

export default function SearchBar({ searchQuery, setSearchQuery, onAddPress }: SearchBarProps) {
  const { colors } = useThemeContext();

  return (
    <View className="px-4 mb-4">
      <View
        className="flex-row items-center rounded-2xl px-5 py-3 shadow-sm"
        style={{ backgroundColor: colors.card, elevation: 2 }}
      >
        <Ionicons name="search" size={22} color={colors.text} />
        <TextInput
          placeholder="Search by name or email..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-3 text-base"
          style={{ color: colors.text }}
        />

        {onAddPress && (
          <Pressable
            onPress={onAddPress}
            className="w-11 h-11 rounded-xl items-center justify-center shadow-md"
            style={{ backgroundColor: colors.primary, elevation: 4 }}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
