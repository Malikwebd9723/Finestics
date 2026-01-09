// screens/Auth/Login.tsx

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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { loginUser } from 'api/actions/authActions';
import { loginSchema, LoginFormData } from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (formData: LoginFormData) => {
    const response = await loginUser({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });

    if (!response.success) {
      Toast.error(response.data?.message || 'Login failed');
      return;
    }

    Toast.success('Welcome back!');
    await login(response.data.data);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
              <Ionicons name="storefront" size={40} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}>
              Welcome Back
            </Text>
            <Text style={{ fontSize: 15, color: colors.placeholder }}>
              Sign in to continue to your account
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Email Field */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: errors.email ? '#EF4444' : colors.border || '#eee',
                    }}>
                    <Ionicons name="mail-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: errors.password ? '#EF4444' : colors.border || '#eee',
                    }}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showPassword}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoComplete="password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    onPress={() => onChange(!value)}
                    style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: value ? colors.primary : colors.border || '#ddd',
                        backgroundColor: value ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                      }}>
                      {value && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={{ color: colors.text, fontSize: 14 }}>Remember me</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 8,
                opacity: isSubmitting ? 0.7 : 1,
              }}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
              )}
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: colors.text, fontSize: 15 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
