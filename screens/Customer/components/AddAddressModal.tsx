// screens/Customer/components/AddAddressModal.tsx
// Shared "new delivery address" sheet — used by Checkout and the Addresses screen.
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import { createAddress, type CustomerAddress } from 'api/actions/customerOrderActions';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (address: CustomerAddress) => void;
}

export default function AddAddressModal({ visible, onClose, onSaved }: Props) {
  const { colors } = useThemeContext();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [label, setLabel] = useState('');

  const mutation = useMutation({
    mutationFn: () => createAddress({ street, city, postalCode, label, type: 'delivery' }),
    onSuccess: (a) => {
      setStreet('');
      setCity('');
      setPostalCode('');
      setLabel('');
      onSaved(a);
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to save address'),
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
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>New Address</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Label (e.g. Home, Shop)"
            placeholderTextColor={colors.placeholder}
            style={input}
          />
          <TextInput
            value={street}
            onChangeText={setStreet}
            placeholder="Street address"
            placeholderTextColor={colors.placeholder}
            style={input}
          />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={colors.placeholder}
            style={input}
          />
          <TextInput
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Postal code"
            placeholderTextColor={colors.placeholder}
            style={input}
          />
          <Pressable
            disabled={mutation.isPending || !street.trim() || !city.trim()}
            onPress={() => mutation.mutate()}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 16,
              opacity: mutation.isPending || !street.trim() || !city.trim() ? 0.6 : 1,
            }}>
            {mutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
                Save Address
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
