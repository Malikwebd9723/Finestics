// screens/Customer/ProductCatalogScreen.tsx
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import SearchBar from 'components/SearchBar';
import { getVendorProducts } from 'api/actions/marketplaceActions';
import ProductCard from './components/ProductCard';

export default function ProductCatalogScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId: number = route.params?.vendorId;
  const vendorName: string | undefined = route.params?.vendorName;

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useLayoutEffect(() => {
    if (vendorName) navigation.setOptions({ headerTitle: vendorName });
  }, [navigation, vendorName]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-products', vendorId, debounced],
    queryFn: () => getVendorProducts(vendorId, { search: debounced || undefined, limit: 100 }),
    enabled: !!vendorId,
  });

  const products = data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: 12 }}>
        <SearchBar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search products..."
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
              <MaterialCommunityIcons name="package-variant" size={56} color={colors.muted} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
                No products found
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
