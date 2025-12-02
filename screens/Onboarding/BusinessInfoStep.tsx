import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, FieldErrors, Control } from 'react-hook-form';

interface BusinessFormValues {
  businessName: string;
  businessType: string;
  licenseNumber: string;
  website: string;
  description: string;
}

interface Props {
  colors: any;
  control: Control<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  coverImage: string | null;
  logoImage: string | null;
  onPickCover: () => void;
  onPickLogo: () => void;
  onBack: () => void;
  onNext: () => void;
}

const BusinessInfoStep: React.FC<Props> = ({
  colors,
  control,
  errors,
  coverImage,
  logoImage,
  onPickCover,
  onPickLogo,
  onBack,
  onNext,
}) => {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1"
      style={{ backgroundColor: colors.background }}>
      {/* Cover Image */}
      <TouchableOpacity
        onPress={onPickCover}
        className="h-64 w-full items-center justify-center overflow-hidden rounded-b-3xl"
        style={{ backgroundColor: colors.card }}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="items-center justify-center">
            <Ionicons name="image-outline" size={40} color={colors.text} />
            <Text className="mt-2 text-sm" style={{ color: colors.text }}>
              Click to add cover image
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Logo */}
      <TouchableOpacity
        onPress={onPickLogo}
        className="-mt-20 self-center"
        style={{ borderColor: colors.primary, borderWidth: 1, borderRadius: 100 }}>
        <Image
          source={logoImage ? { uri: logoImage } : require('../../assets/dummy-profile.png')}
          className="h-40 w-40 rounded-full bg-white"
        />
      </TouchableOpacity>

      <Text className="mt-2 text-center text-md" style={{ color: colors.text }}>
        Business logo
      </Text>

      <ScrollView className="mt-4 px-2">
        <Text className="mt-6 text-center text-2xl font-semibold" style={{ color: colors.text }}>
          Business information
        </Text>

        <View className="mt-5 gap-4">
          {/* Business Name */}
          <View>
            <Controller
              control={control}
              name="businessName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Business name"
                  placeholderTextColor={colors.placeholder}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, color: colors.text }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.businessName && (
              <Text className="mt-1 text-sm text-red-500">{errors.businessName.message}</Text>
            )}
          </View>

          {/* Business Type */}
          <View>
            <Controller
              control={control}
              name="businessType"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Business Type"
                  placeholderTextColor={colors.placeholder}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, color: colors.text }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.businessType && (
              <Text className="mt-1 text-sm text-red-500">{errors.businessType.message}</Text>
            )}
          </View>

          {/* License Number */}
          <View>
            <Controller
              control={control}
              name="licenseNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Business license number"
                  placeholderTextColor={colors.placeholder}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, color: colors.text }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.licenseNumber && (
              <Text className="mt-1 text-sm text-red-500">{errors.licenseNumber.message}</Text>
            )}
          </View>

          {/* Website */}
          <View>
            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Website url (optional)"
                  placeholderTextColor={colors.placeholder}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, color: colors.text }}
                  keyboardType="url"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.website && (
              <Text className="mt-1 text-sm text-red-500">{errors.website.message}</Text>
            )}
          </View>

          {/* Description */}
          <View>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Description"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  className="w-full rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: colors.card,
                    color: colors.text,
                    height: 120,
                    textAlignVertical: 'top',
                  }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.description && (
              <Text className="mt-1 text-sm text-red-500">{errors.description.message}</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View className="mt-8 flex-row justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="mr-3 flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: colors.primary }}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            className="ml-3 flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: colors.primary }}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BusinessInfoStep;
