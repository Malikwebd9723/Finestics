// screens/ForgotPasswordScreen.tsx
// Two steps on one screen: request a 6-digit reset code by email, then enter
// the code + a new password. Mirrors the Login screen's visual language.
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeContext } from 'context/ThemeProvider';
import { requestPasswordReset, resetPassword } from 'api/actions/authActions';
import Toast from 'utils/Toast';
import { fonts } from 'constants/design';
import { Input, Button } from 'components/ui';

type Step = 'email' | 'reset';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string }>({});

  const sendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    setErrors({});
    setSending(true);
    const response = await requestPasswordReset(trimmed);
    setSending(false);

    if (!response.success) {
      Toast.error(response.data?.message || 'Could not send the reset code');
      return;
    }
    Toast.success('If an account exists, a reset code is on its way');
    setStep('reset');
  };

  const submitReset = async () => {
    const nextErrors: typeof errors = {};
    if (!/^\d{6}$/.test(code.trim())) {
      nextErrors.code = 'Enter the 6-digit code from your email';
    }
    if (!PASSWORD_RULE.test(password)) {
      nextErrors.password = 'Min 8 characters with uppercase, lowercase and a number';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setResetting(true);
    const response = await resetPassword(email.trim().toLowerCase(), code.trim(), password);
    setResetting(false);

    if (!response.success) {
      Toast.error(response.data?.error?.message || response.data?.message || 'Reset failed');
      return;
    }
    Toast.success('Password reset — sign in with your new password');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* No KAV behavior on Android — the window already resizes; "height"
          here double-compensates and hides the buttons while typing. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
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
                fontSize: 24,
                letterSpacing: -0.4,
                color: colors.text,
                marginBottom: 6,
              }}>
              {step === 'email' ? 'Reset your password' : 'Enter your code'}
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>
              {step === 'email'
                ? 'We’ll email you a 6-digit code to reset it'
                : `We sent a code to ${email.trim()}`}
            </Text>
          </View>

          {step === 'email' ? (
            <>
              <Input
                label="Email"
                icon="email-outline"
                placeholder="you@business.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />
              <Button
                title="Send reset code"
                onPress={sendCode}
                loading={sending}
                disabled={sending}
              />
            </>
          ) : (
            <>
              <Input
                label="Reset code"
                icon="numeric"
                placeholder="6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.code}
              />
              <Input
                label="New password"
                icon="lock-outline"
                placeholder="8+ chars, mixed case + number"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoComplete="new-password"
                error={errors.password}
              />
              <Button
                title="Reset password"
                onPress={submitReset}
                loading={resetting}
                disabled={resetting}
              />
              <Button
                title="Resend code"
                variant="ghost"
                onPress={sendCode}
                loading={sending}
                disabled={sending}
                style={{ marginTop: 10 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
