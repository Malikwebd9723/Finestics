// screens/Customer/MarketplaceScreen.tsx
// Not a public directory: the default view is the customer's own connected
// vendors (with an All / Top switch). Unlinked vendors are reachable ONLY by
// explicitly searching a business name or a shared 6-character vendor code —
// the full list ships later, alongside the ratings system.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { EmptyState } from 'components/ui';
import { typo } from 'constants/design';
import SearchBar from 'components/SearchBar';
import { listVendors } from 'api/actions/marketplaceActions';
import { getConnections } from 'api/actions/connectionActions';
import { getOrders } from 'api/actions/customerOrderActions';
import VendorCard from './components/VendorCard';

export default function MarketplaceScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [chip, setChip] = useState<'all' | 'top'>('all');

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const searching = debounced.length >= 2;

  // My vendors (approved connections) — the default view.
  const {
    data: connections,
    isLoading: connectionsLoading,
    refetch: refetchConnections,
    isRefetching: refetchingConnections,
  } = useQuery({
    queryKey: ['customer-connections'],
    queryFn: () => getConnections(),
  });

  // Order history powers the "Top" sort (your most-ordered vendors first).
  const { data: ordersData } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: () => getOrders(),
  });

  // Search mode: hits the marketplace endpoint (name match or exact code).
  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErrorObj,
  } = useQuery({
    queryKey: ['marketplace-vendors', debounced],
    queryFn: () => listVendors({ search: debounced, limit: 50 }),
    enabled: searching,
  });

  const myVendors = useMemo(() => {
    const active = (connections ?? [])
      .filter((c) => c.connectionStatus === 'active' && c.vendor)
      .map((c) => c.vendor!);

    if (chip !== 'top') return active;

    const counts = new Map<number, number>();
    (ordersData?.items ?? []).forEach((o) => {
      if (o.vendor?.id) counts.set(o.vendor.id, (counts.get(o.vendor.id) ?? 0) + 1);
    });
    return [...active].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  }, [connections, ordersData, chip]);

  const searchResults = searchData?.items ?? [];
  const openVendor = (vendorId: number) =>
    navigation.navigate('VendorDetailScreen', { vendorId });

  const renderMyVendorsEmpty = () => {
    if (connectionsLoading) return null;
    return (
      <EmptyState
        icon="storefront-outline"
        title="Find your vendor"
        subtitle="Search their business name or the 6-character vendor code they shared with you, then send a connection request."
      />
    );
  };

  const renderSearchEmpty = () => {
    if (searchLoading) return null;
    return (
      <EmptyState
        icon="magnify"
        title={searchError ? 'Could not search vendors' : 'No vendors match'}
        subtitle={
          searchError
            ? (searchErrorObj as Error)?.message || 'Please try again.'
            : 'Check the spelling — or ask your vendor for their 6-character code.'
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
          placeholder="Search vendor name or code..."
        />
      </View>

      {searching ? (
        <>
          <Text
            style={[
              typo.eyebrow,
              { color: colors.muted, paddingHorizontal: 16, paddingBottom: 8 },
            ]}>
            SEARCH RESULTS
          </Text>
          {searchLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <VendorCard vendor={item} onPress={() => openVendor(item.id)} />
              )}
              ListEmptyComponent={renderSearchEmpty}
              contentContainerStyle={{ paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </>
      ) : (
        <>
          {/* My vendors: All / Top (most ordered). Best Rated arrives with the
              ratings system. */}
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 10,
            }}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'top', label: 'Top' },
              ] as const
            ).map((t) => {
              const selected = chip === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setChip(t.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.cta : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.cta : colors.border,
                  }}>
                  <Text
                    style={{
                      color: selected ? colors.onCta : colors.text,
                      fontSize: 13,
                      fontWeight: '600',
                    }}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {connectionsLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={myVendors}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <VendorCard vendor={item} onPress={() => openVendor(item.id)} />
              )}
              ListEmptyComponent={renderMyVendorsEmpty}
              contentContainerStyle={{ paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
              refreshControl={
                <RefreshControl
                  refreshing={refetchingConnections}
                  onRefresh={refetchConnections}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
}
