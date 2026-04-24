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
  TouchableOpacity,
  Alert,
} from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
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
import { fetchVendorProfile } from 'api/actions/vendorActions';
import ConfirmDeleteModal from 'components/DeleteConfirmationModal';
import {
  OrderDetailResponse,
  OrderStatus,
  formatPrice,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getItemStatusColor,
  getNextStatuses,
  canUpdateOrder,
  canCancelOrder,
  canDeleteOrder,
} from 'types/order.types';
import { canProcessReturn, getReturnActionColor, getReturnActionLabel } from 'types/return.types';
import ProcessReturnModal from './ProcessReturnModal';
import ReturnDetailModal from './ReturnDetailModal';
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


const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const sanitizeFilename = (value: unknown): string =>
  String(value ?? '')
    .replace(/[\\/:*?"<>|\r\n]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'invoice';

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

const generateInvoiceHTML = (order: any, vendor: any) => {
  const formatPrice = (price: number) => `£${toNumber(price).toFixed(2)}`;

  // Build a map of return info per order item (for the per-line "Returned" label)
  const returnInfoByItemId: Record<number, { returnedQty: number; actions: string[] }> = {};
  if (order.returns && order.returns.length > 0) {
    for (const ret of order.returns) {
      for (const ri of ret.items || []) {
        if (!returnInfoByItemId[ri.orderItemId]) {
          returnInfoByItemId[ri.orderItemId] = { returnedQty: 0, actions: [] };
        }
        returnInfoByItemId[ri.orderItemId].returnedQty += toNumber(ri.quantity);
        const label = ri.action === 'credit' ? 'Credit' : ri.action === 'refund' ? 'Refund' : 'Replace';
        if (!returnInfoByItemId[ri.orderItemId].actions.includes(label)) {
          returnInfoByItemId[ri.orderItemId].actions.push(label);
        }
      }
    }
  }

  // Per-line: prefer backend-computed netQuantity / netSubtotal (§3.2 fix).
  // Fallback to the local calculation for older API responses so old builds still work.
  const itemsRows = (order.items || [])
    .map((item: any) => {
      const ordered = toNumber(item.orderedQuantity);
      const returned = toNumber(item.returnedQuantity);
      const netQuantity =
        item.netQuantity != null ? toNumber(item.netQuantity) : Math.max(0, ordered - returned);
      const netSubtotal =
        item.netSubtotal != null
          ? toNumber(item.netSubtotal)
          : netQuantity * toNumber(item.sellingPrice);

      const ri = returnInfoByItemId[item.id];
      const returnLabel = ri
        ? `<div style="font-size: 11px; margin-top: 3px;">
            <span style="color: #f59e0b; font-weight: bold;">Returned: ${escapeHtml(ri.returnedQty)} ${escapeHtml(item.unit)}</span>
            ${ri.actions
              .map((a: string) => {
                const color = a === 'Credit' ? '#10b981' : a === 'Refund' ? '#ef4444' : '#3b82f6';
                return `<span style="background: ${color}20; color: ${color}; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; margin-left: 4px;">${escapeHtml(a)}</span>`;
              })
              .join('')}
          </div>`
        : '';

      const quantityCell =
        returned > 0
          ? `${escapeHtml(netQuantity)} ${escapeHtml(item.unit)} <span style="color: #9ca3af; font-size: 10px;">(of ${escapeHtml(ordered)})</span>`
          : `${escapeHtml(ordered)} ${escapeHtml(item.unit)}`;

      return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.productName)}${returnLabel}</td>
      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">${quantityCell}</td>
      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatPrice(toNumber(item.sellingPrice))}</td>
      <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatPrice(netSubtotal)}</td>
    </tr>`;
    })
    .join('');

  // Vendor business details
  const businessName = vendor?.businessName || 'Business Name';
  const businessPhone = vendor?.businessPhone || '';
  const address = vendor?.address
    ? [vendor.address.street, vendor.address.city, vendor.address.postcode]
        .filter(Boolean)
        .join(', ')
    : '';

  const returnsValue = toNumber(order.returnsValue);
  const discount = toNumber(order.discount);
  const customerName = order.customer?.businessName || 'N/A';
  const customerPhone = order.customer?.phone || 'N/A';

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 14px; color: #333; font-size: 13px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 2px solid #1f2937; padding-bottom: 12px; }
          .company-info h1 { margin: 0; font-size: 20px; color: #1f2937; }
          .company-details { font-size: 11px; color: #666; margin-top: 3px; }
          .company-details p { margin: 1px 0; }
          .invoice-title { font-size: 32px; font-weight: bold; color: #1f2937; }
          .invoice-desc { font-size: 18px; font-weight: bold; color: #1f2937; }
          .invoice-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          thead { background: #1f2937; color: white; }
          th { padding: 8px; text-align: left; font-weight: bold; font-size: 12px; }
          td { padding: 6px 8px; font-size: 12px; }
          .summary { margin-top: 16px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .summary-row.total { border-top: 2px solid #1f2937; border-bottom: 2px solid #1f2937; font-weight: bold; font-size: 16px; padding: 8px 0; background: #f3f4f6; }
          .footer { font-size: 10px; color: #666; margin-top: 16px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
          .footer p { margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${escapeHtml(businessName)}</h1>
            <div class="company-details">
              ${address ? `<p>${escapeHtml(address)}</p>` : ''}
              ${businessPhone ? `<p>Tel: ${escapeHtml(businessPhone)}</p>` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-desc">${escapeHtml(customerName)}</div>
          </div>
        </div>

        <div class="invoice-meta">
        <div class="bill-to">
        <h3>BILL TO: ${escapeHtml(customerName)}</h3>
        <p>Contact: ${escapeHtml(customerPhone)}</p>
        ${order.deliveryAddress ? `<p>${escapeHtml(order.deliveryAddress)}</p>` : ''}
        </div>

        <div>
          <p><strong>Date:</strong> ${escapeHtml(formatDate(order.orderDate))}</p>
          <p><strong>Invoice No:</strong> ${escapeHtml(order.orderNumber)}</p>
          <p><strong>Invoice Type:</strong> ${escapeHtml(order.invoiceType || 'credit')}</p>
        </div>
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
            <span>${formatPrice(toNumber(order.subtotal))}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span>${formatPrice(toNumber(order.deliveryFee))}</span>
          </div>
          ${discount > 0 ? `<div class="summary-row"><span>Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
          ${returnsValue > 0 ? `<div class="summary-row"><span>Returns / Refunds</span><span style="color: #ef4444;">-${formatPrice(returnsValue)}</span></div>` : ''}
          <div class="summary-row total">
            <span>TOTAL</span>
            <span>${formatPrice(toNumber(order.totalAmount))}</span>
          </div>
        </div>

        ${order.paymentStatus !== 'paid' ? `
          <div class="summary" style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <div class="summary-row">
              <span>Paid Amount</span>
              <span style="color: #10b981;">${formatPrice(toNumber(order.paidAmount))}</span>
            </div>
            <div class="summary-row">
              <span>Balance Due</span>
              <span style="color: #ef4444;">${formatPrice(toNumber(order.balanceAmount))}</span>
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p style="margin-top: 10px; color: #999;">Generated on ${escapeHtml(new Date().toLocaleDateString())}</p>
        </div>
      </body>
    </html>
  `;
};

const getInvoiceFilename = (order: any) => {
  const customer = sanitizeFilename(order.customer?.businessName || 'invoice');
  const orderNumber = sanitizeFilename(order.orderNumber || '');
  const date = sanitizeFilename(formatDate(order.orderDate).replace(/\//g, '-'));
  return `${customer}-${orderNumber}-${date}.pdf`;
};

const handleGenerateAndShareInvoice = async (order: any, vendor: any) => {
  try {
    const html = generateInvoiceHTML(order, vendor);
    const { uri } = await Print.printToFileAsync({ html });

    const filename = getInvoiceFilename(order);
    const newUri = `${documentDirectory}${filename}`;

    await copyAsync({ from: uri, to: newUri });
    await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: filename });
  } catch (error) {
    Dialog.alert('Error', 'Failed to generate invoice');
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
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnDetailId, setReturnDetailId] = useState<number | null>(null);
  const [returnDetailVisible, setReturnDetailVisible] = useState(false);

  // Fetch order details
  const { data, isLoading, error } = useQuery<OrderDetailResponse>({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrderDetails(orderId!),
    enabled: !!orderId && visible,
  });

  // Fetch vendor profile for invoice
  const { data: vendorData } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: fetchVendorProfile,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const order = data?.data;
  const vendor = vendorData?.data;

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => updateOrderStatus(orderId!, status),
    onSuccess: () => {
      Toast.success('Order status updated!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusMenuVisible(false);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update status';
      Dialog.alert('Error', message);
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelOrder(orderId!, reason),
    onSuccess: () => {
      Toast.success('Order cancelled!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCancelModalVisible(false);
      onClose();
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to cancel order';
      Dialog.alert('Error', message);
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: () => duplicateOrder(orderId!),
    onSuccess: (response) => {
      Toast.success('Order duplicated!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to duplicate order';
      Dialog.alert('Error', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteOrder(orderId!),
    onSuccess: () => {
      Toast.success('Order deleted!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to delete order';
      Dialog.alert('Error', message);
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

                    {/* Profit — authoritative values from the backend */}
                    {order.grossProfit != null && (
                      <View className="mt-2 border-t pt-2" style={{ borderColor: colors.border }}>
                        <View className="flex-row justify-between">
                          <Text style={{ color: colors.muted }}>Cost</Text>
                          <Text className="font-semibold" style={{ color: colors.text }}>
                            {formatPrice(order.totalCost ?? 0)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text style={{ color: colors.muted }}>Profit</Text>
                          <Text className="font-bold" style={{ color: (order.grossProfit ?? 0) >= 0 ? colors.success : colors.error }}>
                            {formatPrice(order.grossProfit ?? 0)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text style={{ color: colors.muted }}>Margin</Text>
                          <Text className="font-semibold" style={{ color: (order.grossProfit ?? 0) >= 0 ? colors.success : colors.error }}>
                            {(order.grossMargin ?? 0).toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    )}
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
                            {parseFloat(String(item.returnedQuantity || 0)) > 0 && (
                              <Text className="mt-0.5 text-xs" style={{ color: '#f59e0b' }}>
                                Returned: {item.returnedQuantity} {item.unit}
                              </Text>
                            )}
                            {/* Show replace indicator from returns data */}
                            {order.returns?.some((r) =>
                              r.items?.some(
                                (ri) => ri.orderItemId === item.id && ri.action === 'replace_next_order'
                              )
                            ) && (
                              <Text className="mt-0.5 text-xs" style={{ color: '#3b82f6' }}>
                                Replacement scheduled for next order
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

                {/* Return History */}
                {order.returns && order.returns.length > 0 && (
                  <View
                    className="mb-4 rounded-2xl p-4"
                    style={{ backgroundColor: colors.background }}>
                    <View className="mb-3 flex-row items-center">
                      <MaterialIcons name="assignment-return" size={18} color="#f59e0b" />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        Returns ({order.returns.length})
                      </Text>
                    </View>
                    {order.returns.map((ret) => (
                      <TouchableOpacity
                        key={ret.id}
                        onPress={() => {
                          setReturnDetailId(ret.id);
                          setReturnDetailVisible(true);
                        }}
                        className="py-2 border-b"
                        style={{ borderColor: colors.border }}>
                        <View className="flex-row justify-between">
                          <Text className="text-sm" style={{ color: colors.text }}>
                            {formatDate(ret.returnDate)}
                          </Text>
                          <Text className="text-sm font-bold" style={{ color: colors.error }}>
                            -{formatPrice(ret.totalRefundAmount)}
                          </Text>
                        </View>
                        {/* Returned item names */}
                        {ret.items && ret.items.length > 0 && (
                          <View className="mt-1.5 gap-1">
                            {ret.items.map((ri) => {
                              const actionColor = getReturnActionColor(ri.action);
                              return (
                                <View key={ri.id} className="flex-row items-center">
                                  <View
                                    className="rounded px-1.5 py-0.5 mr-1.5"
                                    style={{ backgroundColor: actionColor + '20' }}>
                                    <Text className="text-xs font-semibold" style={{ color: actionColor }}>
                                      {getReturnActionLabel(ri.action)}
                                    </Text>
                                  </View>
                                  <Text className="text-xs flex-1" style={{ color: colors.text }} numberOfLines={1}>
                                    {ri.product?.name || 'Item'} — {ri.quantity} {ri.product?.unit || ''}
                                  </Text>
                                  {ri.action !== 'replace_next_order' && (
                                    <Text className="text-xs font-semibold" style={{ color: colors.muted }}>
                                      {formatPrice(ri.refundAmount)}
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}
                        {ret.notes && (
                          <Text className="mt-1.5 text-xs italic" style={{ color: colors.muted }}>
                            {ret.notes}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

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
                  {/* Payment */}
                  <TouchableOpacity
                    onPress={() => onRecordPayment(orderId!)}
                    className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                    style={{ backgroundColor: colors.success }}>
                    <MaterialIcons name="payment" size={18} color="#fff" />
                    <Text className="ml-2 text-sm font-bold text-white">
                      {order.paymentStatus === 'paid' ? 'Adjust' : 'Record'}
                    </Text>
                  </TouchableOpacity>

                  {/* Return - for delivered/completed orders */}
                  {canProcessReturn(order.status) && (
                    <TouchableOpacity
                      onPress={() => setReturnModalVisible(true)}
                      className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                      style={{ backgroundColor: '#f59e0b' }}>
                      <MaterialIcons name="assignment-return" size={18} color="#fff" />
                      <Text className="ml-2 text-sm font-bold text-white">Return</Text>
                    </TouchableOpacity>
                  )}

                  {/* Edit - for non-completed, non-cancelled */}
                  {((order.capabilities?.canEdit ?? canUpdateOrder(order.status)) && !isCancelled) && (
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

                  {/* Invoice */}
                  <TouchableOpacity
                    onPress={() => handleGenerateAndShareInvoice(order, vendor)}
                    className="items-center justify-center rounded-xl py-3 px-3"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                    <MaterialIcons name="receipt-long" size={20} color={colors.text} />
                  </TouchableOpacity>
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
                  {((order.capabilities?.canCancel ?? canCancelOrder(order.status)) && !(order.capabilities?.canDelete ?? canDeleteOrder(order.status))) && (
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

              {/* Process Return Modal */}
              <ProcessReturnModal
                visible={returnModalVisible}
                orderId={orderId}
                onClose={() => setReturnModalVisible(false)}
              />

              {/* Return Detail Modal */}
              <ReturnDetailModal
                visible={returnDetailVisible}
                returnId={returnDetailId}
                onClose={() => {
                  setReturnDetailVisible(false);
                  setReturnDetailId(null);
                }}
              />
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
