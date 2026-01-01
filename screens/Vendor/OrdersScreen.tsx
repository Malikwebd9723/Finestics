// screens/Vendor/OrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Pressable, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from 'context/ThemeProvider';
import SearchBar from 'components/SearchBar';
import OrdersList from './components/OrdersList';
import OrderDetailModal from './components/OrderDetailModal';
import PaymentModal from './components/PaymentModal';
import BulkActionsBar from './components/BulkActionsBar';
import VanOrdersModal from './components/VanOrdersModal';
import CustomerOrdersModal from './components/CustomerOrderDetailsModal';

export default function Orders() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

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
  const [vanOrdersModalVisible, setVanOrdersModalVisible] = useState(false);
  const [customerOrdersModalVisible, setCustomerOrdersModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

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

  const handleViewVanOrders = () => {
    setVanOrdersModalVisible(true);
  };

  const handleViewCustomerOrders = () => {
    setCustomerOrdersModalVisible(true);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: colors.primary }}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleCancelSelection} className="mr-3">
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white">{selectedOrders.size} selected</Text>
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
              <MaterialIcons name="shopping-basket" size={16} color={colors.primary} />
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
              <Ionicons name="car" size={16} color={colors.primary} />
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
              <Ionicons name="person" size={16} color={colors.primary} />
              <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
                By Customer
              </Text>
            </TouchableOpacity>
          </View>
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
        onViewCustomerOrders={handleViewCustomerOrders}
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
            backgroundColor: colors.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          }}>
          <Ionicons name="add" size={28} color="#fff" />
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

      {/* Van Orders Modal */}
      <VanOrdersModal
        visible={vanOrdersModalVisible}
        onClose={() => setVanOrdersModalVisible(false)}
        onViewOrder={(orderId) => {
          setVanOrdersModalVisible(false);
          setTimeout(() => {
            setSelectedOrderId(orderId);
            setDetailModalVisible(true);
          }, 300);
        }}
      />

      {/* Customer Orders Modal (NEW) */}
      {/* <CustomerOrdersModal
        visible={customerOrdersModalVisible}
        onClose={() => setCustomerOrdersModalVisible(false)}
        onViewOrder={(orderId) => {
          setCustomerOrdersModalVisible(false);
          setTimeout(() => {
            setSelectedOrderId(orderId);
            setDetailModalVisible(true);
          }, 300);
        }}
      /> */}
    </View>
  );
}
