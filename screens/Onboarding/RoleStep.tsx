import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RoleStepProps {
  colors: any;
  onSelectRole: (role: 'customer' | 'vendor') => void;
}

const RoleStep: React.FC<RoleStepProps> = ({ colors, onSelectRole }) => {
  return (
    <View
      className="flex-1 items-center justify-center gap-5 px-6"
      style={{ backgroundColor: colors.background }}>
      {/* Logo */}
      <View
        className="h-100 w-100 items-center justify-center"
        style={{ backgroundColor: colors.primary, borderRadius: 999 }}>
        <Image
          source={require('../../assets/splash.png')}
          className="h-100 w-100"
          resizeMode="contain"
        />
      </View>

      <View>
        <Text className="text-center text-3xl font-bold" style={{ color: colors.text }}>
          Let’s setup your profile
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
          Select how you want to continue
        </Text>
      </View>

      <View className="mt-8 w-full flex-row justify-center gap-4">
        <TouchableOpacity
          onPress={() => onSelectRole('customer')}
          className="flex-1 flex-row items-center justify-center rounded-xl px-5 py-3"
          style={{ backgroundColor: colors.primary }}>
          <Ionicons name="person-outline" size={20} color={colors.white} />
          <Text className="ml-2 text-lg font-medium" style={{ color: colors.white }}>
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectRole('vendor')}
          className="flex-1 flex-row items-center justify-center rounded-xl px-5 py-3"
          style={{ backgroundColor: colors.primary }}>
          <Ionicons name="storefront-outline" size={20} color={colors.white} />
          <Text className="ml-2 text-lg font-medium" style={{ color: colors.white }}>
            Vendor
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RoleStep;
