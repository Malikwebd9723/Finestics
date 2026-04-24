// screens/Vendor/components/PaymentModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchOrderDetails, recordPayment } from 'api/actions/orderActions';
import {
  OrderDetailResponse,
  PAYMENT_METHODS,
  PaymentMethod,
  formatPrice,
} from 'types/order.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvalidateStats } from 'hooks/useInvalidateStats';

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

interface PaymentModalProps {
  visible: boolean;
  orderId: number | null;
  onClose: () => void;
}

export default function PaymentModal({ visible, orderId, onClose }: PaymentModalProps) {
  const { colors } = useThemeContext();
  const invalidateStats = useInvalidateStats();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('cash');

  // Fetch order details to get balance
  const { data: orderData, isLoading: isLoadingOrder } = useQuery<OrderDetailResponse>({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrderDetails(orderId!),
    enabled: !!orderId && visible,
  });

  const order = orderData?.data;
  const balanceAmount = toFiniteNumber(order?.balanceAmount);

  // Reset form when modal opens
  useEffect(() => {
    if (visible && order) {
      setAmount(balanceAmount.toFixed(2));
      setPaymentMethod('cash');
    }
  }, [visible, order, balanceAmount]);

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: () =>
      recordPayment(orderId!, {
        amount: toFiniteNumber(amount),
        paymentMethod,
      }),
    onSuccess: () => {
      Toast.success('Payment recorded successfully!');
      invalidateStats();
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to record payment';
      Dialog.alert('Error', message);
    },
  });

  const handleSubmit = () => {
    const paymentAmount = toFiniteNumber(amount, NaN);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      Dialog.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    if (paymentAmount > balanceAmount) {
      Dialog.alert('Validation Error', 'Amount exceeds balance due');
      return;
    }

    paymentMutation.mutate();
  };

  const handlePayFull = () => {
    setAmount(balanceAmount.toFixed(2));
  };

  const isSubmitting = paymentMutation.isPending;

  // Filter out 'credit' from payment methods for recording payment
  const availableMethods = PAYMENT_METHODS.filter((m) => m.value !== 'credit');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <SafeAreaView className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl" style={{ backgroundColor: colors.card }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between border-b px-5 py-4"
              style={{ borderColor: colors.border }}>
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Record Payment
              </Text>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isLoadingOrder ? (
              <View className="items-center p-8">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : order ? (
              <View className="p-5">
                {/* Order Info */}
                <View
                  className="mb-5 rounded-xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <View className="mb-2 flex-row justify-between">
                    <Text style={{ color: colors.muted }}>Order</Text>
                    <Text className="font-semibold" style={{ color: colors.primary }}>
                      {order.orderNumber}
                    </Text>
                  </View>
                  <View className="mb-2 flex-row justify-between">
                    <Text style={{ color: colors.muted }}>Customer</Text>
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      {order.customer?.businessName}
                    </Text>
                  </View>
                  <View className="mb-2 flex-row justify-between">
                    <Text style={{ color: colors.muted }}>Total Amount</Text>
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      {formatPrice(order.totalAmount)}
                    </Text>
                  </View>
                  <View className="mb-2 flex-row justify-between">
                    <Text style={{ color: colors.muted }}>Already Paid</Text>
                    <Text className="font-semibold" style={{ color: colors.success }}>
                      {formatPrice(order.paidAmount)}
                    </Text>
                  </View>
                  <View
                    className="mt-2 flex-row justify-between border-t pt-2"
                    style={{ borderColor: colors.border }}>
                    <Text className="font-bold" style={{ color: colors.text }}>
                      Balance Due
                    </Text>
                    <Text className="font-bold" style={{ color: colors.error }}>
                      {formatPrice(order.balanceAmount)}
                    </Text>
                  </View>
                </View>

                {/* Amount Input */}
                <View className="mb-4">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      Payment Amount <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TouchableOpacity onPress={handlePayFull}>
                      <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                        Pay Full
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    editable={!isSubmitting}
                    className="rounded-xl px-4 py-3.5 text-lg font-semibold"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                    placeholder="0.00"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>

                {/* Payment Method Selection */}
                <View className="mb-5">
                  <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                    Payment Method
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {availableMethods.map((method) => (
                      <TouchableOpacity
                        key={method.value}
                        onPress={() => setPaymentMethod(method.value)}
                        disabled={isSubmitting}
                        className="rounded-xl px-4 py-2.5"
                        style={{
                          backgroundColor:
                            paymentMethod === method.value ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor:
                            paymentMethod === method.value ? colors.primary : colors.border,
                        }}>
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: paymentMethod === method.value ? '#fff' : colors.text,
                          }}>
                          {method.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSubmitting}
                    className="flex-1 items-center rounded-xl py-3.5"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: isSubmitting ? 0.5 : 1,
                    }}>
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || !amount}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
                    style={{
                      backgroundColor: colors.success,
                      opacity: isSubmitting || !amount ? 0.7 : 1,
                    }}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={18} color="#fff" />
                        <Text className="ml-1 font-semibold text-white">Record Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="items-center p-8">
                <Text style={{ color: colors.muted }}>Order not found</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
