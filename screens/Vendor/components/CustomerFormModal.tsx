// screens/Vendor/components/CustomerFormModal.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { CustomerDetailResponse, BUSINESS_TYPES, PAYMENT_TERMS } from 'types/customer.types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CustomerFormModalProps {
  visible: boolean;
  onClose: () => void;
  customerId?: number | null;
}

// Local form shape — only the fields this quick-add form actually renders.
interface CustomerFormValues {
  businessName: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  businessType: string;
  creditLimit: string;
  paymentTerms: string;
  street: string;
  city: string;
  postalCode: string;
  notes: string;
  deliveryInstructions: string;
}

const DEFAULT_VALUES: CustomerFormValues = {
  businessName: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  businessType: 'other',
  creditLimit: '',
  paymentTerms: 'cash',
  street: '',
  city: '',
  postalCode: '',
  notes: '',
  deliveryInstructions: '',
};

export default function CustomerFormModal({
  visible,
  onClose,
  customerId,
}: CustomerFormModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

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
  } = useForm<CustomerFormValues>({
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
        businessType: editingCustomer.businessType || 'other',
        creditLimit: editingCustomer.creditLimit?.toString() || '',
        paymentTerms: editingCustomer.paymentTerms || 'cash',
        street: editingCustomer.address?.street || '',
        city: editingCustomer.address?.city || '',
        postalCode: editingCustomer.address?.postalCode || '',
        notes: editingCustomer.notes || '',
        deliveryInstructions: editingCustomer.deliveryInstructions || '',
      });
    } else if (!isEditMode) {
      reset(DEFAULT_VALUES);
    }
  }, [visible, editingCustomer, isEditMode, reset]);

  // Build API payload from form data
  const buildPayload = (formData: CustomerFormValues) => ({
    businessName: formData.businessName,
    contactPerson: formData.contactPerson,
    phone: formData.phone,
    alternatePhone: formData.alternatePhone || null,
    email: formData.email || null,
    creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
    paymentTerms: formData.paymentTerms || 'cash',
    businessType: formData.businessType || 'other',
    notes: formData.notes || null,
    deliveryInstructions: formData.deliveryInstructions || null,
    // Address is optional (walk-in customers). When present, `type` and
    // `country` are hardcoded constants the API expects.
    ...(formData.street && formData.city
      ? {
          address: {
            type: 'business',
            street: formData.street,
            city: formData.city,
            postalCode: formData.postalCode || null,
            country: 'UK',
          },
        }
      : {}),
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (formData: CustomerFormValues) => addCustomer(buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      Toast.success('Customer added successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add customer';
      Dialog.alert('Error', message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (formData: CustomerFormValues) =>
      updateCustomer(customerId!, buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      Toast.success('Customer updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update customer';
      Dialog.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customerId!),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      Toast.success('Customer deleted successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete customer';
      Dialog.alert('Error', message);
    },
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      Dialog.confirm(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to close?',
        {
          confirmText: 'Discard',
          destructive: true,
          onConfirm: () => onClose(),
        }
      );
    } else {
      onClose();
    }
  };

  const onSubmit = (formData: CustomerFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

  const confirmDelete = () => {
    Dialog.confirm(
      'Delete Customer?',
      'Are you sure you want to delete this customer? This action cannot be undone.',
      {
        confirmText: 'Delete',
        destructive: true,
        onConfirm: () => deleteMutation.mutate(),
      }
    );
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
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView
              className="px-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Required fields — enough to save */}
              <View className="mt-5">
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
                  name="phone"
                  render={({ field }) => (
                    <FormInput
                      label="Phone"
                      required
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="07700 900000"
                      keyboardType="phone-pad"
                      error={errors.phone?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </View>

              {/* Everything else is optional */}
              <FormSection title="More details">
                <Controller
                  control={control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormInput
                      label="Contact Person"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Enter contact person name"
                      error={errors.contactPerson?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

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
                      options={[...BUSINESS_TYPES]}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.businessType?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormSelect
                      label="Payment Terms"
                      options={[...PAYMENT_TERMS]}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.paymentTerms?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />

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
                  name="street"
                  render={({ field }) => (
                    <FormInput
                      label="Street Address"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g., 14 High Street"
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
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="e.g., Birmingham"
                          error={errors.city?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormInput
                          label="Postcode"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="e.g., B1 1AA"
                          autoCapitalize="characters"
                          error={errors.postalCode?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                </FormRow>

                <Controller
                  control={control}
                  name="deliveryInstructions"
                  render={({ field }) => (
                    <FormTextArea
                      label="Delivery Instructions"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g., Side entrance, ring bell twice"
                      minHeight={60}
                      numberOfLines={2}
                      error={errors.deliveryInstructions?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

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
                  onPress={confirmDelete}
                  disabled={isSubmitting}
                  className="items-center justify-center rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: colors.error,
                    opacity: isSubmitting ? 0.5 : 1,
                  }}>
                  <MaterialCommunityIcons name="delete" size={20} color="#fff" />
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
                  backgroundColor: colors.cta,
                  opacity: isSubmitting ? 0.7 : 1,
                }}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.onCta} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={isEditMode ? 'check' : 'plus'}
                      size={18}
                      color={colors.onCta}
                    />
                    <Text className="ml-1 font-semibold" style={{ color: colors.onCta }}>
                      {isEditMode ? 'Update' : 'Add'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
