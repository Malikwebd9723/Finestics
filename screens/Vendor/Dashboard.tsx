// screens/Vendor/Dashboard.tsx
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllOrders } from 'api/actions/orderActions';
import { fetchAllProducts } from 'api/actions/productActions';
import { fetchAllCustomers } from 'api/actions/customerActions';
import { formatPrice, isToday } from 'types/order.types';
import OrderDetailModal from './components/OrderDetailModal';
import PaymentModal from './components/PaymentModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function Dashboard() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();

  // Fetch orders
  const {
    data: ordersData,
    refetch: refetchOrders,
    isRefetching: ordersRefetching,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchAllOrders({ limit: 100 }),
  });

  // Fetch products
  const { data: productsData, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchAllProducts,
  });

  // Fetch customers
  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchAllCustomers,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const orders = ordersData?.data || [];
    const products = productsData?.data || [];
    const customers = customersData?.data || [];

    const todayOrders = orders.filter((o: any) => isToday(o.orderDate));
    const pendingOrders = orders.filter((o: any) => o.status === 'pending');
    const todaySales = todayOrders.reduce(
      (sum: number, o: any) => sum + parseFloat(o.totalAmount || 0),
      0
    );
    const todayCollected = todayOrders.reduce(
      (sum: number, o: any) => sum + parseFloat(o.paidAmount || 0),
      0
    );
    const totalOutstanding = orders.reduce(
      (sum: number, o: any) => sum + parseFloat(o.balanceAmount || 0),
      0
    );
    const activeProducts = products.filter((p: any) => p.isActive);
    const activeCustomers = customers.filter((c: any) => c.status === 'active');

    return {
      todayOrders: todayOrders.length,
      pendingOrders: pendingOrders.length,
      todaySales,
      todayCollected,
      totalOutstanding,
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
    };
  }, [ordersData, productsData, customersData]);

  // Recent orders
  const recentOrders = useMemo(() => {
    const orders = ordersData?.data || [];
    return orders.slice(0, 5);
  }, [ordersData]);

  const handleRefresh = () => {
    refetchOrders();
    refetchProducts();
    refetchCustomers();
  };

  // Navigation handlers - using tab names from navigationItems
  const navigateToOrders = () => navigation.navigate('Orders');
  const navigateToProducts = () => navigation.navigate('Products');
  const navigateToCustomers = () => navigation.navigate('Customers');
  const navigateToCreateOrder = () => navigation.navigate('CreateOrderScreen');


  // Order Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<number | null>(null);
  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [selectedPaymentOrderId, setSelectedPaymentOrderId] = React.useState<number | null>(null);

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedOrderId(null);
  };
  const handleEditOrder = (orderId: number) => {
    handleCloseDetailModal();
    navigation.navigate('CreateOrderScreen', { orderId });
  };
  const handleRecordPayment = (orderId: number) => {
    handleCloseDetailModal();
    setSelectedPaymentOrderId(orderId);
    setPaymentModalVisible(true);
  }

  const handleOrderOpen = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDetailModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedPaymentOrderId(null);
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={ordersRefetching}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      <View className="px-4 py-5">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text className="mt-1 text-2xl font-bold" style={{ color: colors.text }}>
            Dashboard
          </Text>
        </View>

        {/* Quick Action - New Order */}
        <TouchableOpacity
          onPress={navigateToCreateOrder}
          activeOpacity={0.8}
          className="mb-6 flex-row items-center justify-between rounded-xl p-4"
          style={{ backgroundColor: colors.primary }}>
          <View className="flex-row items-center">
            <View
              className="h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <View className="ml-3">
              <Text className="text-base font-semibold text-white">New Order</Text>
              <Text className="text-xs text-white/70">Create a new order</Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Stats Grid */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          {/* Today's Orders */}
          <StatCard
            title="Today's Orders"
            value={stats.todayOrders.toString()}
            subtitle={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : undefined}
            subtitleColor="#f59e0b"
            colors={colors}
          />

          {/* Today's Sales */}
          <StatCard title="Today's Sales" value={formatPrice(stats.todaySales)} colors={colors} />

          {/* Collected */}
          <StatCard title="Collected" value={formatPrice(stats.todayCollected)} colors={colors} />

          {/* Outstanding */}
          <StatCard
            title="Outstanding"
            value={formatPrice(stats.totalOutstanding)}
            valueColor={stats.totalOutstanding > 0 ? '#ef4444' : undefined}
            colors={colors}
          />
        </View>

        {/* Overview Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
            OVERVIEW
          </Text>

          <View
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            {/* Products */}
            <TouchableOpacity
              onPress={navigateToProducts}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: colors.background }}>
                  <Ionicons name="cube-outline" size={18} color={colors.text} />
                </View>
                <View className="ml-3">
                  <Text className="font-medium" style={{ color: colors.text }}>
                    Products
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {stats.activeProducts} active
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-lg font-semibold" style={{ color: colors.text }}>
                  {stats.totalProducts}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Customers */}
            <TouchableOpacity
              onPress={navigateToCustomers}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: colors.background }}>
                  <Ionicons name="people-outline" size={18} color={colors.text} />
                </View>
                <View className="ml-3">
                  <Text className="font-medium" style={{ color: colors.text }}>
                    Customers
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {stats.activeCustomers} active
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-lg font-semibold" style={{ color: colors.text }}>
                  {stats.totalCustomers}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Orders */}
            <TouchableOpacity
              onPress={navigateToOrders}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                <View
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: colors.background }}>
                  <Ionicons name="receipt-outline" size={18} color={colors.text} />
                </View>
                <View className="ml-3">
                  <Text className="font-medium" style={{ color: colors.text }}>
                    Orders
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    View all orders
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
              RECENT ORDERS
            </Text>
            <TouchableOpacity onPress={navigateToOrders}>
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View
              className="items-center rounded-xl p-8"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Ionicons name="receipt-outline" size={32} color={colors.muted} />
              <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
                No orders yet
              </Text>
              <TouchableOpacity
                onPress={navigateToCreateOrder}
                className="mt-3 rounded-lg px-4 py-2"
                style={{ backgroundColor: colors.primary }}>
                <Text className="text-sm font-medium text-white">Create Order</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              className="overflow-hidden rounded-xl"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              {recentOrders.map((order: any, index: number) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => handleOrderOpen(order.id)}
                  activeOpacity={0.7}
                  className="p-4"
                  style={{
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                  }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="font-medium" style={{ color: colors.text }}>
                          {order.orderNumber}
                        </Text>
                        <StatusBadge status={order.status} colors={colors} />
                      </View>
                      <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                        {order.customer?.businessName || 'Unknown Customer'}
                      </Text>
                    </View>
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      {formatPrice(order.totalAmount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacer */}
        <View className="h-6" />
      </View>
      <OrderDetailModal
        visible={detailModalVisible}
        orderId={selectedOrderId}
        onClose={handleCloseDetailModal}
        onEdit={handleEditOrder}
        onRecordPayment={handleRecordPayment}
      />
      <PaymentModal
        visible={paymentModalVisible}
        orderId={selectedPaymentOrderId}
        onClose={handleClosePaymentModal}
      />

    </ScrollView>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  subtitleColor,
  valueColor,
  colors,
}: {
  title: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  valueColor?: string;
  colors: any;
}) {
  return (
    <View
      className="mb-3 rounded-xl p-4"
      style={{
        width: CARD_WIDTH,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <Text className="mb-2 text-xs font-medium" style={{ color: colors.muted }}>
        {title}
      </Text>
      <Text className="text-xl font-bold" style={{ color: valueColor || colors.text }}>
        {value}
      </Text>
      {subtitle && (
        <Text className="mt-1 text-xs font-medium" style={{ color: subtitleColor || colors.muted }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

// Status Badge Component
function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'confirmed':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'collected':
        return { bg: '#e9d5ff', text: '#9333ea' };
      case 'delivered':
        return { bg: '#d1fae5', text: '#059669' };
      case 'completed':
        return { bg: '#d1fae5', text: '#059669' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: colors.background, text: colors.muted };
    }
  };

  const style = getStatusStyle();

  return (
    <View className="ml-2 rounded px-2 py-0.5" style={{ backgroundColor: style.bg }}>
      <Text className="text-xs font-medium capitalize" style={{ color: style.text }}>
        {status}
      </Text>
    </View>
  );
}
