// screens/Customer/MyOrdersScreen.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { EmptyState } from 'components/ui';
import { typo, fonts } from 'constants/design';
import { getOrders, type OrderStatus } from 'api/actions/customerOrderActions';
import { formatPrice } from './components/ProductCard';
import OrderStatusBadge from './components/OrderStatusBadge';

const FILTERS: { key: 'all' | 'active' | 'delivered' | 'cancelled'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_delivery',
  'dispatched',
];

export default function MyOrdersScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: () => getOrders(),
    refetchInterval: isFocused ? 30000 : false, // poll only while actually viewing
  });

  const all = data?.items ?? [];
  const orders = all.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled' || o.status === 'refunded';
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filter chips */}
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 }}>
        {FILTERS.map((f) => {
          const selected = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: selected ? colors.cta : colors.card,
                borderWidth: 1,
                borderColor: selected ? colors.cta : colors.border,
              }}>
              <Text
                style={{
                  color: selected ? colors.onCta : colors.text,
                  fontWeight: '600',
                  fontSize: 13,
                }}>
                {f.label}
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
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('CustomerOrderDetailScreen', { orderId: item.id })
              }
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 14,
                marginHorizontal: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 15 }}>
                  {item.vendor?.businessName || 'Order'}
                </Text>
                <OrderStatusBadge status={item.status} />
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {item.orderNumber}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {item.itemCount ?? 0} item{(item.itemCount ?? 0) === 1 ? '' : 's'}
                </Text>
                <Text style={[typo.num, { color: colors.text }]}>
                  {formatPrice(item.totalAmount)}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt"
              title="No orders yet"
              subtitle="Orders you place will appear here."
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}
