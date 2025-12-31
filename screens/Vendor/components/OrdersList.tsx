// screens/Vendor/components/OrdersList.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllOrders } from 'api/actions/orderActions';
import { fetchVans } from 'api/actions/vendorActions';
import {
  Order,
  OrdersApiResponse,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatPrice,
  formatShortDate,
  getStatusColor,
  getStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  isToday,
} from 'types/order.types';
import OrderCardSkeleton from './OrderCardSkeleton';

interface OrdersListProps {
  searchQuery: string;
  statusFilter: string | null;
  paymentFilter: string | null;
  vanFilter: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  onStatusFilterChange: (status: string | null) => void;
  onPaymentFilterChange: (status: string | null) => void;
  onVanFilterChange: (van: string | null) => void;
  onDateRangeChange: (from: Date | null, to: Date | null) => void;
  onViewOrder: (orderId: number) => void;
  onLongPressOrder: (orderId: number) => void;
  isSelectionMode: boolean;
  selectedOrders: Set<number>;
  onSelectAll: (orderIds: number[]) => void;
}

export default function OrdersList({
  searchQuery,
  statusFilter,
  paymentFilter,
  vanFilter,
  dateFrom,
  dateTo,
  onStatusFilterChange,
  onPaymentFilterChange,
  onVanFilterChange,
  onDateRangeChange,
  onViewOrder,
  onLongPressOrder,
  isSelectionMode,
  selectedOrders,
  onSelectAll,
}: OrdersListProps) {
  const { colors } = useThemeContext();
  const [showFilters, setShowFilters] = useState(false);
  const [showDateFrom, setShowDateFrom] = useState(false);
  const [showDateTo, setShowDateTo] = useState(false);

  // Fetch vans for filter
  const { data: vansData } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const vans: string[] = vansData?.data || [];

  // Format dates for API
  const dateFromStr = dateFrom?.toISOString().split('T')[0];
  const dateToStr = dateTo?.toISOString().split('T')[0];

  const { data, isLoading, error, refetch, isRefetching } = useQuery<OrdersApiResponse>({
    queryKey: [
      'orders',
      {
        status: statusFilter,
        paymentStatus: paymentFilter,
        vanName: vanFilter,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
      },
    ],
    queryFn: () =>
      fetchAllOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        vanName: vanFilter || undefined,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        limit: 100,
      }),
  });

  // Filter orders based on search
  const filteredOrders = useMemo(() => {
    if (!data?.data) return [];

    if (!searchQuery.trim()) return data.data;

    const query = searchQuery.toLowerCase().trim();
    return data.data.filter((order) => {
      const orderNumberMatch = order.orderNumber?.toLowerCase().includes(query);
      const customerMatch = order.customer?.businessName?.toLowerCase().includes(query);
      const contactMatch = order.customer?.contactPerson?.toLowerCase().includes(query);
      return orderNumberMatch || customerMatch || contactMatch;
    });
  }, [data, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!data?.data) return { total: 0, today: 0, pending: 0, totalAmount: 0 };
    const orders = data.data;
    return {
      total: orders.length,
      today: orders.filter((o) => isToday(o.orderDate)).length,
      pending: orders.filter((o) => o.status === 'pending').length,
      totalAmount: orders.reduce((sum, o) => sum + parseFloat((o.totalAmount as string) || '0'), 0),
    };
  }, [data]);

  // Active filters count
  const activeFiltersCount = [statusFilter, paymentFilter, vanFilter, dateFrom, dateTo].filter(
    Boolean
  ).length;

  // Date picker handlers
  const handleDateFromChange = (event: any, date?: Date) => {
    setShowDateFrom(false);
    if (date) {
      onDateRangeChange(date, dateTo);
    }
  };

  const handleDateToChange = (event: any, date?: Date) => {
    setShowDateTo(false);
    if (date) {
      onDateRangeChange(dateFrom, date);
    }
  };

  const clearDateFilter = () => {
    onDateRangeChange(null, null);
  };

  // Handle select all visible
  const handleSelectAllVisible = () => {
    const allIds = filteredOrders.map((o) => o.id);
    onSelectAll(allIds);
  };

  // Loading state
  if (isLoading) {
    return <OrderCardSkeleton count={5} />;
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
          Failed to load orders
        </Text>
        <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
          Please check your connection and try again
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 rounded-xl px-6 py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text className="font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Filter Toggle & Stats */}
      <View className="px-4 py-3">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              Orders
            </Text>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: colors.primary + '15' }}>
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                {stats.total}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Select All Button (in selection mode) */}
            {isSelectionMode && (
              <TouchableOpacity
                onPress={handleSelectAllVisible}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: colors.primary + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                  Select All ({filteredOrders.length})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{
                backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: activeFiltersCount > 0 ? colors.primary : colors.border,
              }}>
              <MaterialIcons
                name="filter-list"
                size={16}
                color={activeFiltersCount > 0 ? '#fff' : colors.text}
              />
              <Text
                className="ml-1 text-xs font-semibold"
                style={{ color: activeFiltersCount > 0 ? '#fff' : colors.text }}>
                Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: colors.card }}>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Today
            </Text>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {stats.today}
            </Text>
          </View>
          <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: colors.card }}>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Pending
            </Text>
            <Text className="text-lg font-bold" style={{ color: '#f59e0b' }}>
              {stats.pending}
            </Text>
          </View>
          <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: colors.card }}>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Value
            </Text>
            <Text className="text-lg font-bold" style={{ color: colors.primary }}>
              {formatPrice(stats.totalAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View className="px-4 pb-3">
          {/* Date Range Filter */}
          <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
            Date Range
          </Text>
          <View className="mb-3 flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowDateFrom(true)}
              className="flex-1 flex-row items-center rounded-lg px-3 py-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: dateFrom ? colors.primary : colors.border,
              }}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={dateFrom ? colors.primary : colors.muted}
              />
              <Text
                className="ml-2 text-sm"
                style={{ color: dateFrom ? colors.text : colors.placeholder }}>
                {dateFrom
                  ? dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'From'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDateTo(true)}
              className="flex-1 flex-row items-center rounded-lg px-3 py-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: dateTo ? colors.primary : colors.border,
              }}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={dateTo ? colors.primary : colors.muted}
              />
              <Text
                className="ml-2 text-sm"
                style={{ color: dateTo ? colors.text : colors.placeholder }}>
                {dateTo
                  ? dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'To'}
              </Text>
            </TouchableOpacity>
            {(dateFrom || dateTo) && (
              <TouchableOpacity
                onPress={clearDateFilter}
                className="items-center justify-center px-2">
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {/* Van Filter */}
          {vans.length > 0 && (
            <>
              <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
                Van
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => onVanFilterChange(null)}
                    className="rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor: !vanFilter ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: !vanFilter ? colors.primary : colors.border,
                    }}>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: !vanFilter ? '#fff' : colors.text }}>
                      All Vans
                    </Text>
                  </TouchableOpacity>
                  {vans.map((van) => (
                    <TouchableOpacity
                      key={van}
                      onPress={() => onVanFilterChange(vanFilter === van ? null : van)}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        backgroundColor: vanFilter === van ? colors.primary : colors.card,
                        borderWidth: 1,
                        borderColor: vanFilter === van ? colors.primary : colors.border,
                      }}>
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: vanFilter === van ? '#fff' : colors.text }}>
                        {van}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Order Status Filter */}
          <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
            Order Status
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => onStatusFilterChange(null)}
                className="rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: !statusFilter ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: !statusFilter ? colors.primary : colors.border,
                }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: !statusFilter ? '#fff' : colors.text }}>
                  All
                </Text>
              </TouchableOpacity>
              {ORDER_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() =>
                    onStatusFilterChange(statusFilter === status.value ? null : status.value)
                  }
                  className="rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: statusFilter === status.value ? status.color : colors.card,
                    borderWidth: 1,
                    borderColor: statusFilter === status.value ? status.color : colors.border,
                  }}>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: statusFilter === status.value ? '#fff' : colors.text }}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Payment Status Filter */}
          <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
            Payment Status
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => onPaymentFilterChange(null)}
                className="rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: !paymentFilter ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: !paymentFilter ? colors.primary : colors.border,
                }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: !paymentFilter ? '#fff' : colors.text }}>
                  All
                </Text>
              </TouchableOpacity>
              {PAYMENT_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() =>
                    onPaymentFilterChange(paymentFilter === status.value ? null : status.value)
                  }
                  className="rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: paymentFilter === status.value ? status.color : colors.card,
                    borderWidth: 1,
                    borderColor: paymentFilter === status.value ? status.color : colors.border,
                  }}>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: paymentFilter === status.value ? '#fff' : colors.text }}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              onPress={() => {
                onStatusFilterChange(null);
                onPaymentFilterChange(null);
                onVanFilterChange(null);
                onDateRangeChange(null, null);
              }}
              className="mt-3 self-start">
              <Text className="text-sm font-semibold" style={{ color: colors.error }}>
                Clear all filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Date Pickers */}
      {showDateFrom && (
        <DateTimePicker
          value={dateFrom || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateFromChange}
          maximumDate={dateTo || new Date()}
        />
      )}
      {showDateTo && (
        <DateTimePicker
          value={dateTo || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateToChange}
          minimumDate={dateFrom || undefined}
          maximumDate={new Date()}
        />
      )}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: isSelectionMode ? 120 : 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MaterialIcons name="receipt-long" size={72} color={colors.muted} />
            <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
              No orders found
            </Text>
            <Text className="mt-2 px-8 text-center text-sm" style={{ color: colors.muted }}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try different search or filters'
                : 'Create your first order to get started'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            colors={colors}
            onPress={() => onViewOrder(item.id)}
            onLongPress={() => onLongPressOrder(item.id)}
            isSelectionMode={isSelectionMode}
            isSelected={selectedOrders.has(item.id)}
          />
        )}
      />
    </View>
  );
}

