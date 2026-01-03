// screens/Vendor/Dashboard.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchDashboardStats, DashboardStats } from 'api/actions/statisticsActions';
import { formatPrice } from 'types/order.types';

export default function Dashboard() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const {
    data: statsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });

  const stats: DashboardStats | null = statsData?.data || null;

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.muted }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      {/* Header */}
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Dashboard
        </Text>
        <Text className="text-sm" style={{ color: colors.muted }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Today's Highlights */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
          TODAY'S HIGHLIGHTS
        </Text>
        <View className="flex-row gap-3">
          {/* Orders Today */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.8}
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.primary }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="rounded-full bg-white/20 p-2">
                <MaterialIcons name="receipt-long" size={20} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-white">{stats?.today.orders || 0}</Text>
            </View>
            <Text className="text-sm text-white/80">Orders Today</Text>
          </TouchableOpacity>

          {/* Sales Today */}
          <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.success }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="rounded-full bg-white/20 p-2">
                <MaterialIcons name="attach-money" size={20} color="#fff" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-white">
              {formatPrice(stats?.today.sales || 0)}
            </Text>
            <Text className="text-sm text-white/80">Sales Today</Text>
          </View>
        </View>

        {/* Second Row */}
        <View className="mt-3 flex-row gap-3">
          {/* Collected Today */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center">
              <View className="rounded-full p-2" style={{ backgroundColor: colors.success + '20' }}>
                <MaterialIcons name="account-balance-wallet" size={18} color={colors.success} />
              </View>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.success }}>
              {formatPrice(stats?.today.collected || 0)}
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Collected Today
            </Text>
          </View>

          {/* Deliveries Today */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center">
              <View className="rounded-full p-2" style={{ backgroundColor: colors.primary + '20' }}>
                <MaterialIcons name="local-shipping" size={18} color={colors.primary} />
              </View>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {stats?.today.deliveries || 0}
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Deliveries Due
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
          QUICK ACTIONS
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateOrderScreen')}
            className="flex-1 items-center rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View
              className="mb-2 rounded-full p-3"
              style={{ backgroundColor: colors.primary + '15' }}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              New Order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('CollectionSheet')}
            className="flex-1 items-center rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 rounded-full p-3" style={{ backgroundColor: '#8b5cf6' + '15' }}>
              <MaterialIcons name="shopping-basket" size={24} color="#8b5cf6" />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              Collection
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Customers')}
            className="flex-1 items-center rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 rounded-full p-3" style={{ backgroundColor: '#f59e0b' + '15' }}>
              <Ionicons name="people" size={24} color="#f59e0b" />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              Customers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attention Required */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
          ATTENTION REQUIRED
        </Text>
        <View className="gap-3">
          {/* Pending Orders */}
          {(stats?.pendingOrders || 0) > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Orders', { statusFilter: 'pending' })}
              className="flex-row items-center rounded-xl p-4"
              style={{
                backgroundColor: '#f59e0b' + '15',
                borderWidth: 1,
                borderColor: '#f59e0b' + '30',
              }}>
              <View className="mr-3 rounded-full p-2" style={{ backgroundColor: '#f59e0b' + '20' }}>
                <MaterialIcons name="pending-actions" size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {stats?.pendingOrders} Pending Orders
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Need confirmation or action
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          )}

          {/* Outstanding Balance */}
          {(stats?.outstandingBalance || 0) > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Orders', { paymentFilter: 'unpaid' })}
              className="flex-row items-center rounded-xl p-4"
              style={{
                backgroundColor: colors.error + '10',
                borderWidth: 1,
                borderColor: colors.error + '30',
              }}>
              <View
                className="mr-3 rounded-full p-2"
                style={{ backgroundColor: colors.error + '20' }}>
                <MaterialCommunityIcons name="cash-clock" size={20} color={colors.error} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {formatPrice(stats?.outstandingBalance || 0)} Outstanding
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Payments pending collection
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Period Summary */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
          PERIOD SUMMARY
        </Text>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* This Week */}
          <View className="mb-4">
            <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
              THIS WEEK
            </Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {stats?.week.orders || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Orders
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  {formatPrice(stats?.week.sales || 0)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Sales
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.success }}>
                  {formatPrice(stats?.week.collected || 0)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Collected
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="mb-4 h-px" style={{ backgroundColor: colors.border }} />

          {/* This Month */}
          <View>
            <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
              THIS MONTH
            </Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {stats?.month.orders || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Orders
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  {formatPrice(stats?.month.sales || 0)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Sales
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold" style={{ color: colors.success }}>
                  {formatPrice(stats?.month.collected || 0)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Collected
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Order Status Overview */}
      <View className="px-4 py-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
            ORDER STATUS
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Statistics')}>
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              See More
            </Text>
          </TouchableOpacity>
        </View>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row flex-wrap gap-3">
            {[
              { key: 'pending', label: 'Pending', color: '#f59e0b' },
              { key: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
              { key: 'collected', label: 'Collected', color: '#8b5cf6' },
              { key: 'delivered', label: 'Delivered', color: '#10b981' },
              { key: 'completed', label: 'Completed', color: '#059669' },
              { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
            ].map((status) => (
              <TouchableOpacity
                key={status.key}
                onPress={() => navigation.navigate('Orders', { statusFilter: status.key })}
                className="flex-row items-center rounded-full px-3 py-2"
                style={{ backgroundColor: status.color + '15' }}>
                <View
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <Text className="text-sm font-medium" style={{ color: status.color }}>
                  {status.label}: {stats?.ordersByStatus?.[status.key] || 0}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Customer Overview */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
          CUSTOMERS
        </Text>
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text className="ml-2 text-xs" style={{ color: colors.muted }}>
                Total
              </Text>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {stats?.customers.total || 0}
            </Text>
          </View>
          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="trending-up" size={18} color={colors.success} />
              <Text className="ml-2 text-xs" style={{ color: colors.muted }}>
                Active (30d)
              </Text>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.success }}>
              {stats?.customers.active || 0}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
