import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type PackageType = 'basic' | 'premium' | null;

interface Props {
  colors: any;
  selected: PackageType;
  onSelect: (value: PackageType) => void;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
}

const PackagesStep: React.FC<Props> = ({
  colors,
  selected,
  onSelect,
  onSkip,
  onBack,
  onNext,
}) => {
  const cardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <SafeAreaView className="flex-1 px-6 pt-10" style={{ backgroundColor: colors.background }}>
      <Text className="text-center text-3xl font-bold" style={{ color: colors.text }}>
        Our Packages
      </Text>
      <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
        Select the plan and start managing your fin flow. You can update your subscription plan
        anytime!
      </Text>

      {/* Skip */}
      <TouchableOpacity onPress={onSkip} className="mt-4 self-end flex-row items-center">
        <Text className="text-base" style={{ color: colors.text }}>
          Skip
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* BASIC */}
      <TouchableOpacity
        onPress={() => onSelect('basic')}
        className="mt-10 w-full rounded-2xl p-4"
        style={{ backgroundColor: colors.card, ...cardShadow }}>
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons
              name={selected === 'basic' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={colors.text}
            />
            <Text className="ml-2 text-xl font-semibold" style={{ color: colors.text }}>
              Basic
            </Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            $50
          </Text>
        </View>

        <View className="mt-1 flex-row justify-between">
          <Text style={{ color: colors.text }}>Duration</Text>
          <Text style={{ color: colors.text }}>1 Month</Text>
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text style={{ color: colors.text }}>Max orders</Text>
          <Text style={{ color: colors.text }}>100</Text>
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text style={{ color: colors.text }}>Max products</Text>
          <Text style={{ color: colors.text }}>1,000</Text>
        </View>
        <View className="mt-1 flex-row justify-between items-center">
          <Text style={{ color: colors.text }}>Order Management</Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* PREMIUM */}
      <TouchableOpacity
        onPress={() => onSelect('premium')}
        className="mt-5 w-full rounded-2xl p-4"
        style={{ backgroundColor: colors.card, ...cardShadow }}>
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons
              name={selected === 'premium' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={colors.text}
            />
            <Text className="ml-2 text-xl font-semibold" style={{ color: colors.text }}>
              Premium
            </Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            $150
          </Text>
        </View>

        <View className="mt-1 flex-row justify-between">
          <Text style={{ color: colors.text }}>Duration</Text>
          <Text style={{ color: colors.text }}>1 Month</Text>
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text style={{ color: colors.text }}>Max orders</Text>
          <Text style={{ color: colors.text }}>500</Text>
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text style={{ color: colors.text }}>Max products</Text>
          <Text style={{ color: colors.text }}>3,500</Text>
        </View>
        <View className="mt-1 flex-row justify-between items-center">
          <Text style={{ color: colors.text }}>Order Management</Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <View className="mt-10 flex-row justify-between">
        <TouchableOpacity
          onPress={onBack}
          className="flex-1 items-center rounded-xl py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text style={{ color: colors.white, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!selected}
          className="ml-3 flex-1 items-center rounded-xl py-3"
          style={{
            backgroundColor: selected ? colors.primary : colors.card,
            opacity: selected ? 1 : 0.4,
          }}>
          <Text style={{ color: selected ? colors.white : colors.text, fontWeight: '600' }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PackagesStep;
