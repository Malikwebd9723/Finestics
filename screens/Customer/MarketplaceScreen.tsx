// screens/Customer/MarketplaceScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import SearchBar from 'components/SearchBar';
import { listVendors } from 'api/actions/marketplaceActions';
import VendorCard from './components/VendorCard';

export default function MarketplaceScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['marketplace-vendors', debounced],
    queryFn: () => listVendors({ search: debounced || undefined, limit: 50 }),
  });

  const vendors = data?.items ?? [];

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
        <MaterialCommunityIcons name="storefront-outline" size={56} color={colors.muted} />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
          {isError ? 'Could not load vendors' : 'No vendors found'}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
          {isError
            ? (error as Error)?.message || 'Please try again.'
            : debounced
              ? 'Try a different search term.'
              : 'Check back soon for new vendors.'}
        </Text>
      </View>
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
