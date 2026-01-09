// screens/Onboarding/BusinessAddressScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useThemeContext } from 'context/ThemeProvider';
import { addAddress } from 'api/actions/onboardingActions';
import { businessAddressSchema, BusinessAddressFormData } from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';

const ADDRESS_TYPES = ['Business', 'Billing', 'Delivery'];

export default function BusinessAddressScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const [showTypePicker, setShowTypePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessAddressFormData>({
    resolver: yupResolver(businessAddressSchema),
    defaultValues: {
      type: 'business',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'UK',
      isPrimary: true,
    },
  });

  const onSubmit = async (formData: BusinessAddressFormData) => {
    const response = await addAddress({
      type: formData.type as 'business' | 'billing' | 'delivery',
      street: formData.street,
      city: formData.city,
      state: formData.state || undefined,
      postalCode: formData.postalCode,
      country: formData.country || 'UK',
      isPrimary: formData.isPrimary,
    });

    if (!response.success) {
      Toast.error(response.data?.message || 'Failed to save address');
      return;
    }

    Toast.success('Address saved!');
    navigation.navigate('SubmitOnboardingScreen');
  };

  // Modal Picker Component
  const ModalPicker = ({
    visible,
    onClose,
    options,
    title,
    onSelect,
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    title: string;
    onSelect: (value: string) => void;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            maxHeight: '70%',
          }}>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border || '#ddd',
                borderRadius: 2,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 8,
              textAlign: 'center',
            }}>
            {title}
          </Text>

          <ScrollView style={{ maxHeight: 400 }}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  onSelect(option.toLowerCase());
                  onClose();
                }}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  marginHorizontal: 16,
                  marginVertical: 4,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border || '#eee',
                }}>
                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={{
              margin: 20,
              paddingVertical: 14,
              backgroundColor: colors.primary,
              borderRadius: 12,
            }}>
            <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: 16 }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Progress Indicator */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{ flex: 1, height: 4, backgroundColor: colors.primary, borderRadius: 2 }}
              />
              <View
                style={{ flex: 1, height: 4, backgroundColor: colors.primary, borderRadius: 2 }}
              />
              <View
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: colors.border || '#eee',
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                color: colors.placeholder,
                marginTop: 8,
                textAlign: 'center',
              }}>
              Step 2 of 3
            </Text>
          </View>

          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                <Ionicons name="location" size={32} color={colors.primary} />
              </View>
              <Text
                style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                Business Address
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.placeholder,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                Where is your business located?
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {/* Address Type Picker */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Address Type
              </Text>
              <Controller
                control={control}
                name="type"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowTypePicker(true)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 16,
                        borderWidth: 1,
                        borderColor: colors.border || '#eee',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="bookmark-outline" size={20} color={colors.placeholder} />
                        <Text
                          style={{
                            color: value ? colors.text : colors.placeholder,
                            fontSize: 16,
                            marginLeft: 12,
                            textTransform: 'capitalize',
                          }}>
                          {value || 'Select address type'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                    </TouchableOpacity>
                    <ModalPicker
                      visible={showTypePicker}
                      onClose={() => setShowTypePicker(false)}
                      options={ADDRESS_TYPES}
                      title="Select Address Type"
                      onSelect={onChange}
                    />
                  </>
                )}
              />
            </View>

            {/* Street Address */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Street Address
              </Text>
              <Controller
                control={control}
                name="street"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: errors.street ? '#EF4444' : colors.border || '#eee',
                    }}>
                    <Ionicons name="home-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="e.g., 123 High Street"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
              {errors.street && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                  {errors.street.message}
                </Text>
              )}
            </View>

            {/* City and State Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}>
                  City
                </Text>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="City"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: errors.city ? '#EF4444' : colors.border || '#eee',
                      }}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.city && (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    {errors.city.message}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}>
                  County <Text style={{ color: colors.placeholder }}>(Optional)</Text>
                </Text>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="County"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: colors.border || '#eee',
                      }}
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
            </View>

            {/* Postal Code and Country Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}>
                  Postcode
                </Text>
                <Controller
                  control={control}
                  name="postalCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="e.g., SW1A 1AA"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="characters"
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: errors.postalCode ? '#EF4444' : colors.border || '#eee',
                      }}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.postalCode && (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    {errors.postalCode.message}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}>
                  Country
                </Text>
                <Controller
                  control={control}
                  name="country"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="Country"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: colors.border || '#eee',
                      }}
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
            </View>

            {/* Primary Address Checkbox */}
            <Controller
              control={control}
              name="isPrimary"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  onPress={() => onChange(!value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border || '#eee',
                  }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      marginRight: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: value ? colors.primary : 'transparent',
                      borderWidth: 2,
                      borderColor: value ? colors.primary : colors.border || '#ddd',
                    }}>
                    {value && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                      Set as Primary Address
                    </Text>
                    <Text style={{ color: colors.placeholder, fontSize: 13, marginTop: 2 }}>
                      This will be your default business location
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Footer Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 32 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                alignItems: 'center',
                borderRadius: 12,
                paddingVertical: 16,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.primary,
              }}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{
                flex: 1,
                alignItems: 'center',
                borderRadius: 12,
                paddingVertical: 16,
                backgroundColor: colors.primary,
                opacity: isSubmitting ? 0.7 : 1,
              }}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
