// screens/Onboarding/PendingVerificationScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';

export default function PendingVerificationScreen() {
  const { colors } = useThemeContext();
  const { logout } = useAuth();

  const handleEmail = () => {
    Linking.openURL('mailto:support@example.com');
  };

  const handleWhatsApp = () => {
    const phoneNumber = '+447700900000'; // UK format
    const message = 'Hello, I need assistance with my pending verification.';
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Logout */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, alignItems: 'flex-end' }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border || '#eee',
          }}>
          <Ionicons name="log-out-outline" size={18} color={colors.text} />
          <Text style={{ marginLeft: 8, color: colors.text, fontWeight: '500' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        {/* Icon */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}>
          <Ionicons name="hourglass-outline" size={60} color={colors.primary} />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}>
          Profile Under Review
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 15,
            color: colors.placeholder,
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 10,
          }}>
          Thank you! Your profile has been submitted successfully.{'\n'}
          Our team is now reviewing your information.
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: colors.text,
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 20,
          }}>
          Verification typically takes{' '}
          <Text style={{ fontWeight: '700', color: colors.primary }}>12–24 hours</Text>.{'\n'}
          You will be notified once approved.
        </Text>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginTop: 32,
            width: '100%',
            borderWidth: 1,
            borderColor: colors.border || '#eee',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: colors.text }}>
              What you can do meanwhile
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ color: colors.primary, marginRight: 8, fontSize: 14 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                Contact the admin team for faster processing
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ color: colors.primary, marginRight: 8, fontSize: 14 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                Prepare your product catalogue details
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ color: colors.primary, marginRight: 8, fontSize: 14 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                Full access will be granted after approval
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text
          style={{
            fontSize: 13,
            color: colors.placeholder,
            textAlign: 'center',
            marginBottom: 16,
          }}>
          Need help? Contact us:
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
          <TouchableOpacity
            onPress={handleEmail}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border || '#eee',
            }}>
            <Ionicons name="mail-outline" size={22} color="#EA4335" />
            <Text style={{ marginLeft: 10, fontWeight: '500', color: colors.text }}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWhatsApp}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border || '#eee',
            }}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={{ marginLeft: 10, fontWeight: '500', color: colors.text }}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
