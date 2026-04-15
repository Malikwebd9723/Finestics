// screens/Vendor/components/OrdersList.tsx
import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
  Modal,
  Animated,
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
  SORT_OPTIONS,
  SortField,
  SortOrder,
  DateFilterField,
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
  onViewCustomerOrders?: () => void;
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
  const [showSummary, setShowSummary] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<'status' | 'payment' | 'van' | 'dateRange' | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Sorting state
  const [sortBy, setSortBy] = useState<SortField>('orderDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Date filter field
  const [dateFilterField, setDateFilterField] = useState<DateFilterField>('orderDate');

  // Quick date navigation
  const [quickDate, setQuickDate] = useState<Date>(new Date());
  const [showQuickDatePicker, setShowQuickDatePicker] = useState(false);

  // Filter menu animation
  const openFilterMenu = (type: 'status' | 'payment' | 'van' | 'dateRange') => {
    setActiveFilterType(type);
    setFilterMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeFilterMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setFilterMenuVisible(false);
      setActiveFilterType(null);
    });
  };

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
        dateFilterField,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      fetchAllOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        vanName: vanFilter || undefined,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        dateFilterField,
        sortBy,
        sortOrder,
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

  // Enhanced Stats
  const stats = useMemo(() => {
    if (!data?.data) {
      return {
        total: 0,
        today: 0,
        pending: 0,
        confirmed: 0,
        collected: 0,
        delivered: 0,
        completed: 0,
        cancelled: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        unpaidOrders: 0,
        partialOrders: 0,
        paidOrders: 0,
      };
    }
    const orders = data.data;

    // Exclude cancelled for financial calculations
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');

    return {
      total: orders.length,
      today: orders.filter((o) => isToday(o.orderDate)).length,
      // Status counts (include all)
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      collected: orders.filter((o) => o.status === 'collected').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      // Financial stats (exclude cancelled)
      totalAmount: activeOrders.reduce(
        (sum, o) => sum + parseFloat((o.totalAmount as string) || '0'),
        0
      ),
      paidAmount: activeOrders.reduce(
        (sum, o) => sum + parseFloat((o.paidAmount as string) || '0'),
        0
      ),
      balanceAmount: activeOrders.reduce(
        (sum, o) => sum + parseFloat((o.balanceAmount as string) || '0'),
        0
      ),
      // Payment status counts (exclude cancelled)
      unpaidOrders: activeOrders.filter((o) => o.paymentStatus === 'unpaid').length,
      partialOrders: activeOrders.filter((o) => o.paymentStatus === 'partial').length,
      paidOrders: activeOrders.filter((o) => o.paymentStatus === 'paid').length,
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

  // Quick date navigation handlers
  const handleQuickDateChange = (event: any, date?: Date) => {
    setShowQuickDatePicker(false);
    if (date) {
      setQuickDate(date);
      onDateRangeChange(date, date);
    }
  };

  const navigateQuickDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(quickDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setQuickDate(newDate);
    onDateRangeChange(newDate, newDate);
  };

  const setToday = () => {
    const today = new Date();
    setQuickDate(today);
    onDateRangeChange(today, today);
  };

  const clearQuickDate = () => {
    onDateRangeChange(null, null);
  };

  const formatQuickDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Handle select all visible
  const handleSelectAllVisible = () => {
    const allIds = filteredOrders.map((o) => o.id);
    onSelectAll(allIds);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
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

  // Header Component - Now scrolls with the list
  const ListHeader = () => (
    <View>
      {/* Quick Date Navigation */}
      <View
        className="flex-row items-center justify-between px-4 py-2"
        style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
        <TouchableOpacity
          onPress={() => navigateQuickDate('prev')}
          className="rounded-full p-2"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowQuickDatePicker(true)}
          className="flex-row items-center rounded-lg px-4 py-2"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text className="mx-2 font-semibold" style={{ color: colors.text }}>
            {dateFrom && dateTo && dateFrom.toDateString() === dateTo.toDateString()
              ? formatQuickDate(dateFrom)
              : 'All Dates'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateQuickDate('next')}
          className="rounded-full p-2"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* Today & Clear buttons */}
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={setToday}
            className="rounded-lg px-3 py-2"
            style={{
              backgroundColor: isToday(quickDate.toISOString())
                ? colors.primary
                : colors.background,
            }}>
            <Text
              className="text-xs font-semibold"
              style={{ color: isToday(quickDate.toISOString()) ? '#fff' : colors.text }}>
              Today
            </Text>
          </TouchableOpacity>
          {(dateFrom || dateTo) && (
            <TouchableOpacity
              onPress={clearQuickDate}
              className="items-center justify-center rounded-lg px-2"
              style={{ backgroundColor: colors.background }}>
              <Ionicons name="close" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Filter Chips - Show below date selection */}
      {activeFiltersCount > 0 && (
        <View className="px-4 py-2" style={{ backgroundColor: colors.background }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-2">
              {statusFilter && (
                <TouchableOpacity
                  onPress={() => onStatusFilterChange(null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: ORDER_STATUSES.find(s => s.value === statusFilter)?.color + '20',
                    borderWidth: 1,
                    borderColor: ORDER_STATUSES.find(s => s.value === statusFilter)?.color,
                  }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: ORDER_STATUSES.find(s => s.value === statusFilter)?.color }}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: ORDER_STATUSES.find(s => s.value === statusFilter)?.color }}>
                    {ORDER_STATUSES.find(s => s.value === statusFilter)?.label}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={ORDER_STATUSES.find(s => s.value === statusFilter)?.color}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {paymentFilter && (
                <TouchableOpacity
                  onPress={() => onPaymentFilterChange(null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color + '20',
                    borderWidth: 1,
                    borderColor: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color,
                  }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color }}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color }}>
                    {PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.label}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {vanFilter && (
                <TouchableOpacity
                  onPress={() => onVanFilterChange(null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: colors.primary + '20',
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}>
                  <Ionicons name="car" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {vanFilter}
                  </Text>
                  <Ionicons name="close" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
              {(dateFrom || dateTo) && !(dateFrom && dateTo && dateFrom.toDateString() === dateTo.toDateString()) && (
                <TouchableOpacity
                  onPress={clearDateFilter}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: colors.primary + '20',
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}>
                  <Ionicons name="calendar" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {dateFrom ? dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'} - {dateTo ? dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'}
                  </Text>
                  <Ionicons name="close" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
              {/* Clear All */}
              <TouchableOpacity
                onPress={() => {
                  onStatusFilterChange(null);
                  onPaymentFilterChange(null);
                  onVanFilterChange(null);
                  onDateRangeChange(null, null);
                }}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: colors.error + '15' }}>
                <Text className="text-xs font-semibold" style={{ color: colors.error }}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Controls Row */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            {stats.total} orders
          </Text>
          {stats.pending > 0 && (
            <Text className="text-xs" style={{ color: '#f59e0b' }}>
              {stats.pending} pending
            </Text>
          )}
          {isSelectionMode && (
            <TouchableOpacity
              onPress={handleSelectAllVisible}
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: colors.primary + '20' }}>
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                Select All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {/* Sort Button */}
          <TouchableOpacity
            onPress={() => setShowSortOptions(!showSortOptions)}
            className="flex-row items-center rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialIcons
              name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
              size={14}
              color={colors.text}
            />
            <Text className="ml-1 text-xs" style={{ color: colors.text }}>
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort'}
            </Text>
          </TouchableOpacity>

          {/* Filters Button */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center rounded-lg px-2.5 py-1.5"
            style={{
              backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: activeFiltersCount > 0 ? colors.primary : colors.border,
            }}>
            <MaterialIcons
              name="tune"
              size={16}
              color={activeFiltersCount > 0 ? '#fff' : colors.text}
            />
            {activeFiltersCount > 0 && (
              <Text className="ml-1 text-xs font-bold" style={{ color: '#fff' }}>
                {activeFiltersCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Stats Toggle */}
          <TouchableOpacity
            onPress={() => setShowSummary(!showSummary)}
            className="rounded-lg px-2.5 py-1.5"
            style={{
              backgroundColor: showSummary ? colors.primary + '15' : colors.card,
              borderWidth: 1,
              borderColor: showSummary ? colors.primary : colors.border,
            }}>
            <Ionicons
              name="stats-chart"
              size={16}
              color={showSummary ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Options Dropdown */}
      {showSortOptions && (
        <View
          className="mx-4 mb-2 rounded-xl p-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold" style={{ color: colors.muted }}>
              SORT BY
            </Text>
            <View className="flex-row items-center gap-2">
              {/* Date Filter Type Toggle */}
              <TouchableOpacity
                onPress={() => setDateFilterField(dateFilterField === 'orderDate' ? 'deliveryDate' : 'orderDate')}
                className="flex-row items-center rounded-lg px-2 py-1"
                style={{ backgroundColor: colors.background }}>
                <Text className="text-xs" style={{ color: colors.primary }}>
                  By {dateFilterField === 'orderDate' ? 'Order' : 'Delivery'} Date
                </Text>
                <Ionicons name="swap-horizontal" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleSortOrder}
                className="flex-row items-center rounded-lg px-2 py-1"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons
                  name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
                  size={14}
                  color={colors.primary}
                />
                <Text className="ml-1 text-xs" style={{ color: colors.primary }}>
                  {sortOrder === 'DESC' ? 'Newest' : 'Oldest'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortOptions(false);
                  }}
                  className="rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: sortBy === option.value ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: sortBy === option.value ? colors.primary : colors.border,
                  }}>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: sortBy === option.value ? '#fff' : colors.text }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Stats Panel - Compact */}
      {showSummary && (
        <View className="mx-4 mb-2 rounded-xl overflow-hidden"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* Financial Row */}
          <View className="flex-row">
            <View className="flex-1 border-r p-2.5" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>Value</Text>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {formatPrice(stats.totalAmount)}
              </Text>
            </View>
            <View className="flex-1 border-r p-2.5" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>Collected</Text>
              <Text className="text-sm font-bold" style={{ color: colors.success }}>
                {formatPrice(stats.paidAmount)}
              </Text>
            </View>
            <View className="flex-1 p-2.5">
              <Text className="text-xs" style={{ color: colors.muted }}>Outstanding</Text>
              <Text className="text-sm font-bold" style={{ color: colors.error }}>
                {formatPrice(stats.balanceAmount)}
              </Text>
            </View>
          </View>
          {/* Status Chips */}
          <View className="border-t px-2.5 py-2" style={{ borderColor: colors.border }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                {ORDER_STATUSES.map((status) => {
                  const count = stats[status.value as keyof typeof stats] || 0;
                  if (!count) return null;
                  return (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => {
                        onStatusFilterChange(statusFilter === status.value ? null : status.value);
                      }}
                      className="flex-row items-center rounded-full px-2 py-0.5"
                      style={{ backgroundColor: status.color + '15' }}>
                      <View className="mr-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <Text className="text-xs" style={{ color: status.color }}>
                        {status.label} {count as number}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Filters Menu - Cleaner dropdown style */}
      {showFilters && (
        <View
          className="mx-4 mb-3 rounded-xl overflow-hidden"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* Date Range - From */}
          <View className="flex-row items-center border-b" style={{ borderColor: colors.border }}>
            <TouchableOpacity
              onPress={() => setShowDateFrom(true)}
              className="flex-1 flex-row items-center justify-between px-4 py-3 border-r"
              style={{ borderColor: colors.border }}>
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color={dateFrom ? colors.primary : colors.muted} />
                <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
                  From
                </Text>
              </View>
              <Text className="text-sm" style={{ color: dateFrom ? colors.primary : colors.muted }}>
                {dateFrom ? dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Any'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDateTo(true)}
              className="flex-1 flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color={dateTo ? colors.primary : colors.muted} />
                <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
                  To
                </Text>
              </View>
              <Text className="text-sm" style={{ color: dateTo ? colors.primary : colors.muted }}>
                {dateTo ? dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Any'}
              </Text>
            </TouchableOpacity>
            {(dateFrom || dateTo) && (
              <TouchableOpacity onPress={clearDateFilter} className="pr-3">
                <Ionicons name="close-circle" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {/* Order Status */}
          <TouchableOpacity
            onPress={() => openFilterMenu('status')}
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: colors.border }}>
            <View className="flex-row items-center">
              <Ionicons name="flag-outline" size={18} color={statusFilter ? colors.primary : colors.muted} />
              <Text className="ml-3 text-sm font-medium" style={{ color: colors.text }}>
                Order Status
              </Text>
            </View>
            <View className="flex-row items-center">
              {statusFilter ? (
                <>
                  <View
                    className="flex-row items-center rounded-full px-2 py-0.5"
                    style={{ backgroundColor: ORDER_STATUSES.find(s => s.value === statusFilter)?.color + '20' }}>
                    <View
                      className="mr-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: ORDER_STATUSES.find(s => s.value === statusFilter)?.color }}
                    />
                    <Text className="text-xs font-medium" style={{ color: ORDER_STATUSES.find(s => s.value === statusFilter)?.color }}>
                      {ORDER_STATUSES.find(s => s.value === statusFilter)?.label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onStatusFilterChange(null)} className="ml-2">
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text className="text-sm" style={{ color: colors.muted }}>All</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 4 }} />
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Payment Status */}
          <TouchableOpacity
            onPress={() => openFilterMenu('payment')}
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: colors.border }}>
            <View className="flex-row items-center">
              <Ionicons name="wallet-outline" size={18} color={paymentFilter ? colors.primary : colors.muted} />
              <Text className="ml-3 text-sm font-medium" style={{ color: colors.text }}>
                Payment Status
              </Text>
            </View>
            <View className="flex-row items-center">
              {paymentFilter ? (
                <>
                  <View
                    className="flex-row items-center rounded-full px-2 py-0.5"
                    style={{ backgroundColor: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color + '20' }}>
                    <View
                      className="mr-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color }}
                    />
                    <Text className="text-xs font-medium" style={{ color: PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.color }}>
                      {PAYMENT_STATUSES.find(s => s.value === paymentFilter)?.label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onPaymentFilterChange(null)} className="ml-2">
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text className="text-sm" style={{ color: colors.muted }}>All</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 4 }} />
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Van Filter */}
          {vans.length > 0 && (
            <TouchableOpacity
              onPress={() => openFilterMenu('van')}
              className="flex-row items-center justify-between px-4 py-3"
              style={{ borderColor: colors.border }}>
              <View className="flex-row items-center">
                <Ionicons name="car-outline" size={18} color={vanFilter ? colors.primary : colors.muted} />
                <Text className="ml-3 text-sm font-medium" style={{ color: colors.text }}>
                  Van
                </Text>
              </View>
              <View className="flex-row items-center">
                {vanFilter ? (
                  <>
                    <Text className="text-sm" style={{ color: colors.primary }}>{vanFilter}</Text>
                    <TouchableOpacity onPress={() => onVanFilterChange(null)} className="ml-2">
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text className="text-sm" style={{ color: colors.muted }}>All Vans</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 4 }} />
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1">
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
      {showQuickDatePicker && (
        <DateTimePicker
          value={quickDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleQuickDateChange}
        />
      )}

      {/* Orders List - Header now scrolls with content */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
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
          <View className="items-center justify-center px-4 py-20">
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
          <View className="px-4">
            <OrderCard
              order={item}
              colors={colors}
              onPress={() => onViewOrder(item.id)}
              onLongPress={() => onLongPressOrder(item.id)}
              isSelectionMode={isSelectionMode}
              isSelected={selectedOrders.has(item.id)}
            />
          </View>
        )}
      />

      {/* Filter Selection Modal */}
      <Modal
        visible={filterMenuVisible}
        transparent
        animationType="none"
        onRequestClose={closeFilterMenu}>
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={closeFilterMenu}>
          <Animated.View
            style={{
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            }}>
            <Pressable
              className="rounded-t-3xl px-4 pb-8 pt-4"
              style={{ backgroundColor: colors.card }}
              onPress={(e) => e.stopPropagation()}>
              {/* Handle bar */}
              <View className="mb-4 self-center h-1 w-12 rounded-full" style={{ backgroundColor: colors.border }} />

              {/* Modal Title */}
              <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>
                {activeFilterType === 'status' && 'Order Status'}
                {activeFilterType === 'payment' && 'Payment Status'}
                {activeFilterType === 'van' && 'Select Van'}
              </Text>

              {/* Status Options */}
              {activeFilterType === 'status' && (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      onStatusFilterChange(null);
                      closeFilterMenu();
                    }}
                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: !statusFilter ? colors.primary + '15' : colors.background,
                      borderWidth: !statusFilter ? 1 : 0,
                      borderColor: colors.primary,
                    }}>
                    <Text className="text-sm font-medium" style={{ color: !statusFilter ? colors.primary : colors.text }}>
                      All Statuses
                    </Text>
                    {!statusFilter && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  {ORDER_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => {
                        onStatusFilterChange(status.value);
                        closeFilterMenu();
                      }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: statusFilter === status.value ? status.color + '15' : colors.background,
                        borderWidth: statusFilter === status.value ? 1 : 0,
                        borderColor: status.color,
                      }}>
                      <View className="flex-row items-center">
                        <View
                          className="mr-3 h-3 w-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <Text
                          className="text-sm font-medium"
                          style={{ color: statusFilter === status.value ? status.color : colors.text }}>
                          {status.label}
                        </Text>
                      </View>
                      {statusFilter === status.value && <Ionicons name="checkmark" size={20} color={status.color} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Payment Options */}
              {activeFilterType === 'payment' && (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      onPaymentFilterChange(null);
                      closeFilterMenu();
                    }}
                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: !paymentFilter ? colors.primary + '15' : colors.background,
                      borderWidth: !paymentFilter ? 1 : 0,
                      borderColor: colors.primary,
                    }}>
                    <Text className="text-sm font-medium" style={{ color: !paymentFilter ? colors.primary : colors.text }}>
                      All Payment Statuses
                    </Text>
                    {!paymentFilter && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  {PAYMENT_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => {
                        onPaymentFilterChange(status.value);
                        closeFilterMenu();
                      }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: paymentFilter === status.value ? status.color + '15' : colors.background,
                        borderWidth: paymentFilter === status.value ? 1 : 0,
                        borderColor: status.color,
                      }}>
                      <View className="flex-row items-center">
                        <View
                          className="mr-3 h-3 w-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <Text
                          className="text-sm font-medium"
                          style={{ color: paymentFilter === status.value ? status.color : colors.text }}>
                          {status.label}
                        </Text>
                      </View>
                      {paymentFilter === status.value && <Ionicons name="checkmark" size={20} color={status.color} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Van Options */}
              {activeFilterType === 'van' && (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      onVanFilterChange(null);
                      closeFilterMenu();
                    }}
                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: !vanFilter ? colors.primary + '15' : colors.background,
                      borderWidth: !vanFilter ? 1 : 0,
                      borderColor: colors.primary,
                    }}>
                    <View className="flex-row items-center">
                      <Ionicons name="car" size={18} color={!vanFilter ? colors.primary : colors.muted} style={{ marginRight: 12 }} />
                      <Text className="text-sm font-medium" style={{ color: !vanFilter ? colors.primary : colors.text }}>
                        All Vans
                      </Text>
                    </View>
                    {!vanFilter && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  {vans.map((van) => (
                    <TouchableOpacity
                      key={van}
                      onPress={() => {
                        onVanFilterChange(van);
                        closeFilterMenu();
                      }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: vanFilter === van ? colors.primary + '15' : colors.background,
                        borderWidth: vanFilter === van ? 1 : 0,
                        borderColor: colors.primary,
                      }}>
                      <View className="flex-row items-center">
                        <Ionicons name="car" size={18} color={vanFilter === van ? colors.primary : colors.muted} style={{ marginRight: 12 }} />
                        <Text
                          className="text-sm font-medium"
                          style={{ color: vanFilter === van ? colors.primary : colors.text }}>
                          {van}
                        </Text>
                      </View>
                      {vanFilter === van && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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

  // count items
  // const itemCount = order.items?.length || 0;

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
        <View className="mb-2 flex-row items-center">
          <View className="flex-1">
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.text }}
              numberOfLines={1}>
              {order.customer?.businessName || 'Unknown Customer'}
            </Text>
            {order.customer?.contactPerson && (
              <Text className="text-xs" style={{ color: colors.muted }}>
                {order.customer.contactPerson}
              </Text>
            )}
          </View>
        </View>

        {/* Order Details Row */}
        <View className="mb-3 flex-row items-center flex-wrap gap-3">
          {/* Order Date */}
          <View className="flex-row items-center">
            <Ionicons name="cart-outline" size={14} color={colors.muted} />
            <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
              Order: {formatShortDate(order.orderDate)}
            </Text>
          </View>
          {/* Delivery Date */}
          {order.deliveryDate && (
            <View className="flex-row items-center">
              <Ionicons name="car-outline" size={14} color={colors.primary} />
              <Text className="ml-1 text-xs font-medium" style={{ color: colors.primary }}>
                Delivery: {formatShortDate(order.deliveryDate)}
              </Text>
            </View>
          )}
          {/* Van */}
          {order.vanName && (
            <View className="flex-row items-center">
              <MaterialIcons name="local-shipping" size={14} color={colors.muted} />
              <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                {order.vanName}
              </Text>
            </View>
          )}
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
          <View className="items-end">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {formatPrice(order.totalAmount)}
            </Text>
            {order.items && order.items.length > 0 && (() => {
              const cost = order.items!.reduce((sum, item) => {
                const qty = parseFloat(String(item.deliveredQuantity)) || parseFloat(String(item.orderedQuantity)) || 0;
                const ret = parseFloat(String(item.returnedQuantity)) || 0;
                return sum + Math.max(0, qty - ret) * (parseFloat(String(item.buyingPrice)) || 0);
              }, 0);
              const profit = (parseFloat(String(order.subtotal)) || 0) - cost;
              return profit !== 0 ? (
                <Text className="text-xs font-medium" style={{ color: profit >= 0 ? colors.success : colors.error }}>
                  P: {formatPrice(profit)}
                </Text>
              ) : null;
            })()}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
