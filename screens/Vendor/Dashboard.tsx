// screens/Vendor/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchDashboardStats, DashboardStats, fetchSalesTrend } from 'api/actions/statisticsActions';
import { fetchAllOrders } from 'api/actions/orderActions';
import { formatPrice, getPaymentStatusLabel, Order } from 'types/order.types';
import SegmentedDateFilter from 'components/shared/SegmentedDateFilter';
import { DateRange, defaultRange } from 'components/shared/DatePresetSelector';
import { typo, radius } from 'constants/design';
import { HeroMetric, StatCell, TrendCard, AttentionRow, ListRow } from 'components/ui';

const initialsOf = (s?: string) =>
  (s || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'OR';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function Dashboard() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const [range, setRange] = useState<DateRange>(() => defaultRange('today'));
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => sub.remove();
  }, []);

  const spanDays = useMemo(() => {
    const start = new Date(range.from);
    const end = new Date(range.to);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  }, [range]);
  const useLast7 = spanDays <= 1;
  const trendInterval: 'day' | 'week' | 'month' =
    spanDays <= 31 ? 'day' : spanDays <= 120 ? 'week' : 'month';

  const {
    data: statsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboardStats', range.from, range.to],
    queryFn: () => fetchDashboardStats({ from: range.from, to: range.to }),
    refetchInterval: appActive ? 60000 : false,
    refetchIntervalInBackground: false,
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboardTrend', useLast7 ? 'last7' : range.from, range.to, trendInterval],
    queryFn: () =>
      useLast7
        ? fetchSalesTrend({ days: 7, interval: 'day' })
        : fetchSalesTrend({ from: range.from, to: range.to, interval: trendInterval }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['dashboardRecentOrders'],
    queryFn: () => fetchAllOrders({ limit: 5, sortBy: 'createdAt', sortOrder: 'DESC' }),
  });

  const stats: DashboardStats | null = statsData?.data || null;
  const bucket = stats?.custom ?? stats?.today ?? null;
  const recent: Order[] = ordersData?.data || [];

  const trendPoints = trendData?.data || [];
  const series = useMemo(() => trendPoints.map((d) => d.sales), [trendPoints]);
  const trendLabels = useMemo(() => trendPoints.map((d) => fmtDate(d.date)), [trendPoints]);
  const seriesSum = useMemo(() => series.reduce((a, b) => a + b, 0), [series]);
  const delta =
    series.length > 1 && series[0] !== 0
      ? { pct: ((series[series.length - 1] - series[0]) / Math.abs(series[0])) * 100 }
      : null;

  const pending = stats?.pendingOrders || 0;
  const outstanding = stats?.outstandingBalance || 0;
  const trendTitle = useLast7 ? 'Sales · last 7 days' : 'Sales · selected range';
  const margin = bucket?.netMargin != null ? `${bucket.netMargin}% margin` : undefined;

  if (isLoading && !stats) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.muted }}>
          Loading dashboard…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      {/* Date range */}
      <View className="pt-3">
        <SegmentedDateFilter value={range} onChange={setRange} />
      </View>

      {/* Net profit — hero card */}
      <View className="px-4 pt-5">
        <HeroMetric
          variant="card"
          label="Net profit"
          value={formatPrice(bucket?.netProfit || 0)}
          sublabel={margin}
          onPress={() => navigation.navigate('Statistics')}
          footer={
            <View className="flex-row justify-between">
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' }}>
                Gross {formatPrice(bucket?.grossProfit || 0)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' }}>
                Expenses {formatPrice(bucket?.expenses || 0)}
              </Text>
            </View>
          }
        />
      </View>

      {/* KPIs — 2×2 cards */}
      <View className="px-4 pt-4">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCell boxed icon="cash-multiple" label="Sales" value={formatPrice(bucket?.sales || 0)} />
          </View>
          <View className="flex-1">
            <StatCell
              boxed
              icon="cash-check"
              label="Collected"
              value={formatPrice(bucket?.collected || 0)}
              tone="success"
            />
          </View>
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <StatCell boxed icon="receipt" label="Orders" value={String(bucket?.orders || 0)} />
          </View>
          <View className="flex-1">
            <StatCell
              boxed
              icon="cash-clock"
              label="Outstanding"
              value={formatPrice(outstanding)}
              tone="error"
              onPress={() => navigation.navigate('Orders', { paymentFilter: 'unpaid' })}
            />
          </View>
        </View>
      </View>

      {/* Needs attention */}
      {pending > 0 && (
        <View className="px-4 pt-4">
          <AttentionRow
            icon="clock-alert-outline"
            title={`${pending} pending ${pending === 1 ? 'order' : 'orders'}`}
            subtitle="Confirm or action these"
            tone="info"
            onPress={() => navigation.navigate('Orders', { statusFilter: 'pending' })}
          />
        </View>
      )}

      {/* Sales trend */}
      <View className="px-4 pt-4">
        <TrendCard
          variant="card"
          title={trendTitle}
          value={formatPrice(seriesSum)}
          delta={delta}
          data={series}
          labels={trendLabels}
          onPress={() => navigation.navigate('Statistics')}
        />
      </View>

      {/* Recent orders */}
      <View className="px-4 pt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text style={[typo.eyebrow, { color: colors.muted }]}>RECENT ORDERS</Text>
          <TouchableOpacity hitSlop={8} onPress={() => navigation.navigate('Orders')}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              See all
            </Text>
          </TouchableOpacity>
        </View>
        <View
          className="px-4"
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          {recent.length === 0 ? (
            <Text className="py-6 text-center text-sm" style={{ color: colors.muted }}>
              No orders yet
            </Text>
          ) : (
            recent.slice(0, 5).map((o, i) => (
              <ListRow
                key={o.id}
                leading={initialsOf(o.customer?.businessName)}
                title={o.customer?.businessName || `Order ${o.orderNumber}`}
                subtitle={`${o.orderNumber} · ${fmtDate(o.orderDate)}`}
                amount={formatPrice(Number(o.totalAmount) || 0)}
                badge={{
                  label: getPaymentStatusLabel(o.paymentStatus),
                  tone:
                    o.paymentStatus === 'paid'
                      ? 'success'
                      : o.paymentStatus === 'unpaid'
                        ? 'error'
                        : 'default',
                }}
                divider={i > 0}
                onPress={() => navigation.navigate('Orders')}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
