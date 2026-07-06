// screens/Vendor/VendorOrderDetailScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import {
  getVendorOrder,
  updateVendorOrderStatus,
  recordOrderPayment,
  type VendorOrderStatusAction,
} from 'api/actions/vendorOrderInboxActions';
import type { OrderStatus } from 'api/actions/customerOrderActions';
import { formatPrice } from '../Customer/components/ProductCard';
import OrderStatusBadge from '../Customer/components/OrderStatusBadge';

// Forward action available from each status.
const NEXT_ACTION: Partial<Record<OrderStatus, { status: VendorOrderStatusAction; label: string }>> = {
  pending: { status: 'confirmed', label: 'Accept Order' },
  confirmed: { status: 'processing', label: 'Start Preparing' },
  processing: { status: 'ready_for_delivery', label: 'Mark Ready' },
  ready_for_delivery: { status: 'dispatched', label: 'Dispatch' },
  dispatched: { status: 'delivered', label: 'Mark Delivered' },
};

const CAN_CANCEL: OrderStatus[] = ['pending', 'confirmed', 'processing'];

export default function VendorOrderDetailScreen() {
  const { colors } = useThemeContext();
  const route = useRoute<any>();
  const orderId: number = route.params?.orderId;
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['vendor-customer-order', orderId],
    queryFn: () => getVendorOrder(orderId),
    enabled: !!orderId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendor-customer-order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['vendor-customer-orders'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-customer-order-stats'] });
  };

  const mutation = useMutation({
    mutationFn: (status: VendorOrderStatusAction) => updateVendorOrderStatus(orderId, status),
    onSuccess: () => {
      Toast.success('Order updated');
      invalidate();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to update'),
  });

  const paymentMutation = useMutation({
    mutationFn: () => recordOrderPayment(orderId),
    onSuccess: () => {
      Toast.success('Payment recorded');
      invalidate();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to record payment'),
  });

  if (isLoading || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const customer = (order as any).customer;
  const customerName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Customer';
  const next = NEXT_ACTION[order.status as OrderStatus];
  const canCancel = CAN_CANCEL.includes(order.status as OrderStatus);
  const canRecordPayment =
    order.paymentStatus === 'pending' &&
    !['cancelled', 'refunded'].includes(order.status as string);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{customerName}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{order.orderNumber}</Text>
          {!!customer?.phone && (
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{customer.phone}</Text>
          )}
        </View>

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
              {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.postalCode]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Actions */}
        {next && (
          <Pressable
            disabled={mutation.isPending}
            onPress={() => mutation.mutate(next.status)}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              marginTop: 20,
              opacity: mutation.isPending ? 0.7 : 1,
            }}>
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{next.label}</Text>
            )}
          </Pressable>
        )}

        {/* Money-in action: settles credit against the customer's balance */}
        {canRecordPayment && (
          <Pressable
            disabled={paymentMutation.isPending}
            onPress={() => paymentMutation.mutate()}
            style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.success,
              opacity: paymentMutation.isPending ? 0.6 : 1,
            }}>
            {paymentMutation.isPending ? (
              <ActivityIndicator color={colors.success} />
            ) : (
              <Text style={{ color: colors.success, fontWeight: '700' }}>Mark as Paid</Text>
            )}
          </Pressable>
        )}

        {canCancel && (
          <Pressable
            disabled={mutation.isPending}
            onPress={() => mutation.mutate('cancelled')}
            style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.error,
              opacity: mutation.isPending ? 0.6 : 1,
            }}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>Reject / Cancel Order</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
