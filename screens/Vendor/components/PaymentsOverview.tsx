// screens/Vendor/components/PaymentsOverview.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';
import { EmptyState, HeroMetric, StatInline } from 'components/ui';
import { fetchPaymentOverview, PaymentOverview } from 'api/actions/paymentActions';
import { formatPrice } from 'types/order.types';
import { copyToClipboard, formatOverviewText } from 'utils/paymentClipboard';

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
      <EmptyState
        icon="alert-circle-outline"
        title="Couldn't load overview"
        subtitle="Check your connection and try again."
      />
    );
  }

  if (!overview) {
    return (
      <EmptyState icon="cash-remove" title="No data for this period" />
    );
  }

  const statuses = overview.byPaymentStatus;
  const collectionPct =
    overview.totalSales > 0
      ? Math.round((overview.totalCollections / overview.totalSales) * 100)
      : 0;

  const handleCopy = () => copyToClipboard(formatOverviewText(overview, startDate, endDate));

  return (
    <View className="px-4 pt-4">
      {/* Copy button */}
      <TouchableOpacity
        onPress={handleCopy}
        className="mb-3 flex-row items-center self-end rounded-full px-3"
        style={{ height: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <MaterialCommunityIcons name="content-copy" size={13} color={colors.muted} />
        <Text className="ml-1.5 text-xs" style={{ color: colors.muted }}>Copy</Text>
      </TouchableOpacity>

      {/* Hero: sales for the period, with the collected/outstanding ledger */}
      <View className="mb-3">
        <HeroMetric
          label="Total sales"
          value={formatPrice(overview.totalSales)}
          sublabel={`${overview.orderCount} orders`}
          footer={
            <View className="flex-row items-center justify-between">
              <Text style={{ color: colors.white, opacity: 0.85, fontSize: 13 }}>
                Collected{' '}
                <Text style={[typo.num, { color: colors.white }]}>
                  {formatPrice(overview.totalCollections)}
                </Text>
              </Text>
              <Text style={{ color: colors.white, opacity: 0.85, fontSize: 13 }}>
                Outstanding{' '}
                <Text style={[typo.num, { color: colors.white }]}>
                  {formatPrice(overview.totalOutstanding)}
                </Text>
              </Text>
            </View>
          }
        />
      </View>

      {/* Profit line */}
      <View className="mb-4">
        <StatInline
          items={[
            {
              label: `Gross profit · ${overview.grossMargin}%`,
              value: formatPrice(overview.grossProfit),
              tone: 'success',
            },
            { label: 'Cost', value: formatPrice(overview.totalCost) },
          ]}
        />
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

      {/* Payment status — one quiet card, tone carried by the dot + amount */}
      <View
        className="mb-4 flex-row rounded-2xl py-3"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        {([
          { key: 'paid' as const, label: 'Paid', color: colors.success },
          { key: 'partial' as const, label: 'Partial', color: colors.muted },
          { key: 'unpaid' as const, label: 'Unpaid', color: colors.error },
        ]).map((s, i) => (
          <View
            key={s.key}
            className="flex-1 items-center px-2"
            style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border } : undefined}>
            <View className="flex-row items-center">
              <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <Text className="text-xs" style={{ color: colors.muted }}>
                {s.label} · {statuses[s.key]?.count || 0}
              </Text>
            </View>
            <Text className="mt-1 text-sm" style={[typo.num, { color: s.color }]}>
              {formatPrice(statuses[s.key]?.totalAmount || 0)}
            </Text>
          </View>
        ))}
      </View>

      {/* Expenses & Net Cash Flow */}
      {overview.expenses && (
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="arrow-up-circle" size={16} color={colors.error} />
              <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                Expenses
              </Text>
            </View>
            <Text style={[typo.num, { color: colors.error }]}>
              {formatPrice(overview.expenses.total)}
            </Text>
          </View>
          <View
            className="mt-3 flex-row items-center justify-between border-t pt-3"
            style={{ borderColor: colors.border }}>
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Net Cash Flow
            </Text>
            <Text
              className="text-lg"
              style={[
                typo.num,
                { color: (overview.netCashFlow || 0) >= 0 ? colors.success : colors.error },
              ]}>
              {formatPrice(overview.netCashFlow || 0)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
