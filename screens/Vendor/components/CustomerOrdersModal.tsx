// screens/Vendor/components/CustomerOrdersModal.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchCustomers } from 'api/actions/customerActions';
import { fetchOrdersByCustomer } from 'api/actions/orderActions';
import {
  formatPrice,
  formatShortDate,
  getStatusColor,
  getStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from 'types/order.types';
import { Customer } from 'types/customer.types';

interface CustomerOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  onViewOrder: (orderId: number) => void;
}

export default function CustomerOrdersModal({
  visible,
  onClose,
  onViewOrder,
}: CustomerOrdersModalProps) {
  const { colors } = useThemeContext();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetchCustomers({ limit: 100 }),
    enabled: visible,
  });

  const customers: Customer[] = customersData?.data || [];

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.businessName?.toLowerCase().includes(query) ||
        c.contactPerson?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
    );
  }, [customers, searchQuery]);

  // Fetch orders for selected customer
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['customerOrders', selectedCustomer?.id, statusFilter],
    queryFn: () =>
      fetchOrdersByCustomer(selectedCustomer!.id, {
        status: statusFilter || undefined,
        limit: 50,
      }),
    enabled: !!selectedCustomer && visible,
  });

  const ordersResponse = ordersData?.data;
  const orders = ordersResponse?.orders || [];
  const stats = ordersResponse?.stats;

  // Reset when closing
  const handleClose = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setStatusFilter(null);
    onClose();
  };

  // Go back to customer list
  const handleBack = () => {
    setSelectedCustomer(null);
    setStatusFilter(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between border-b px-4 py-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={selectedCustomer ? handleBack : handleClose}
              className="mr-3 p-1">
              <Ionicons
                name={selectedCustomer ? 'arrow-back' : 'close'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {selectedCustomer ? selectedCustomer.businessName : 'Orders by Customer'}
              </Text>
              {selectedCustomer && (
                <Text className="text-xs" style={{ color: colors.muted }}>
                  {selectedCustomer.contactPerson} • {selectedCustomer.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {!selectedCustomer ? (
          // Customer Selection View
          <>
            {/* Search Bar */}
            <View className="px-4 py-3">
              <View
                className="flex-row items-center rounded-xl px-4 py-2"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Ionicons name="search" size={18} color={colors.muted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search customers..."
                  placeholderTextColor={colors.placeholder}
                  className="ml-2 flex-1"
                  style={{ color: colors.text }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Customer List */}
            {customersLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4" style={{ color: colors.muted }}>
                  Loading customers...
                </Text>
              </View>
            ) : filteredCustomers.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="people-outline" size={64} color={colors.muted} />
                <Text
                  className="mt-4 text-center text-lg font-semibold"
                  style={{ color: colors.text }}>
                  {searchQuery ? 'No customers found' : 'No customers yet'}
                </Text>
                <Text className="mt-2 text-center" style={{ color: colors.muted }}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Add customers to see their orders here'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedCustomer(item)}
                    activeOpacity={0.7}
                    className="mb-3 rounded-xl p-4"
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <View className="flex-row items-center">
                      <View
                        className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: colors.primary + '20' }}>
                        <Ionicons name="person" size={24} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold" style={{ color: colors.text }}>
                          {item.businessName}
                        </Text>
                        <Text className="text-sm" style={{ color: colors.muted }}>
                          {item.contactPerson} • {item.phone}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        {parseFloat(item.currentBalance as string) > 0 && (
                          <View
                            className="mr-2 rounded-full px-2 py-1"
                            style={{ backgroundColor: colors.error + '15' }}>
                            <Text className="text-xs font-semibold" style={{ color: colors.error }}>
                              {formatPrice(item.currentBalance)} due
                            </Text>
                          </View>
                        )}
                        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        ) : (
          // Customer Orders View
          <>
            {/* Customer Stats */}
            {stats && (
              <View className="flex-row gap-2 px-4 py-3">
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Total Orders
                  </Text>
                  <Text className="text-lg font-bold" style={{ color: colors.text }}>
                    {stats.totalOrders}
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
                    Total Spent
                  </Text>
                  <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                    {formatPrice(stats.totalSpent)}
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
                    Balance
                  </Text>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: stats.totalBalance > 0 ? colors.error : colors.success }}>
                    {formatPrice(stats.totalBalance)}
                  </Text>
                </View>
              </View>
            )}

            {/* Status Filter */}
            <View className="px-4 pb-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setStatusFilter(null)}
                  className="rounded-full px-4 py-2"
                  style={{
                    backgroundColor: !statusFilter ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: !statusFilter ? colors.primary : colors.border,
                    minWidth: 80,
                    alignItems: 'center',
                  }}>
                  <Text
                    className="text-sm font-medium"
                    style={{ color: !statusFilter ? '#fff' : colors.text }}>
                    All
                  </Text>
                </TouchableOpacity>
                {['pending', 'confirmed', 'delivered', 'completed'].map((status) => {
                  const color = getStatusColor(status as any);
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                      className="rounded-full px-4 py-2"
                      style={{
                        backgroundColor: statusFilter === status ? color : colors.card,
                        borderWidth: 1,
                        borderColor: statusFilter === status ? color : colors.border,
                        minWidth: 80,
                        alignItems: 'center',
                      }}>
                      <Text
                        className="text-sm font-medium"
                        style={{ color: statusFilter === status ? '#fff' : colors.text }}>
                        {getStatusLabel(status as any)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Orders List */}
            {ordersLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4" style={{ color: colors.muted }}>
                  Loading orders...
                </Text>
              </View>
            ) : (
              <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
                ListEmptyComponent={
                  <View className="items-center py-16">
                    <MaterialIcons name="receipt-long" size={48} color={colors.muted} />
                    <Text className="mt-4 text-center" style={{ color: colors.muted }}>
                      No orders found for this customer
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <CustomerOrderCard
                    order={item}
                    colors={colors}
                    onPress={() => onViewOrder(item.id)}
                  />
                )}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

// Customer Order Card
interface CustomerOrderCardProps {
  order: any;
  colors: any;
  onPress: () => void;
}

function CustomerOrderCard({ order, colors, onPress }: CustomerOrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const paymentColor = getPaymentStatusColor(order.paymentStatus);
  const itemCount = order.items?.length || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-3 rounded-xl p-4"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      {/* Header */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-bold" style={{ color: colors.primary }}>
          {order.orderNumber}
        </Text>
        <View className="rounded-full px-2 py-1" style={{ backgroundColor: statusColor + '20' }}>
          <Text className="text-xs font-bold" style={{ color: statusColor }}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      {/* Order Details */}
      <View className="mb-2 flex-row items-center gap-4">
        <View className="flex-row items-center">
          <MaterialIcons name="event" size={14} color={colors.muted} />
          <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
            {formatShortDate(order.orderDate)}
          </Text>
        </View>
        {order.deliveryDate && (
          <View className="flex-row items-center">
            <MaterialIcons name="local-shipping" size={14} color={colors.muted} />
            <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
              {formatShortDate(order.deliveryDate)}
            </Text>
          </View>
        )}
        <View className="flex-row items-center">
          <MaterialIcons name="shopping-basket" size={14} color={colors.muted} />
          <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Items Preview */}
      {order.items && order.items.length > 0 && (
        <View className="mb-2 rounded-lg p-2" style={{ backgroundColor: colors.background }}>
          {order.items.slice(0, 2).map((item: any, idx: number) => (
            <View key={idx} className="flex-row justify-between py-0.5">
              <Text className="flex-1 text-sm" style={{ color: colors.text }} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                {item.orderedQuantity} {item.unit}
              </Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <Text className="mt-1 text-xs" style={{ color: colors.primary }}>
              +{order.items.length - 2} more items
            </Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View
        className="flex-row items-center justify-between border-t pt-2"
        style={{ borderColor: colors.border }}>
        <View className="flex-row items-center gap-2">
          <View className="rounded-md px-2 py-1" style={{ backgroundColor: paymentColor + '15' }}>
            <Text className="text-xs font-semibold" style={{ color: paymentColor }}>
              {getPaymentStatusLabel(order.paymentStatus)}
            </Text>
          </View>
          {parseFloat(order.balanceAmount || 0) > 0 && (
            <Text className="text-xs" style={{ color: colors.muted }}>
              Due: {formatPrice(order.balanceAmount)}
            </Text>
          )}
        </View>
        <Text className="font-bold" style={{ color: colors.text }}>
          {formatPrice(order.totalAmount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
