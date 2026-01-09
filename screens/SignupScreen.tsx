// screens/Auth/SignupScreen.tsx

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
import { signupUser } from 'api/actions/authActions';
import { signupSchema, SignupFormData } from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (formData: SignupFormData) => {
    const response = await signupUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    });

    if (!response.success) {
      Toast.error(response.data?.message || 'Signup failed');
      return;
    }

    Toast.success('Account created successfully!');

    // Store tokens and navigate to onboarding
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
            paddingVertical: 20,
          }}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
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
              <Ionicons name="person-add" size={40} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 15, color: colors.placeholder, textAlign: 'center' }}>
              Sign up to start managing your business
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Name Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* First Name */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}>
                  First Name
                </Text>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: errors.firstName ? '#EF4444' : colors.border || '#eee',
                      }}>
                      <Ionicons name="person-outline" size={20} color={colors.placeholder} />
                      <TextInput
                        placeholder="First"
                        placeholderTextColor={colors.placeholder}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          paddingHorizontal: 10,
                          fontSize: 16,
                          color: colors.text,
                        }}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                      />
                    </View>
                  )}
                />
                {errors.firstName && (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    {errors.firstName.message}
                  </Text>
                )}
              </View>

              {/* Last Name */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}>
                  Last Name
                </Text>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: errors.lastName ? '#EF4444' : colors.border || '#eee',
                      }}>
                      <TextInput
                        placeholder="Last"
                        placeholderTextColor={colors.placeholder}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          paddingHorizontal: 10,
                          fontSize: 16,
                          color: colors.text,
                        }}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                      />
                    </View>
                  )}
                />
                {errors.lastName && (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    {errors.lastName.message}
                  </Text>
                )}
              </View>
            </View>

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
                      placeholder="Create a password"
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

            {/* Confirm Password Field */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Confirm Password
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: errors.confirmPassword ? '#EF4444' : colors.border || '#eee',
                    }}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showConfirmPassword}
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
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Sign Up Button */}
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
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Create Account
                </Text>
              )}
            </Pressable>
          </View>

          {/* Login Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: colors.text, fontSize: 15 }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
