// screens/Vendor/IncomingOrdersScreen.tsx
// Vendor view of customer-placed orders.
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { StatInline } from 'components/ui';
import { getVendorOrders, getVendorOrderStats } from 'api/actions/vendorOrderInboxActions';
import type { OrderStatus } from 'api/actions/customerOrderActions';
import { formatPrice } from '../Customer/components/ProductCard';
import OrderStatusBadge from '../Customer/components/OrderStatusBadge';

const FILTERS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'confirmed', label: 'Accepted' },
  { key: 'dispatched', label: 'Out' },
  { key: 'delivered', label: 'Delivered' },
];

export default function IncomingOrdersScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-customer-orders'],
    queryFn: () => getVendorOrders(),
    refetchInterval: isFocused ? 30000 : false,
  });

  // App-order aggregates — the vendor's window into customer-placed revenue
  // until these numbers are fused into the main Dashboard.
  const { data: stats } = useQuery({
    queryKey: ['vendor-customer-order-stats'],
    queryFn: getVendorOrderStats,
    refetchInterval: isFocused ? 60000 : false,
  });

  const all = data?.items ?? [];
  const orders = filter === 'all' ? all : all.filter((o) => o.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        ListHeaderComponent={
          <View>
            {stats && (
              <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
                <StatInline
                  items={[
                    { label: 'App orders', value: String(stats.totalOrders) },
                    { label: 'Delivered revenue', value: formatPrice(stats.revenue), tone: 'success' },
                    {
                      label: 'Outstanding credit',
                      value: formatPrice(stats.outstandingCredit),
                      tone: stats.outstandingCredit > 0 ? 'error' : 'default',
                    },
                  ]}
                />
              </View>
            )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 4 }}>
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
          </View>
        }
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const customer = (item as any).customer;
          const name = customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Customer';
          return (
            <Pressable
              onPress={() => navigation.navigate('VendorOrderDetailScreen', { orderId: item.id })}
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                padding: 14,
                marginHorizontal: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{name}</Text>
                <OrderStatusBadge status={item.status} />
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.orderNumber}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {item.itemCount ?? 0} item{(item.itemCount ?? 0) === 1 ? '' : 's'}
                </Text>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {formatPrice(item.totalAmount)}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
              <MaterialCommunityIcons name="receipt" size={56} color={colors.muted} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
                No orders yet
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                Orders placed by your connected customers will appear here.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
      {isLoading && (
        <View style={{ position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}
