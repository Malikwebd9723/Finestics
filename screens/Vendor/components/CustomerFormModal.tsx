// screens/Vendor/components/CustomerFormModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerSchema } from 'validations/customerValidation';
import {
  addCustomer,
  deleteCustomer,
  fetchCustomerDetails,
  updateCustomer,
} from 'api/actions/customerActions';
import { FormInput, FormTextArea, FormSelect, FormRow, FormSection } from './FormInputFields';
import ConfirmDeleteModal from 'components/DeleteConfirmationModal';
import {
  CustomerFormData,
  CustomerDetailResponse,
  BUSINESS_TYPES,
  PAYMENT_TERMS,
  ADDRESS_TYPES,
} from 'types/customer.types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CustomerFormModalProps {
  visible: boolean;
  onClose: () => void;
  customerId?: number | null;
}

const DEFAULT_VALUES: CustomerFormData = {
  businessName: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  creditLimit: '',
  paymentTerms: '',
  businessType: '',
  notes: '',
  deliveryInstructions: '',
  type: 'business',
  label: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Pakistan',
  instructions: '',
};

export default function CustomerFormModal({
  visible,
  onClose,
  customerId,
}: CustomerFormModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const isEditMode = !!customerId;

  // Fetch customer details for edit mode
  const { data, isLoading: isLoadingCustomer } = useQuery<CustomerDetailResponse>({
    queryKey: ['customers', customerId],
    queryFn: () => fetchCustomerDetails(customerId!),
    enabled: isEditMode && visible,
  });

  const editingCustomer = data?.data;

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CustomerFormData>({
    resolver: yupResolver(customerSchema) as any,
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  // Reset form when modal opens/closes or customer data changes
  useEffect(() => {
    if (!visible) {
      reset(DEFAULT_VALUES);
      return;
    }

    if (isEditMode && editingCustomer) {
      reset({
        businessName: editingCustomer.businessName || '',
        contactPerson: editingCustomer.contactPerson || '',
        phone: editingCustomer.phone || '',
        alternatePhone: editingCustomer.alternatePhone || '',
        email: editingCustomer.email || '',
        creditLimit: editingCustomer.creditLimit?.toString() || '',
        paymentTerms: editingCustomer.paymentTerms || '',
        businessType: editingCustomer.businessType || '',
        notes: editingCustomer.notes || '',
        deliveryInstructions: editingCustomer.deliveryInstructions || '',
        type: editingCustomer.address?.type || 'business',
        label: editingCustomer.address?.label || '',
        street: editingCustomer.address?.street || '',
        city: editingCustomer.address?.city || '',
        state: editingCustomer.address?.state || '',
        postalCode: editingCustomer.address?.postalCode || '',
        country: editingCustomer.address?.country || 'Pakistan',
        instructions: editingCustomer.address?.instructions || '',
      });
    } else if (!isEditMode) {
      reset(DEFAULT_VALUES);
    }
  }, [visible, editingCustomer, isEditMode, reset]);

  // Build API payload from form data
  const buildPayload = (formData: CustomerFormData) => ({
    businessName: formData.businessName,
    contactPerson: formData.contactPerson,
    phone: formData.phone,
    alternatePhone: formData.alternatePhone || null,
    email: formData.email || null,
    creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
    paymentTerms: formData.paymentTerms,
    businessType: formData.businessType,
    notes: formData.notes || null,
    deliveryInstructions: formData.deliveryInstructions || null,
    address: {
      type: formData.type,
      label: formData.label || null,
      street: formData.street,
      city: formData.city,
      state: formData.state || null,
      postalCode: formData.postalCode || null,
      country: formData.country || 'Pakistan',
      instructions: formData.instructions || null,
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (formData: CustomerFormData) => addCustomer(buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        ToastAndroid.show(response.message || 'Something went wrong', ToastAndroid.SHORT);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      ToastAndroid.show('Customer added successfully!', ToastAndroid.SHORT);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add customer';
      Alert.alert('Error', message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (formData: CustomerFormData) => updateCustomer(customerId!, buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        ToastAndroid.show(response.message || 'Something went wrong', ToastAndroid.SHORT);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      ToastAndroid.show('Customer updated successfully!', ToastAndroid.SHORT);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update customer';
      Alert.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customerId!),
    onSuccess: (response) => {
      if (!response.success) {
        ToastAndroid.show(response.message || 'Something went wrong', ToastAndroid.SHORT);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      ToastAndroid.show('Customer deleted successfully!', ToastAndroid.SHORT);
      setDeleteModalVisible(false);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete customer';
      Alert.alert('Error', message);
    },
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to close?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => onClose() },
      ]);
    } else {
      onClose();
    }
  };

  const onSubmit = (formData: CustomerFormData) => {
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingCustomer && visible) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="items-center rounded-2xl p-8" style={{ backgroundColor: colors.card }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4 text-base" style={{ color: colors.text }}>
              Loading customer...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <SafeAreaView className="flex-1 justify-end bg-black/50">
          <View
            className="rounded-t-3xl"
            style={{ backgroundColor: colors.card, maxHeight: '92%' }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between border-b px-5 py-4"
              style={{ borderColor: colors.border }}>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {isEditMode ? 'Edit Customer' : 'Add Customer'}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isSubmitting}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView
              className="px-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Business Information */}
              <FormSection title="Business Information">
                <Controller
                  control={control}
                  name="businessName"
                  render={({ field }) => (
                    <FormInput
                      label="Business Name"
                      required
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter business name"
                      error={errors.businessName?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormInput
                      label="Contact Person"
                      required
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter contact person name"
                      error={errors.contactPerson?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <FormRow>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <FormInput
                          label="Phone"
                          required
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="03001234567"
                          keyboardType="phone-pad"
                          error={errors.phone?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="alternatePhone"
                      render={({ field }) => (
                        <FormInput
                          label="Alt. Phone"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Optional"
                          keyboardType="phone-pad"
                          error={errors.alternatePhone?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                </FormRow>

                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormInput
                      label="Email"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="email@example.com (optional)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="businessType"
                  render={({ field }) => (
                    <FormSelect
                      label="Business Type"
                      required
                      options={[...BUSINESS_TYPES]}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.businessType?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </FormSection>

              {/* Payment Information */}
              <FormSection title="Payment Information">
                <Controller
                  control={control}
                  name="creditLimit"
                  render={({ field }) => (
                    <FormInput
                      label="Credit Limit"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      error={errors.creditLimit?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormSelect
                      label="Payment Terms"
                      required
                      options={[...PAYMENT_TERMS]}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.paymentTerms?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </FormSection>

              {/* Address Information */}
              <FormSection title="Address">
                <FormRow>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <FormSelect
                          label="Type"
                          required
                          options={[...ADDRESS_TYPES]}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.type?.message}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="label"
                      render={({ field }) => (
                        <FormInput
                          label="Label"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Main Store"
                          error={errors.label?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                </FormRow>

                <Controller
                  control={control}
                  name="street"
                  render={({ field }) => (
                    <FormInput
                      label="Street Address"
                      required
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Shop 15, Saddar Bazaar"
                      error={errors.street?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <FormRow>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="city"
                      render={({ field }) => (
                        <FormInput
                          label="City"
                          required
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Karachi"
                          error={errors.city?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="state"
                      render={({ field }) => (
                        <FormInput
                          label="State/Province"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Sindh"
                          error={errors.state?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                </FormRow>

                <FormRow>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormInput
                          label="Postal Code"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="75000"
                          keyboardType="number-pad"
                          error={errors.postalCode?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="country"
                      render={({ field }) => (
                        <FormInput
                          label="Country"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Pakistan"
                          error={errors.country?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                </FormRow>

                <Controller
                  control={control}
                  name="instructions"
                  render={({ field }) => (
                    <FormTextArea
                      label="Address Instructions"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Near old bus stand, blue building"
                      minHeight={60}
                      numberOfLines={2}
                      error={errors.instructions?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormSection>

              {/* Additional Information */}
              <FormSection title="Additional Notes">
                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <FormTextArea
                      label="Notes"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Regular customer, prefers morning deliveries"
                      minHeight={70}
                      numberOfLines={3}
                      error={errors.notes?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="deliveryInstructions"
                  render={({ field }) => (
                    <FormTextArea
                      label="Delivery Instructions"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Call before delivery"
                      minHeight={70}
                      numberOfLines={3}
                      error={errors.deliveryInstructions?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormSection>

              {/* Spacer */}
              <View className="h-6" />
            </ScrollView>

            {/* Action Buttons */}
            <View
              className="flex-row gap-3 border-t px-5 py-4"
              style={{ borderColor: colors.border }}>
              {isEditMode && (
                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(true)}
                  disabled={isSubmitting}
                  className="items-center justify-center rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: colors.error,
                    opacity: isSubmitting ? 0.5 : 1,
                  }}>
                  <MaterialIcons name="delete" size={20} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleClose}
                disabled={isSubmitting}
                className="flex-1 items-center rounded-xl py-3.5"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: isSubmitting ? 0.5 : 1,
                }}>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
                style={{
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.7 : 1,
                }}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name={isEditMode ? 'check' : 'add'} size={18} color="#fff" />
                    <Text className="ml-1 font-semibold text-white">
                      {isEditMode ? 'Update' : 'Add'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Modal>
  );
}
