// screens/Vendor/components/OrderTableView.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import {
  formatPrice,
  formatShortDate,
  getStatusColor,
  getStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from 'types/order.types';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string | number;
  balanceAmount: string | number;
  paidAmount?: string | number;
  orderDate: string;
  deliveryDate?: string;
  vanName?: string;
  customer?: {
    businessName?: string;
    contactPerson?: string;
    phone?: string;
  };
  items?: any[];
}

interface OrderTableViewProps {
  orders: Order[];
  onViewOrder: (orderId: number) => void;
  showIndex?: boolean;
  showVan?: boolean;
  showDeliveryDate?: boolean;
  compact?: boolean;
}

export default function OrderTableView({
  orders,
  onViewOrder,
  showIndex = true,
  showVan = false,
  showDeliveryDate = false,
  compact = false,
}: OrderTableViewProps) {
  const { colors } = useThemeContext();

  if (orders.length === 0) {
    return (
      <View className="items-center py-16">
        <MaterialIcons name="receipt-long" size={48} color={colors.muted} />
        <Text className="mt-4 text-center" style={{ color: colors.muted }}>
          No orders found
        </Text>
      </View>
    );
  }

  // Calculate totals (exclude cancelled)
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totals = activeOrders.reduce(
    (acc, order) => ({
      count: acc.count + 1,
      amount: acc.amount + parseFloat(String(order.totalAmount || 0)),
      balance: acc.balance + parseFloat(String(order.balanceAmount || 0)),
      paid: acc.paid + parseFloat(String(order.paidAmount || 0)),
    }),
    { count: 0, amount: 0, balance: 0, paid: 0 }
  );

  return (
    <View className="flex-1">
      {/* Horizontal Scroll for Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Table Header */}
          <View
            className="flex-row border-b"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            {showIndex && (
              <View
                className="w-10 items-center justify-center border-r px-2 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                  #
                </Text>
              </View>
            )}
            <View
              className="w-28 justify-center border-r px-3 py-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                ORDER
              </Text>
            </View>
            <View
              className="w-40 justify-center border-r px-3 py-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                CUSTOMER
              </Text>
            </View>
            <View
              className="w-24 items-center justify-center border-r px-2 py-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                STATUS
              </Text>
            </View>
            <View
              className="w-24 items-center justify-center border-r px-2 py-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                PAYMENT
              </Text>
            </View>
            <View
              className="w-24 items-end justify-center border-r px-3 py-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                TOTAL
              </Text>
            </View>
            <View
              className="w-24 items-end justify-center border-r px-3 py-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                BALANCE
              </Text>
            </View>
            {!compact && (
              <View
                className="w-24 items-center justify-center border-r px-2 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                  DATE
                </Text>
              </View>
            )}
            {showDeliveryDate && (
              <View
                className="w-24 items-center justify-center border-r px-2 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                  DELIVERY
                </Text>
              </View>
            )}
            {showVan && (
              <View
                className="w-20 items-center justify-center border-r px-2 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                  VAN
                </Text>
              </View>
            )}
            {!compact && (
              <View className="w-16 items-center justify-center px-2 py-3">
                <Text className="text-xs font-bold" style={{ color: colors.muted }}>
                  ITEMS
                </Text>
              </View>
            )}
          </View>

          {/* Table Rows */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {orders.map((order, index) => {
              const statusColor = getStatusColor(order.status);
              const paymentColor = getPaymentStatusColor(order.paymentStatus);
              const hasBalance = parseFloat(String(order.balanceAmount || 0)) > 0;
              const isCancelled = order.status === 'cancelled';

              return (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => onViewOrder(order.id)}
                  activeOpacity={0.7}
                  className="flex-row border-b"
                  style={{
                    backgroundColor: isCancelled ? colors.error + '05' : colors.background,
                    borderColor: colors.border,
                  }}>
                  {showIndex && (
                    <View
                      className="w-10 items-center justify-center border-r px-2 py-3"
                      style={{ borderColor: colors.border }}>
                      <Text className="text-sm font-medium" style={{ color: colors.muted }}>
                        {index + 1}
                      </Text>
                    </View>
                  )}
                  <View
                    className="w-28 justify-center border-r px-3 py-3"
                    style={{ borderColor: colors.border }}>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: isCancelled ? colors.muted : colors.primary }}>
                      {order.orderNumber?.split('-').pop() || order.orderNumber}
                    </Text>
                  </View>
                  <View
                    className="w-40 justify-center border-r px-3 py-3"
                    style={{ borderColor: colors.border }}>
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isCancelled ? colors.muted : colors.text }}
                      numberOfLines={1}>
                      {order.customer?.businessName || 'Unknown'}
                    </Text>
                    {!compact && order.customer?.phone && (
                      <Text className="text-xs" style={{ color: colors.muted }} numberOfLines={1}>
                        {order.customer.phone}
                      </Text>
                    )}
                  </View>
                  <View
                    className="w-24 items-center justify-center border-r px-2 py-3"
                    style={{ borderColor: colors.border }}>
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: statusColor + '20' }}>
                      <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="w-24 items-center justify-center border-r px-2 py-3"
                    style={{ borderColor: colors.border }}>
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: paymentColor + '15' }}>
                      <Text className="text-xs font-semibold" style={{ color: paymentColor }}>
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="w-24 items-end justify-center border-r px-3 py-3"
                    style={{ borderColor: colors.border }}>
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: isCancelled ? colors.muted : colors.text,
                        textDecorationLine: isCancelled ? 'line-through' : 'none',
                      }}>
                      {formatPrice(order.totalAmount)}
                    </Text>
                  </View>
                  <View
                    className="w-24 items-end justify-center border-r px-3 py-3"
                    style={{ borderColor: colors.border }}>
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: isCancelled ? colors.muted : hasBalance ? '#f59e0b' : colors.success,
                      }}>
                      {isCancelled ? '—' : hasBalance ? formatPrice(order.balanceAmount) : '—'}
                    </Text>
                  </View>
                  {!compact && (
                    <View
                      className="w-24 items-center justify-center border-r px-2 py-3"
                      style={{ borderColor: colors.border }}>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {formatShortDate(order.orderDate)}
                      </Text>
                    </View>
                  )}
                  {showDeliveryDate && (
                    <View
                      className="w-24 items-center justify-center border-r px-2 py-3"
                      style={{ borderColor: colors.border }}>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {order.deliveryDate ? formatShortDate(order.deliveryDate) : '—'}
                      </Text>
                    </View>
                  )}
                  {showVan && (
                    <View
                      className="w-20 items-center justify-center border-r px-2 py-3"
                      style={{ borderColor: colors.border }}>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {order.vanName || '—'}
                      </Text>
                    </View>
                  )}
                  {!compact && (
                    <View className="w-16 items-center justify-center px-2 py-3">
                      <Text className="text-sm" style={{ color: colors.muted }}>
                        {order.items?.length || 0}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Totals Row */}
            <View
              className="flex-row border-t-2"
              style={{ backgroundColor: colors.card, borderColor: colors.primary }}>
              {showIndex && (
                <View className="w-10 border-r px-2 py-3" style={{ borderColor: colors.border }} />
              )}
              <View
                className="w-28 justify-center border-r px-3 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  TOTAL
                </Text>
              </View>
              <View
                className="w-40 justify-center border-r px-3 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
                  {totals.count} orders
                </Text>
              </View>
              <View className="w-24 border-r px-2 py-3" style={{ borderColor: colors.border }} />
              <View className="w-24 border-r px-2 py-3" style={{ borderColor: colors.border }} />
              <View
                className="w-24 items-end justify-center border-r px-3 py-3"
                style={{ borderColor: colors.border }}>
                <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                  {formatPrice(totals.amount)}
                </Text>
              </View>
              <View
                className="w-24 items-end justify-center border-r px-3 py-3"
                style={{ borderColor: colors.border }}>
                <Text
                  className="text-sm font-bold"
                  style={{ color: totals.balance > 0 ? '#f59e0b' : colors.success }}>
                  {formatPrice(totals.balance)}
                </Text>
              </View>
              {!compact && (
                <View className="w-24 border-r px-2 py-3" style={{ borderColor: colors.border }} />
              )}
              {showDeliveryDate && (
                <View className="w-24 border-r px-2 py-3" style={{ borderColor: colors.border }} />
              )}
              {showVan && (
                <View className="w-20 border-r px-2 py-3" style={{ borderColor: colors.border }} />
              )}
              {!compact && <View className="w-16 px-2 py-3" />}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

// View Toggle Button Component
interface ViewToggleProps {
  viewMode: 'card' | 'table';
  onToggle: (mode: 'card' | 'table') => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  const { colors } = useThemeContext();

  return (
    <View
      className="flex-row rounded-lg p-1"
      style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
      <TouchableOpacity
        onPress={() => onToggle('card')}
        className="flex-row items-center rounded-md px-3 py-1.5"
        style={{ backgroundColor: viewMode === 'card' ? colors.primary : 'transparent' }}>
        <Ionicons
          name="grid-outline"
          size={14}
          color={viewMode === 'card' ? '#fff' : colors.muted}
        />
        <Text
          className="ml-1 text-xs font-medium"
          style={{ color: viewMode === 'card' ? '#fff' : colors.muted }}>
          Cards
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onToggle('table')}
        className="flex-row items-center rounded-md px-3 py-1.5"
        style={{ backgroundColor: viewMode === 'table' ? colors.primary : 'transparent' }}>
        <Ionicons
          name="list-outline"
          size={14}
          color={viewMode === 'table' ? '#fff' : colors.muted}
        />
        <Text
          className="ml-1 text-xs font-medium"
          style={{ color: viewMode === 'table' ? '#fff' : colors.muted }}>
          Table
        </Text>
      </TouchableOpacity>
    </View>
  );
}
