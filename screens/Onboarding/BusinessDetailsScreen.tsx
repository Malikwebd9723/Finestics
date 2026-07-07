// screens/Onboarding/BusinessDetailsScreen.tsx
// Single-screen vendor onboarding: the five essentials, then submit for
// approval. Also handles the rejected-profile flow (update + resubmit).

import React, { useEffect, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import {
  getOnboardingStatus,
  saveBusinessInfo,
  addAddress,
  submitOnboarding,
  updateProfile,
  resubmitProfile,
} from 'api/actions/onboardingActions';
import { businessDetailsSchema, BusinessDetailsFormData } from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';
import { fonts } from 'constants/design';
import { Input, Button, BottomSheet } from 'components/ui';

const BUSINESS_TYPES = [
  'Wholesaler',
  'Retailer',
  'Farm',
  'Distributor',
  'Restaurant',
  'Cafe',
  'Hotel',
  'Catering',
  'Other',
];

export default function BusinessDetailsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { user, refreshUser, logout } = useAuth() as any;

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  // Truthy when the profile was rejected; carries the admin's reason.
  const [rejected, setRejected] = useState<{ reason?: string } | null>(null);

  // Prefill from an existing profile (rejected users, or a resumed session).
  const profile: any = (user as any)?.vendorProfile ?? (user as any)?.customerProfile ?? null;
  const existingAddress = profile?.addresses?.[0];

  // Typed-but-unsubmitted values survive app kills / sign-outs on this device.
  const draftKey = user?.id ? `onboarding_draft_v1:${user.id}` : null;
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BusinessDetailsFormData>({
    resolver: yupResolver(businessDetailsSchema),
    defaultValues: {
      businessName: profile?.businessName ?? '',
      businessType: profile?.businessType ?? '',
      street: existingAddress?.street ?? '',
      city: existingAddress?.city ?? '',
      postalCode: existingAddress?.postalCode ?? '',
    },
  });

  useEffect(() => {
    const loadStatus = async () => {
      const response = await getOnboardingStatus();
      const status = response.success ? response.data?.data : null;
      if (status?.profileStatus === 'rejected') {
        setRejected({ reason: status.rejectionReason });
      }
    };
    loadStatus();
  }, []);

  // Restore a saved draft (draft wins over profile prefill — it's newer).
  useEffect(() => {
    if (!draftKey) return;
    AsyncStorage.getItem(draftKey)
      .then((raw) => {
        if (raw) reset(JSON.parse(raw));
      })
      .catch(() => {
        // Corrupt/missing draft — keep the prefill.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Persist as the user types (debounced), until successfully submitted.
  useEffect(() => {
    if (!draftKey) return;
    const sub = watch((values) => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        AsyncStorage.setItem(draftKey, JSON.stringify(values)).catch(() => {});
      }, 400);
    });
    return () => {
      sub.unsubscribe();
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [watch, draftKey]);

  const onSubmit = async (formData: BusinessDetailsFormData) => {
    const info = {
      businessName: formData.businessName,
      businessType: formData.businessType,
    };
    const infoResponse = rejected ? await updateProfile(info) : await saveBusinessInfo(info);
    if (!infoResponse.success) {
      Toast.error(infoResponse.data?.message || 'Failed to save business details');
      return;
    }

    const addressResponse = await addAddress({
      type: 'business',
      street: formData.street,
      city: formData.city,
      postalCode: formData.postalCode,
      country: 'UK',
      isPrimary: true,
    });
    if (!addressResponse.success) {
      Toast.error(addressResponse.data?.message || 'Failed to save address');
      return;
    }

    const submitResponse = rejected ? await resubmitProfile() : await submitOnboarding();
    if (!submitResponse.success) {
      Toast.error(submitResponse.data?.message || 'Failed to submit profile');
      return;
    }

    Toast.success(rejected ? 'Profile resubmitted for review!' : 'Profile submitted for review!');
    if (draftKey) await AsyncStorage.removeItem(draftKey).catch(() => {});
    await refreshUser();
    navigation.reset({
      index: 0,
      routes: [{ name: 'PendingVerificationScreen' }],
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Escape hatch — onboarding must never trap the user. Their draft is
          saved locally, so signing out and back in resumes where they left off. */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, alignItems: 'flex-end' }}>
        <TouchableOpacity
          onPress={() => logout?.()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <MaterialCommunityIcons name="logout" size={17} color={colors.text} />
          <Text style={{ marginLeft: 7, color: colors.text, fontWeight: '500', fontSize: 13 }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Text
              style={{
                fontFamily: fonts.extrabold,
                fontSize: 26,
                letterSpacing: -0.4,
                color: colors.text,
                marginBottom: 6,
              }}>
              Business details
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>
              Tell us the essentials — you can complete your profile after approval.
            </Text>
          </View>

          {/* Rejection banner */}
          {rejected ? (
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.error + '14',
                borderRadius: 12,
                padding: 14,
                marginBottom: 18,
                gap: 10,
              }}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={20}
                color={colors.error}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: colors.error, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>
                  Application rejected
                </Text>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>
                  {rejected.reason || 'Please review your details and resubmit.'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Form */}
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Business name"
                icon="storefront-outline"
                placeholder="Your trading name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.businessName?.message}
              />
            )}
          />

          {/* Business type — picker field styled to match Input */}
          <Controller
            control={control}
            name="businessType"
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: 14 }}>
                <Text
                  style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Business type
                </Text>
                <Pressable
                  onPress={() => setTypePickerOpen(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: errors.businessType ? colors.error : colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 13,
                  }}>
                  <MaterialCommunityIcons
                    name="view-grid-outline"
                    size={19}
                    color={errors.businessType ? colors.error : colors.muted}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: value ? colors.text : colors.placeholder,
                      textTransform: 'capitalize',
                    }}>
                    {value || 'Select business type'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.muted} />
                </Pressable>
                {errors.businessType ? (
                  <Text style={{ color: colors.error, fontSize: 12, marginTop: 5 }}>
                    {errors.businessType.message}
                  </Text>
                ) : null}

                <BottomSheet
                  visible={typePickerOpen}
                  onClose={() => setTypePickerOpen(false)}
                  title="Business type">
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {BUSINESS_TYPES.map((option) => {
                      const selected = value === option.toLowerCase();
                      return (
                        <Pressable
                          key={option}
                          onPress={() => {
                            onChange(option.toLowerCase());
                            setTypePickerOpen(false);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 14,
                            paddingHorizontal: 4,
                          }}>
                          <Text
                            style={{
                              fontSize: 15,
                              color: selected ? colors.accent : colors.text,
                              fontWeight: selected ? '700' : '400',
                            }}>
                            {option}
                          </Text>
                          {selected ? (
                            <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </BottomSheet>
              </View>
            )}
          />

          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Street address"
                icon="map-marker-outline"
                placeholder="e.g. 123 High Street"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoComplete="street-address"
                error={errors.street?.message}
              />
            )}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="City"
                    placeholder="City"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.city?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="postalCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Postcode"
                    placeholder="e.g. SW1A 1AA"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="characters"
                    autoComplete="postal-code"
                    error={errors.postalCode?.message}
                  />
                )}
              />
            </View>
          </View>

          <Button
            title={rejected ? 'Update & resubmit' : 'Submit for approval'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={{ marginTop: 6 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
