// screens/Vendor/components/OrderDetailModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchOrderDetails,
  updateOrderStatus,
  cancelOrder,
  duplicateOrder,
  deleteOrder,
} from 'api/actions/orderActions';
import ConfirmDeleteModal from 'components/DeleteConfirmationModal';
import {
  Order,
  OrderDetailResponse,
  OrderStatus,
  ORDER_STATUSES,
  formatPrice,
  formatDate,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getItemStatusColor,
  getNextStatuses,
  canUpdateOrder,
  canCancelOrder,
  canReopenOrder,
  canDeleteOrder,
} from 'types/order.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';

const { height } = Dimensions.get('window');

interface OrderDetailModalProps {
  visible: boolean;
  orderId: number | null;
  onClose: () => void;
  onEdit: (orderId: number) => void;
  onRecordPayment: (orderId: number) => void;
}


const generateInvoiceHTML = (order: any) => {
  const formatPrice = (price: number) => `£${Number(price).toFixed(2)}`;
  const itemsRows = order.items
    ?.map(
      (item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.orderedQuantity} ${item.unit}</td>
      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatPrice(item.sellingPrice)}</td>
      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatPrice(item.subtotal)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #1f2937; padding-bottom: 20px; }
          .company-info h1 { margin: 0; font-size: 24px; color: #1f2937; }
          .company-details { font-size: 12px; color: #666; margin-top: 5px; }
          .invoice-title { font-size: 48px; font-weight: bold; color: #1f2937; }
          .invoice-meta { font-size: 12px; margin-top: 20px; }
          .bill-to { background: #1f2937; color: white; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .bill-to h3 { margin: 0 0 10px 0; }
          .bill-to p { margin: 5px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead { background: #1f2937; color: white; }
          th { padding: 12px; text-align: left; font-weight: bold; }
          td { padding: 8px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .summary { margin-top: 30px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .summary-row.total { border-top: 2px solid #1f2937; border-bottom: 2px solid #1f2937; font-weight: bold; font-size: 18px; padding: 12px 0; background: #f3f4f6; }
          .footer { font-size: 11px; color: #666; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          .footer p { margin: 3px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Sunshine Vegetables Ltd</h1>
            <div class="company-details">
              <p>Stand 12, New Spitalfields Market</p>
              <p>Leyton, London E10 5SL</p>
              <p>📞 07876212579</p>
              <p>📧 info@sunshinevegetables.co.uk</p>
              <p>Reg No: 15476589, VAT: 468769910</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">INVOICE</div>
          </div>
        </div>

        <div class="invoice-meta">
          <p><strong>Date:</strong> ${formatDateTime(order.orderDate)}</p>
          <p><strong>Invoice No:</strong> ${order.orderNumber}</p>
          <p><strong>Invoice Type:</strong> ${order.invoiceType || 'credit'}</p>
        </div>

        <div class="bill-to">
          <h3>BILL TO: ${order.customer?.businessName || 'N/A'}</h3>
          <p>Contact: ${order.customer?.contactPerson || 'N/A'} • ${order.customer?.phone || 'N/A'}</p>
          ${order.deliveryAddress ? `<p>${order.deliveryAddress}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(order.subtotal)}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span>${formatPrice(order.deliveryFee)}</span>
          </div>
          ${order.discount > 0 ? `<div class="summary-row"><span>Discount</span><span>-${formatPrice(order.discount)}</span></div>` : ''}
          <div class="summary-row">
            <span>VAT @ %</span>
            <span>${formatPrice(0)}</span>
          </div>
          <div class="summary-row total">
            <span>TOTAL</span>
            <span>${formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        ${order.paymentStatus !== 'paid' ? `
          <div class="summary" style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <div class="summary-row">
              <span>Paid Amount</span>
              <span style="color: #10b981;">${formatPrice(order.paidAmount)}</span>
            </div>
            <div class="summary-row">
              <span>Balance Due</span>
              <span style="color: #ef4444;">${formatPrice(order.balanceAmount)}</span>
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>NO COMPLAINTS OR RETURNS CONSIDERED AFTER 24 HOURS<br>Bank: Metro</p>
          <p>Acc: 55818878 | Sort Code: 23-05-80</p>
          <p style="margin-top: 10px; color: #999;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;
};

const handleGenerateAndShareInvoice = async (order: any) => {
  try {
    const html = generateInvoiceHTML(order);
    const { uri } = await Print.printToFileAsync({ html });
    
    const filename = `${order.customer?.businessName}-${order.orderNumber}-${formatDateTime(order.orderDate).replace(/\//g, '-')}.pdf`;
    const newUri = `${documentDirectory}${filename}`;
    
    await copyAsync({ from: uri, to: newUri });
    await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: filename });
  } catch (error) {
    Alert.alert('Error', 'Failed to generate invoice');
    console.error(error);
  }
};



export default function OrderDetailModal({
  visible,
  orderId,
  onClose,
  onEdit,
  onRecordPayment,
}: OrderDetailModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  // Fetch order details
  const { data, isLoading, error } = useQuery<OrderDetailResponse>({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrderDetails(orderId!),
    enabled: !!orderId && visible,
  });

  const order = data?.data;

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => updateOrderStatus(orderId!, status),
    onSuccess: () => {
      ToastAndroid.show('Order status updated!', ToastAndroid.SHORT);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusMenuVisible(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update status';
      Alert.alert('Error', message);
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelOrder(orderId!, reason),
    onSuccess: () => {
      ToastAndroid.show('Order cancelled!', ToastAndroid.SHORT);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelModalVisible(false);
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to cancel order';
      Alert.alert('Error', message);
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: () => duplicateOrder(orderId!),
    onSuccess: (response) => {
      ToastAndroid.show('Order duplicated!', ToastAndroid.SHORT);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to duplicate order';
      Alert.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteOrder(orderId!),
    onSuccess: () => {
      ToastAndroid.show('Order deleted!', ToastAndroid.SHORT);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete order';
      Alert.alert('Error', message);
    },
  });

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

  const statusColor = order ? getStatusColor(order.status) : '#6b7280';
  const paymentColor = order ? getPaymentStatusColor(order.paymentStatus) : '#6b7280';

  // Get available statuses (all except current)
  const availableStatuses = order ? getNextStatuses(order.status) : [];
  const isCancelled = order?.status === 'cancelled';

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
              Order Details
            </Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading order...
              </Text>
            </View>
          ) : error || !order ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.error} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                Failed to load order
              </Text>
            </View>
          ) : (
            <>
              <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
                {/* Order Header Card */}
                <View
                  className="mb-4 rounded-2xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                      {order.orderNumber}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setStatusMenuVisible(!statusMenuVisible)}
                      className="flex-row items-center rounded-full px-3 py-1.5"
                      style={{ backgroundColor: statusColor + '20' }}>
                      <Text className="text-sm font-bold" style={{ color: statusColor }}>
                        {getStatusLabel(order.status)}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={18} color={statusColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Status Menu Dropdown - Now shows ALL statuses */}
                  {statusMenuVisible && (
                    <View
                      className="mb-3 rounded-xl p-2"
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}>
                      <Text
                        className="mb-2 px-2 text-xs font-semibold"
                        style={{ color: colors.muted }}>
                        {isCancelled ? 'Reopen Order As:' : 'Change Status To:'}
                      </Text>
                      {availableStatuses.map((status) => {
                        const color = getStatusColor(status);
                        return (
                          <TouchableOpacity
                            key={status}
                            onPress={() => statusMutation.mutate({ status })}
                            disabled={statusMutation.isPending}
                            className="mb-1 flex-row items-center rounded-lg px-3 py-2.5"
                            style={{ backgroundColor: color + '15' }}>
                            <View
                              className="mr-2 h-3 w-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <Text className="flex-1 font-semibold" style={{ color }}>
                              {getStatusLabel(status)}
                            </Text>
                            {statusMutation.isPending && (
                              <ActivityIndicator
                                size="small"
                                color={color}
                                style={{ marginLeft: 8 }}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Cancelled Info */}
                  {isCancelled && order.cancelledAt && (
                    <View
                      className="mb-3 rounded-lg p-3"
                      style={{ backgroundColor: colors.error + '10' }}>
                      <View className="flex-row items-center">
                        <MaterialIcons name="cancel" size={16} color={colors.error} />
                        <Text
                          className="ml-2 text-sm font-semibold"
                          style={{ color: colors.error }}>
                          Cancelled on {formatDate(order.cancelledAt)}
                        </Text>
                      </View>
                      {order.cancellationReason && (
                        <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                          Reason: {order.cancellationReason}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Dates */}
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        Order Date
                      </Text>
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {formatDate(order.orderDate)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        Delivery Date
                      </Text>
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {formatDate(order.deliveryDate)}
                      </Text>
                    </View>
                  </View>

                  {order.vanName && (
                    <View className="mt-3 flex-row items-center">
                      <MaterialIcons name="local-shipping" size={16} color={colors.muted} />
                      <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                        {order.vanName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Customer Card */}
                <View
                  className="mb-4 rounded-2xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <View className="mb-3 flex-row items-center">
                    <Ionicons name="person" size={18} color={colors.primary} />
                    <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                      Customer
                    </Text>
                  </View>
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {order.customer?.businessName}
                  </Text>
                  <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
                    {order.customer?.contactPerson} • {order.customer?.phone}
                  </Text>
                  {order.deliveryAddress && (
                    <View className="mt-2 flex-row items-start">
                      <MaterialIcons name="location-on" size={14} color={colors.muted} />
                      <Text className="ml-1 flex-1 text-xs" style={{ color: colors.muted }}>
                        {order.deliveryAddress}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payment Card */}
                <View
                  className="mb-4 rounded-2xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <MaterialIcons name="payment" size={18} color={colors.primary} />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        Payment
                      </Text>
                    </View>
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: paymentColor + '20' }}>
                      <Text className="text-xs font-bold" style={{ color: paymentColor }}>
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Subtotal</Text>
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        {formatPrice(order.subtotal)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Delivery Fee</Text>
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        {formatPrice(order.deliveryFee)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Discount</Text>
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        -{formatPrice(order.discount)}
                      </Text>
                    </View>
                    <View
                      className="mt-2 flex-row justify-between border-t pt-2"
                      style={{ borderColor: colors.border }}>
                      <Text className="text-base font-bold" style={{ color: colors.text }}>
                        Total
                      </Text>
                      <Text className="text-base font-bold" style={{ color: colors.primary }}>
                        {formatPrice(order.totalAmount)}
                      </Text>
                    </View>
                    {order.paymentStatus !== 'paid' && (
                      <>
                        <View className="flex-row justify-between">
                          <Text style={{ color: colors.muted }}>Paid</Text>
                          <Text className="font-semibold" style={{ color: colors.success }}>
                            {formatPrice(order.paidAmount)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text style={{ color: colors.muted }}>Balance Due</Text>
                          <Text className="font-semibold" style={{ color: colors.error }}>
                            {formatPrice(order.balanceAmount)}
                          </Text>
                        </View>
                      </>
                    )}
                    <View className="flex-row justify-between">
                      <Text style={{ color: colors.muted }}>Method</Text>
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Order Items */}
                <View
                  className="mb-4 rounded-2xl p-4"
                  style={{ backgroundColor: colors.background }}>
                  <View className="mb-3 flex-row items-center">
                    <MaterialIcons name="shopping-basket" size={18} color={colors.primary} />
                    <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                      Items ({order.items?.length || 0})
                    </Text>
                  </View>

                  {order.items?.map((item, index) => {
                    const itemStatusColor = getItemStatusColor(item.status);
                    return (
                      <View
                        key={item.id}
                        className={`py-3 ${index > 0 ? 'border-t' : ''}`}
                        style={{ borderColor: colors.border }}>
                        <View className="flex-row items-start justify-between">
                          <View className="mr-3 flex-1">
                            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                              {item.productName}
                            </Text>
                            <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                              {formatPrice(item.sellingPrice)} × {item.orderedQuantity} {item.unit}
                            </Text>
                            {item.deliveredQuantity > 0 &&
                              item.deliveredQuantity !== item.orderedQuantity && (
                                <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                                  Delivered: {item.deliveredQuantity} {item.unit}
                                </Text>
                              )}
                          </View>
                          <View className="items-end">
                            <Text className="font-bold" style={{ color: colors.text }}>
                              {formatPrice(item.subtotal)}
                            </Text>
                            <View
                              className="mt-1 rounded px-1.5 py-0.5"
                              style={{ backgroundColor: itemStatusColor + '20' }}>
                              <Text
                                className="text-xs font-semibold"
                                style={{ color: itemStatusColor }}>
                                {item.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {item.notes && (
                          <Text className="mt-1 text-xs italic" style={{ color: colors.muted }}>
                            Note: {item.notes}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Notes */}
                {order.notes && (
                  <View
                    className="mb-4 rounded-2xl p-4"
                    style={{ backgroundColor: colors.background }}>
                    <View className="mb-2 flex-row items-center">
                      <MaterialIcons name="notes" size={18} color={colors.primary} />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        Notes
                      </Text>
                    </View>
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {order.notes}
                    </Text>
                  </View>
                )}

                {/* Spacer */}
                <View className="h-4" />
              </ScrollView>

              {/* Action Buttons */}
              <View className="border-t px-5 py-4" style={{ borderColor: colors.border }}>
                {/* Primary Actions Row */}
                {/* Generate Invoice Button */}

                <View className="mb-3 flex-row gap-3">
                  {/* Record Payment - Always show (allows adjustments) */}
                  <TouchableOpacity
                    onPress={() => handleGenerateAndShareInvoice(order)}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                    style={{ backgroundColor: colors.primary }}>
                    <MaterialIcons name="picture-as-pdf" size={18} color="#fff" />
                    <Text className="ml-2 text-sm font-bold text-white">Invoice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onRecordPayment(orderId!)}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                    style={{ backgroundColor: colors.success }}>
                    <MaterialIcons name="payment" size={18} color="#fff" />
                    <Text className="ml-2 text-sm font-bold text-white">
                      {order.paymentStatus === 'paid' ? 'Adjust Payment' : 'Record Payment'}
                    </Text>
                  </TouchableOpacity>

                  {/* Edit - for non-completed, non-cancelled */}
                  {canUpdateOrder(order.status) && !isCancelled && (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        setTimeout(() => onEdit(orderId!), 300);
                      }}
                      className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                      style={{ backgroundColor: colors.primary }}>
                      <MaterialIcons name="edit" size={18} color="#fff" />
                      <Text className="ml-2 text-sm font-bold text-white">Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Secondary Actions Row */}
                {/* Secondary Actions Row */}
                <View className="flex-row gap-3">
                  {/* Duplicate - always available */}
                  <TouchableOpacity
                    onPress={() => duplicateMutation.mutate()}
                    disabled={duplicateMutation.isPending}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    {duplicateMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <MaterialIcons name="content-copy" size={16} color={colors.text} />
                        <Text
                          className="ml-1.5 text-sm font-semibold"
                          style={{ color: colors.text }}>
                          Duplicate
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Cancel button - only for non-cancelled, non-pending orders */}
                  {canCancelOrder(order.status) && !canDeleteOrder(order.status) && (
                    <TouchableOpacity
                      onPress={() => setCancelModalVisible(true)}
                      className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                      style={{
                        backgroundColor: colors.error + '15',
                        borderWidth: 1,
                        borderColor: colors.error,
                      }}>
                      <MaterialIcons name="cancel" size={16} color={colors.error} />
                      <Text
                        className="ml-1.5 text-sm font-semibold"
                        style={{ color: colors.error }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* For pending: show both Cancel and Delete */}
                  {order.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        onPress={() => setCancelModalVisible(true)}
                        className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                        style={{
                          backgroundColor: colors.error + '15',
                          borderWidth: 1,
                          borderColor: colors.error,
                        }}>
                        <MaterialIcons name="cancel" size={16} color={colors.error} />
                        <Text
                          className="ml-1.5 text-sm font-semibold"
                          style={{ color: colors.error }}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDeleteModalVisible(true)}
                        className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                        style={{
                          backgroundColor: colors.error,
                        }}>
                        <MaterialIcons name="delete" size={16} color="#fff" />
                        <Text className="ml-1.5 text-sm font-semibold text-white">Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Delete button - only for cancelled orders */}
                  {order.status === 'cancelled' && (
                    <TouchableOpacity
                      onPress={() => setDeleteModalVisible(true)}
                      className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                      style={{
                        backgroundColor: colors.error,
                      }}>
                      <MaterialIcons name="delete" size={16} color="#fff" />
                      <Text className="ml-1.5 text-sm font-semibold text-white">Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Reopen hint for cancelled orders - separate row if needed */}
                {isCancelled && (
                  <View className="mt-3 flex-row items-center justify-center">
                    <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
                    <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                      Use status dropdown above to reopen this order
                    </Text>
                  </View>
                )}
              </View>

              {/* Cancel Confirmation Modal */}
              <ConfirmDeleteModal
                visible={cancelModalVisible}
                loading={cancelMutation.isPending}
                title="Cancel Order?"
                message="Are you sure you want to cancel this order? You can reopen it later by changing the status."
                onCancel={() => setCancelModalVisible(false)}
                onConfirm={() => cancelMutation.mutate()}
              />

              {/* Delete Confirmation Modal */}
              <ConfirmDeleteModal
                visible={deleteModalVisible}
                loading={deleteMutation.isPending}
                title="Delete Order?"
                message="This will permanently delete the order. This action cannot be undone."
                onCancel={() => setDeleteModalVisible(false)}
                onConfirm={() => deleteMutation.mutate()}
              />
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
