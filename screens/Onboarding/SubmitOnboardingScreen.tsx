// screens/Onboarding/SubmitOnboardingScreen.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { submitOnboarding } from 'api/actions/onboardingActions';
import Toast from 'utils/Toast';

export default function SubmitOnboardingScreen() {
  const { colors } = useThemeContext();
  const { refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await submitOnboarding();

      if (!response.success) {
        Toast.error(response.data?.message || 'Failed to submit profile');
        return;
      }

      Toast.success('Profile submitted successfully!');

      // Refresh user data to update onboardingCompleted status
      await refreshUser();

      // Navigate to pending verification screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingVerificationScreen' }],
      });
    } catch (error) {
      Toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Progress Indicator */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, height: 4, backgroundColor: colors.primary, borderRadius: 2 }} />
          <View style={{ flex: 1, height: 4, backgroundColor: colors.primary, borderRadius: 2 }} />
          <View style={{ flex: 1, height: 4, backgroundColor: colors.primary, borderRadius: 2 }} />
        </View>
        <Text
          style={{ fontSize: 13, color: colors.placeholder, marginTop: 8, textAlign: 'center' }}>
          Step 3 of 3
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        {/* Success Icon */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}>
          You're Almost Done!
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 15,
            color: colors.placeholder,
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 20,
          }}>
          We have collected all the required information. Please review and submit your profile for
          approval.
        </Text>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginTop: 32,
            borderWidth: 1,
            borderColor: colors.border || '#eee',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              What happens next?
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.primary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                Our team will review your submitted information
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.primary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                Approval usually takes 12–24 hours
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.primary}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                You will be notified once your account is verified
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isSubmitting ? 0.7 : 1,
          }}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Submit for Approval
              </Text>
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border || '#eee',
          }}>
          <Text style={{ color: colors.text, fontWeight: '500', fontSize: 16 }}>
            Go Back & Edit
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
