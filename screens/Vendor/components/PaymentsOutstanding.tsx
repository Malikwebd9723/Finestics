// screens/Vendor/components/PaymentsOutstanding.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchOutstandingOrders,
  fetchAgingReport,
  OutstandingOrder,
  AgingData,
} from 'api/actions/paymentActions';
import { formatPrice, formatShortDate, getPaymentStatusColor } from 'types/order.types';
import { copyToClipboard, formatOutstandingText, formatAgingText } from 'utils/paymentClipboard';

type ViewMode = 'orders' | 'aging';
type SortField = 'orderDate' | 'totalAmount' | 'balanceAmount' | 'daysOutstanding';

interface Props {
  startDate: string;
  endDate: string;
  isActive: boolean;
  onCustomerPress?: (customerId: number) => void;
}

const SORT_OPTIONS: { key: SortField; label: string }[] = [
  { key: 'balanceAmount', label: 'Balance' },
  { key: 'daysOutstanding', label: 'Age' },
  { key: 'totalAmount', label: 'Amount' },
  { key: 'orderDate', label: 'Date' },
];

const AGING_COLORS: Record<string, string> = {
  '0-7': '#10b981',
  '8-15': '#f59e0b',
  '16-30': '#f97316',
  '30+': '#ef4444',
};

const AGING_LABELS: Record<string, string> = {
  '0-7': '0-7 days',
  '8-15': '8-15 days',
  '16-30': '16-30 days',
  '30+': '30+ days',
};

