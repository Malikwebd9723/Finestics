import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ToastAndroid,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeProvider';

// form + validation
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { apiRequest } from 'api/clients';
import { loginSchema } from 'validations/formValidationSchemas';
import { useAuth } from 'context/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeContext();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  // ------------------ FORM HANDLER ------------------
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // --------------- LOGIN SUBMIT HANDLER --------------
  const onSubmit = async (formData: any) => {
    try {
      const { email, password, rememberMe } = formData;

      const response = await apiRequest(
        '/auth/login',
        'POST',
        { email, password, rememberMe }
      );

      if (!response.success) {
        ToastAndroid.show(response.data.error.message || 'Login failed', ToastAndroid.SHORT);
        return;
      }

      ToastAndroid.show('Login Successful', ToastAndroid.SHORT);
      login(response.data);
    } catch (error) {
      ToastAndroid.show('Something went wrong, try again!', ToastAndroid.SHORT);
    }
  };

  return (
    <View className="flex-1 px-6" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-center">
        {/* Title */}
        <Text className="mb-10 text-center text-3xl font-bold" style={{ color: colors.text }}>
          Login
        </Text>

        {/* EMAIL FIELD */}
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3"
                style={{ backgroundColor: colors.card }}>
                <Ionicons name="mail-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.placeholder}
                  className="flex-1 px-3 py-3 text-base"
                  style={{ color: colors.text }}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="email-address"
                />
              </View>
              {errors.email && (
                <Text style={{ color: colors.error, marginBottom: 8 }}>{errors.email.message}</Text>
              )}
            </>
          )}
        />

        {/* PASSWORD FIELD */}
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <>
              <View
                className="mb-1 flex-row items-center rounded-xl px-3"
                style={{ backgroundColor: colors.card }}>
                <Ionicons name="key-outline" size={20} color={colors.text} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  className="flex-1 px-3 py-3 text-base"
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

        {/* REMEMBER ME CHECKBOX */}
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <TouchableOpacity
              onPress={() => field.onChange(!field.value)}
              className="mb-5 mt-2 flex-row items-center">
              <Ionicons
                name={field.value ? 'checkbox-outline' : 'square-outline'}
                size={22}
                color={colors.primary}
              />
              <Text className="ml-2" style={{ color: colors.text }}>
                Remember Me
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text className="mb-5 text-right text-sm" style={{ color: colors.text }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* LOGIN BUTTON */}
        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className="mb-4 items-center rounded-xl py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text className="text-base font-semibold" style={{ color: colors.white }}>
            {isSubmitting ? 'Loading...' : 'Login'}
          </Text>
        </Pressable>

        {/* SIGNUP LINK */}
        <View className="flex-row justify-end">
          <Text className="mr-1 text-sm" style={{ color: colors.text }}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Signup?
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
