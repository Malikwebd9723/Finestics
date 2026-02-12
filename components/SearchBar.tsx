// components/SearchBar.tsx
import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  onAddPress?: () => void;
  placeholder?: string;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onAddPress,
  placeholder = 'Search...',
}: SearchBarProps) {
  const { colors } = useThemeContext();

  return (
    <View className="mb-4 px-4">
      <View
        className="flex-row items-center rounded-2xl px-4 py-3"
        style={{
          backgroundColor: colors.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="ml-3 flex-1 text-base"
          style={{ color: colors.text }}
        />

        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            className="mr-2 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}

        {onAddPress && (
          <Pressable
            onPress={onAddPress}
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 3,
            }}>
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
