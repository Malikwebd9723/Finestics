// screens/Customer/MyVendorsScreen.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { getConnections } from 'api/actions/connectionActions';
import type { ConnectionStatus } from 'api/actions/connectionActions';
import { EmptyState } from 'components/ui';
import VendorCard from './components/VendorCard';
import ConnectionStatusBadge from './components/ConnectionStatusBadge';

const TABS: { key: ConnectionStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

export default function MyVendorsScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<ConnectionStatus>('active');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-connections'],
    queryFn: () => getConnections(),
  });

  const connections = (data ?? []).filter((c) => c.connectionStatus === tab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.card,
          margin: 16,
          borderRadius: 12,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 9,
                alignItems: 'center',
                backgroundColor: selected ? colors.cta : 'transparent',
              }}>
              <Text style={{ color: selected ? colors.onCta : colors.text, fontWeight: '600' }}>
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
          data={connections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) =>
            item.vendor ? (
              <VendorCard
                vendor={item.vendor}
                onPress={() =>
                  navigation.navigate('VendorDetailScreen', { vendorId: item.vendor!.id })
                }
                rightSlot={<ConnectionStatusBadge status={item.connectionStatus} size="sm" />}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="account-group-outline"
              title={`No ${tab} vendors`}
              subtitle={
                tab === 'active'
                  ? 'Connect with vendors from the Marketplace to start ordering.'
                  : tab === 'pending'
                    ? 'Requests awaiting vendor approval will appear here.'
                    : 'Rejected requests will appear here.'
              }
            />
          }
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
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