// Order Card Component
interface OrderCardProps {
  order: Order;
  colors: any;
  onPress: () => void;
  onLongPress: () => void;
  isSelectionMode: boolean;
  isSelected: boolean;
}

function OrderCard({
  order,
  colors,
  onPress,
  onLongPress,
  isSelectionMode,
  isSelected,
}: OrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const paymentColor = getPaymentStatusColor(order.paymentStatus);
  const itemCount = order.items?.length || 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      className="mb-3 flex-row rounded-2xl p-4"
      style={{
        backgroundColor: isSelected ? colors.primary + '15' : colors.card,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.primary : colors.border,
      }}>
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <View className="mr-3 justify-center">
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{
              backgroundColor: isSelected ? colors.primary : colors.background,
              borderWidth: isSelected ? 0 : 2,
              borderColor: colors.border,
            }}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>
      )}

      <View className="flex-1">
        {/* Header: Order Number + Status */}
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold" style={{ color: colors.primary }}>
              {order.orderNumber}
            </Text>
            {isToday(order.orderDate) && (
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.success + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                  Today
                </Text>
              </View>
            )}
          </View>
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: statusColor + '20' }}>
            <Text className="text-xs font-bold" style={{ color: statusColor }}>
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View className="mb-3 flex-row items-center">
          <View
            className="mr-2.5 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary + '15' }}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
              numberOfLines={1}>
              {order.customer?.businessName || 'Unknown Customer'}
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              {order.customer?.contactPerson}
            </Text>
          </View>
        </View>

        {/* Order Details Row */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <MaterialIcons name="event" size={14} color={colors.muted} />
              <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                {formatShortDate(order.orderDate)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="shopping-basket" size={14} color={colors.muted} />
              <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                {itemCount} items
              </Text>
            </View>
            {order.vanName && (
              <View className="flex-row items-center">
                <MaterialIcons name="local-shipping" size={14} color={colors.muted} />
                <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                  {order.vanName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer: Payment + Total */}
        <View
          className="flex-row items-center justify-between border-t pt-3"
          style={{ borderColor: colors.border }}>
          <View className="flex-row items-center gap-2">
            <View className="rounded-md px-2 py-1" style={{ backgroundColor: paymentColor + '15' }}>
              <Text className="text-xs font-semibold" style={{ color: paymentColor }}>
                {getPaymentStatusLabel(order.paymentStatus)}
              </Text>
            </View>
            {order.paymentStatus !== 'paid' && parseFloat(order.balanceAmount as string) > 0 && (
              <Text className="text-xs" style={{ color: colors.muted }}>
                Due: {formatPrice(order.balanceAmount)}
              </Text>
            )}
          </View>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {formatPrice(order.totalAmount)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
