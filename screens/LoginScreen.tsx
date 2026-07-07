// screens/LoginScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { loginUser } from 'api/actions/authActions';
import { loginSchema, LoginFormData } from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';
import { fonts } from 'constants/design';
import { Input, Button } from 'components/ui';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { login } = useAuth();

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
      {/* 'padding' on BOTH platforms: SDK 54 Android is edge-to-edge, where
          softwareKeyboardLayoutMode:"resize" is ignored, so the KAV is the
          only thing keeping the keyboard off the inputs. */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled">
          {/* Brand header */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Image
              source={require('../assets/icon.png')}
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 20,
              }}
            />
            <Text
              style={{
                fontFamily: fonts.extrabold,
                fontSize: 26,
                letterSpacing: -0.4,
                color: colors.text,
                marginBottom: 6,
              }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted }}>
              Sign in to continue to Finestics
            </Text>
          </View>

          {/* Form */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                icon="email-outline"
                placeholder="you@business.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                icon="lock-outline"
                placeholder="Your password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoComplete="password"
                error={errors.password?.message}
              />
            )}
          />

          {/* Remember me & forgot password */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
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
                      width: 21,
                      height: 21,
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: value ? colors.cta : colors.border,
                      backgroundColor: value ? colors.cta : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}>
                    {value && (
                      <MaterialCommunityIcons name="check" size={14} color={colors.onCta} />
                    )}
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14 }}>Remember me</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />

          {/* Sign up link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Don’t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} hitSlop={8}>
              <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '700' }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
