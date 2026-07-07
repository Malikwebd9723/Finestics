// screens/Customer/OrderDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { useCart } from 'context/CartContext';
import { getOrder, cancelOrder, OrderStatus } from 'api/actions/customerOrderActions';
import { getOrderStatusMeta, TIMELINE_STEPS } from 'utils/orderStatus';
import { formatPrice } from './components/ProductCard';
import OrderStatusBadge from './components/OrderStatusBadge';
import InvoiceModal from './components/InvoiceModal';

const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'refunded'];

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function OrderDetailScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number = route.params?.orderId;
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const { addItem } = useCart();
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const { data: order, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
    // Live tracking: poll while the order is still moving and the screen is
    // visible; terminal orders never poll.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!isFocused || !status || TERMINAL_STATUSES.includes(status)) return false;
      return 30000;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      Toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['customer-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to cancel'),
  });

  const confirmCancel = () => {
    Dialog.confirm(
      'Cancel this order?',
      'The vendor will be notified. This cannot be undone.',
      {
        confirmText: 'Cancel Order',
        cancelText: 'Keep Order',
        destructive: true,
        onConfirm: () => cancelMutation.mutate(),
      }
    );
  };

  const reorder = () => {
    if (!order?.vendor || !order.items?.length) return;
    order.items.forEach((it) => {
      addItem(
        order.vendor!.id,
        order.vendor!.businessName,
        {
          productId: it.productId,
          name: it.productName,
          unit: it.unit,
          sellingPrice: it.unitPrice,
        },
        Math.max(1, Math.round(parseFloat(it.quantity)) || 1)
      );
    });
    Toast.success('Items added to your cart');
    navigation.navigate('CartScreen', { vendorId: order.vendor.id });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}>
        <Text style={{ color: colors.text }}>{(error as Error)?.message || 'Order not found'}</Text>
      </View>
    );
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canReorder = TERMINAL_STATUSES.includes(order.status);
  const currentStepIndex = TIMELINE_STEPS.indexOf(order.status as any);

  // Map each timeline step to when it actually happened (if it has).
  const stepTimestamp = (step: string): string | null => {
    const entry = order.statusHistory?.find((h) => h.toStatus === step);
    return entry ? fmtWhen(entry.changedAt) : step === 'pending' ? fmtWhen(order.placedAt) : null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              {order.vendor?.businessName || 'Order'}
            </Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{order.orderNumber}</Text>
        </View>

        {/* Timeline */}
        {!isCancelled ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 12 }}>Progress</Text>
            {TIMELINE_STEPS.map((step, idx) => {
              const meta = getOrderStatusMeta(step);
              const done = idx <= currentStepIndex;
              const when = done ? stepTimestamp(step) : null;
              return (
                <View
                  key={step}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons
                    name={done ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={done ? colors.success : colors.muted}
                  />
                  <Text
                    style={{
                      flex: 1,
                      color: done ? colors.text : colors.muted,
                      marginLeft: 10,
                      fontWeight: idx === currentStepIndex ? '700' : '400',
                    }}>
                    {meta.label}
                  </Text>
                  {when ? (
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{when}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.error + '12',
              borderRadius: 14,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: colors.error + '55',
            }}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>
              {order.status === 'refunded' ? 'Order refunded' : 'Order cancelled'}
            </Text>
            {!!order.cancellationReason && (
              <Text style={{ color: colors.error, fontSize: 13, marginTop: 4 }}>
                {order.cancellationReason}
              </Text>
            )}
          </View>
        )}

        {/* Items */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 12 }}>Items</Text>
          {order.items?.map((it) => (
            <View
              key={it.id}
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                {it.quantity} {it.unit} × {it.productName}
              </Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{formatPrice(it.total)}</Text>
            </View>
          ))}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Total</Text>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {formatPrice(order.totalAmount)}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
            Payment: {order.paymentMethod === 'cash' ? 'Cash on delivery' : order.paymentMethod} ·{' '}
            {order.paymentStatus}
          </Text>
        </View>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>
              Delivery Address
            </Text>
            <Text style={{ color: colors.text }}>
              {[
                order.deliveryAddress.street,
                order.deliveryAddress.city,
                order.deliveryAddress.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Invoice */}
        {!isCancelled && (
          <Pressable
            onPress={() => setInvoiceOpen(true)}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 20,
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '700', marginLeft: 8 }}>
              View Invoice
            </Text>
          </Pressable>
        )}

        {/* Reorder — rebuild the cart from this order's lines */}
        {canReorder && (
          <Pressable
            onPress={reorder}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: isCancelled ? 20 : 12,
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
            <MaterialCommunityIcons name="cart-plus" size={18} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '700', marginLeft: 8 }}>
              Reorder These Items
            </Text>
          </Pressable>
        )}

        {/* Cancel */}
        {canCancel && (
          <Pressable
            disabled={cancelMutation.isPending}
            onPress={confirmCancel}
            style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.error,
              opacity: cancelMutation.isPending ? 0.6 : 1,
            }}>
            {cancelMutation.isPending ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={{ color: colors.error, fontWeight: '700' }}>Cancel Order</Text>
            )}
          </Pressable>
        )}
      </ScrollView>

      <InvoiceModal visible={invoiceOpen} order={order} onClose={() => setInvoiceOpen(false)} />
    </View>
  );
}
