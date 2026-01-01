// screens/Vendor/VanOrdersScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchVans } from 'api/actions/vendorActions';
import { fetchOrdersByVan } from 'api/actions/orderActions';
import { formatPrice, formatShortDate, getStatusColor, getStatusLabel } from 'types/order.types';
import VanOrderDetailsModal from './components/VanOrdersDetailModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VanOrdersScreen({ navigation }: any) {
  const { colors } = useThemeContext();

  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Fetch vans
  const { data: vansData, isLoading: vansLoading } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const vans: string[] = vansData?.data || [];

  // Format date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch orders for selected van
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['vanOrders', selectedVan, dateString],
    queryFn: () => fetchOrdersByVan(selectedVan!, dateString),
    enabled: !!selectedVan,
  });

  const orders = ordersData?.data || [];

  // Calculate totals for selected van
  const totals = orders.reduce(
    (acc: any, order: any) => ({
      count: acc.count + 1,
      amount: acc.amount + parseFloat(order.totalAmount || 0),
      balance: acc.balance + parseFloat(order.balanceAmount || 0),
    }),
    { count: 0, amount: 0, balance: 0 }
  );

  // Date handlers
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedOrderId(null);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b px-4 py-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Orders by Van
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Manage van assignments and deliveries
            </Text>
          </View>
        </View>

        {/* Date Selector */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="flex-row items-center rounded-lg px-3 py-1.5"
          style={{ backgroundColor: colors.background }}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
            {formatDisplayDate(selectedDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Van Selection Tabs */}
      <View style={{ backgroundColor: colors.card }}>
        {vansLoading ? (
          <View className="items-center py-4">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : vans.length === 0 ? (
          <View className="px-4 py-4">
            <Text className="text-center" style={{ color: colors.muted }}>
              No vans configured. Add vans in Business Profile.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 8 }}>
            {vans.map((van) => (
              <TouchableOpacity
                key={van}
                onPress={() => setSelectedVan(van)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: selectedVan === van ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: selectedVan === van ? colors.primary : colors.border,
                }}>
                <Text
                  className="font-medium"
                  style={{
                    color: selectedVan === van ? '#fff' : colors.text,
                  }}>
                  {van}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {!selectedVan ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="car-outline" size={64} color={colors.muted} />
          <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
            Select a Van
          </Text>
          <Text className="mt-2 text-center" style={{ color: colors.muted }}>
            Choose a van above to view its assigned orders
          </Text>
        </View>
      ) : ordersLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.muted }}>
            Loading orders...
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Bar */}
          <View className="flex-row gap-2 px-4 py-3">
            <View
              className="flex-1 rounded-xl p-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Orders
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {totals.count}
              </Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Total
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                {formatPrice(totals.amount)}
              </Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Text className="text-xs" style={{ color: colors.muted }}>
                To Collect
              </Text>
              <Text
                className="text-lg font-bold"
                style={{ color: totals.balance > 0 ? '#f59e0b' : colors.success }}>
                {formatPrice(totals.balance)}
              </Text>
            </View>
          </View>

          {/* Orders List */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }>
            {orders.length === 0 ? (
              <View className="items-center py-16">
                <MaterialIcons name="receipt-long" size={48} color={colors.muted} />
                <Text className="mt-4 text-center" style={{ color: colors.muted }}>
                  No orders assigned to {selectedVan} for {formatDisplayDate(selectedDate)}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {orders.map((order: any, index: number) => (
                  <VanOrderCard
                    key={order.id}
                    order={order}
                    index={index + 1}
                    colors={colors}
                    onPress={() => handleViewOrder(order.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Van Order Details Modal */}
      {selectedOrderId && (
        <VanOrderDetailsModal
          visible={detailModalVisible}
          orderId={selectedOrderId}
          onClose={handleCloseDetailModal}
        />
      )}
    </SafeAreaView>
  );
}

// Van Order Card
interface VanOrderCardProps {
  order: any;
  index: number;
  colors: any;
  onPress: () => void;
}

function VanOrderCard({ order, index, colors, onPress }: VanOrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const itemCount = order.items?.length || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="rounded-xl p-4"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      {/* Header */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="mr-2 h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              {index}
            </Text>
          </View>
          <Text className="font-bold" style={{ color: colors.primary }}>
            {order.orderNumber}
          </Text>
        </View>
        <View className="rounded-full px-2 py-1" style={{ backgroundColor: statusColor + '20' }}>
          <Text className="text-xs font-bold" style={{ color: statusColor }}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      {/* Customer */}
      <View className="mb-3">
        <Text className="font-semibold" style={{ color: colors.text }}>
          {order.customer?.businessName || 'Unknown'}
        </Text>
        <Text className="text-sm" style={{ color: colors.muted }}>
          {order.customer?.contactPerson} • {order.customer?.phone}
        </Text>
        {order.deliveryAddress && (
          <View className="mt-1 flex-row items-start">
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text className="ml-1 flex-1 text-xs" style={{ color: colors.muted }} numberOfLines={2}>
              {order.deliveryAddress}
            </Text>
          </View>
        )}
      </View>

      {/* Items Summary */}
      {order.items && order.items.length > 0 && (
        <View className="mb-3 rounded-lg p-2" style={{ backgroundColor: colors.background }}>
          <Text className="mb-1 text-xs font-semibold" style={{ color: colors.muted }}>
            ITEMS ({itemCount})
          </Text>
          {order.items.slice(0, 3).map((item: any, idx: number) => (
            <View key={idx} className="flex-row justify-between py-0.5">
              <Text className="flex-1 text-sm" style={{ color: colors.text }}>
                {item.productName}
              </Text>
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                {item.orderedQuantity} {item.unit}
              </Text>
            </View>
          ))}
          {order.items.length > 3 && (
            <Text className="mt-1 text-xs" style={{ color: colors.primary }}>
              +{order.items.length - 3} more items
            </Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View
        className="flex-row items-center justify-between border-t pt-2"
        style={{ borderColor: colors.border }}>
        <View className="flex-row items-center gap-2">
          {parseFloat(order.balanceAmount) > 0 ? (
            <View className="flex-row items-center">
              <MaterialIcons name="payments" size={14} color="#f59e0b" />
              <Text className="ml-1 text-xs font-medium" style={{ color: '#f59e0b' }}>
                Collect: {formatPrice(order.balanceAmount)}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text className="ml-1 text-xs font-medium" style={{ color: colors.success }}>
                Paid
              </Text>
            </View>
          )}
        </View>
        <Text className="font-bold" style={{ color: colors.text }}>
          {formatPrice(order.totalAmount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}