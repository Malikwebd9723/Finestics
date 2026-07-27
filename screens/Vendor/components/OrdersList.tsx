// screens/Vendor/components/OrdersList.tsx
// The vendor order-book list and its header controls: date scoping chips,
// active-filter chips, sort/filter/stats controls and the order cards.
// Every filter/sort preference is owned by OrdersScreen (so it can be
// persisted per vendor) — this component renders controls and reports changes.
// Date pickers always go through DatePickerSheet: the old inline iOS spinner
// had no dismiss affordance and could get stuck on screen.
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllOrders } from 'api/actions/orderActions';
import { fetchVans } from 'api/actions/vendorActions';
import {
  Order,
  OrderStatus,
  OrdersApiResponse,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PaymentStatus,
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
import { toneColor, toneTint } from 'utils/statusTones';
import { typo } from 'constants/design';
import { Button, EmptyState, DatePickerSheet } from 'components/ui';
import OrderCardSkeleton from './OrderCardSkeleton';

export type DateScope = 'today' | 'tomorrow' | 'all' | 'custom';

type SheetView = 'menu' | 'sort' | 'status' | 'payment' | 'van';

interface OrdersListProps {
  searchQuery: string;
  statusFilter: string | null;
  paymentFilter: string | null;
  vanFilter: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  dateScope: DateScope;
  customDate: Date | null;
  sortBy: SortField;
  sortOrder: SortOrder;
  dateFilterField: DateFilterField;
  showSummary: boolean;
  onStatusFilterChange: (status: string | null) => void;
  onPaymentFilterChange: (status: string | null) => void;
  onVanFilterChange: (van: string | null) => void;
  onDateRangeChange: (from: Date | null, to: Date | null) => void;
  onDateScopeChange: (scope: DateScope, customDate?: Date | null) => void;
  onStepDay: (dir: 1 | -1) => void;
  onSortChange: (field: SortField, order: SortOrder) => void;
  onDateFilterFieldChange: (field: DateFilterField) => void;
  onToggleSummary: () => void;
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
  dateScope,
  customDate,
  sortBy,
  sortOrder,
  dateFilterField,
  showSummary,
  onStatusFilterChange,
  onPaymentFilterChange,
  onVanFilterChange,
  onDateRangeChange,
  onDateScopeChange,
  onStepDay,
  onSortChange,
  onDateFilterFieldChange,
  onToggleSummary,
  onViewOrder,
  onLongPressOrder,
  isSelectionMode,
  selectedOrders,
  onSelectAll,
}: OrdersListProps) {
  const { colors } = useThemeContext();
  const [showDateFrom, setShowDateFrom] = useState(false);
  const [showDateTo, setShowDateTo] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>('menu');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const openSheet = (view: SheetView) => {
    setSheetView(view);
    setSheetVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSheet = (after?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setSheetView('menu');
      // iOS can't present a modal while another is still dismissing — give the
      // native dismissal a beat before opening a follow-up date picker.
      if (after) setTimeout(after, 300);
    });
  };

  // Fetch vans for filter
  const { data: vansData } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const vans: string[] = useMemo(() => vansData?.data || [], [vansData]);

  // A persisted van filter can outlive the van itself — drop it silently.
  useEffect(() => {
    if (!vansData) return;
    if (vanFilter && !vans.includes(vanFilter)) onVanFilterChange(null);
  }, [vansData, vans, vanFilter, onVanFilterChange]);

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
        status: (statusFilter as OrderStatus) || undefined,
        paymentStatus: (paymentFilter as PaymentStatus) || undefined,
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

  // A single-day window driven by the chips is not "a filter"; only a real
  // from/to range (set in the sheet) counts toward the badge.
  const sameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.toDateString() === b.toDateString();
  const chipDateActive = dateScope !== 'all' && sameDay(dateFrom, dateTo);
  const rangeActive = !!(dateFrom || dateTo) && !chipDateActive;
  const activeFiltersCount =
    [statusFilter, paymentFilter, vanFilter].filter(Boolean).length + (rangeActive ? 1 : 0);

  const clearAllFilters = () => {
    onStatusFilterChange(null);
    onPaymentFilterChange(null);
    onVanFilterChange(null);
    onDateScopeChange('all');
  };

  // Handle select all visible
  const handleSelectAllVisible = () => {
    const allIds = filteredOrders.map((o) => o.id);
    onSelectAll(allIds);
  };

  const fmtChipDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // Loading state
  if (isLoading) {
    return <OrderCardSkeleton count={5} />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Couldn't load orders"
        subtitle="Check your connection and try again."
        action={<Button title="Retry" icon="refresh" onPress={() => refetch()} />}
      />
    );
  }

  const dateChip = (label: string, selected: boolean, onPress: () => void, icon?: string) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center rounded-full px-3 py-1.5"
      style={{
        backgroundColor: selected ? colors.cta : colors.background,
        borderWidth: 1,
        borderColor: selected ? colors.cta : colors.border,
      }}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon as any}
          size={13}
          color={selected ? colors.onCta : colors.text}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text
        className="text-xs font-semibold"
        style={{ color: selected ? colors.onCta : colors.text }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const listHeader = (
    <View>
      {/* Date scope: one row of chips replaces the old dropdown + wheel */}
      <View
        className="flex-row items-center px-4 py-2"
        style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
        <View className="flex-1 flex-row items-center gap-2">
          {dateChip('Today', dateScope === 'today', () => onDateScopeChange('today'))}
          {dateChip('Tomorrow', dateScope === 'tomorrow', () => onDateScopeChange('tomorrow'))}
          {dateChip(
            dateScope === 'custom' && customDate ? fmtChipDate(customDate) : 'Pick',
            dateScope === 'custom',
            () => setShowCustomPicker(true),
            'calendar-outline'
          )}
          {dateChip('All', dateScope === 'all' && !rangeActive, () => onDateScopeChange('all'))}
        </View>
        <TouchableOpacity onPress={() => onStepDay(-1)} className="p-1.5" hitSlop={6}>
          <MaterialCommunityIcons name="chevron-left" size={18} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onStepDay(1)} className="p-1.5" hitSlop={6}>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <View className="px-4 py-2" style={{ backgroundColor: colors.background }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-2">
              {statusFilter && (
                <TouchableOpacity
                  onPress={() => onStatusFilterChange(null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: getStatusColor(statusFilter, colors) + '14',
                    borderWidth: 1,
                    borderColor: getStatusColor(statusFilter, colors),
                  }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(statusFilter, colors) }}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getStatusColor(statusFilter, colors) }}>
                    {getStatusLabel(statusFilter)}
                  </Text>
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={getStatusColor(statusFilter, colors)}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {paymentFilter && (
                <TouchableOpacity
                  onPress={() => onPaymentFilterChange(null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: getPaymentStatusColor(paymentFilter, colors) + '14',
                    borderWidth: 1,
                    borderColor: getPaymentStatusColor(paymentFilter, colors),
                  }}>
                  <View
                    className="mr-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: getPaymentStatusColor(paymentFilter, colors) }}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getPaymentStatusColor(paymentFilter, colors) }}>
                    {getPaymentStatusLabel(paymentFilter)}
                  </Text>
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={getPaymentStatusColor(paymentFilter, colors)}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {vanFilter && (
                <TouchableOpacity
                  onPress={() => onVanFilterChange(null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: colors.primary + '14',
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}>
                  <MaterialCommunityIcons
                    name="truck-outline"
                    size={12}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {vanFilter}
                  </Text>
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {rangeActive && (
                <TouchableOpacity
                  onPress={() => onDateRangeChange(null, null)}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: colors.primary + '14',
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={12}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {dateFrom ? fmtChipDate(dateFrom) : '…'} – {dateTo ? fmtChipDate(dateTo) : '…'}
                  </Text>
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {/* Clear All */}
              <TouchableOpacity
                onPress={clearAllFilters}
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
            <Text className="text-xs" style={{ color: colors.muted }}>
              {stats.pending} pending
            </Text>
          )}
          {isSelectionMode && (
            <TouchableOpacity
              onPress={handleSelectAllVisible}
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: colors.primary + '14' }}>
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                Select All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {/* Sort Button */}
          <TouchableOpacity
            onPress={() => openSheet('sort')}
            className="flex-row items-center rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <MaterialCommunityIcons
              name={sortOrder === 'DESC' ? 'arrow-down' : 'arrow-up'}
              size={14}
              color={colors.text}
            />
            <Text className="ml-1 text-xs" style={{ color: colors.text }}>
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort'}
            </Text>
          </TouchableOpacity>

          {/* Filters Button */}
          <TouchableOpacity
            onPress={() => openSheet('menu')}
            className="flex-row items-center rounded-lg px-2.5 py-1.5"
            style={{
              backgroundColor: activeFiltersCount > 0 ? colors.cta : colors.card,
              borderWidth: 1,
              borderColor: activeFiltersCount > 0 ? colors.cta : colors.border,
            }}>
            <MaterialCommunityIcons
              name="tune"
              size={16}
              color={activeFiltersCount > 0 ? colors.onCta : colors.text}
            />
            {activeFiltersCount > 0 && (
              <Text className="ml-1 text-xs font-bold" style={{ color: colors.onCta }}>
                {activeFiltersCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Stats Toggle */}
          <TouchableOpacity
            onPress={onToggleSummary}
            className="rounded-lg px-2.5 py-1.5"
            style={{
              backgroundColor: showSummary ? colors.primary + '15' : colors.card,
              borderWidth: 1,
              borderColor: showSummary ? colors.accent : colors.border,
            }}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={16}
              color={showSummary ? colors.accent : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Panel - Compact */}
      {showSummary && (
        <View
          className="mx-4 mb-2 overflow-hidden rounded-xl"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* Financial Row */}
          <View className="flex-row">
            <View className="flex-1 border-r p-2.5" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Value
              </Text>
              <Text className="text-sm" style={[typo.num, { color: colors.text }]}>
                {formatPrice(stats.totalAmount)}
              </Text>
            </View>
            <View className="flex-1 border-r p-2.5" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Collected
              </Text>
              <Text className="text-sm" style={[typo.num, { color: colors.success }]}>
                {formatPrice(stats.paidAmount)}
              </Text>
            </View>
            <View className="flex-1 p-2.5">
              <Text className="text-xs" style={{ color: colors.muted }}>
                Outstanding
              </Text>
              <Text className="text-sm" style={[typo.num, { color: colors.error }]}>
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
                  const chipColor = toneColor(status.tone, colors);
                  return (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => {
                        onStatusFilterChange(statusFilter === status.value ? null : status.value);
                      }}
                      className="flex-row items-center rounded-full px-2 py-0.5"
                      style={{ backgroundColor: toneTint(status.tone, colors) }}>
                      <View
                        className="mr-1 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: chipColor }}
                      />
                      <Text className="text-xs" style={{ color: chipColor }}>
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
    </View>
  );

  return (
    <View className="flex-1">
      {/* Date pickers — sheet-based, always dismissable */}
      <DatePickerSheet
        visible={showCustomPicker}
        onClose={() => setShowCustomPicker(false)}
        title="Show orders for"
        value={customDate ?? dateFrom ?? new Date()}
        onSelect={(d) => onDateScopeChange('custom', d)}
      />
      <DatePickerSheet
        visible={showDateFrom}
        onClose={() => setShowDateFrom(false)}
        title="From date"
        value={dateFrom}
        maximumDate={dateTo || undefined}
        onSelect={(d) => onDateRangeChange(d, dateTo)}
      />
      <DatePickerSheet
        visible={showDateTo}
        onClose={() => setShowDateTo(false)}
        title="To date"
        value={dateTo}
        minimumDate={dateFrom || undefined}
        onSelect={(d) => onDateRangeChange(dateFrom, d)}
      />

      {/* Orders List - Header scrolls with content */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={listHeader}
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
          <EmptyState
            icon="receipt"
            title="No orders found"
            subtitle={
              searchQuery || activeFiltersCount > 0 || dateScope !== 'all'
                ? 'Try a different date, search or clear the filters.'
                : 'Create your first order to get started.'
            }
          />
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

      {/* Filters & sort sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeSheet()}>
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => closeSheet()}>
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
              <View
                className="mb-4 h-1 w-12 self-center rounded-full"
                style={{ backgroundColor: colors.border }}
              />

              {/* Title row (with back on sub-views) */}
              <View className="mb-4 flex-row items-center">
                {sheetView !== 'menu' && (
                  <TouchableOpacity
                    onPress={() => setSheetView('menu')}
                    hitSlop={8}
                    className="mr-2">
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.muted} />
                  </TouchableOpacity>
                )}
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {sheetView === 'menu' && 'Filters'}
                  {sheetView === 'sort' && 'Sort'}
                  {sheetView === 'status' && 'Order Status'}
                  {sheetView === 'payment' && 'Payment Status'}
                  {sheetView === 'van' && 'Select Van'}
                </Text>
              </View>

              {/* Root menu */}
              {sheetView === 'menu' && (
                <View className="gap-1">
                  <SheetRow
                    colors={colors}
                    icon="sort"
                    label="Sort by"
                    value={`${SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Order Date'} · ${
                      sortOrder === 'DESC' ? 'Newest' : 'Oldest'
                    }`}
                    onPress={() => setSheetView('sort')}
                  />
                  <SheetRow
                    colors={colors}
                    icon="swap-horizontal"
                    label="Dates mean"
                    value={dateFilterField === 'orderDate' ? 'Order date' : 'Delivery date'}
                    onPress={() =>
                      onDateFilterFieldChange(
                        dateFilterField === 'orderDate' ? 'deliveryDate' : 'orderDate'
                      )
                    }
                  />
                  <SheetRow
                    colors={colors}
                    icon="flag-outline"
                    label="Order status"
                    value={statusFilter ? getStatusLabel(statusFilter) : 'All'}
                    highlighted={!!statusFilter}
                    onPress={() => setSheetView('status')}
                  />
                  <SheetRow
                    colors={colors}
                    icon="wallet-outline"
                    label="Payment status"
                    value={paymentFilter ? getPaymentStatusLabel(paymentFilter) : 'All'}
                    highlighted={!!paymentFilter}
                    onPress={() => setSheetView('payment')}
                  />
                  {vans.length > 0 && (
                    <SheetRow
                      colors={colors}
                      icon="truck-outline"
                      label="Van"
                      value={vanFilter || 'All vans'}
                      highlighted={!!vanFilter}
                      onPress={() => setSheetView('van')}
                    />
                  )}
                  <SheetRow
                    colors={colors}
                    icon="calendar-range"
                    label="From date"
                    value={dateFrom && rangeActive ? fmtChipDate(dateFrom) : 'Any'}
                    highlighted={rangeActive && !!dateFrom}
                    onPress={() => closeSheet(() => setShowDateFrom(true))}
                  />
                  <SheetRow
                    colors={colors}
                    icon="calendar-range"
                    label="To date"
                    value={dateTo && rangeActive ? fmtChipDate(dateTo) : 'Any'}
                    highlighted={rangeActive && !!dateTo}
                    onPress={() => closeSheet(() => setShowDateTo(true))}
                  />
                  {activeFiltersCount > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        clearAllFilters();
                        closeSheet();
                      }}
                      className="mt-2 items-center rounded-xl px-4 py-3"
                      style={{ backgroundColor: colors.error + '12' }}>
                      <Text className="text-sm font-semibold" style={{ color: colors.error }}>
                        Clear all filters
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Sort */}
              {sheetView === 'sort' && (
                <View className="gap-2">
                  <View className="mb-1 flex-row gap-2">
                    {(['DESC', 'ASC'] as SortOrder[]).map((ord) => (
                      <TouchableOpacity
                        key={ord}
                        onPress={() => onSortChange(sortBy, ord)}
                        className="flex-1 flex-row items-center justify-center rounded-xl px-3 py-2.5"
                        style={{
                          backgroundColor: sortOrder === ord ? colors.cta : colors.background,
                          borderWidth: 1,
                          borderColor: sortOrder === ord ? colors.cta : colors.border,
                        }}>
                        <MaterialCommunityIcons
                          name={ord === 'DESC' ? 'arrow-down' : 'arrow-up'}
                          size={14}
                          color={sortOrder === ord ? colors.onCta : colors.text}
                        />
                        <Text
                          className="ml-1 text-sm font-medium"
                          style={{ color: sortOrder === ord ? colors.onCta : colors.text }}>
                          {ord === 'DESC' ? 'Newest first' : 'Oldest first'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        onSortChange(option.value, sortOrder);
                        closeSheet();
                      }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor:
                          sortBy === option.value ? colors.primary + '15' : colors.background,
                        borderWidth: sortBy === option.value ? 1 : 0,
                        borderColor: colors.accent,
                      }}>
                      <Text
                        className="text-sm font-medium"
                        style={{ color: sortBy === option.value ? colors.accent : colors.text }}>
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Status Options */}
              {sheetView === 'status' && (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      onStatusFilterChange(null);
                      closeSheet();
                    }}
                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: !statusFilter ? colors.primary + '15' : colors.background,
                      borderWidth: !statusFilter ? 1 : 0,
                      borderColor: colors.accent,
                    }}>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: !statusFilter ? colors.accent : colors.text }}>
                      All Statuses
                    </Text>
                    {!statusFilter && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                  {ORDER_STATUSES.map((status) => {
                    const statusColor = toneColor(status.tone, colors);
                    return (
                      <TouchableOpacity
                        key={status.value}
                        onPress={() => {
                          onStatusFilterChange(status.value);
                          closeSheet();
                        }}
                        className="flex-row items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          backgroundColor:
                            statusFilter === status.value
                              ? toneTint(status.tone, colors)
                              : colors.background,
                          borderWidth: statusFilter === status.value ? 1 : 0,
                          borderColor: statusColor,
                        }}>
                        <View className="flex-row items-center">
                          <View
                            className="mr-3 h-3 w-3 rounded-full"
                            style={{ backgroundColor: statusColor }}
                          />
                          <Text
                            className="text-sm font-medium"
                            style={{
                              color: statusFilter === status.value ? statusColor : colors.text,
                            }}>
                            {status.label}
                          </Text>
                        </View>
                        {statusFilter === status.value && (
                          <MaterialCommunityIcons name="check" size={20} color={statusColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Payment Options */}
              {sheetView === 'payment' && (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      onPaymentFilterChange(null);
                      closeSheet();
                    }}
                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: !paymentFilter ? colors.primary + '15' : colors.background,
                      borderWidth: !paymentFilter ? 1 : 0,
                      borderColor: colors.accent,
                    }}>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: !paymentFilter ? colors.accent : colors.text }}>
                      All Payment Statuses
                    </Text>
                    {!paymentFilter && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                  {PAYMENT_STATUSES.map((status) => {
                    const statusColor = toneColor(status.tone, colors);
                    return (
                      <TouchableOpacity
                        key={status.value}
                        onPress={() => {
                          onPaymentFilterChange(status.value);
                          closeSheet();
                        }}
                        className="flex-row items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          backgroundColor:
                            paymentFilter === status.value
                              ? toneTint(status.tone, colors)
                              : colors.background,
                          borderWidth: paymentFilter === status.value ? 1 : 0,
                          borderColor: statusColor,
                        }}>
                        <View className="flex-row items-center">
                          <View
                            className="mr-3 h-3 w-3 rounded-full"
                            style={{ backgroundColor: statusColor }}
                          />
                          <Text
                            className="text-sm font-medium"
                            style={{
                              color: paymentFilter === status.value ? statusColor : colors.text,
                            }}>
                            {status.label}
                          </Text>
                        </View>
                        {paymentFilter === status.value && (
                          <MaterialCommunityIcons name="check" size={20} color={statusColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Van Options */}
              {sheetView === 'van' && (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      onVanFilterChange(null);
                      closeSheet();
                    }}
                    className="flex-row items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: !vanFilter ? colors.primary + '15' : colors.background,
                      borderWidth: !vanFilter ? 1 : 0,
                      borderColor: colors.accent,
                    }}>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons
                        name="truck-outline"
                        size={18}
                        color={!vanFilter ? colors.accent : colors.muted}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        className="text-sm font-medium"
                        style={{ color: !vanFilter ? colors.accent : colors.text }}>
                        All Vans
                      </Text>
                    </View>
                    {!vanFilter && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                  {vans.map((van) => (
                    <TouchableOpacity
                      key={van}
                      onPress={() => {
                        onVanFilterChange(van);
                        closeSheet();
                      }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor:
                          vanFilter === van ? colors.primary + '15' : colors.background,
                        borderWidth: vanFilter === van ? 1 : 0,
                        borderColor: colors.accent,
                      }}>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="truck-outline"
                          size={18}
                          color={vanFilter === van ? colors.accent : colors.muted}
                          style={{ marginRight: 12 }}
                        />
                        <Text
                          className="text-sm font-medium"
                          style={{ color: vanFilter === van ? colors.accent : colors.text }}>
                          {van}
                        </Text>
                      </View>
                      {vanFilter === van && (
                        <MaterialCommunityIcons name="check" size={20} color={colors.accent} />
                      )}
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

// Sheet menu row
function SheetRow({
  colors,
  icon,
  label,
  value,
  highlighted = false,
  onPress,
}: {
  colors: any;
  icon: string;
  label: string;
  value: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl px-3 py-3"
      style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center">
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={highlighted ? colors.accent : colors.muted}
        />
        <Text className="ml-3 text-sm font-medium" style={{ color: colors.text }}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-sm" style={{ color: highlighted ? colors.accent : colors.muted }}>
          {value}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={colors.muted}
          style={{ marginLeft: 4 }}
        />
      </View>
    </TouchableOpacity>
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
  const statusColor = getStatusColor(order.status, colors);
  const paymentColor = getPaymentStatusColor(order.paymentStatus, colors);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      className="mb-3 flex-row rounded-2xl p-4"
      style={{
        backgroundColor: isSelected ? colors.primary + '15' : colors.card,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.accent : colors.border,
      }}>
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <View className="mr-3 justify-center">
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{
              backgroundColor: isSelected ? colors.cta : colors.background,
              borderWidth: isSelected ? 0 : 2,
              borderColor: colors.border,
            }}>
            {isSelected && <MaterialCommunityIcons name="check" size={16} color={colors.onCta} />}
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
            {order.sourceOrderId != null && (
              <View
                className="flex-row items-center rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.primary + '14' }}>
                <MaterialCommunityIcons name="cellphone" size={12} color={colors.accent} />
                <Text className="ml-0.5 text-xs font-semibold" style={{ color: colors.accent }}>
                  App
                </Text>
              </View>
            )}
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
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: statusColor + '14' }}>
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
        <View className="mb-3 flex-row flex-wrap items-center gap-3">
          {/* Order Date */}
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="cart-outline" size={14} color={colors.muted} />
            <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
              Order: {formatShortDate(order.orderDate)}
            </Text>
          </View>
          {/* Delivery Date */}
          {order.deliveryDate && (
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="truck-outline" size={14} color={colors.primary} />
              <Text className="ml-1 text-xs font-medium" style={{ color: colors.primary }}>
                Delivery: {formatShortDate(order.deliveryDate)}
              </Text>
            </View>
          )}
          {/* Van */}
          {order.vanName && (
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="truck-outline" size={14} color={colors.muted} />
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
            <View className="rounded-md px-2 py-1" style={{ backgroundColor: paymentColor + '14' }}>
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
            <Text className="text-lg" style={[typo.num, { color: colors.text }]}>
              {formatPrice(order.totalAmount)}
            </Text>
            {order.items &&
              order.items.length > 0 &&
              (() => {
                const cost = order.items!.reduce((sum, item) => {
                  const qty =
                    parseFloat(String(item.deliveredQuantity)) ||
                    parseFloat(String(item.orderedQuantity)) ||
                    0;
                  const ret = parseFloat(String(item.returnedQuantity)) || 0;
                  return sum + Math.max(0, qty - ret) * (parseFloat(String(item.buyingPrice)) || 0);
                }, 0);
                const profit = (parseFloat(String(order.subtotal)) || 0) - cost;
                return profit !== 0 ? (
                  <Text
                    className="text-xs font-medium"
                    style={{ color: profit >= 0 ? colors.success : colors.error }}>
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
