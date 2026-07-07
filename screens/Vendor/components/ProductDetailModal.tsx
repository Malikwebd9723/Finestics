// screens/Vendor/components/ProductDetailModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { deleteProduct, fetchProductDetails } from 'api/actions/productActions';
import {
  Product,
  ProductDetailResponse,
  formatPrice,
  calculateProfit,
  calculateProfitMargin,
  getInitials,
} from 'types/product.types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface ProductDetailModalProps {
  visible: boolean;
  productId: number | null;
  onClose: () => void;
  onEdit: (productId: number) => void;
}

export default function ProductDetailModal({
  visible,
  productId,
  onClose,
  onEdit,
}: ProductDetailModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));

  // Fetch product details
  const { data, isLoading, error } = useQuery<ProductDetailResponse>({
    queryKey: ['products', productId],
    queryFn: () => fetchProductDetails(productId!),
    enabled: !!productId && visible,
  });

  const product = data?.data;

  // Delete mutation — close modals sequentially to avoid iOS freeze
  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId!),
    onSuccess: () => {
      // On iOS, closing two modals at once freezes the screen.
      // The confirm dialog dismisses on tap; close the parent modal after a short delay.
      setTimeout(() => {
        Toast.success('Product deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products', 'tags'] });
        onClose();
      }, 300);
    },
    onError: (error: any) => {
      Toast.error(error?.message || 'Failed to delete product');
    },
  });

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

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const profit = product ? calculateProfit(product.buyingPrice, product.sellingPrice) : 0;
  const profitMargin = product
    ? calculateProfitMargin(product.buyingPrice, product.sellingPrice)
    : 0;
  const isProfitable = profit > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            height: height * 0.75,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 20,
          }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Product Details
            </Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading details...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.error} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                Failed to load details
              </Text>
            </View>
          ) : product ? (
            <>
              <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
                {/* Product Header */}
                <View
                  className="mb-4 rounded-2xl p-5"
                  style={{ backgroundColor: colors.background }}>
                  <View className="flex-row items-center">
                    <View
                      className="h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: colors.primary + '14' }}>
                      <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                        {getInitials(product.name)}
                      </Text>
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-xl font-bold" style={{ color: colors.text }}>
                        {product.name}
                      </Text>
                      <View className="mt-1.5 flex-row items-center gap-2">
                        <View
                          className="rounded-full px-3 py-1"
                          style={{
                            backgroundColor: product.isActive
                              ? colors.success + '14'
                              : colors.error + '14',
                          }}>
                          <Text
                            className="text-xs font-bold"
                            style={{
                              color: product.isActive ? colors.success : colors.error,
                            }}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        <View
                          className="rounded-full px-3 py-1"
                          style={{ backgroundColor: colors.primary + '14' }}>
                          <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                            {product.unit}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Pricing Card */}
                <View
                  className="mb-4 rounded-2xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <View className="mb-4 flex-row items-center">
                    <MaterialCommunityIcons name="currency-gbp" size={20} color={colors.primary} />
                    <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                      Pricing
                    </Text>
                  </View>

                  <View className="mb-4 flex-row justify-between">
                    {/* Buying Price */}
                    <View className="flex-1 items-center">
                      <Text className="mb-1 text-xs" style={{ color: colors.muted }}>
                        Buying Price
                      </Text>
                      <Text className="text-lg font-bold" style={{ color: colors.text }}>
                        {formatPrice(product.buyingPrice)}
                      </Text>
                    </View>

                    <View className="items-center justify-center px-2">
                      <MaterialCommunityIcons name="arrow-right" size={20} color={colors.muted} />
                    </View>

                    {/* Selling Price */}
                    <View className="flex-1 items-center">
                      <Text className="mb-1 text-xs" style={{ color: colors.muted }}>
                        Selling Price
                      </Text>
                      <Text className="text-lg font-bold" style={{ color: colors.text }}>
                        {formatPrice(product.sellingPrice)}
                      </Text>
                    </View>
                  </View>

                  {/* Profit Stats */}
                  <View
                    className="flex-row rounded-xl p-3"
                    style={{
                      backgroundColor: isProfitable ? colors.success + '14' : colors.error + '14',
                    }}>
                    <View className="flex-1 items-center">
                      <Text className="mb-1 text-xs" style={{ color: colors.muted }}>
                        Profit
                      </Text>
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: isProfitable ? colors.success : colors.error,
                        }}>
                        {isProfitable ? '+' : ''}
                        {formatPrice(profit)}
                      </Text>
                    </View>
                    <View className="w-px" style={{ backgroundColor: colors.border }} />
                    <View className="flex-1 items-center">
                      <Text className="mb-1 text-xs" style={{ color: colors.muted }}>
                        Margin
                      </Text>
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: isProfitable ? colors.success : colors.error,
                        }}>
                        {profitMargin.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <View
                    className="mb-4 rounded-2xl p-4"
                    style={{ backgroundColor: colors.background }}>
                    <View className="mb-3 flex-row items-center">
                      <MaterialCommunityIcons name="tag-multiple" size={18} color={colors.primary} />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        Tags
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {product.tags.map((tag, idx) => (
                        <View
                          key={idx}
                          className="rounded-lg px-3 py-1.5"
                          style={{ backgroundColor: colors.primary + '14' }}>
                          <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Description */}
                {product.description && (
                  <View
                    className="mb-4 rounded-2xl p-4"
                    style={{ backgroundColor: colors.background }}>
                    <View className="mb-3 flex-row items-center">
                      <MaterialCommunityIcons
                        name="text-box-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        Description
                      </Text>
                    </View>
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {product.description}
                    </Text>
                  </View>
                )}

                {/* Spacer */}
                <View className="h-4" />
              </ScrollView>

              {/* Action Buttons */}
              <View
                className="flex-row gap-3 border-t px-5 py-4"
                style={{ borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={confirmDelete}
                  className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                  style={{
                    backgroundColor: colors.error + '14',
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
                  <Text className="ml-2 text-sm font-bold" style={{ color: colors.error }}>
                    Delete
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    setTimeout(() => onEdit(productId!), 300);
                  }}
                  className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                  style={{ backgroundColor: colors.primary }}>
                  <MaterialCommunityIcons name="pencil" size={18} color={colors.white} />
                  <Text className="ml-2 text-sm font-bold text-white">Edit</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.muted} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                No data available
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
