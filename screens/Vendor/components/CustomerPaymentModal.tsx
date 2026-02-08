// screens/Vendor/components/CustomerPaymentModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchCustomerPaymentDetail,
  fetchCustomerLedger,
  CustomerDetailSummary,
  LedgerData,
} from 'api/actions/paymentActions';
import { formatPrice, formatShortDate, formatDate, getPaymentStatusColor } from 'types/order.types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface CustomerPaymentModalProps {
  visible: boolean;
  customerId: number | null;
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}

export default function CustomerPaymentModal({
  visible,
  customerId,
  startDate,
  endDate,
  onClose,
}: CustomerPaymentModalProps) {
  const { colors } = useThemeContext();
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Fetch customer payment detail
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['payments', 'customer', customerId, startDate, endDate],
    queryFn: () =>
      fetchCustomerPaymentDetail(customerId!, {
        startDate,
        endDate,
      }),
    enabled: !!customerId && visible,
  });

  // Fetch customer ledger
  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ['payments', 'customer', 'ledger', customerId, startDate, endDate],
    queryFn: () =>
      fetchCustomerLedger(customerId!, {
        startDate,
        endDate,
        limit: 50,
      }),
    enabled: !!customerId && visible,
  });

  const detail: CustomerDetailSummary | null = detailData?.data || null;
  const ledger: LedgerData | null = ledgerData?.data || null;

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const isLoading = detailLoading && !detail;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            height: height * 0.85,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 20,
          }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Payment Details
            </Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading details...
              </Text>
            </View>
          ) : detail ? (
            <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Customer Info */}
              <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: colors.background }}>
                <View className="flex-row items-center">
                  <View
                    className="h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primary + '15' }}>
                    <MaterialIcons name="person" size={28} color={colors.primary} />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>
                      {detail.customer.businessName}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.muted }}>
                      {detail.customer.contactPerson} • {detail.customer.phone}
                    </Text>
                    {detail.customer.paymentTerms && (
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {detail.customer.paymentTerms}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Summary Cards */}
              <View className="mb-4 flex-row gap-3">
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="text-lg font-bold" style={{ color: colors.text }}>
                    {formatPrice(detail.summary.totalAmount)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Total Sales
                  </Text>
                </View>
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="text-lg font-bold" style={{ color: colors.success }}>
                    {formatPrice(detail.summary.totalPaid)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Collected
                  </Text>
                </View>
              </View>

              <View className="mb-4 flex-row gap-3">
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{
                    backgroundColor: colors.error + '10',
                    borderWidth: 1,
                    borderColor: colors.error + '30',
                  }}>
                  <Text className="text-lg font-bold" style={{ color: colors.error }}>
                    {formatPrice(detail.summary.totalBalance)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Balance Due
                  </Text>
                </View>
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                    {detail.summary.totalOrders}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Orders ({formatPrice(detail.summary.avgOrderValue)} avg)
                  </Text>
                </View>
              </View>

              {/* Payment Status Breakdown */}
              <View
                className="mb-4 rounded-xl p-4"
                style={{ backgroundColor: colors.background }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  PAYMENT STATUS
                </Text>
                <View className="flex-row gap-3">
                  {[
                    { key: 'paid' as const, label: 'Paid', color: colors.success },
                    { key: 'partial' as const, label: 'Partial', color: '#f59e0b' },
                    { key: 'unpaid' as const, label: 'Unpaid', color: colors.error },
                  ].map((status) => (
                    <View
                      key={status.key}
                      className="flex-1 items-center rounded-lg p-2"
                      style={{ backgroundColor: status.color + '15' }}>
                      <Text className="text-lg font-bold" style={{ color: status.color }}>
                        {detail.byPaymentStatus[status.key]?.count || 0}
                      </Text>
                      <Text className="text-xs" style={{ color: status.color }}>
                        {status.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recent Unpaid Orders */}
              {detail.recentUnpaidOrders.length > 0 && (
                <View
                  className="mb-4 rounded-xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                    UNPAID ORDERS
                  </Text>
                  {detail.recentUnpaidOrders.map((order, idx) => (
                    <View
                      key={order.id}
                      className={`flex-row items-center justify-between py-2 ${idx > 0 ? 'border-t' : ''}`}
                      style={{ borderColor: colors.border }}>
                      <View>
                        <Text className="text-sm font-medium" style={{ color: colors.text }}>
                          {order.orderNumber}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.muted }}>
                          {formatShortDate(order.orderDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold" style={{ color: colors.error }}>
                          {formatPrice(order.balanceAmount)}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.muted }}>
                          of {formatPrice(order.totalAmount)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Ledger */}
              {ledger && (
                <View className="mb-4 rounded-xl p-4" style={{ backgroundColor: colors.background }}>
                  <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                    LEDGER
                  </Text>

                  {/* Ledger Summary */}
                  <View
                    className="mb-3 flex-row gap-3 rounded-lg p-3"
                    style={{ backgroundColor: colors.card }}>
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        Opening
                      </Text>
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>
                        {formatPrice(ledger.openingBalance)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        Closing
                      </Text>
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>
                        {formatPrice(ledger.closingBalance)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        Net
                      </Text>
                      <Text
                        className="text-sm font-bold"
                        style={{
                          color: ledger.summary.netMovement >= 0 ? colors.error : colors.success,
                        }}>
                        {ledger.summary.netMovement >= 0 ? '+' : ''}
                        {formatPrice(ledger.summary.netMovement)}
                      </Text>
                    </View>
                  </View>

                  {/* Ledger Entries */}
                  {ledgerLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : ledger.entries.length === 0 ? (
                    <Text className="py-4 text-center text-sm" style={{ color: colors.muted }}>
                      No entries in this period
                    </Text>
                  ) : (
                    <>
                      {/* Header */}
                      <View className="mb-1 flex-row items-center py-1">
                        <Text className="flex-1 text-xs font-semibold" style={{ color: colors.muted }}>
                          Date
                        </Text>
                        <Text
                          className="w-20 text-right text-xs font-semibold"
                          style={{ color: colors.muted }}>
                          Debit
                        </Text>
                        <Text
                          className="w-20 text-right text-xs font-semibold"
                          style={{ color: colors.muted }}>
                          Credit
                        </Text>
                        <Text
                          className="w-20 text-right text-xs font-semibold"
                          style={{ color: colors.muted }}>
                          Balance
                        </Text>
                      </View>

                      {ledger.entries.map((entry, idx) => (
                        <View
                          key={idx}
                          className={`flex-row items-center py-2 ${idx > 0 ? 'border-t' : ''}`}
                          style={{ borderColor: colors.border }}>
                          <View className="flex-1">
                            <Text className="text-xs" style={{ color: colors.text }}>
                              {formatShortDate(entry.date)}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.muted }} numberOfLines={1}>
                              {entry.description}
                            </Text>
                          </View>
                          <Text
                            className="w-20 text-right text-xs font-medium"
                            style={{ color: entry.debit > 0 ? colors.error : colors.muted }}>
                            {entry.debit > 0 ? formatPrice(entry.debit) : '-'}
                          </Text>
                          <Text
                            className="w-20 text-right text-xs font-medium"
                            style={{ color: entry.credit > 0 ? colors.success : colors.muted }}>
                            {entry.credit > 0 ? formatPrice(entry.credit) : '-'}
                          </Text>
                          <Text
                            className="w-20 text-right text-xs font-bold"
                            style={{ color: colors.text }}>
                            {formatPrice(entry.balance)}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {/* Credit Info */}
              {detail.customer.creditLimit > 0 && (
                <View
                  className="mb-4 rounded-xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="mb-2 text-sm font-semibold" style={{ color: colors.muted }}>
                    CREDIT INFO
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {formatPrice(detail.customer.currentBalance)} of{' '}
                      {formatPrice(detail.customer.creditLimit)}
                    </Text>
                    <Text
                      className="text-sm font-bold"
                      style={{
                        color:
                          detail.customer.creditUtilization > 80
                            ? colors.error
                            : detail.customer.creditUtilization > 50
                              ? '#f59e0b'
                              : colors.success,
                      }}>
                      {detail.customer.creditUtilization}% used
                    </Text>
                  </View>
                  <View
                    className="mt-2 h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: colors.border }}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(detail.customer.creditUtilization, 100)}%`,
                        backgroundColor:
                          detail.customer.creditUtilization > 80
                            ? colors.error
                            : detail.customer.creditUtilization > 50
                              ? '#f59e0b'
                              : colors.success,
                      }}
                    />
                  </View>
                </View>
              )}

              <View className="h-8" />
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.muted} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                No data available
              </Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
