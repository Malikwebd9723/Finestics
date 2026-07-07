// screens/Vendor/components/ProductFormModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productSchema } from 'validations/productValidation';
import {
  addProduct,
  deleteProduct,
  fetchProductDetails,
  updateProduct,
  fetchTags,
} from 'api/actions/productActions';
import { FormInput, FormTextArea, FormSection, FormRow } from './FormInputFields';
import { ProductFormData, ProductDetailResponse, PRODUCT_UNITS } from 'types/product.types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProductFormModalProps {
  visible: boolean;
  onClose: () => void;
  productId?: number | null;
}

const DEFAULT_VALUES: ProductFormData = {
  name: '',
  unit: 'kg',
  buyingPrice: '',
  sellingPrice: '',
  tags: [],
  description: '',
  isActive: true,
};

export default function ProductFormModal({ visible, onClose, productId }: ProductFormModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  // "More options" disclosure — collapsed on create, expanded on edit so
  // existing tags/status/description stay visible
  const [showMore, setShowMore] = useState(false);

  const isEditMode = !!productId;

  // Fetch product details for edit mode
  const { data: productData, isLoading: isLoadingProduct } = useQuery<ProductDetailResponse>({
    queryKey: ['products', productId],
    queryFn: () => fetchProductDetails(productId!),
    enabled: isEditMode && visible,
  });

  const editingProduct = productData?.data;

  // Fetch existing tags
  const { data: existingTags = [] } = useQuery<string[]>({
    queryKey: ['products', 'tags'],
    queryFn: fetchTags,
    enabled: visible,
  });

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema) as any,
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const selectedUnit = watch('unit');

  // Reset form when modal opens/closes or product data changes
  useEffect(() => {
    if (!visible) {
      reset(DEFAULT_VALUES);
      setSelectedTags([]);
      setCustomTagInput('');
      setShowMore(false);
      return;
    }

    if (isEditMode && editingProduct) {
      reset({
        name: editingProduct.name || '',
        unit: editingProduct.unit || 'kg',
        buyingPrice: editingProduct.buyingPrice?.toString() || '',
        sellingPrice: editingProduct.sellingPrice?.toString() || '',
        tags: editingProduct.tags || [],
        description: editingProduct.description || '',
        isActive: editingProduct.isActive ?? true,
      });
      setSelectedTags(editingProduct.tags || []);
      setShowMore(true);
    } else if (!isEditMode) {
      reset(DEFAULT_VALUES);
      setSelectedTags([]);
      setShowMore(false);
    }
  }, [visible, editingProduct, isEditMode, reset]);

  // Build API payload
  const buildPayload = (formData: ProductFormData) => ({
    name: formData.name,
    unit: formData.unit,
    buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : 0,
    sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0,
    tags: selectedTags,
    description: formData.description || null,
    isActive: formData.isActive,
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (formData: ProductFormData) => addProduct(buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
      Toast.success('Product added successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add product';
      Dialog.alert('Error', message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (formData: ProductFormData) => updateProduct(productId!, buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
      Toast.success('Product updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update product';
      Dialog.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId!),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.message || 'Something went wrong');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
      Toast.success('Product deleted successfully!');
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete product';
      Dialog.alert('Error', message);
    },
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const closeAndReset = () => {
    onClose();
    setSelectedTags([]);
    setCustomTagInput('');
  };

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      Dialog.confirm(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to close?',
        {
          confirmText: 'Discard',
          destructive: true,
          onConfirm: closeAndReset,
        }
      );
    } else {
      closeAndReset();
    }
  };

  const onSubmit = (formData: ProductFormData) => {
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

  const confirmDelete = () => {
    Dialog.confirm(
      'Delete Product?',
      'Are you sure you want to delete this product? This action cannot be undone.',
      {
        confirmText: 'Delete',
        destructive: true,
        onConfirm: () => deleteMutation.mutate(),
      }
    );
  };

  // Tag operations
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const addCustomTag = () => {
    const trimmedTag = customTagInput.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setCustomTagInput('');
    } else if (selectedTags.includes(trimmedTag)) {
      Toast.info('Tag already added');
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingProduct && visible) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="items-center rounded-2xl p-8" style={{ backgroundColor: colors.card }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4 text-base" style={{ color: colors.text }}>
              Loading product...
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
        behavior={'padding'}
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
                {isEditMode ? 'Edit Product' : 'Add Product'}
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
              {/* Basic Information */}
              <FormSection title="Basic Information">
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormInput
                      label="Product Name"
                      required
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g., Tomato, Potato, Banana"
                      error={errors.name?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                {/* Unit Selection */}
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                    Unit <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field }) => (
                      <View className="flex-row flex-wrap gap-2">
                        {PRODUCT_UNITS.map((unit) => (
                          <TouchableOpacity
                            key={unit.value}
                            onPress={() => field.onChange(unit.value)}
                            disabled={isSubmitting}
                            className="rounded-xl px-4 py-2.5"
                            style={{
                              backgroundColor:
                                field.value === unit.value ? colors.cta : colors.background,
                              borderWidth: 1,
                              borderColor:
                                field.value === unit.value ? colors.cta : colors.border,
                            }}>
                            <Text
                              className="text-sm font-medium"
                              style={{
                                color: field.value === unit.value ? colors.onCta : colors.text,
                              }}>
                              {unit.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                  {errors.unit && (
                    <Text className="mt-1.5 text-xs" style={{ color: colors.error }}>
                      {errors.unit.message}
                    </Text>
                  )}
                </View>
              </FormSection>

              {/* Pricing */}
              <FormSection title="Pricing">
                <FormRow>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="buyingPrice"
                      render={({ field }) => (
                        <FormInput
                          label="Buying Price"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="0"
                          keyboardType="decimal-pad"
                          error={errors.buyingPrice?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Controller
                      control={control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormInput
                          label="Selling Price"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="0"
                          keyboardType="decimal-pad"
                          error={errors.sellingPrice?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>
                </FormRow>
              </FormSection>

              {/* More options: tags, status, description */}
              <Pressable
                onPress={() => setShowMore((prev) => !prev)}
                className="mt-5 flex-row items-center justify-between rounded-xl px-4 py-3.5"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  More options
                </Text>
                <MaterialCommunityIcons
                  name={showMore ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.muted}
                />
              </Pressable>

              {showMore && (
                <>
                  {/* Tags */}
                  <FormSection title="Tags (Optional)">
                    {/* Custom Tag Input */}
                    <View className="mb-3 flex-row gap-2">
                      <TextInput
                        value={customTagInput}
                        onChangeText={setCustomTagInput}
                        onSubmitEditing={addCustomTag}
                        className="flex-1 rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                        placeholder="Type a tag and press +"
                        placeholderTextColor={colors.muted}
                        editable={!isSubmitting}
                      />
                      <TouchableOpacity
                        onPress={addCustomTag}
                        disabled={!customTagInput.trim() || isSubmitting}
                        className="items-center justify-center rounded-xl px-4"
                        style={{
                          backgroundColor: colors.cta,
                          opacity: !customTagInput.trim() ? 0.5 : 1,
                        }}>
                        <MaterialCommunityIcons name="plus" size={24} color={colors.onCta} />
                      </TouchableOpacity>
                    </View>

                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <View className="mb-3">
                        <Text className="mb-2 text-xs" style={{ color: colors.muted }}>
                          Selected ({selectedTags.length}):
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {selectedTags.map((tag, idx) => (
                            <View
                              key={idx}
                              className="flex-row items-center rounded-lg px-3 py-2"
                              style={{ backgroundColor: colors.cta }}>
                              <Text
                                className="mr-2 text-sm font-medium"
                                style={{ color: colors.onCta }}>
                                {tag}
                              </Text>
                              <TouchableOpacity
                                onPress={() => removeTag(tag)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <MaterialCommunityIcons name="close" size={16} color={colors.onCta} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Existing Tags from API */}
                    {existingTags.length > 0 && (
                      <>
                        <Text className="mb-2 text-xs" style={{ color: colors.muted }}>
                          Or select from existing:
                        </Text>
                        <View className="mb-4 flex-row flex-wrap gap-2">
                          {existingTags
                            .filter((tag) => !selectedTags.includes(tag))
                            .map((tag, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => toggleTag(tag)}
                                disabled={isSubmitting}
                                className="rounded-lg px-3 py-2"
                                style={{
                                  backgroundColor: colors.background,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                }}>
                                <Text
                                  className="text-sm font-medium"
                                  style={{ color: colors.text }}>
                                  {tag}
                                </Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      </>
                    )}
                  </FormSection>

                  {/* Status */}
                  <FormSection title="Status">
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <View className="flex-row gap-3">
                          <TouchableOpacity
                            onPress={() => field.onChange(true)}
                            disabled={isSubmitting}
                            className="flex-1 flex-row items-center justify-center rounded-xl p-4"
                            style={{
                              backgroundColor:
                                field.value === true ? colors.success : colors.background,
                              borderWidth: 1,
                              borderColor: field.value === true ? colors.success : colors.border,
                            }}>
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={20}
                              color={field.value === true ? '#fff' : colors.text}
                            />
                            <Text
                              className="ml-2 font-semibold"
                              style={{
                                color: field.value === true ? '#fff' : colors.text,
                              }}>
                              Active
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => field.onChange(false)}
                            disabled={isSubmitting}
                            className="flex-1 flex-row items-center justify-center rounded-xl p-4"
                            style={{
                              backgroundColor:
                                field.value === false ? colors.error : colors.background,
                              borderWidth: 1,
                              borderColor: field.value === false ? colors.error : colors.border,
                            }}>
                            <MaterialCommunityIcons
                              name="cancel"
                              size={20}
                              color={field.value === false ? '#fff' : colors.text}
                            />
                            <Text
                              className="ml-2 font-semibold"
                              style={{
                                color: field.value === false ? '#fff' : colors.text,
                              }}>
                              Inactive
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  </FormSection>

                  {/* Description */}
                  <FormSection title="Additional Details">
                    <Controller
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormTextArea
                          label="Description"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Additional notes about this product..."
                          minHeight={80}
                          numberOfLines={3}
                          error={errors.description?.message}
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </FormSection>
                </>
              )}

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
