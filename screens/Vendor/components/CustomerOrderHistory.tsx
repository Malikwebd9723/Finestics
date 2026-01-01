// screens/Vendor/components/CustomerOrderHistory.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchCustomerOrders } from 'api/actions/orderActions';
import {
  formatPrice,
  formatShortDate,
  getStatusColor,
  getStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from 'types/order.types';
import { useNavigation } from '@react-navigation/native';

interface CustomerOrderHistoryProps {
  customerId: number;
  onViewOrder?: (orderId: number) => void;
  maxOrders?: number;
}

export default function CustomerOrderHistory({
  customerId,
  onViewOrder,
  maxOrders = 5,
}: CustomerOrderHistoryProps) {
  const { colors } = useThemeContext();
  const navigation = useNavigation();
  // Fetch customer orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['customerOrders', customerId],
    queryFn: () => fetchCustomerOrders(customerId, { limit: maxOrders }),
    enabled: !!customerId,
  });

  const orders = data?.data?.orders || [];
  const customer = data?.data?.customer;

    const handleViewCustomerOrders = () => {
    navigation.navigate('CustomerOrdersScreen', {
      customer: customer,
      openOrdersModal: true,
    });
  };

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-6">
        <Text className="text-sm" style={{ color: colors.muted }}>
          Failed to load order history
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View className="items-center py-6">
        <MaterialIcons name="receipt-long" size={32} color={colors.muted} />
        <Text className="mt-2 text-sm" style={{ color: colors.muted }}>
          No orders yet
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Stats Summary */}
      {customer && (
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 rounded-lg p-3" style={{ backgroundColor: colors.background }}>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Total Orders
            </Text>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {data?.data?.totalItems || orders.length}
            </Text>
          </View>
          <View className="flex-1 rounded-lg p-3" style={{ backgroundColor: colors.background }}>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Balance
            </Text>
            <Text
              className="text-lg font-bold"
              style={{
                color: parseFloat(customer.currentBalance) > 0 ? colors.error : colors.success,
              }}>
              {formatPrice(customer.currentBalance)}
            </Text>
          </View>
        </View>
      )}

      {/* Recent Orders */}
      <View className="gap-2">
        {orders.map((order: any) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => onViewOrder?.(order.id)}
            activeOpacity={0.7}
            className="flex-row items-center rounded-lg p-3"
            style={{ backgroundColor: colors.background }}>
            {/* Order Info */}
            <View className="flex-1">
              <View className="mb-1 flex-row items-center gap-2">
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  {order.orderNumber}
                </Text>
                <View
                  className="rounded px-1.5 py-0.5"
                  style={{ backgroundColor: getStatusColor(order.status) + '20' }}>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getStatusColor(order.status) }}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-xs" style={{ color: colors.muted }}>
                  {formatShortDate(order.orderDate)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  {order.items?.length || 0} items
                </Text>
                <View
                  className="rounded px-1.5 py-0.5"
                  style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) + '15' }}>
                  <Text
                    className="text-xs"
                    style={{ color: getPaymentStatusColor(order.paymentStatus) }}>
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount */}
            <View className="items-end">
              <Text className="font-bold" style={{ color: colors.text }}>
                {formatPrice(order.totalAmount)}
              </Text>
              {parseFloat(order.balanceAmount) > 0 && (
                <Text className="text-xs" style={{ color: colors.error }}>
                  Due: {formatPrice(order.balanceAmount)}
                </Text>
              )}
            </View>

            {/* Chevron */}
            {onViewOrder && (
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.muted}
                style={{ marginLeft: 8 }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* View All Link */}
      {data?.data?.totalItems > maxOrders && (
        <TouchableOpacity className="mt-3 items-center py-2" onPress={handleViewCustomerOrders}>
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            View All {data.data.totalItems} Orders →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
