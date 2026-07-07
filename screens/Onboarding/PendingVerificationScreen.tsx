// screens/Onboarding/PendingVerificationScreen.tsx

import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { fonts } from 'constants/design';

export default function PendingVerificationScreen() {
  const { colors } = useThemeContext();
  const { logout } = useAuth();

  const handleEmail = () => {
    Linking.openURL('mailto:support@finestics.com');
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
            borderColor: colors.border,
          }}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.text} />
          <Text style={{ marginLeft: 8, color: colors.text, fontWeight: '500' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Brand header */}
        <Image
          source={require('../../assets/icon.png')}
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 18,
          }}
        />

        {/* Title */}
        <Text
          style={{
            fontFamily: fonts.extrabold,
            fontSize: 26,
            letterSpacing: -0.4,
            color: colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}>
          Profile under review
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 15,
            color: colors.muted,
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
            borderColor: colors.border,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.primary} />
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
            color: colors.muted,
            textAlign: 'center',
            marginBottom: 16,
          }}>
          Need help? Contact us:
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
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
              borderColor: colors.border,
            }}>
            <MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />
            <Text style={{ marginLeft: 10, fontWeight: '500', color: colors.text }}>
              support@finestics.com
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
