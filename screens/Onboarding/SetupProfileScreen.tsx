import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller, set } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { businessSchema } from 'validations/formValidationSchemas';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from 'api/clients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function SetupProfileScreen() {
  const { colors } = useThemeContext();
  const [screen, setScreen] = useState<'role' | 'information' | 'packages' | 'outro'>('role');
  const [role, setRole] = useState<'customer' | 'vendor' | null>(null);
  const [data, setData] = useState({});
  const [coverImage, setCoverImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [selected, setSelected] = useState<'basic' | 'premium' | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(businessSchema),
    defaultValues: {
      businessName: '',
      businessType: '',
      licenseNumber: '',
      website: '',
      description: '',
    },
  });

  const pickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const onNext = (data) => {
    setData(data);
    setScreen('packages');
  };

  const submitInformation = async () => {
    const dataToSubmit = {
      role,
      ...data,
      coverImage,
      logoImage,
      selectedPackage: selected,
    };
    try {
      setLoading(true);
      const response = await apiRequest('/auth/logins', 'POST', { dataToSubmit });

      if (!response.success) {
        ToastAndroid.show(
          response.data.error.message || 'Error while submitting!',
          ToastAndroid.SHORT
        );
        AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setLoading(false);
        return;
      }

      ToastAndroid.show('Profile Submitted Successfully!', ToastAndroid.SHORT);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      ToastAndroid.show('Something went wrong, try again!', ToastAndroid.SHORT);
    }
  };
  // ROLE SELECTION SCREEN
  if (screen === 'role') {
    return (
      <View
        className="flex-1 items-center justify-center gap-5 px-6"
        style={{ backgroundColor: colors.background }}>
        {/* Logo */}
        <View
          className="h-100 w-100 items-center justify-center"
          style={{ backgroundColor: colors.primary, borderRadius: '100%' }}>
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

        {/* Buttons */}
        <View className="mt-8 w-full flex-row justify-center gap-4">
          {/* Customer */}
          <TouchableOpacity
            onPress={() => {
              setRole('customer');
              setScreen('information');
            }}
            className="flex-1 flex-row items-center justify-center rounded-xl px-5 py-3"
            style={{ backgroundColor: colors.primary }}>
            <Ionicons name="person-outline" size={20} color={colors.white} />
            <Text className="ml-2 text-lg font-medium" style={{ color: colors.white }}>
              Customer
            </Text>
          </TouchableOpacity>

          {/* Vendor */}
          <TouchableOpacity
            onPress={() => {
              setRole('vendor');
              setScreen('information');
            }}
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
  }

  // BUSINESS INFORMATION SCREEN (IMAGE YOU SENT)

  if (screen === 'information') {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 10 }}
        style={{ backgroundColor: colors.background }}>
        {/* Cover Image */}
        <TouchableOpacity
          onPress={() => pickImage(setCoverImage)}
          className="h-64 w-full items-center justify-center overflow-hidden rounded-b-3xl"
          style={{ backgroundColor: colors.card }}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="items-center justify-center">
              <Ionicons name="image-outline" size={40} color={colors.text} />
              <Text className="mt-2 text-sm" style={{ color: colors.text }}>
                {' '}
                Click to add cover image
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logo */}
        <TouchableOpacity
          onPress={() => pickImage(setLogoImage)}
          className="-mt-20 self-center"
          style={{ borderColor: colors.primary, borderWidth: 1, borderRadius: 100 }}>
          <Image
            source={logoImage ? { uri: logoImage } : require('../../assets/dummy-profile.png')}
            className="h-40 w-40 rounded-full bg-white"
          />
        </TouchableOpacity>

        <Text className="text-md mt-2 text-center" style={{ color: colors.text }}>
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
                    keyboardType="default"
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
                    keyboardType="default"
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
                    keyboardType="default"
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

          {/* Footer Buttons */}
          <View className="mt-8 flex-row justify-between">
            <TouchableOpacity
              onPress={() => setScreen('role')}
              className="mr-3 flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.primary }}>
              <Text style={{ color: colors.white, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onNext)}
              className="ml-3 flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.primary }}>
              <Text style={{ color: colors.white, fontWeight: '600' }}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // PACKAGES SCREEN
  if (screen === 'packages') {
    return (
      <SafeAreaView className="flex-1 px-6 pt-14" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <Text className="text-center text-3xl font-bold" style={{ color: colors.text }}>
          Our Packages
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
          Select the plan and start managing your fin flow. You can update your subscription plan
          anytime!
        </Text>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => setScreen('outro')}
          className="items-right mt-4 flex-row self-end">
          <Text className="text-base" style={{ color: colors.text }}>
            Skip
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* BASIC PACKAGE */}
        <TouchableOpacity
          onPress={() => setSelected('basic')}
          className="mt-10 w-full rounded-2xl p-4"
          style={{ backgroundColor: colors.card, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
            <Text className="text-base" style={{ color: colors.text }}>
              Duration
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              1 Month
            </Text>
          </View>

          <View className="mt-1 flex-row justify-between">
            <Text className="text-base" style={{ color: colors.text }}>
              Max orders
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              100
            </Text>
          </View>

          <View className="mt-1 flex-row justify-between">
            <Text className="text-base" style={{ color: colors.text }}>
              Max products
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              1,000
            </Text>
          </View>

          <View className="mt-1 flex-row justify-between">
            <Text className="mr-2 text-base" style={{ color: colors.text }}>
              Order Management
            </Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* PREMIUM PACKAGE */}
        <TouchableOpacity
          onPress={() => setSelected('premium')}
          className="mt-5 w-full rounded-2xl p-4"
          style={{ backgroundColor: colors.card, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
            <Text className="text-base" style={{ color: colors.text }}>
              Duration
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              1 Month
            </Text>
          </View>

          <View className="mt-1 flex-row justify-between">
            <Text className="text-base" style={{ color: colors.text }}>
              Max orders
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              500
            </Text>
          </View>

          <View className="mt-1 flex-row justify-between">
            <Text className="text-base" style={{ color: colors.text }}>
              Max products
            </Text>
            <Text className="text-base" style={{ color: colors.text }}>
              3,500
            </Text>
          </View>

          <View className="mt-1 flex-row justify-between">
            <Text className="mr-2 text-base" style={{ color: colors.text }}>
              Order Management
            </Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* FOOTER BUTTONS */}
        <View className="mt-10 flex-row justify-between">
          <TouchableOpacity
            onPress={() => setScreen('information')}
            className="flex-1 items-center rounded-xl py-3"
            style={{ backgroundColor: colors.primary }}>
            <Text style={{ color: colors.white, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => selected && setScreen('outro')}
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
  }

  // OUTRO SCREEN (Profile Under Review)
  return (
    <View
      className="flex-1 items-center justify-center gap-10 px-6"
      style={{ backgroundColor: colors.background }}>
      <Ionicons name="checkmark-circle-outline" size={200} color={colors.primary} />
      <View className="items-center">
        <Text className="mt-4 text-2xl font-bold" style={{ color: colors.text }}>
          Your are Done!
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
          Submit your profile for review. We will notify you once it is approved.
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => submitInformation()}
        disabled={loading}
        className="ml-3 w-full items-center rounded-xl py-3"
        style={{
          backgroundColor: loading ? colors.card : colors.primary,
          boardercolor: loading ? colors.gray : colors.primary,
          borderWidth: 1,
        }}>
        <Text style={{ color: loading ? colors.text : colors.gray, fontWeight: '600' }}>
          {loading ? 'Submitting...' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
