// screens/Vendor/OrdersScreen.tsx
// Owns every filter/sort/date preference for the order book and persists them
// per vendor (utils/uiPrefs) so the screen reopens exactly how the vendor
// left it — e.g. defaulting to tomorrow's orders. A picked custom date is
// deliberately NOT persisted (a stale date next morning is worse than none).
import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { typo } from 'constants/design';
import { AttentionRow, BottomSheet } from 'components/ui';
import { getVendorOrders } from 'api/actions/vendorOrderInboxActions';
import { formatPrice, SortField, SortOrder, DateFilterField } from 'types/order.types';
import { loadUiPrefs, saveUiPrefs } from 'utils/uiPrefs';
import SearchBar from 'components/SearchBar';
import OrdersList, { DateScope } from './components/OrdersList';
import OrderDetailModal from './components/OrderDetailModal';
import PaymentModal from './components/PaymentModal';
import BulkActionsBar from './components/BulkActionsBar';

// Noon-anchored days: local midnight can cross into the previous day once
// serialized to an ISO date for the API.
const atNoon = (d: Date) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};
const dayWithOffset = (days: number) => atNoon(new Date(Date.now() + days * 864e5));

interface OrdersPrefs {
  dateScope?: 'today' | 'tomorrow' | 'all';
  sortBy?: SortField;
  sortOrder?: SortOrder;
  dateFilterField?: DateFilterField;
  statusFilter?: string | null;
  paymentFilter?: string | null;
  vanFilter?: string | null;
  showSummary?: boolean;
}

