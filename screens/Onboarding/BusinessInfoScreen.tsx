// screens/Onboarding/BusinessInfoScreen.tsx

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
import { saveBusinessInfo } from 'api/actions/onboardingActions';
import { businessInfoSchema, BusinessInfoFormData } from 'validations/formValidationSchemas';
import Toast from 'utils/Toast';

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

export default function BusinessInfoScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const [showTypePicker, setShowTypePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessInfoFormData>({
    resolver: yupResolver(businessInfoSchema),
    defaultValues: {
      businessName: '',
      businessType: '',
      businessPhone: '',
      businessEmail: '',
      businessLicense: '',
      website: '',
      description: '',
    },
  });

  const onSubmit = async (formData: BusinessInfoFormData) => {
    const response = await saveBusinessInfo({
      businessName: formData.businessName,
      businessType: formData.businessType,
      businessPhone: formData.businessPhone || undefined,
      businessEmail: formData.businessEmail || undefined,
      businessLicense: formData.businessLicense || undefined,
      website: formData.website || undefined,
      description: formData.description || undefined,
    });

    if (!response.success) {
      Toast.error(response.data?.message || 'Failed to save business info');
      return;
    }

    Toast.success('Business info saved!');
    navigation.navigate('BusinessAddressScreen');
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
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: colors.border || '#eee',
                  borderRadius: 2,
                }}
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
              Step 1 of 3
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
                <Ionicons name="business" size={32} color={colors.primary} />
              </View>
              <Text
                style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                Business Information
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.placeholder,
                  textAlign: 'center',
                  lineHeight: 20,
                }}>
                Tell us about your business
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {/* Business Name */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Business Name
              </Text>
              <Controller
                control={control}
                name="businessName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: errors.businessName ? '#EF4444' : colors.border || '#eee',
                    }}>
                    <Ionicons name="storefront-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="Enter your business name"
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
              {errors.businessName && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                  {errors.businessName.message}
                </Text>
              )}
            </View>

            {/* Business Type Picker */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Business Type
              </Text>
              <Controller
                control={control}
                name="businessType"
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
                        borderColor: errors.businessType ? '#EF4444' : colors.border || '#eee',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="grid-outline" size={20} color={colors.placeholder} />
                        <Text
                          style={{
                            color: value ? colors.text : colors.placeholder,
                            fontSize: 16,
                            marginLeft: 12,
                            textTransform: 'capitalize',
                          }}>
                          {value || 'Select business type'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                    </TouchableOpacity>
                    <ModalPicker
                      visible={showTypePicker}
                      onClose={() => setShowTypePicker(false)}
                      options={BUSINESS_TYPES}
                      title="Select Business Type"
                      onSelect={onChange}
                    />
                  </>
                )}
              />
              {errors.businessType && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
                  {errors.businessType.message}
                </Text>
              )}
            </View>

            {/* Phone */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Business Phone <Text style={{ color: colors.placeholder }}>(Optional)</Text>
              </Text>
              <Controller
                control={control}
                name="businessPhone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: colors.border || '#eee',
                    }}>
                    <Ionicons name="call-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="e.g., +44 7700 900000"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="phone-pad"
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
            </View>

            {/* Email */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Business Email <Text style={{ color: colors.placeholder }}>(Optional)</Text>
              </Text>
              <Controller
                control={control}
                name="businessEmail"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: colors.border || '#eee',
                    }}>
                    <Ionicons name="mail-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="business@example.com"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
            </View>

            {/* License */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                License Number <Text style={{ color: colors.placeholder }}>(Optional)</Text>
              </Text>
              <Controller
                control={control}
                name="businessLicense"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: colors.border || '#eee',
                    }}>
                    <Ionicons name="document-text-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="Enter license number"
                      placeholderTextColor={colors.placeholder}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
            </View>

            {/* Website */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Website <Text style={{ color: colors.placeholder }}>(Optional)</Text>
              </Text>
              <Controller
                control={control}
                name="website"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: colors.border || '#eee',
                    }}>
                    <Ionicons name="globe-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      placeholder="https://www.example.com"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="url"
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
            </View>

            {/* Description */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                Description <Text style={{ color: colors.placeholder }}>(Optional)</Text>
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Tell us about your business..."
                    placeholderTextColor={colors.placeholder}
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      fontSize: 16,
                      minHeight: 100,
                      textAlignVertical: 'top',
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

          {/* Footer Button */}
          <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
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
