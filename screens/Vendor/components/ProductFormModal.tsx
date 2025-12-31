// screens/Vendor/components/ProductFormModal.tsx
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
  TextInput,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { MaterialIcons } from '@expo/vector-icons';
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
import ConfirmDeleteModal from 'components/DeleteConfirmationModal';
import { ProductFormData, ProductDetailResponse, PRODUCT_UNITS } from 'types/product.types';

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

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
    } else if (!isEditMode) {
      reset(DEFAULT_VALUES);
      setSelectedTags([]);
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
        ToastAndroid.show(response.message || 'Something went wrong', ToastAndroid.SHORT);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
      ToastAndroid.show('Product added successfully!', ToastAndroid.SHORT);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add product';
      Alert.alert('Error', message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (formData: ProductFormData) => updateProduct(productId!, buildPayload(formData)),
    onSuccess: (response) => {
      if (!response.success) {
        ToastAndroid.show(response.message || 'Something went wrong', ToastAndroid.SHORT);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
      ToastAndroid.show('Product updated successfully!', ToastAndroid.SHORT);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update product';
      Alert.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId!),
    onSuccess: (response) => {
      if (!response.success) {
        ToastAndroid.show(response.message || 'Something went wrong', ToastAndroid.SHORT);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
      ToastAndroid.show('Product deleted successfully!', ToastAndroid.SHORT);
      setDeleteModalVisible(false);
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete product';
      Alert.alert('Error', message);
    },
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    onClose();
    setSelectedTags([]);
    setCustomTagInput('');
  };

  const onSubmit = (formData: ProductFormData) => {
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
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
      ToastAndroid.show('Tag already added', ToastAndroid.SHORT);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <View className="flex-1 justify-end bg-black/50">
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
                <MaterialIcons name="close" size={22} color={colors.text} />
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
                                field.value === unit.value ? colors.primary : colors.background,
                              borderWidth: 1,
                              borderColor:
                                field.value === unit.value ? colors.primary : colors.border,
                            }}>
                            <Text
                              className="text-sm font-medium"
                              style={{
                                color: field.value === unit.value ? '#fff' : colors.text,
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
                      backgroundColor: colors.primary,
                      opacity: !customTagInput.trim() ? 0.5 : 1,
                    }}>
                    <MaterialIcons name="add" size={24} color="#fff" />
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
                          style={{ backgroundColor: colors.primary }}>
                          <Text className="mr-2 text-sm font-medium text-white">{tag}</Text>
                          <TouchableOpacity
                            onPress={() => removeTag(tag)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <MaterialIcons name="close" size={16} color="#fff" />
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
                            <Text className="text-sm font-medium" style={{ color: colors.text }}>
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
                        <MaterialIcons
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
                          backgroundColor: field.value === false ? colors.error : colors.background,
                          borderWidth: 1,
                          borderColor: field.value === false ? colors.error : colors.border,
                        }}>
                        <MaterialIcons
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
        </View>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        loading={deleteMutation.isPending}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Modal>
  );
}
