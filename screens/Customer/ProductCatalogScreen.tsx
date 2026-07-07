// screens/Customer/ProductCatalogScreen.tsx
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { useCart } from 'context/CartContext';
import { EmptyState } from 'components/ui';
import { typo } from 'constants/design';
import SearchBar from 'components/SearchBar';
import { getVendorProducts } from 'api/actions/marketplaceActions';
import ProductCard, { formatPrice } from './components/ProductCard';

export default function ProductCatalogScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId: number = route.params?.vendorId;
  const vendorName: string = route.params?.vendorName || 'Catalog';

  const { getCart, getCount, getTotal, addItem, setQty } = useCart();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: vendorName });
  }, [navigation, vendorName]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-products', vendorId, debounced],
    queryFn: () => getVendorProducts(vendorId, { search: debounced || undefined, limit: 100 }),
    enabled: !!vendorId,
  });

  const products = data?.items ?? [];
  const cartItems = getCart(vendorId);
  const count = getCount(vendorId);
  const total = getTotal(vendorId);
  const qtyOf = (productId: number) =>
    cartItems.find((l) => l.productId === productId)?.quantity ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: 12 }}>
        <SearchBar searchQuery={search} setSearchQuery={setSearch} placeholder="Search products..." />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        // Catalog is connection-gated (403 NOT_CONNECTED lands here).
        <EmptyState
          icon="lock-outline"
          title="Catalog unavailable"
          subtitle={(error as Error)?.message || 'Connect with this vendor to browse their catalog.'}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const qty = qtyOf(item.id);
            return (
              <ProductCard
                product={item}
                cartQty={qty}
                onAdd={() =>
                  addItem(vendorId, vendorName, {
                    productId: item.id,
                    name: item.name,
                    unit: item.unit,
                    sellingPrice: String(item.sellingPrice ?? 0),
                  })
                }
                onIncrement={() => setQty(vendorId, item.id, qty + 1)}
                onDecrement={() => setQty(vendorId, item.id, qty - 1)}
              />
            );
          }}
          ListEmptyComponent={<EmptyState icon="package-variant" title="No products found" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: count > 0 ? 90 : 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      )}

      {/* View Cart bar */}
      {count > 0 && (
        <Pressable
          onPress={() => navigation.navigate('CartScreen', { vendorId, vendorName })}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 20,
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowOpacity: 0.2,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 5,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="cart" size={20} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '700', marginLeft: 8 }}>
              {count} item{count > 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={[typo.num, { color: colors.white }]}>
            View Cart · {formatPrice(total)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
