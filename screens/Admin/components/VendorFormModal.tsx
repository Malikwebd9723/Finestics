// screens/Admin/components/VendorFormModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { createVendor, updateVendor, Vendor } from 'api/actions/adminActions';
import Snackbar, { useSnackbar } from 'components/Snackbar';

const { height } = Dimensions.get('window');

interface VendorFormModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  vendor?: Vendor;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  businessType: string;
  description: string;
  businessPhone: string;
  businessEmail: string;
}

export default function VendorFormModal({ visible, onClose, mode, vendor }: VendorFormModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));
  const snackbar = useSnackbar();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    businessType: '',
    description: '',
    businessPhone: '',
    businessEmail: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (mode === 'edit' && vendor) {
      setFormData({
        firstName: vendor.user?.firstName || '',
        lastName: vendor.user?.lastName || '',
        email: vendor.user?.email || '',
        phone: vendor.user?.phone || '',
        password: '',
        businessName: vendor.businessName || '',
        businessType: vendor.businessType || '',
        description: vendor.description || '',
        businessPhone: vendor.businessPhone || '',
        businessEmail: vendor.businessEmail || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        businessName: '',
        businessType: '',
        description: '',
        businessPhone: '',
        businessEmail: '',
      });
    }
    setErrors({});
  }, [mode, vendor, visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: (response: any) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['vendors'] });
        snackbar.showSuccess(response.data?.message || 'Vendor created successfully');
        setTimeout(() => onClose(), 500);
      } else {
        const errorMsg = response.data?.error?.message || response.data?.message || 'Failed to create vendor';
        snackbar.showError(errorMsg);
      }
    },
    onError: (error: any) => {
      const errorMsg = error?.data?.error?.message || error?.message || 'Failed to create vendor';
      snackbar.showError(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Vendor> }) => updateVendor(id, data),
    onSuccess: (response: any) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['vendors'] });
        snackbar.showSuccess(response.data?.message || 'Vendor updated successfully');
        setTimeout(() => onClose(), 500);
      } else {
        const errorMsg = response.data?.error?.message || response.data?.message || 'Failed to update vendor';
        snackbar.showError(errorMsg);
      }
    },
    onError: (error: any) => {
      const errorMsg = error?.data?.error?.message || error?.message || 'Failed to update vendor';
      snackbar.showError(errorMsg);
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (mode === 'create') {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (mode === 'create') {
      createMutation.mutate({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        password: formData.password,
        businessName: formData.businessName.trim(),
        businessType: formData.businessType?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        businessPhone: formData.businessPhone?.trim() || undefined,
        businessEmail: formData.businessEmail?.trim() || undefined,
      });
    } else if (vendor) {
      updateMutation.mutate({
        id: vendor.id,
        data: {
          businessName: formData.businessName,
          businessType: formData.businessType,
          description: formData.description,
          businessPhone: formData.businessPhone,
          businessEmail: formData.businessEmail,
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable style={{ height: height * 0.1 }} onPress={onClose} />

          <Animated.View
            style={{
              flex: 1,
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.card,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 20,
            }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between p-5 border-b"
              style={{ borderColor: colors.border }}>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {mode === 'create' ? 'Add New Vendor' : 'Edit Vendor'}
              </Text>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Form Content */}
            <ScrollView
              className="flex-1 px-5 py-4"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* User Info Section (only for create) */}
              {mode === 'create' && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-3" style={{ color: colors.muted }}>
                    USER INFORMATION
                  </Text>

                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1">
                      <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                        First Name *
                      </Text>
                      <TextInput
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        placeholder="First name"
                        placeholderTextColor={colors.muted}
                        className="rounded-lg px-3 py-3"
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: errors.firstName ? colors.error : colors.border,
                        }}
                      />
                      {errors.firstName && (
                        <Text className="text-xs mt-1" style={{ color: colors.error }}>
                          {errors.firstName}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                        Last Name *
                      </Text>
                      <TextInput
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        placeholder="Last name"
                        placeholderTextColor={colors.muted}
                        className="rounded-lg px-3 py-3"
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: errors.lastName ? colors.error : colors.border,
                        }}
                      />
                      {errors.lastName && (
                        <Text className="text-xs mt-1" style={{ color: colors.error }}>
                          {errors.lastName}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                      Email *
                    </Text>
                    <TextInput
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      placeholder="Email address"
                      placeholderTextColor={colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="rounded-lg px-3 py-3"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: errors.email ? colors.error : colors.border,
                      }}
                    />
                    {errors.email && (
                      <Text className="text-xs mt-1" style={{ color: colors.error }}>
                        {errors.email}
                      </Text>
                    )}
                  </View>

                  <View className="mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                      Phone
                    </Text>
                    <TextInput
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholder="Phone number"
                      placeholderTextColor={colors.muted}
                      keyboardType="phone-pad"
                      className="rounded-lg px-3 py-3"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>

                  <View className="mb-3">
                    <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                      Password *
                    </Text>
                    <TextInput
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      placeholder="Password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                      className="rounded-lg px-3 py-3"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: errors.password ? colors.error : colors.border,
                      }}
                    />
                    {errors.password && (
                      <Text className="text-xs mt-1" style={{ color: colors.error }}>
                        {errors.password}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Business Info Section */}
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-3" style={{ color: colors.muted }}>
                  BUSINESS INFORMATION
                </Text>

                <View className="mb-3">
                  <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                    Business Name *
                  </Text>
                  <TextInput
                    value={formData.businessName}
                    onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                    placeholder="Business name"
                    placeholderTextColor={colors.muted}
                    className="rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: errors.businessName ? colors.error : colors.border,
                    }}
                  />
                  {errors.businessName && (
                    <Text className="text-xs mt-1" style={{ color: colors.error }}>
                      {errors.businessName}
                    </Text>
                  )}
                </View>

                <View className="mb-3">
                  <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                    Business Type
                  </Text>
                  <TextInput
                    value={formData.businessType}
                    onChangeText={(text) => setFormData({ ...formData, businessType: text })}
                    placeholder="e.g., Wholesale, Retail"
                    placeholderTextColor={colors.muted}
                    className="rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                    Description
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Brief description of the business"
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={3}
                    className="rounded-lg px-3 py-3"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                      Business Phone
                    </Text>
                    <TextInput
                      value={formData.businessPhone}
                      onChangeText={(text) => setFormData({ ...formData, businessPhone: text })}
                      placeholder="Phone"
                      placeholderTextColor={colors.muted}
                      keyboardType="phone-pad"
                      className="rounded-lg px-3 py-3"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs mb-1" style={{ color: colors.muted }}>
                      Business Email
                    </Text>
                    <TextInput
                      value={formData.businessEmail}
                      onChangeText={(text) => setFormData({ ...formData, businessEmail: text })}
                      placeholder="Email"
                      placeholderTextColor={colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="rounded-lg px-3 py-3"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Bottom spacer */}
              <View className="h-20" />
            </ScrollView>

            {/* Submit Button */}
            <View className="p-5 border-t" style={{ borderColor: colors.border }}>
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                className="py-4 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                }}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    {mode === 'create' ? 'Create Vendor' : 'Save Changes'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>

          {/* Snackbar for feedback */}
          <Snackbar
            visible={snackbar.visible}
            message={snackbar.message}
            type={snackbar.type}
            onDismiss={snackbar.hideSnackbar}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
