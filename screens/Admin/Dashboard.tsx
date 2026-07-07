// screens/Admin/Dashboard.tsx
// Admin home — platform health at a glance. Built on components/ui like the
// vendor Dashboard: one hero (platform revenue), a 2×2 KPI grid, the approval
// attention queue, top vendors by revenue, user mix, and quick actions.
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchAdminDashboardStats,
  fetchPlatformStats,
  fetchVendorPerformanceStats,
} from 'api/actions/adminActions';
import { formatPrice } from 'types/order.types';
import { typo } from 'constants/design';
import { HeroMetric, StatCell, AttentionRow, ActionBar, RankBars, Button } from 'components/ui';

export default function AdminDashboard() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const {
    data: dashData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchAdminDashboardStats,
    refetchInterval: appActive ? 60000 : false,
    refetchIntervalInBackground: false,
  });

  const { data: overviewData, refetch: refetchOverview } = useQuery({
    queryKey: ['adminPlatformStats', 'month'],
    queryFn: () => fetchPlatformStats('month'),
  });

  const { data: vendorStatsData, refetch: refetchVendors } = useQuery({
    queryKey: ['adminVendorStats', 'month'],
    queryFn: () => fetchVendorPerformanceStats('month'),
  });

  const stats = dashData?.data ?? null;
  const overview = overviewData?.data ?? null;
  const topVendors = vendorStatsData?.data?.topVendors ?? [];

  const attention = stats?.attentionRequired;
  const attentionRows = [
    {
      key: 'pendingVendors',
      count: attention?.pendingVendors ?? 0,
      icon: 'store-clock-outline' as const,
      title: (n: number) => `${n} vendor ${n === 1 ? 'application' : 'applications'} pending`,
      subtitle: 'Review and approve',
      onPress: () => navigation.navigate('Vendors'),
    },
    {
      key: 'pendingCustomers',
      count: attention?.pendingCustomers ?? 0,
      icon: 'account-clock-outline' as const,
      title: (n: number) => `${n} customer ${n === 1 ? 'application' : 'applications'} pending`,
      subtitle: 'Review and approve',
      onPress: () => navigation.navigate('Users'),
    },
    {
      key: 'suspendedVendors',
      count: attention?.suspendedVendors ?? 0,
      icon: 'store-off-outline' as const,
      title: (n: number) => `${n} suspended ${n === 1 ? 'vendor' : 'vendors'}`,
      subtitle: 'Reactivate or follow up',
      onPress: () => navigation.navigate('Vendors'),
    },
  ].filter((r) => r.count > 0);

  const revenueSeries = overview?.chartData?.revenue ?? [];
  const revenueDelta = overview != null ? { pct: overview.revenue.percentageChange } : null;

  const onRefresh = () => {
    refetch();
    refetchOverview();
    refetchVendors();
  };

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

  if (isError && !stats) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.background }}>
        <Text style={[typo.title, { color: colors.text }]}>Couldn’t load dashboard</Text>
        <Text className="mb-5 mt-2 text-center text-sm" style={{ color: colors.muted }}>
          Check your connection and try again.
        </Text>
        <Button title="Retry" icon="refresh" onPress={() => refetch()} />
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
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      {/* Platform revenue — hero */}
      <View className="px-4 pt-5">
        <HeroMetric
          variant="card"
          label="Platform revenue"
          value={formatPrice(overview?.revenue.total ?? 0)}
          sublabel={`${overview?.orders.total ?? 0} orders`}
          series={revenueSeries.length > 1 ? revenueSeries : undefined}
          seriesCaption="Revenue · last 30 days"
          delta={revenueDelta}
          onPress={() => navigation.navigate('Statistics')}
          footer={
            overview ? (
              <View className="flex-row justify-between">
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' }}>
                  Marketplace {formatPrice(overview.revenue.byChannel.marketplace.revenue)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' }}>
                  Direct {formatPrice(overview.revenue.byChannel.direct.revenue)}
                </Text>
              </View>
            ) : undefined
          }
        />
      </View>

      {/* KPIs — 2×2 */}
      <View className="px-4 pt-4">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <StatCell
              boxed
              icon="receipt"
              label="Orders · 30d"
              value={String(overview?.orders.total ?? 0)}
            />
          </View>
          <View className="flex-1">
            <StatCell
              boxed
              icon="account-group-outline"
              label="Total users"
              value={String(stats?.users.total ?? 0)}
              onPress={() => navigation.navigate('Users')}
            />
          </View>
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <StatCell
              boxed
              icon="storefront-outline"
              label="Active vendors"
              value={String(stats?.vendors.active ?? 0)}
              onPress={() => navigation.navigate('Vendors')}
            />
          </View>
          <View className="flex-1">
            <StatCell
              boxed
              icon="account-plus-outline"
              label="New users · month"
              value={String(stats?.overview.newUsersThisMonth ?? 0)}
            />
          </View>
        </View>
      </View>

      {/* Needs attention */}
      {attentionRows.length > 0 && (
        <View className="px-4 pt-4" style={{ gap: 10 }}>
          <Text style={[typo.eyebrow, { color: colors.muted }]}>NEEDS ATTENTION</Text>
          {attentionRows.map((row) => (
            <AttentionRow
              key={row.key}
              icon={row.icon}
              title={row.title(row.count)}
              subtitle={row.subtitle}
              tone="info"
              onPress={row.onPress}
            />
          ))}
        </View>
      )}

      {/* Top vendors by revenue */}
      {topVendors.length > 0 && (
        <View className="px-4 pt-4">
          <Text className="mb-2" style={[typo.eyebrow, { color: colors.muted }]}>
            TOP VENDORS · 30 DAYS
          </Text>
          <View
            className="rounded-2xl border p-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <RankBars
              items={topVendors.map((v) => ({
                id: v.id,
                label: v.businessName,
                value: v.totalRevenue,
              }))}
              formatValue={(n) => formatPrice(n)}
            />
          </View>
        </View>
      )}

      {/* User mix */}
      <View className="px-4 pt-4">
        <Text className="mb-2" style={[typo.eyebrow, { color: colors.muted }]}>
          USERS
        </Text>
        <View
          className="flex-row rounded-2xl border px-1 py-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          {[
            { label: 'Customers', value: stats?.users.byRole.customer ?? 0 },
            { label: 'Vendors', value: stats?.users.byRole.vendor ?? 0 },
            { label: 'New this week', value: stats?.overview.newUsersThisWeek ?? 0 },
          ].map((item, i) => (
            <View
              key={item.label}
              className="flex-1 px-3"
              style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border } : undefined}>
              <Text style={[typo.stat, { color: colors.text }]} numberOfLines={1}>
                {item.value}
              </Text>
              <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View className="px-4 pt-4">
        <ActionBar
          actions={[
            {
              icon: 'storefront-outline',
              label: 'Vendors',
              primary: true,
              onPress: () => navigation.navigate('Vendors'),
            },
            {
              icon: 'account-group-outline',
              label: 'Users',
              onPress: () => navigation.navigate('Users'),
            },
            {
              icon: 'chart-line',
              label: 'Statistics',
              onPress: () => navigation.navigate('Statistics'),
            },
          ]}
        />
      </View>
    </ScrollView>
  );
}
