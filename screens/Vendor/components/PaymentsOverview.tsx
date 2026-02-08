// screens/Vendor/components/PaymentsOverview.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchPaymentOverview, PaymentOverview } from 'api/actions/paymentActions';
import { formatPrice } from 'types/order.types';

interface Props {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function PaymentsOverviewTab({ startDate, endDate, isActive }: Props) {
  const { colors } = useThemeContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', 'overview', startDate, endDate],
    queryFn: () => fetchPaymentOverview({ startDate, endDate, includeExpenses: true }),
    enabled: isActive,
  });

  const overview: PaymentOverview | null = data?.data || null;

  if (isLoading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-16 px-6">
        <MaterialIcons name="error-outline" size={40} color={colors.error} />
        <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
          Failed to load overview
        </Text>
      </View>
    );
  }

  if (!overview) {
    return (
      <View className="items-center py-16">
        <MaterialCommunityIcons name="cash-remove" size={40} color={colors.muted} />
        <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
          No data for this period
        </Text>
      </View>
    );
  }

  const statuses = overview.byPaymentStatus;
  const collectionPct =
    overview.totalSales > 0
      ? Math.round((overview.totalCollections / overview.totalSales) * 100)
      : 0;

  return (
    <View className="px-4 pt-4">
      {/* Main figures */}
      <View className="mb-3 flex-row gap-3">
        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.primary }}>
          <Text className="text-2xl font-bold text-white">
            {formatPrice(overview.totalSales)}
          </Text>
          <Text className="mt-1 text-xs text-white/70">Total Sales</Text>
        </View>
        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.success }}>
          <Text className="text-2xl font-bold text-white">
            {formatPrice(overview.totalCollections)}
          </Text>
          <Text className="mt-1 text-xs text-white/70">Collected</Text>
        </View>
      </View>

      {/* Secondary stats row */}
      <View className="mb-4 flex-row gap-2">
        <View
          className="flex-1 items-center rounded-xl py-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-base font-bold" style={{ color: colors.error }}>
            {formatPrice(overview.totalOutstanding)}
          </Text>
          <Text className="text-xs" style={{ color: colors.muted }}>Outstanding</Text>
        </View>
        <View
          className="flex-1 items-center rounded-xl py-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            {overview.orderCount}
          </Text>
          <Text className="text-xs" style={{ color: colors.muted }}>Orders</Text>
        </View>
        <View
          className="flex-1 items-center rounded-xl py-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            {formatPrice(overview.avgOrderValue)}
          </Text>
          <Text className="text-xs" style={{ color: colors.muted }}>Avg</Text>
        </View>
      </View>

      {/* Collection progress */}
      <View
        className="mb-4 rounded-xl p-4"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            Collection Rate
          </Text>
          <Text className="text-sm font-bold" style={{ color: colors.success }}>
            {collectionPct}%
          </Text>
        </View>
        <View
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: colors.border }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.min(collectionPct, 100)}%`,
              backgroundColor: colors.success,
            }}
          />
        </View>
      </View>

      {/* Payment status */}
      <View className="mb-4 flex-row gap-2">
        {([
          { key: 'paid' as const, label: 'Paid', color: colors.success },
          { key: 'partial' as const, label: 'Partial', color: '#f59e0b' },
          { key: 'unpaid' as const, label: 'Unpaid', color: colors.error },
        ]).map((s) => (
          <View
            key={s.key}
            className="flex-1 items-center rounded-xl p-3"
            style={{ backgroundColor: s.color + '12' }}>
            <Text className="text-lg font-bold" style={{ color: s.color }}>
              {statuses[s.key]?.count || 0}
            </Text>
            <Text className="text-xs" style={{ color: s.color }}>{s.label}</Text>
            <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
              {formatPrice(statuses[s.key]?.totalAmount || 0)}
            </Text>
          </View>
        ))}
      </View>

      {/* Expenses & Net Revenue */}
      {overview.expenses && (
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="arrow-up-circle" size={16} color={colors.error} />
              <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                Expenses
              </Text>
            </View>
            <Text className="font-semibold" style={{ color: colors.error }}>
              {formatPrice(overview.expenses.total)}
            </Text>
          </View>
          <View
            className="mt-3 flex-row items-center justify-between border-t pt-3"
            style={{ borderColor: colors.border }}>
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Net Revenue
            </Text>
            <Text
              className="text-lg font-bold"
              style={{
                color: (overview.netRevenue || 0) >= 0 ? colors.success : colors.error,
              }}>
              {formatPrice(overview.netRevenue || 0)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
