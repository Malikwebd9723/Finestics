// screens/Customer/MarketplaceScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { EmptyState } from 'components/ui';
import SearchBar from 'components/SearchBar';
import { listVendors } from 'api/actions/marketplaceActions';
import VendorCard from './components/VendorCard';

export default function MarketplaceScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [businessType, setBusinessType] = useState<string | undefined>(undefined);

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['marketplace-vendors', debounced, businessType],
    queryFn: () =>
      listVendors({ search: debounced || undefined, businessType, limit: 50 }),
  });

  const vendors = data?.items ?? [];

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        icon="storefront-outline"
        title={isError ? 'Could not load vendors' : 'No vendors found'}
        subtitle={
          isError
            ? (error as Error)?.message || 'Please try again.'
            : debounced
              ? 'Try a different search term.'
              : 'Check back soon for new vendors.'
        }
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: 12 }}>
        <SearchBar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search vendors..."
        />
      </View>

      {/* Business-type filter (backed by GET /marketplace/vendors?businessType=) */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}>
        {[
          { label: 'All', value: undefined },
          { label: 'Wholesalers', value: 'wholesaler' },
          { label: 'Retailers', value: 'retailer' },
          { label: 'Farms', value: 'farm' },
          { label: 'Distributors', value: 'distributor' },
        ].map((t) => {
          const selected = businessType === t.value;
          return (
            <Pressable
              key={t.label}
              onPress={() => setBusinessType(t.value)}
              style={{
                paddingHorizontal: 13,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: selected ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
              }}>
              <Text
                style={{
                  color: selected ? colors.white : colors.text,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() =>
                navigation.navigate('VendorDetailScreen', { vendorId: item.id })
              }
            />
          )}
          ListEmptyComponent={renderEmpty}
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
