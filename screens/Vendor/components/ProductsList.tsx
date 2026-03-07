// screens/Vendor/components/ProductsList.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllProducts } from 'api/actions/productActions';
import {
  Product,
  formatPrice,
  calculateProfit,
  getInitials,
} from 'types/product.types';
import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductsListProps {
  searchQuery: string;
  onViewProduct: (productId: number) => void;
  onEditProduct: (productId: number) => void;
}

export default function ProductsList({
  searchQuery,
  onViewProduct,
  onEditProduct,
}: ProductsListProps) {
  const { colors } = useThemeContext();
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce searchQuery prop
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error, refetch, isRefetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['products', debouncedSearch],
      queryFn: ({ pageParam }) =>
        fetchAllProducts({ page: pageParam, limit: 20, search: debouncedSearch || undefined }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const p = lastPage?.pagination;
        return p && p.currentPage < p.totalPages ? p.currentPage + 1 : undefined;
      },
    });

  // Flatten all pages
  const filteredProducts = useMemo(
    () => data?.pages.flatMap((page) => page?.data || []) || [],
    [data]
  );

  // Stats for header
  const stats = useMemo(() => {
    const totalItems = data?.pages[data.pages.length - 1]?.pagination?.totalItems ?? filteredProducts.length;
    return {
      total: totalItems,
      active: filteredProducts.filter((p: Product) => p.isActive).length,
      inactive: filteredProducts.filter((p: Product) => !p.isActive).length,
    };
  }, [filteredProducts, data]);

  // Loading state
  if (isLoading) {
    return <ProductCardSkeleton count={6} />;
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
          Failed to load products
        </Text>
        <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
          Please check your connection and try again
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 rounded-xl px-6 py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text className="font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header with stats */}
      <View className="mb-3 flex-row items-center justify-between px-4">
        <Text className="text-base font-bold" style={{ color: colors.text }}>
          Products
        </Text>
        <View className="flex-row items-center gap-2">
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: colors.success + '20' }}>
            <View
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.success }}
            />
            <Text className="text-xs font-semibold" style={{ color: colors.success }}>
              {stats.active}
            </Text>
          </View>
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: colors.error + '20' }}>
            <View
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.error }}
            />
            <Text className="text-xs font-semibold" style={{ color: colors.error }}>
              {stats.inactive}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MaterialIcons name="inventory-2" size={72} color={colors.muted} />
            <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
              No products found
            </Text>
            <Text className="mt-2 px-8 text-center text-sm" style={{ color: colors.muted }}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first product to get started'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            colors={colors}
            onPress={() => onViewProduct(item.id)}
            onEdit={() => onEditProduct(item.id)}
          />
        )}
      />
    </View>
  );
}

// Product Card Component
interface ProductCardProps {
  product: Product;
  colors: any;
  onPress: () => void;
  onEdit: () => void;
}

function ProductCard({ product, colors, onPress, onEdit }: ProductCardProps) {
  const profit = calculateProfit(product.buyingPrice, product.sellingPrice);
  const isProfitable = profit > 0;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl p-4"
      style={{
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}>
      <View className="flex-row">
        {/* Product Icon/Avatar */}
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.primary + '15' }}>
          <Text className="text-base font-bold" style={{ color: colors.primary }}>
            {getInitials(product.name)}
          </Text>
        </View>

        {/* Main Content */}
        <View className="ml-3 flex-1">
          {/* Name + Status */}
          <View className="flex-row items-center justify-between">
            <Text
              className="mr-2 flex-1 text-base font-bold"
              style={{ color: colors.text }}
              numberOfLines={1}>
              {product.name}
            </Text>
            <View
              className="rounded-full px-2 py-1"
              style={{
                backgroundColor: product.isActive ? colors.success + '20' : colors.error + '20',
              }}>
              <Text
                className="text-xs font-semibold"
                style={{
                  color: product.isActive ? colors.success : colors.error,
                }}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View className="mt-1.5 flex-row flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, idx) => (
                <View
                  key={idx}
                  className="rounded-md px-2 py-0.5"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xs font-medium" style={{ color: colors.muted }}>
                    {tag}
                  </Text>
                </View>
              ))}
              {product.tags.length > 3 && (
                <View
                  className="rounded-md px-2 py-0.5"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xs font-medium" style={{ color: colors.muted }}>
                    +{product.tags.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Price Row */}
          <View className="mt-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              {/* Buying Price */}
              <View>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Cost
                </Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {formatPrice(product.buyingPrice)}
                </Text>
              </View>

              {/* Arrow */}
              <MaterialIcons name="arrow-forward" size={14} color={colors.muted} />

              {/* Selling Price */}
              <View>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Sell
                </Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {formatPrice(product.sellingPrice)}
                </Text>
              </View>

              {/* Profit */}
              <View>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Profit
                </Text>
                <Text
                  className="text-sm font-bold"
                  style={{
                    color: isProfitable ? colors.success : colors.error,
                  }}>
                  {isProfitable ? '+' : ''}
                  {formatPrice(profit)}
                </Text>
              </View>
            </View>

            {/* Unit Badge */}
            <View
              className="rounded-lg px-2.5 py-1"
              style={{ backgroundColor: colors.primary + '15' }}>
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                {product.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="ml-2 self-start rounded-lg p-2"
          style={{ backgroundColor: colors.background }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="edit" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
