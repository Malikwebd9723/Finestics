// screens/Vendor/components/ExpenseFormModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseSchema, ExpenseFormData } from 'validations/expenseValidation';
import {
  createExpense,
  deleteExpense,
  fetchExpenseDetails,
  updateExpense,
  fetchExpenseCategories,
} from 'api/actions/expensesActions';
import { FormInput, FormTextArea, FormSection } from './FormInputFields';
import ConfirmDeleteModal from 'components/DeleteConfirmationModal';
import {
  ExpenseDetailResponse,
  EXPENSE_CATEGORIES,
  getCategoryIcon,
  getCategoryColor,
} from 'types/expense.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  expenseId?: number | null;
}

const DEFAULT_VALUES: ExpenseFormData = {
  category: '',
  amount: '',
  description: '',
  date: new Date(),
  notes: '',
};

export default function ExpenseFormModal({
  visible,
  onClose,
  expenseId,
}: ExpenseFormModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditMode = !!expenseId;

  // Fetch expense details for edit mode
  const { data: expenseData, isLoading: isLoadingExpense } = useQuery<ExpenseDetailResponse>({
    queryKey: ['expenses', expenseId],
    queryFn: () => fetchExpenseDetails(expenseId!),
    enabled: isEditMode && visible,
  });

  const editingExpense = expenseData?.data;

  // Fetch existing categories
  const { data: existingCategoriesData } = useQuery<{ success: boolean; data: string[] }>({
    queryKey: ['expenses', 'categories'],
    queryFn: fetchExpenseCategories,
    enabled: visible,
  });

  const existingCategories = existingCategoriesData?.data || [];

  // Combine default categories with any custom ones from API
  const allCategories = React.useMemo(() => {
    const defaultCats = EXPENSE_CATEGORIES.map((c) => c.value);
    const customCats = existingCategories.filter(
      (cat) => !defaultCats.includes(cat.toLowerCase())
    );
    return [...EXPENSE_CATEGORIES, ...customCats.map((cat) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: cat,
      icon: 'tag-outline',
    }))];
  }, [existingCategories]);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(expenseSchema) as any,
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const selectedCategory = watch('category');
  const selectedDate = watch('date');

  // Reset form when modal opens/closes or expense data changes
  useEffect(() => {
    if (!visible) {
      reset(DEFAULT_VALUES);
      return;
    }

    if (isEditMode && editingExpense) {
      reset({
        category: editingExpense.category || '',
        amount: editingExpense.amount?.toString() || '',
        description: editingExpense.description || '',
        date: editingExpense.date ? new Date(editingExpense.date) : new Date(),
        notes: editingExpense.notes || '',
      });
    } else if (!isEditMode) {
      reset(DEFAULT_VALUES);
    }
  }, [visible, editingExpense, isEditMode, reset]);

  // Build API payload
  const buildPayload = (formData: ExpenseFormData) => ({
    category: formData.category,
    amount: parseFloat(formData.amount),
    description: formData.description || undefined,
    date: formData.date.toISOString().split('T')[0],
    notes: formData.notes || undefined,
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (formData: ExpenseFormData) => createExpense(buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.error?.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.success('Expense added successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to add expense';
      Dialog.alert('Error', message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (formData: ExpenseFormData) => updateExpense(expenseId!, buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.error?.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.success('Expense updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to update expense';
      Dialog.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(expenseId!),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.error?.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.success('Expense deleted successfully!');
      setDeleteModalVisible(false);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to delete expense';
      Dialog.alert('Error', message);
    },
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    onClose();
  };

  const onSubmit = (formData: ExpenseFormData) => {
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setValue('date', date);
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingExpense && visible) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="items-center rounded-2xl p-8" style={{ backgroundColor: colors.card }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4 text-base" style={{ color: colors.text }}>
              Loading expense...
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
                {isEditMode ? 'Edit Expense' : 'Add Expense'}
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
              {/* Category Selection */}
              <FormSection title="Category">
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <View className="flex-row flex-wrap gap-2">
                      {allCategories.map((cat) => {
                        const isSelected = field.value.toLowerCase() === cat.value.toLowerCase();
                        const catColor = getCategoryColor(cat.value);
                        return (
                          <TouchableOpacity
                            key={cat.value}
                            onPress={() => field.onChange(cat.value)}
                            disabled={isSubmitting}
                            className="flex-row items-center rounded-xl px-3 py-2.5"
                            style={{
                              backgroundColor: isSelected ? catColor : colors.background,
                              borderWidth: 1,
                              borderColor: isSelected ? catColor : colors.border,
                            }}>
                            <MaterialCommunityIcons
                              name={getCategoryIcon(cat.value) as any}
                              size={18}
                              color={isSelected ? '#fff' : colors.text}
                            />
                            <Text
                              className="ml-2 text-sm font-medium"
                              style={{ color: isSelected ? '#fff' : colors.text }}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                />
                {errors.category && (
                  <Text className="mt-2 text-xs" style={{ color: colors.error }}>
                    {errors.category.message}
                  </Text>
                )}
              </FormSection>

              {/* Amount & Date */}
              <FormSection title="Details">
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <FormInput
                      label="Amount"
                      required
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      error={errors.amount?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                {/* Date Picker */}
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                    Date <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    disabled={isSubmitting}
                    className="flex-row items-center rounded-xl px-4 py-3.5"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <MaterialCommunityIcons name="calendar" size={20} color={colors.muted} />
                    <Text className="ml-3 flex-1" style={{ color: colors.text }}>
                      {selectedDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormInput
                      label="Description"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Brief description of expense"
                      error={errors.description?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormSection>

              {/* Notes */}
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
                      placeholder="Any additional details..."
                      minHeight={80}
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
        title="Delete Expense?"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Modal>
  );
}
