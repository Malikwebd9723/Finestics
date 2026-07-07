// screens/Admin/Statistics.tsx
// Platform analytics — Overview / Vendors / Users tabs over the admin
// statistics endpoints, with a named-period selector. Built on components/ui.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchPlatformStats,
  fetchVendorPerformanceStats,
  fetchUserGrowthStats,
  StatsPeriod,
} from 'api/actions/adminActions';
import { formatPrice } from 'types/order.types';
import { typo, radius } from 'constants/design';
import { TrendCard, StatInline, RankBars, BarChart, Button } from 'components/ui';

type TabType = 'overview' | 'vendors' | 'users';

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'users', label: 'Users' },
];

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: 'week', label: '7D' },
  { key: 'month', label: '30D' },
  { key: 'quarter', label: '90D' },
  { key: 'year', label: '1Y' },
];

const fmtLabel = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function AdminStatistics() {
  const { colors } = useThemeContext();
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const overviewQuery = useQuery({
    queryKey: ['adminPlatformStats', period],
    queryFn: () => fetchPlatformStats(period),
    enabled: activeTab === 'overview',
  });
  const vendorsQuery = useQuery({
    queryKey: ['adminVendorStats', period],
    queryFn: () => fetchVendorPerformanceStats(period),
    enabled: activeTab === 'vendors',
  });
  const usersQuery = useQuery({
    queryKey: ['adminUserStats', period],
    queryFn: () => fetchUserGrowthStats(period),
    enabled: activeTab === 'users',
  });

  const active =
    activeTab === 'overview' ? overviewQuery : activeTab === 'vendors' ? vendorsQuery : usersQuery;

  const cardStyle = {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  } as const;

  const chip = (selected: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: selected ? colors.cta : colors.card,
    borderWidth: 1,
    borderColor: selected ? colors.cta : colors.border,
  });
  const chipLabel = (selected: boolean) => ({
    color: selected ? colors.onCta : colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  });

  const overview = overviewQuery.data?.data;
  const vendors = vendorsQuery.data?.data;
  const users = usersQuery.data?.data;

  const renderOverview = () => {
    if (!overview) return null;
    const labels = overview.chartData.labels.map(fmtLabel);
    const orderBars = overview.chartData.labels.map((l, i) => ({
      label: fmtLabel(l),
      value: overview.chartData.orders[i] ?? 0,
    }));
    return (
      <>
        <View className="px-4 pt-4">
          <TrendCard
            title="Revenue"
            value={formatPrice(overview.revenue.total)}
            delta={{ pct: overview.revenue.percentageChange }}
            data={overview.chartData.revenue}
            labels={labels}
          />
        </View>

        <View className="px-4 pt-4">
          <StatInline
            items={[
              { label: 'Orders', value: String(overview.orders.total) },
              { label: 'Avg order', value: formatPrice(overview.orders.averageOrderValue) },
              { label: 'New users', value: String(overview.users.newUsers) },
            ]}
          />
        </View>

        <View className="px-4 pt-4">
          <View className="p-4" style={cardStyle}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text style={[typo.eyebrow, { color: colors.muted }]}>ORDERS</Text>
              <Text
                style={{
                  color: overview.orders.percentageChange >= 0 ? colors.success : colors.error,
                  fontSize: 12,
                  fontVariant: ['tabular-nums'],
                }}>
                {overview.orders.percentageChange >= 0 ? '▲' : '▼'}{' '}
                {Math.abs(overview.orders.percentageChange).toFixed(0)}% vs previous
              </Text>
            </View>
            <BarChart
              data={orderBars}
              height={150}
              showValues={orderBars.length <= 8}
              labelMode={orderBars.length <= 8 ? 'all' : 'sparse'}
            />
          </View>
        </View>

        <View className="px-4 pt-4">
          <Text className="mb-2" style={[typo.eyebrow, { color: colors.muted }]}>
            REVENUE BY CHANNEL
          </Text>
          <StatInline
            items={[
              {
                label: 'Marketplace',
                value: formatPrice(overview.revenue.byChannel.marketplace.revenue),
                tone: 'success',
              },
              {
                label: 'Direct (wholesale)',
                value: formatPrice(overview.revenue.byChannel.direct.revenue),
                tone: 'success',
              },
            ]}
          />
        </View>
      </>
    );
  };

  const renderVendors = () => {
    if (!vendors) return null;
    return (
      <>
        <View className="px-4 pt-4">
          <StatInline
            items={[
              { label: 'Total vendors', value: String(vendors.totalVendors) },
              { label: 'Active', value: String(vendors.activeVendors) },
              { label: 'New', value: String(vendors.newVendors) },
            ]}
          />
        </View>

        {vendors.topVendors.length > 0 && (
          <View className="px-4 pt-4">
            <Text className="mb-2" style={[typo.eyebrow, { color: colors.muted }]}>
              TOP VENDORS BY REVENUE
            </Text>
            <View className="p-4" style={cardStyle}>
              <RankBars
                items={vendors.topVendors.map((v) => ({
                  id: v.id,
                  label: v.businessName,
                  value: v.totalRevenue,
                }))}
                formatValue={(n) => formatPrice(n)}
              />
            </View>
          </View>
        )}

        <View className="px-4 pt-4">
          <TrendCard
            title="New vendors"
            value={String(vendors.newVendors)}
            data={vendors.vendorGrowth.newVendors}
            labels={vendors.vendorGrowth.labels.map(fmtLabel)}
          />
        </View>

        <View className="px-4 pt-4">
          <StatInline
            items={[
              { label: 'Pending', value: String(vendors.vendorsByStatus.pending) },
              { label: 'Suspended', value: String(vendors.vendorsByStatus.suspended) },
              { label: 'Rejected', value: String(vendors.vendorsByStatus.rejected) },
            ]}
          />
        </View>
      </>
    );
  };

  const renderUsers = () => {
    if (!users) return null;
    return (
      <>
        <View className="px-4 pt-4">
          <StatInline
            items={[
              { label: 'Total users', value: String(users.totalUsers) },
              { label: 'New', value: String(users.newUsers) },
              { label: 'Active', value: String(users.activeUsers) },
            ]}
          />
        </View>

        <View className="px-4 pt-4">
          <TrendCard
            title="New users"
            value={String(users.newUsers)}
            data={users.userGrowth.newUsers}
            labels={users.userGrowth.labels.map(fmtLabel)}
          />
        </View>

        <View className="px-4 pt-4">
          <Text className="mb-2" style={[typo.eyebrow, { color: colors.muted }]}>
            USERS BY ROLE
          </Text>
          <View className="p-4" style={cardStyle}>
            <RankBars
              items={[
                { id: 'customer', label: 'Customers', value: users.usersByRole.customer },
                { id: 'vendor', label: 'Vendors', value: users.usersByRole.vendor },
                { id: 'admin', label: 'Admins', value: users.usersByRole.admin },
              ]}
              valueTone="default"
            />
          </View>
        </View>

        <View className="px-4 pt-4">
          <StatInline
            items={[
              { label: 'Email verified', value: `${users.verificationRate}%` },
              { label: 'Admins', value: String(users.usersByRole.admin) },
            ]}
          />
        </View>
      </>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Tabs + period selector */}
      <View className="px-4 pt-3">
        <View className="flex-row" style={{ gap: 8 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.85}
              onPress={() => setActiveTab(t.key)}
              style={chip(activeTab === t.key)}>
              <Text style={chipLabel(activeTab === t.key)}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mt-2 flex-row" style={{ gap: 8 }}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              activeOpacity={0.85}
              onPress={() => setPeriod(p.key)}
              style={chip(period === p.key)}>
              <Text style={chipLabel(period === p.key)}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {active.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : active.isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={[typo.title, { color: colors.text }]}>Couldn’t load statistics</Text>
          <Text className="mb-5 mt-2 text-center text-sm" style={{ color: colors.muted }}>
            Check your connection and try again.
          </Text>
          <Button title="Retry" icon="refresh" onPress={() => active.refetch()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={active.isRefetching}
              onRefresh={() => active.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'vendors' && renderVendors()}
          {activeTab === 'users' && renderUsers()}
        </ScrollView>
      )}
    </View>
  );
}
