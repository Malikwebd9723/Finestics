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

  // Sorting state
  const [sortBy, setSortBy] = useState<SortField>('orderDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Date filter field
  const [dateFilterField, setDateFilterField] = useState<DateFilterField>('orderDate');

  // Quick date navigation
  const [quickDate, setQuickDate] = useState<Date>(new Date());
  const [showQuickDatePicker, setShowQuickDatePicker] = useState(false);

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
    return {
      total: orders.length,
      today: orders.filter((o) => isToday(o.orderDate)).length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      collected: orders.filter((o) => o.status === 'collected').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      totalAmount: orders.reduce((sum, o) => sum + parseFloat((o.totalAmount as string) || '0'), 0),
      paidAmount: orders.reduce((sum, o) => sum + parseFloat((o.paidAmount as string) || '0'), 0),
      balanceAmount: orders.reduce(
        (sum, o) => sum + parseFloat((o.balanceAmount as string) || '0'),
        0
      ),
      unpaidOrders: orders.filter((o) => o.paymentStatus === 'unpaid').length,
      partialOrders: orders.filter((o) => o.paymentStatus === 'partial').length,
      paidOrders: orders.filter((o) => o.paymentStatus === 'paid').length,
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

      {/* Filter Toggle, Sort & Stats */}
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

            {/* Sort Button */}
            <TouchableOpacity
              onPress={() => setShowSortOptions(!showSortOptions)}
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <MaterialIcons
                name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
                size={14}
                color={colors.text}
              />
              <Text className="ml-1 text-xs font-semibold" style={{ color: colors.text }}>
                {SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort'}
              </Text>
            </TouchableOpacity>

            {/* Filters Button */}
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

        {/* Sort Options Dropdown */}
        {showSortOptions && (
          <View
            className="mb-3 rounded-xl p-3"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-semibold" style={{ color: colors.muted }}>
                SORT BY
              </Text>
              <TouchableOpacity
                onPress={toggleSortOrder}
                className="flex-row items-center rounded-lg px-2 py-1"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons
                  name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
                  size={14}
                  color={colors.primary}
                />
                <Text className="ml-1 text-xs font-medium" style={{ color: colors.primary }}>
                  {sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}
                </Text>
              </TouchableOpacity>
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

        {/* Quick Stats - Expandable */}
        <TouchableOpacity
          onPress={() => setShowSummary(!showSummary)}
          activeOpacity={0.8}
          className="rounded-xl"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* Main Stats Row */}
          <View className="flex-row">
            <View className="flex-1 border-r p-3" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Today
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {stats.today}
              </Text>
            </View>
            <View className="flex-1 border-r p-3" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Pending
              </Text>
              <Text className="text-lg font-bold" style={{ color: '#f59e0b' }}>
                {stats.pending}
              </Text>
            </View>
            <View className="flex-1 p-3">
              <Text className="text-xs" style={{ color: colors.muted }}>
                Value
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                {formatPrice(stats.totalAmount)}
              </Text>
            </View>
          </View>

          {/* Expand Indicator */}
          <View
            className="flex-row items-center justify-center border-t py-1"
            style={{ borderColor: colors.border }}>
            <Text className="mr-1 text-xs" style={{ color: colors.muted }}>
              {showSummary ? 'Less' : 'More details'}
            </Text>
            <Ionicons
              name={showSummary ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.muted}
            />
          </View>

          {/* Expanded Stats */}
          {showSummary && (
            <View className="border-t p-3" style={{ borderColor: colors.border }}>
              {/* Status Breakdown */}
              <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
                ORDER STATUS
              </Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <View
                    key={status.value}
                    className="flex-row items-center rounded-full px-2.5 py-1"
                    style={{ backgroundColor: status.color + '15' }}>
                    <View
                      className="mr-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <Text className="text-xs font-medium" style={{ color: status.color }}>
                      {status.label}: {stats[status.value as keyof typeof stats] || 0}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Payment Breakdown */}
              <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
                PAYMENT STATUS
              </Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                <View
                  className="flex-row items-center rounded-full px-2.5 py-1"
                  style={{ backgroundColor: '#ef4444' + '15' }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#ef4444' }}
                  />
                  <Text className="text-xs font-medium" style={{ color: '#ef4444' }}>
                    Unpaid: {stats.unpaidOrders}
                  </Text>
                </View>
                <View
                  className="flex-row items-center rounded-full px-2.5 py-1"
                  style={{ backgroundColor: '#f59e0b' + '15' }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#f59e0b' }}
                  />
                  <Text className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                    Partial: {stats.partialOrders}
                  </Text>
                </View>
                <View
                  className="flex-row items-center rounded-full px-2.5 py-1"
                  style={{ backgroundColor: '#10b981' + '15' }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#10b981' }}
                  />
                  <Text className="text-xs font-medium" style={{ color: '#10b981' }}>
                    Paid: {stats.paidOrders}
                  </Text>
                </View>
              </View>

              {/* Financial Summary */}
              <Text className="mb-2 text-xs font-semibold" style={{ color: colors.muted }}>
                FINANCIAL SUMMARY
              </Text>
              <View className="flex-row gap-2">
                <View
                  className="flex-1 rounded-lg p-2"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Total Value
                  </Text>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {formatPrice(stats.totalAmount)}
                  </Text>
                </View>
                <View
                  className="flex-1 rounded-lg p-2"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Collected
                  </Text>
                  <Text className="font-bold" style={{ color: colors.success }}>
                    {formatPrice(stats.paidAmount)}
                  </Text>
                </View>
                <View
                  className="flex-1 rounded-lg p-2"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Outstanding
                  </Text>
                  <Text className="font-bold" style={{ color: colors.error }}>
                    {formatPrice(stats.balanceAmount)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View className="px-4 pb-3">
          {/* Date Filter Field Toggle */}
          <View className="mb-3 flex-row items-center gap-2">
            <Text className="text-xs font-semibold" style={{ color: colors.muted }}>
              Filter by:
            </Text>
            <TouchableOpacity
              onPress={() => setDateFilterField('orderDate')}
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: dateFilterField === 'orderDate' ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: dateFilterField === 'orderDate' ? colors.primary : colors.border,
              }}>
              <Text
                className="text-xs font-medium"
                style={{ color: dateFilterField === 'orderDate' ? '#fff' : colors.text }}>
                Order Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDateFilterField('deliveryDate')}
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: dateFilterField === 'deliveryDate' ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: dateFilterField === 'deliveryDate' ? colors.primary : colors.border,
              }}>
              <Text
                className="text-xs font-medium"
                style={{ color: dateFilterField === 'deliveryDate' ? '#fff' : colors.text }}>
                Delivery Date
              </Text>
            </TouchableOpacity>
          </View>

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
            {/* <View className="flex-row items-center">
              <MaterialIcons name="shopping-basket" size={14} color={colors.muted} />
              <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </Text>
            </View> */}
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
