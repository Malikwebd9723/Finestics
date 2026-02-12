// screens/Admin/Statistics.tsx
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
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchPlatformStats,
  fetchVendorPerformanceStats,
  fetchUserGrowthStats,
} from 'api/actions/adminActions';

type Period = 'week' | 'month' | 'quarter' | 'year';
type TabType = 'overview' | 'vendors' | 'users';

export default function AdminStatistics() {
  const { colors } = useThemeContext();
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Fetch platform stats
  const {
    data: platformData,
    isLoading: platformLoading,
    refetch: refetchPlatform,
    isRefetching: platformRefetching,
  } = useQuery({
    queryKey: ['adminPlatformStats', period],
    queryFn: () => fetchPlatformStats(period),
  });

  // Fetch vendor performance stats
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['adminVendorStats', period],
    queryFn: () => fetchVendorPerformanceStats(period),
    enabled: activeTab === 'vendors',
  });

  // Fetch user growth stats
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['adminUserStats', period],
    queryFn: () => fetchUserGrowthStats(period),
    enabled: activeTab === 'users',
  });

  // Placeholder data
  const platformStats = platformData?.data || {
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    userGrowth: 0,
    activeVendors: 0,
    vendorGrowth: 0,
  };

  const vendorStats = vendorData?.data || {
    topVendors: [],
    vendorsByOrders: [],
    vendorsByRevenue: [],
    newVendors: 0,
  };

  const userStats = userData?.data || {
    totalUsers: 0,
    newUsers: 0,
    usersByRole: { admin: 0, vendor: 0, customer: 0 },
    activeUsers: 0,
    growthRate: 0,
  };

  const isLoading =
    platformLoading ||
    (activeTab === 'vendors' && vendorLoading) ||
    (activeTab === 'users' && userLoading);
  const isRefetching = platformRefetching;

  const periodLabels: Record<Period, string> = {
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
  };

  if (isLoading && !platformStats) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.muted }}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Statistics
        </Text>
      </View>

      {/* Period Selector */}
      <View className="px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {(['week', 'month', 'quarter', 'year'] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className="items-center justify-center rounded-full px-4"
                style={{
                  height: 36,
                  backgroundColor: period === p ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: period === p ? colors.primary : colors.border,
                }}>
                <Text
                  className="text-sm font-medium"
                  style={{ color: period === p ? '#fff' : colors.text }}>
                  {periodLabels[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tab Selector */}
      <View className="flex-row border-b px-4" style={{ borderColor: colors.border }}>
        {[
          { key: 'overview', label: 'Overview', icon: 'bar-chart' },
          { key: 'vendors', label: 'Vendors', icon: 'storefront' },
          { key: 'users', label: 'Users', icon: 'people' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as TabType)}
            className="mr-4 flex-row items-center pb-3 pt-2"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
            }}>
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? colors.primary : colors.muted}
            />
            <Text
              className="ml-1.5 text-sm font-medium"
              style={{ color: activeTab === tab.key ? colors.primary : colors.muted }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchPlatform}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View className="px-4 py-4">
            {/* Platform Summary Cards */}
            <View className="mb-4 flex-row gap-3">
              <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.primary }}>
                <Text className="text-2xl font-bold text-white">
                  ${platformStats.totalRevenue?.toLocaleString() || 0}
                </Text>
                <Text className="text-sm text-white/80">Total Revenue</Text>
              </View>
              <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.success }}>
                <Text className="text-2xl font-bold text-white">
                  {platformStats.totalOrders?.toLocaleString() || 0}
                </Text>
                <Text className="text-sm text-white/80">Total Orders</Text>
              </View>
            </View>

            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  {platformStats.totalUsers?.toLocaleString() || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Users
                </Text>
                {platformStats.userGrowth !== 0 && (
                  <View className="mt-1 flex-row items-center">
                    <MaterialIcons
                      name={platformStats.userGrowth > 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={platformStats.userGrowth > 0 ? colors.success : colors.error}
                    />
                    <Text
                      className="ml-1 text-xs font-medium"
                      style={{ color: platformStats.userGrowth > 0 ? colors.success : colors.error }}>
                      {platformStats.userGrowth > 0 ? '+' : ''}{platformStats.userGrowth}%
                    </Text>
                  </View>
                )}
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                  {platformStats.activeVendors || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Active Vendors
                </Text>
                {platformStats.vendorGrowth !== 0 && (
                  <View className="mt-1 flex-row items-center">
                    <MaterialIcons
                      name={platformStats.vendorGrowth > 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={platformStats.vendorGrowth > 0 ? colors.success : colors.error}
                    />
                    <Text
                      className="ml-1 text-xs font-medium"
                      style={{ color: platformStats.vendorGrowth > 0 ? colors.success : colors.error }}>
                      {platformStats.vendorGrowth > 0 ? '+' : ''}{platformStats.vendorGrowth}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Platform Health */}
            <View
              className="mb-4 rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                PLATFORM SUMMARY
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + '20' }}>
                      <MaterialIcons name="store" size={16} color={colors.primary} />
                    </View>
                    <Text style={{ color: colors.text }}>Active Vendors</Text>
                  </View>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {platformStats.activeVendors || 0}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.success + '20' }}>
                      <Ionicons name="people" size={16} color={colors.success} />
                    </View>
                    <Text style={{ color: colors.text }}>Total Users</Text>
                  </View>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {platformStats.totalUsers || 0}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#8b5cf6' + '20' }}>
                      <MaterialIcons name="receipt" size={16} color="#8b5cf6" />
                    </View>
                    <Text style={{ color: colors.text }}>Total Orders</Text>
                  </View>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {platformStats.totalOrders || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <View className="px-4 py-4">
            {/* Vendor Overview */}
            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <MaterialIcons name="store" size={24} color={colors.primary} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>
                  {vendorStats.newVendors || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  New Vendors
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <MaterialIcons name="trending-up" size={24} color={colors.success} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.success }}>
                  {vendorStats.topVendors?.length || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Top Performers
                </Text>
              </View>
            </View>

            {/* Top Vendors by Revenue */}
            {vendorStats.vendorsByRevenue?.length > 0 && (
              <View
                className="mb-4 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  TOP VENDORS BY REVENUE
                </Text>
                {vendorStats.vendorsByRevenue.slice(0, 5).map((vendor: any, idx: number) => (
                  <View
                    key={vendor.id || idx}
                    className={`flex-row items-center py-2 ${idx > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.success + '20' }}>
                      <Text className="text-xs font-bold" style={{ color: colors.success }}>
                        #{idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {vendor.businessName || 'Unknown'}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {vendor.orderCount || 0} orders
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.success }}>
                      ${vendor.revenue?.toLocaleString() || 0}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Top Vendors by Orders */}
            {vendorStats.vendorsByOrders?.length > 0 && (
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  TOP VENDORS BY ORDERS
                </Text>
                {vendorStats.vendorsByOrders.slice(0, 5).map((vendor: any, idx: number) => (
                  <View
                    key={vendor.id || idx}
                    className={`flex-row items-center py-2 ${idx > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + '20' }}>
                      <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                        #{idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {vendor.businessName || 'Unknown'}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        ${vendor.revenue?.toLocaleString() || 0} revenue
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.primary }}>
                      {vendor.orderCount || 0} orders
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Empty state */}
            {(!vendorStats.vendorsByRevenue || vendorStats.vendorsByRevenue.length === 0) &&
              (!vendorStats.vendorsByOrders || vendorStats.vendorsByOrders.length === 0) && (
                <View className="items-center py-12">
                  <MaterialIcons name="store" size={48} color={colors.muted} />
                  <Text className="mt-4 text-center" style={{ color: colors.muted }}>
                    No vendor data available for this period
                  </Text>
                </View>
              )}
          </View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <View className="px-4 py-4">
            {/* User Overview Cards */}
            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>
                  {userStats.totalUsers || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Users
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <MaterialIcons name="person-add" size={24} color={colors.success} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.success }}>
                  {userStats.newUsers || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  New Users
                </Text>
              </View>
            </View>

            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.success + '10',
                  borderWidth: 1,
                  borderColor: colors.success + '30',
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.success }}>
                  {userStats.activeUsers || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Active Users
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.primary + '10',
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                  {userStats.growthRate || 0}%
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Growth Rate
                </Text>
              </View>
            </View>

            {/* User Distribution */}
            <View
              className="mb-4 rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                USER DISTRIBUTION BY ROLE
              </Text>
              <View className="gap-3">
                {[
                  { key: 'admin', label: 'Admins', color: '#8b5cf6', icon: 'admin-panel-settings' },
                  { key: 'vendor', label: 'Vendors', color: '#3b82f6', icon: 'store' },
                  { key: 'customer', label: 'Customers', color: '#10b981', icon: 'person' },
                ].map((role) => {
                  const count = userStats.usersByRole?.[role.key] || 0;
                  const total = userStats.totalUsers || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <View key={role.key}>
                      <View className="mb-1 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <MaterialIcons name={role.icon as any} size={16} color={role.color} />
                          <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                            {role.label}
                          </Text>
                        </View>
                        <Text className="text-sm font-medium" style={{ color: colors.text }}>
                          {count} ({percentage}%)
                        </Text>
                      </View>
                      <View
                        className="h-2 overflow-hidden rounded-full"
                        style={{ backgroundColor: colors.border }}>
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: role.color }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Activity Summary */}
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                ACTIVITY METRICS
              </Text>
              <View className="flex-row gap-3">
                <View
                  className="flex-1 items-center rounded-lg p-3"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xl font-bold" style={{ color: colors.success }}>
                    {userStats.activeUsers || 0}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Active
                  </Text>
                </View>
                <View
                  className="flex-1 items-center rounded-lg p-3"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                    {userStats.newUsers || 0}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    New
                  </Text>
                </View>
                <View
                  className="flex-1 items-center rounded-lg p-3"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                    {(userStats.totalUsers || 0) - (userStats.activeUsers || 0)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Inactive
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
