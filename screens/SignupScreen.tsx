// screens/SignupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { signupUser } from 'api/actions/authActions';
import {
  customerSignupSchema,
  CustomerSignupFormData,
} from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';
import { fonts } from 'constants/design';
import { Input, Button } from 'components/ui';

type SignupRole = 'customer' | 'vendor';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { login } = useAuth();
  const [role, setRole] = useState<SignupRole>('customer');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerSignupFormData>({
    // Cast avoids the yup<->RHF nullable-field resolver typing mismatch.
    resolver: yupResolver(customerSignupSchema) as any,
    // The schema reads $role to require phone for vendors.
    context: { role },
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (formData: CustomerSignupFormData) => {
    const response = await signupUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || null,
      password: formData.password,
      role,
    });

    if (!response.success) {
      Toast.error(response.data?.message || 'Signup failed');
      return;
    }

    Toast.success('Account created successfully!');

    // Store tokens. RootNavigator routes customers straight to the app and
    // vendors into onboarding.
    await login(response.data.data);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* No KAV behavior on Android — the window already resizes; "height"
          here double-compensates and hides the submit button while typing. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled">
          {/* Brand header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Image
              source={require('../assets/icon.png')}
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 18,
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
              Create your account
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>
              Join Finestics to run your business
            </Text>
          </View>

          {/* Role toggle */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
              I am a
            </Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 4,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              {(['customer', 'vendor'] as SignupRole[]).map((r) => {
                const selected = role === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 9,
                      alignItems: 'center',
                      backgroundColor: selected ? colors.cta : 'transparent',
                    }}>
                    <Text
                      style={{
                        color: selected ? colors.onCta : colors.text,
                        fontWeight: '600',
                        fontSize: 14,
                      }}>
                      {r === 'customer' ? 'Customer' : 'Vendor'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
              {role === 'customer'
                ? 'Browse vendors and place your own orders.'
                : 'Sell products and manage your customers.'}
            </Text>
          </View>

          {/* Form */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="First name"
                    placeholder="First name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="given-name"
                    error={errors.firstName?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Last name"
                    placeholder="Last name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="family-name"
                    error={errors.lastName?.message}
                  />
                )}
              />
            </View>
          </View>

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
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={role === 'vendor' ? 'Phone' : 'Phone (optional)'}
                icon="phone-outline"
                placeholder="07xxx xxxxxx"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                autoComplete="tel"
                error={errors.phone?.message}
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
                placeholder="8+ chars, mixed case + number"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoComplete="new-password"
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm password"
                icon="lock-check-outline"
                placeholder="Repeat your password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ marginTop: 6 }}
          />

          {/* Sign in link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 26 }}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '700' }}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
