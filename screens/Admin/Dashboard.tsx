// screens/Admin/Dashboard.tsx
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
import { fetchAdminDashboardStats, AdminDashboardStats } from 'api/actions/adminActions';

export default function AdminDashboard() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  const {
    data: statsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchAdminDashboardStats,
    refetchInterval: 60000,
  });

  const stats: AdminDashboardStats | null = statsData?.data || null;

  // Placeholder data for when API is not yet connected
  const placeholderStats: AdminDashboardStats = {
    vendors: {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
      rejected: 0,
    },
    users: {
      total: 0,
      active: 0,
      suspended: 0,
      byRole: { admin: 0, vendor: 0, customer: 0 },
    },
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
    },
  };

  const displayStats = stats || placeholderStats;

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
          Admin Dashboard
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
          OVERVIEW
        </Text>
        <View className="flex-row gap-3">
          {/* Total Vendors */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Vendors')}
            activeOpacity={0.8}
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.primary }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="rounded-full bg-white/20 p-2">
                <MaterialIcons name="store" size={20} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-white">{displayStats.vendors.total}</Text>
            </View>
            <Text className="text-sm text-white/80">Total Vendors</Text>
          </TouchableOpacity>

          {/* Active Vendors */}
          <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.success }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View className="rounded-full bg-white/20 p-2">
                <MaterialIcons name="verified" size={20} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-white">{displayStats.vendors.active}</Text>
            </View>
            <Text className="text-sm text-white/80">Active Vendors</Text>
          </View>
        </View>

        {/* Second Row */}
        <View className="mt-3 flex-row gap-3">
          {/* Total Users */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center">
              <View className="rounded-full p-2" style={{ backgroundColor: colors.primary + '20' }}>
                <Ionicons name="people" size={18} color={colors.primary} />
              </View>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {displayStats.users.total}
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Total Users
            </Text>
          </View>

          {/* Active Users */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center">
              <View className="rounded-full p-2" style={{ backgroundColor: colors.success + '20' }}>
                <MaterialIcons name="person" size={18} color={colors.success} />
              </View>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.success }}>
              {displayStats.users.active}
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Active Users
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
            onPress={() => navigation.navigate('Vendors', { filter: 'pending' })}
            className="flex-1 items-center rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View
              className="mb-2 rounded-full p-3"
              style={{ backgroundColor: '#f59e0b' + '15' }}>
              <MaterialIcons name="pending-actions" size={24} color="#f59e0b" />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              Approve Vendors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Users')}
            className="flex-1 items-center rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 rounded-full p-3" style={{ backgroundColor: colors.primary + '15' }}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              Manage Users
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Statistics')}
            className="flex-1 items-center rounded-xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 rounded-full p-3" style={{ backgroundColor: '#8b5cf6' + '15' }}>
              <Ionicons name="stats-chart" size={24} color="#8b5cf6" />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              View Statistics
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
          {/* Pending Vendors */}
          {displayStats.vendors.pending > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Vendors', { filter: 'pending' })}
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
                  {displayStats.vendors.pending} Pending Vendor{displayStats.vendors.pending !== 1 ? 's' : ''}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Awaiting approval
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          )}

          {/* Suspended Vendors */}
          {displayStats.vendors.suspended > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Vendors', { filter: 'suspended' })}
              className="flex-row items-center rounded-xl p-4"
              style={{
                backgroundColor: colors.error + '10',
                borderWidth: 1,
                borderColor: colors.error + '30',
              }}>
              <View
                className="mr-3 rounded-full p-2"
                style={{ backgroundColor: colors.error + '20' }}>
                <MaterialIcons name="block" size={20} color={colors.error} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {displayStats.vendors.suspended} Suspended Vendor{displayStats.vendors.suspended !== 1 ? 's' : ''}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Review or reactivate
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          )}

          {/* No attention required */}
          {displayStats.vendors.pending === 0 && displayStats.vendors.suspended === 0 && (
            <View
              className="flex-row items-center rounded-xl p-4"
              style={{
                backgroundColor: colors.success + '10',
                borderWidth: 1,
                borderColor: colors.success + '30',
              }}>
              <View
                className="mr-3 rounded-full p-2"
                style={{ backgroundColor: colors.success + '20' }}>
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  All Clear
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  No pending actions required
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Period Summary */}
      <View className="px-4 py-3">
        <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
          GROWTH
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
                <Text className="text-lg font-bold" style={{ color: colors.success }}>
                  +{displayStats.overview.newUsersThisWeek}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  New Users
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
                <Text className="text-lg font-bold" style={{ color: colors.success }}>
                  +{displayStats.overview.newUsersThisMonth}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  New Users
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Vendor Status Overview */}
      <View className="px-4 py-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
            VENDOR STATUS
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Vendors')}>
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row flex-wrap gap-3">
            {[
              { key: 'pending', label: 'Pending', color: '#f59e0b', value: displayStats.vendors.pending },
              { key: 'active', label: 'Active', color: '#10b981', value: displayStats.vendors.active },
              { key: 'suspended', label: 'Suspended', color: '#ef4444', value: displayStats.vendors.suspended },
              { key: 'rejected', label: 'Rejected', color: '#6b7280', value: displayStats.vendors.rejected },
            ].map((status) => (
              <TouchableOpacity
                key={status.key}
                onPress={() => navigation.navigate('Vendors', { filter: status.key })}
                className="flex-row items-center rounded-full px-3 py-2"
                style={{ backgroundColor: status.color + '15' }}>
                <View
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <Text className="text-sm font-medium" style={{ color: status.color }}>
                  {status.label}: {status.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* User Status Overview */}
      <View className="px-4 py-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
            USER DISTRIBUTION
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Users')}>
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row flex-wrap gap-3">
            {[
              { key: 'admin', label: 'Admins', color: '#8b5cf6', value: displayStats.users.byRole.admin },
              { key: 'vendor', label: 'Vendors', color: '#3b82f6', value: displayStats.users.byRole.vendor },
              { key: 'customer', label: 'Customers', color: '#10b981', value: displayStats.users.byRole.customer },
            ].map((role) => (
              <TouchableOpacity
                key={role.key}
                onPress={() => navigation.navigate('Users', { filter: role.key })}
                className="flex-row items-center rounded-full px-3 py-2"
                style={{ backgroundColor: role.color + '15' }}>
                <View
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <Text className="text-sm font-medium" style={{ color: role.color }}>
                  {role.label}: {role.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
