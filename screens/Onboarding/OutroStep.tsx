import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  colors: any;
  loading: boolean;
  onSubmit: () => void;
  onBackToPackages: () => void;
}

const OutroStep: React.FC<Props> = ({ colors, loading, onSubmit, onBackToPackages }) => {
  return (
    <View
      className="flex-1 items-center justify-center gap-10 px-6"
      style={{ backgroundColor: colors.background }}>
      <Ionicons name="checkmark-circle-outline" size={200} color={colors.primary} />
      <View className="items-center">
        <Text className="mt-4 text-2xl font-bold" style={{ color: colors.text }}>
          You are Done!
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
          Submit your profile for review. We will notify you once it is approved.
        </Text>
      </View>

      <View className="w-full gap-3">
        <TouchableOpacity
          onPress={onBackToPackages}
          className="w-full items-center rounded-xl py-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          className="w-full items-center rounded-xl py-3"
          style={{
            backgroundColor: loading ? colors.card : colors.primary,
            borderColor: colors.primary,
            borderWidth: 1,
          }}>
          <Text style={{ color: loading ? colors.text : '#fff', fontWeight: '600' }}>
            {loading ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OutroStep;
