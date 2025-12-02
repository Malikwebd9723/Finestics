import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeProvider';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiRequest } from 'api/clients';
import { signupSchema } from 'validations/formValidationSchemas';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: any) => {
    const response = await apiRequest('/auth/signup', 'POST', data);

    if (!response.success) {
      ToastAndroid.show(response.data?.error.message || 'Signup failed', ToastAndroid.SHORT);
      return;
    }

    ToastAndroid.show('Signup Successful', ToastAndroid.SHORT);
    navigation.replace('Login');
  };


  return (
    <KeyboardAvoidingView
      behavior={'padding'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text className="mb-6 text-center text-3xl font-bold" style={{ color: colors.text }}>
          Sign Up
        </Text>

        {/* FIRST NAME */}
        <Controller
          control={control}
          name="firstName"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.card }}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor={colors.placeholder}
                  className="ml-2 flex-1 text-base"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              </View>
              {errors.firstName && (
                <Text style={{ color: colors.error, marginBottom: 8 }}>
                  {errors.firstName.message}
                </Text>
              )}
            </>
          )}
        />

        {/* LAST NAME */}
        <Controller
          control={control}
          name="lastName"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.card }}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor={colors.placeholder}
                  className="ml-2 flex-1 text-base"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              </View>
              {errors.lastName && (
                <Text style={{ color: colors.error, marginBottom: 8 }}>
                  {errors.lastName.message}
                </Text>
              )}
            </>
          )}
        />

        {/* EMAIL */}
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.card }}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  className="ml-2 flex-1 text-base"
                  autoCapitalize="none"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              </View>
              {errors.email && (
                <Text style={{ color: colors.error, marginBottom: 8 }}>{errors.email.message}</Text>
              )}
            </>
          )}
        />

        {/* PASSWORD */}
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.card }}>
                <Ionicons name="key-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  className="ml-2 flex-1 text-base"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={{ color: colors.error, marginBottom: 8 }}>
                  {errors.password.message}
                </Text>
              )}
            </>
          )}
        />

        {/* CONFIRM PASSWORD */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.card }}>
                <Ionicons name="key-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  className="ml-2 flex-1 text-base"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              </View>
              {errors.confirmPassword && (
                <Text style={{ color: colors.error, marginBottom: 8 }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </>
          )}
        />

        {/* PHONE (optional) */}
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3 py-3"
                style={{ backgroundColor: colors.card }}>
                <Ionicons name="call-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Phone (optional)"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  className="ml-2 flex-1 text-base"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                />
              </View>
            </>
          )}
        />

        {/* SIGN UP BUTTON */}
        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className="mt-3 rounded-xl py-3"
          style={{
            backgroundColor: colors.primary,
            alignItems: 'center',
            opacity: isSubmitting ? 0.6 : 1,
          }}>
          <Text className="text-base font-semibold text-white">
            {isSubmitting ? 'Creating...' : 'Sign Up'}
          </Text>
        </Pressable>

        {/* LOGIN LINK */}
        <View className="mt-4 flex-row justify-end">
          <Text className="mr-1 text-sm" style={{ color: colors.text }}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Login?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
