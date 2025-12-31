// screens/Vendor/components/ProductSelectModal.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllProducts } from 'api/actions/productActions';
import { Product, formatPrice } from 'types/product.types';
import { CartItem } from 'types/order.types';

interface ProductSelectModalProps {
  visible: boolean;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onClose: () => void;
}

export default function ProductSelectModal({
  visible,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onClose,
}: ProductSelectModalProps) {
  const { colors } = useThemeContext();
  const [search, setSearch] = useState('');

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchAllProducts,
    enabled: visible,
  });

  // Filter active products
  const filteredProducts = useMemo(() => {
    const products = data?.data || [];
    // Only show active products
    const activeProducts = products.filter((p: Product) => p.isActive);

    if (!search.trim()) return activeProducts;

    const query = search.toLowerCase().trim();
    return activeProducts.filter(
      (p: Product) =>
        p.name?.toLowerCase().includes(query) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [data, search]);

  // Get cart item for product
  const getCartItem = (productId: number): CartItem | undefined => {
    return cart.find((item) => item.productId === productId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl" style={{ backgroundColor: colors.card, maxHeight: '85%' }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <View>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Add Products
              </Text>
              {cart.length > 0 && (
                <Text className="mt-0.5 text-xs" style={{ color: colors.primary }}>
                  {cart.length} items in cart
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-5 py-3">
            <View
              className="flex-row items-center rounded-xl px-4"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                className="ml-2 flex-1 py-3"
                style={{ color: colors.text }}
                placeholder="Search products..."
                placeholderTextColor={colors.placeholder}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Products List */}
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.muted }}>
                Loading products...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              ListEmptyComponent={
                <View className="items-center py-12">
                  <MaterialIcons name="inventory-2" size={48} color={colors.muted} />
                  <Text className="mt-4 text-center" style={{ color: colors.muted }}>
                    {search ? 'No products match your search' : 'No products available'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const cartItem = getCartItem(item.id);
                const inCart = !!cartItem;

                return (
                  <View
                    className="mb-2 rounded-xl p-4"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: inCart ? colors.primary : colors.border,
                    }}>
                    <View className="flex-row items-center justify-between">
                      {/* Product Info */}
                      <View className="mr-3 flex-1">
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: colors.text }}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                          {formatPrice(item.sellingPrice)} / {item.unit}
                        </Text>
                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <View className="mt-1.5 flex-row flex-wrap gap-1">
                            {item.tags.slice(0, 2).map((tag, idx) => (
                              <View
                                key={idx}
                                className="rounded px-1.5 py-0.5"
                                style={{ backgroundColor: colors.card }}>
                                <Text className="text-xs" style={{ color: colors.muted }}>
                                  {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Quantity Controls or Add Button */}
                      {inCart ? (
                        <View className="flex-row items-center">
                          <TouchableOpacity
                            onPress={() => {
                              if (cartItem!.quantity <= 1) {
                                onRemoveFromCart(item.id);
                              } else {
                                onUpdateQuantity(item.id, cartItem!.quantity - 1);
                              }
                            }}
                            className="h-8 w-8 items-center justify-center rounded-full"
                            style={{ backgroundColor: colors.primary + '20' }}>
                            <Ionicons
                              name={cartItem!.quantity <= 1 ? 'trash' : 'remove'}
                              size={16}
                              color={colors.primary}
                            />
                          </TouchableOpacity>

                          <Text
                            className="mx-3 text-base font-bold"
                            style={{ color: colors.text, minWidth: 24, textAlign: 'center' }}>
                            {cartItem!.quantity}
                          </Text>

                          <TouchableOpacity
                            onPress={() => onUpdateQuantity(item.id, cartItem!.quantity + 1)}
                            className="h-8 w-8 items-center justify-center rounded-full"
                            style={{ backgroundColor: colors.primary }}>
                            <Ionicons name="add" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => onAddToCart(item)}
                          className="rounded-lg px-4 py-2"
                          style={{ backgroundColor: colors.primary }}>
                          <Text className="text-sm font-semibold text-white">Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Done Button */}
          {cart.length > 0 && (
            <View className="border-t px-5 py-4" style={{ borderColor: colors.border }}>
              <TouchableOpacity
                onPress={onClose}
                className="flex-row items-center justify-center rounded-xl py-3.5"
                style={{ backgroundColor: colors.primary }}>
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text className="ml-2 font-bold text-white">Done ({cart.length} items)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
