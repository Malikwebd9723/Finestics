// screens/Customer/MyProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { typo, fonts } from 'constants/design';
import { Section, ListRow } from 'components/ui';
import Toast from 'utils/Toast';
import { updateMyProfile } from 'api/actions/customerProfileActions';

export default function MyProfileScreen() {
  const { colors } = useThemeContext();
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const [editOpen, setEditOpen] = useState(false);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const initial = user?.firstName?.[0]?.toUpperCase() || 'C';

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Identity */}
      <View className="items-center" style={{ paddingTop: 28, paddingBottom: 4 }}>
        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary + '14' }}>
          <Text style={{ color: colors.primary, fontFamily: fonts.extrabold, fontSize: 30 }}>
            {initial}
          </Text>
        </View>
        <Text className="mt-3" style={[typo.title, { color: colors.text }]}>
          {fullName || 'Customer'}
        </Text>
        <Text className="mt-0.5 text-[13px] font-medium" style={{ color: colors.muted }}>
          Customer account
        </Text>
      </View>

      {/* Contact details */}
      <Section title="Contact">
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
          }}>
          <ListRow icon="email-outline" title={user?.email || '—'} subtitle="Email" />
          <ListRow
            icon="phone-outline"
            title={user?.phone || 'Not set'}
            subtitle="Phone"
            divider
          />
        </View>
        <Pressable
          onPress={() => setEditOpen(true)}
          style={{
            marginTop: 12,
            borderRadius: 12,
            paddingVertical: 13,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary,
          }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Edit Details</Text>
        </Pressable>
      </Section>

      {/* Account shortcuts */}
      <Section title="Account">
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
          }}>
          <ListRow
            icon="map-marker-outline"
            title="Addresses"
            subtitle="Manage delivery addresses"
            onPress={() => navigation.navigate('AddressesScreen')}
          />
          <ListRow
            icon="bell-outline"
            title="Notifications"
            subtitle="Order updates and connection activity"
            divider
            onPress={() => navigation.navigate('Notifications')}
          />
          <ListRow
            icon="account-group-outline"
            title="My Vendors"
            subtitle="Your connected suppliers"
            divider
            onPress={() => navigation.navigate('MainTabs', { screen: 'My Vendors' })}
          />
        </View>
      </Section>

      <EditProfileModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          phone: user?.phone ?? '',
        }}
        onSaved={async () => {
          setEditOpen(false);
          await refreshUser();
          Toast.success('Profile updated');
        }}
      />
    </ScrollView>
  );
}

// ==================== EDIT SHEET ====================

function EditProfileModal({
  visible,
  onClose,
  initial,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  initial: { firstName: string; lastName: string; phone: string };
  onSaved: () => void;
}) {
  const { colors } = useThemeContext();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);

  // Re-seed fields each time the sheet opens.
  React.useEffect(() => {
    if (visible) {
      setFirstName(initial.firstName);
      setLastName(initial.lastName);
      setPhone(initial.phone);
    }
  }, [visible]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      }),
    onSuccess: onSaved,
    onError: (e: any) => Toast.error(e?.message || 'Failed to update profile'),
  });

  const input = {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    marginTop: 10,
  };

  const canSave = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.text + '55' }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            paddingBottom: 28,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Edit Details
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={colors.placeholder}
            style={input}
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={colors.placeholder}
            style={input}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            style={input}
          />
          <Pressable
            disabled={mutation.isPending || !canSave}
            onPress={() => mutation.mutate()}
            style={{
              backgroundColor: colors.cta,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 16,
              opacity: mutation.isPending || !canSave ? 0.6 : 1,
            }}>
            {mutation.isPending ? (
              <ActivityIndicator color={colors.onCta} />
            ) : (
              <Text style={{ color: colors.onCta, fontWeight: '700', fontSize: 16 }}>
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