export default function PaymentsOutstandingTab({
  startDate,
  endDate,
  isActive,
  onCustomerPress,
}: Props) {
  const { colors } = useThemeContext();
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [sortBy, setSortBy] = useState<SortField>('balanceAmount');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  const { data: outstandingData, isLoading: outstandingLoading } = useQuery({
    queryKey: ['payments', 'outstanding', sortBy, sortOrder, page],
    queryFn: () => fetchOutstandingOrders({ sortBy, sortOrder, page, limit: 50 }),
    enabled: isActive && viewMode === 'orders',
  });

  const { data: agingData, isLoading: agingLoading } = useQuery({
    queryKey: ['payments', 'outstanding', 'aging'],
    queryFn: () => fetchAgingReport(),
    enabled: isActive && viewMode === 'aging',
  });

  const orders: OutstandingOrder[] = outstandingData?.data || [];
  const summary = outstandingData?.summary;
  const pagination = outstandingData?.pagination;
  const aging: AgingData | null = agingData?.data || null;
  const isLoading = viewMode === 'orders' ? outstandingLoading : agingLoading;

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  if (isLoading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleCopy = () => {
    if (viewMode === 'orders' && orders.length > 0 && summary) {
      copyToClipboard(formatOutstandingText(orders, summary));
    } else if (viewMode === 'aging' && aging) {
      copyToClipboard(formatAgingText(aging));
    }
  };

  return (
    <View className="flex-1 px-4 pt-4">
      {/* View toggle + Copy */}
      <View className="mb-4 flex-row items-center gap-2">
        <View
          className="flex-1 flex-row overflow-hidden rounded-full"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {(['orders', 'aging'] as ViewMode[]).map((mode) => {
            const active = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewMode(mode)}
                className="flex-1 items-center justify-center py-2"
                style={{ backgroundColor: active ? colors.primary : 'transparent' }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: active ? '#fff' : colors.muted }}>
                  {mode === 'orders' ? 'Orders' : 'Aging Report'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={handleCopy}
          className="flex-row items-center rounded-full px-3"
          style={{ height: 30, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="copy-outline" size={13} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {viewMode === 'orders' ? (
        <>
          {/* Summary banner */}
          {summary && (
            <View
              className="mb-4 flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: colors.error + '10' }}>
              <Text className="text-sm" style={{ color: colors.text }}>
                {summary.totalOrders} unpaid order{summary.totalOrders !== 1 ? 's' : ''}
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.error }}>
                {formatPrice(summary.totalOutstanding)}
              </Text>
            </View>
          )}

          {/* Sort chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            className="mb-3">
            <View className="flex-row gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => toggleSort(opt.key)}
                    className="flex-row items-center rounded-full px-3"
                    style={{
                      height: 28,
                      backgroundColor: active ? colors.primary + '15' : colors.card,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                    }}>
                    <Text
                      className="text-xs"
                      style={{ color: active ? colors.primary : colors.muted }}>
                      {opt.label}
                    </Text>
                    {active && (
                      <MaterialIcons
                        name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
                        size={12}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Orders */}
          {orders.length === 0 ? (
            <View className="items-center py-12">
              <MaterialCommunityIcons name="check-circle" size={40} color={colors.success} />
              <Text className="mt-3 text-sm font-medium" style={{ color: colors.success }}>
                All caught up!
              </Text>
            </View>
          ) : (
            <>
              {orders.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onCustomerPress?.(item.customerId)}
                  className="mb-2 rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {item.businessName}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {item.orderNumber} · {formatShortDate(item.orderDate)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-bold" style={{ color: colors.error }}>
                        {formatPrice(item.balanceAmount)}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{
                          color: item.daysOutstanding > 30 ? colors.error : colors.muted,
                        }}>
                        {item.daysOutstanding}d
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {pagination && pagination.totalPages > 1 && (
                <View className="mt-3 flex-row items-center justify-center gap-4">
                  <TouchableOpacity
                    onPress={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    style={{ opacity: page === 1 ? 0.4 : 1 }}>
                    <MaterialIcons name="chevron-left" size={26} color={colors.text} />
                  </TouchableOpacity>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {page} / {pagination.totalPages}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    style={{ opacity: page === pagination.totalPages ? 0.4 : 1 }}>
                    <MaterialIcons name="chevron-right" size={26} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      ) : (
        /* Aging Report */
        aging && (
          <>
            <View
              className="mb-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: colors.error + '10' }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Total Outstanding · {aging.totalOrdersOutstanding} orders
              </Text>
              <Text className="text-xl font-bold" style={{ color: colors.error }}>
                {formatPrice(aging.totalOutstanding)}
              </Text>
            </View>

            {/* Stacked bar + buckets */}
            <View
              className="mb-4 rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <View className="mb-3 h-5 flex-row overflow-hidden rounded-full">
                {Object.entries(aging.buckets).map(([key, bucket]) => (
                  <View
                    key={key}
                    style={{
                      width: `${bucket.percentage}%`,
                      backgroundColor: AGING_COLORS[key] || colors.muted,
                      minWidth: bucket.percentage > 0 ? 3 : 0,
                    }}
                  />
                ))}
              </View>
              {Object.entries(aging.buckets).map(([key, bucket]) => (
                <View key={key} className="flex-row items-center justify-between py-1">
                  <View className="flex-row items-center">
                    <View
                      className="mr-2 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: AGING_COLORS[key] || colors.muted }}
                    />
                    <Text className="text-xs" style={{ color: colors.text }}>
                      {AGING_LABELS[key] || key}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      {bucket.count}
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: AGING_COLORS[key] }}>
                      {formatPrice(bucket.amount)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Customer breakdown */}
            {aging.customerBreakdown.length > 0 &&
              aging.customerBreakdown.map((customer) => (
                <TouchableOpacity
                  key={customer.customerId}
                  onPress={() => onCustomerPress?.(customer.customerId)}
                  className="mb-2 rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View className="mb-1.5 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {customer.businessName}
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: colors.error }}>
                      {formatPrice(customer.total)}
                    </Text>
                  </View>
                  <View className="h-2 flex-row overflow-hidden rounded-full">
                    {Object.entries(customer.buckets).map(([key, amount]) => {
                      const pct = customer.total > 0 ? (amount / customer.total) * 100 : 0;
                      return (
                        <View
                          key={key}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: AGING_COLORS[key] || colors.muted,
                            minWidth: pct > 0 ? 2 : 0,
                          }}
                        />
                      );
                    })}
                  </View>
                </TouchableOpacity>
              ))}
          </>
        )
      )}
    </View>
  );
}