export default function Orders() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const prefsKey = `vendor_orders_prefs_v1:${user?.id ?? 'anon'}`;

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [vanFilter, setVanFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [dateScope, setDateScope] = useState<DateScope>('all');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  // Sort & display prefs
  const [sortBy, setSortBy] = useState<SortField>('orderDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [dateFilterField, setDateFilterField] = useState<DateFilterField>('orderDate');
  const [showSummary, setShowSummary] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  const applyDateScope = useCallback((scope: DateScope, custom?: Date | null) => {
    if (scope === 'today' || scope === 'tomorrow') {
      const d = dayWithOffset(scope === 'today' ? 0 : 1);
      setDateScope(scope);
      setCustomDate(null);
      setDateFrom(d);
      setDateTo(d);
    } else if (scope === 'custom') {
      const d = atNoon(custom ?? new Date());
      setDateScope('custom');
      setCustomDate(d);
      setDateFrom(d);
      setDateTo(d);
    } else {
      setDateScope('all');
      setCustomDate(null);
      setDateFrom(null);
      setDateTo(null);
    }
  }, []);

  // Step the scoped day: lands back on the today/tomorrow chips when it can.
  const stepDay = useCallback(
    (dir: 1 | -1) => {
      const base = dateScope !== 'all' && dateFrom ? dateFrom : dayWithOffset(0);
      const next = atNoon(new Date(base.getTime() + dir * 864e5));
      if (next.toDateString() === dayWithOffset(0).toDateString()) applyDateScope('today');
      else if (next.toDateString() === dayWithOffset(1).toDateString()) applyDateScope('tomorrow');
      else applyDateScope('custom', next);
    },
    [dateScope, dateFrom, applyDateScope]
  );

  // Hydrate persisted preferences once per user, then start rendering the list.
  useEffect(() => {
    let alive = true;
    loadUiPrefs<OrdersPrefs>(prefsKey).then((p) => {
      if (!alive) return;
      if (p) {
        if (p.sortBy) setSortBy(p.sortBy);
        if (p.sortOrder) setSortOrder(p.sortOrder);
        if (p.dateFilterField) setDateFilterField(p.dateFilterField);
        if (typeof p.showSummary === 'boolean') setShowSummary(p.showSummary);
        // Deep links (dashboard attention rows) win over remembered filters.
        if (!route.params?.statusFilter && p.statusFilter !== undefined) {
          setStatusFilter(p.statusFilter);
        }
        if (!route.params?.paymentFilter && p.paymentFilter !== undefined) {
          setPaymentFilter(p.paymentFilter);
        }
        if (p.vanFilter !== undefined) setVanFilter(p.vanFilter);
        if (p.dateScope) applyDateScope(p.dateScope);
      }
      setPrefsReady(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsKey]);

  // Persist on every change (custom dates degrade to 'all').
  useEffect(() => {
    if (!prefsReady) return;
    saveUiPrefs(prefsKey, {
      dateScope: dateScope === 'custom' ? 'all' : dateScope,
      sortBy,
      sortOrder,
      dateFilterField,
      statusFilter,
      paymentFilter,
      vanFilter,
      showSummary,
    } satisfies OrdersPrefs);
  }, [
    prefsReady,
    prefsKey,
    dateScope,
    sortBy,
    sortOrder,
    dateFilterField,
    statusFilter,
    paymentFilter,
    vanFilter,
    showSummary,
  ]);

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

  // App orders awaiting vendor action: fresh orders + quote requests.
  const [appOrdersSheetVisible, setAppOrdersSheetVisible] = useState(false);
  const { data: pendingAppOrders } = useQuery({
    queryKey: ['vendor-customer-orders', 'needs-action'],
    queryFn: () => getVendorOrders('pending,quote_requested'),
    refetchInterval: isFocused ? 30000 : false,
  });
  const pendingItems = pendingAppOrders?.items ?? [];
  const pendingCount = pendingAppOrders?.pagination?.totalItems ?? pendingItems.length;

  const openAppOrder = (orderId: number) => {
    setAppOrdersSheetVisible(false);
    navigation.navigate('VendorOrderDetailScreen', { orderId });
  };

  const handleAppOrdersPress = () => {
    if (pendingItems.length === 1) {
      openAppOrder(pendingItems[0].id);
    } else {
      setAppOrdersSheetVisible(true);
    }
  };

  // Filters can be preset by other screens (e.g. Dashboard attention rows).
  useEffect(() => {
    if (route.params?.statusFilter) {
      setStatusFilter(route.params.statusFilter);
    }
    if (route.params?.paymentFilter) {
      setPaymentFilter(route.params.paymentFilter);
    }
  }, [route.params]);

  // Handlers
  const handleCreateOrder = () => {
    navigation.navigate('CreateOrderScreen');
  };

  const handleCollectionSheet = () => {
    navigation.navigate('CollectionSheet');
  };

  const handleViewOrder = (orderId: number) => {
    if (isSelectionMode) {
      toggleOrderSelection(orderId);
    } else {
      setSelectedOrderId(orderId);
      setDetailModalVisible(true);
    }
  };

  const handleLongPressOrder = (orderId: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedOrders(new Set([orderId]));
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      // Exit selection mode if no orders selected
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedOrders(new Set());
  };

  const handleSelectAll = (orderIds: number[]) => {
    setSelectedOrders(new Set(orderIds));
  };

  const handleBulkActionComplete = () => {
    setIsSelectionMode(false);
    setSelectedOrders(new Set());
  };

  const handleEditOrder = (orderId: number) => {
    setDetailModalVisible(false);
    navigation.navigate('CreateOrderScreen', { orderId });
  };

  const handleRecordPayment = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDetailModalVisible(false);
    setTimeout(() => setPaymentModalVisible(true), 300);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedOrderId(null);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedOrderId(null);
  };

  // Advanced from/to range (set in the filters sheet) — leaves the day chips
  // deselected and shows up as an active-filter chip instead.
  const handleDateRangeChange = (from: Date | null, to: Date | null) => {
    setDateScope('all');
    setCustomDate(null);
    setDateFrom(from ? atNoon(from) : null);
    setDateTo(to ? atNoon(to) : null);
  };

  const handleVanFilterChange = (van: string | null) => {
    setVanFilter(van);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: colors.cta }}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleCancelSelection} className="mr-3">
              <MaterialCommunityIcons name="close" size={24} color={colors.onCta} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: colors.onCta }}>
              {selectedOrders.size} selected
            </Text>
          </View>
        </View>
      )}

      {/* Search Bar & Quick Actions */}
      {!isSelectionMode && (
        <View className="pt-2">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search orders, customers..."
          />

          {/* Alternate views — quiet text links, one slim row */}
          <View className="flex-row items-center gap-5 px-4 pb-2">
            {[
              { label: 'Collection', icon: 'basket-outline', onPress: handleCollectionSheet },
              {
                label: 'By Van',
                icon: 'truck-outline',
                onPress: () => navigation.navigate('VanOrdersScreen'),
              },
              {
                label: 'By Customer',
                icon: 'account-outline',
                onPress: () => navigation.navigate('CustomerOrdersScreen'),
              },
            ].map((link) => (
              <TouchableOpacity
                key={link.label}
                onPress={link.onPress}
                hitSlop={6}
                className="flex-row items-center py-1">
                <MaterialCommunityIcons
                  name={link.icon as any}
                  size={15}
                  color={colors.primary}
                />
                <Text className="ml-1 text-xs font-semibold" style={{ color: colors.text }}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New app orders awaiting acceptance */}
          {pendingCount > 0 && (
            <View className="px-4 pb-2">
              <AttentionRow
                icon="cart-arrow-down"
                title={`${pendingCount} new app order${pendingCount === 1 ? '' : 's'}`}
                subtitle="Review and accept"
                onPress={handleAppOrdersPress}
              />
            </View>
          )}
        </View>
      )}

      {/* Orders List with Filters (waits for persisted prefs so the first
          fetch already uses the vendor's remembered defaults) */}
      {prefsReady && (
        <OrdersList
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
          vanFilter={vanFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          dateScope={dateScope}
          customDate={customDate}
          sortBy={sortBy}
          sortOrder={sortOrder}
          dateFilterField={dateFilterField}
          showSummary={showSummary}
          onStatusFilterChange={setStatusFilter}
          onPaymentFilterChange={setPaymentFilter}
          onVanFilterChange={handleVanFilterChange}
          onDateRangeChange={handleDateRangeChange}
          onDateScopeChange={applyDateScope}
          onStepDay={stepDay}
          onSortChange={(field, order) => {
            setSortBy(field);
            setSortOrder(order);
          }}
          onDateFilterFieldChange={setDateFilterField}
          onToggleSummary={() => setShowSummary((s) => !s)}
          onViewOrder={handleViewOrder}
          onLongPressOrder={handleLongPressOrder}
          isSelectionMode={isSelectionMode}
          selectedOrders={selectedOrders}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Bulk Actions Bar */}
      {isSelectionMode && selectedOrders.size > 0 && (
        <BulkActionsBar
          selectedOrderIds={Array.from(selectedOrders)}
          onCancel={handleCancelSelection}
          onComplete={handleBulkActionComplete}
        />
      )}

      {/* Floating Add Button */}
      {!isSelectionMode && (
        <Pressable
          onPress={handleCreateOrder}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{
            backgroundColor: colors.cta,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          }}>
          <MaterialCommunityIcons name="plus" size={28} color={colors.onCta} />
        </Pressable>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={detailModalVisible}
        orderId={selectedOrderId}
        onClose={handleCloseDetailModal}
        onEdit={handleEditOrder}
        onRecordPayment={handleRecordPayment}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        orderId={selectedOrderId}
        onClose={handleClosePaymentModal}
      />

      {/* New app orders sheet */}
      <BottomSheet
        visible={appOrdersSheetVisible}
        onClose={() => setAppOrdersSheetVisible(false)}
        title="New app orders"
        maxHeightRatio={0.75}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {pendingItems.map((item, index) => {
            const customer = (item as any).customer;
            const name = customer
              ? `${customer.firstName} ${customer.lastName}`.trim()
              : 'Customer';
            const itemCount = item.itemCount ?? 0;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => openAppOrder(item.id)}
                activeOpacity={0.7}
                className="flex-row items-center py-3.5"
                style={{
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}>
                <View className="flex-1 pr-3">
                  <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                    {name}
                  </Text>
                  <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                    {item.orderNumber} · {itemCount} item{itemCount === 1 ? '' : 's'}
                  </Text>
                </View>
                {item.status === 'quote_requested' ? (
                  <Text className="mr-1 text-xs font-semibold" style={{ color: colors.accent }}>
                    Quote
                  </Text>
                ) : (
                  <Text className="mr-1 text-[15px]" style={[typo.num, { color: colors.text }]}>
                    {formatPrice(item.totalAmount)}
                  </Text>
                )}
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

    </View>
  );
}
