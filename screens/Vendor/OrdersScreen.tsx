// screens/Vendor/OrdersScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';
import { AttentionRow, BottomSheet } from 'components/ui';
import { getVendorOrders } from 'api/actions/vendorOrderInboxActions';
import { formatPrice } from 'types/order.types';
import SearchBar from 'components/SearchBar';
import OrdersList from './components/OrdersList';
import OrderDetailModal from './components/OrderDetailModal';
import PaymentModal from './components/PaymentModal';
import BulkActionsBar from './components/BulkActionsBar';

export default function Orders() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [vanFilter, setVanFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

  // Pending app orders (customer-placed, awaiting acceptance)
  const [appOrdersSheetVisible, setAppOrdersSheetVisible] = useState(false);
  const { data: pendingAppOrders } = useQuery({
    queryKey: ['vendor-customer-orders', 'pending'],
    queryFn: () => getVendorOrders('pending'),
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
  const route = useRoute<any>();
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

  const handleDateRangeChange = (from: Date | null, to: Date | null) => {
    setDateFrom(from);
    setDateTo(to);
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

          {/* Quick Action Buttons */}
          <View className="flex-row gap-2 px-4 pb-2">
            <TouchableOpacity
              onPress={handleCollectionSheet}
              className="flex-row items-center rounded-lg px-3 py-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <MaterialCommunityIcons name="basket-outline" size={16} color={colors.primary} />
              <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
                Collection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={()=> navigation.navigate('VanOrdersScreen')}
              className="flex-row items-center rounded-lg px-3 py-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <MaterialCommunityIcons name="truck-outline" size={16} color={colors.primary} />
              <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
                By Van
              </Text>
            </TouchableOpacity>

            {/* NEW: By Customer Button */}
            <TouchableOpacity
              onPress={()=> navigation.navigate('CustomerOrdersScreen')}
              className="flex-row items-center rounded-lg px-3 py-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <MaterialCommunityIcons name="account-outline" size={16} color={colors.primary} />
              <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
                By Customer
              </Text>
            </TouchableOpacity>
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

      {/* Orders List with Filters */}
      <OrdersList
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
        vanFilter={vanFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onStatusFilterChange={setStatusFilter}
        onPaymentFilterChange={setPaymentFilter}
        onVanFilterChange={handleVanFilterChange}
        onDateRangeChange={handleDateRangeChange}
        onViewOrder={handleViewOrder}
        onLongPressOrder={handleLongPressOrder}
        isSelectionMode={isSelectionMode}
        selectedOrders={selectedOrders}
        onSelectAll={handleSelectAll}
      />

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
                <Text className="mr-1 text-[15px]" style={[typo.num, { color: colors.text }]}>
                  {formatPrice(item.totalAmount)}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

    </View>
  );
}
