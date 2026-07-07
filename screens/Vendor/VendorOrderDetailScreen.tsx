// screens/Vendor/VendorOrderDetailScreen.tsx
// Acceptance screen for customer app orders. A pending order is reviewed and
// accepted or rejected here; on acceptance the backend mirrors it into the
// vendor's order book, where all further management (status, payments,
// returns, invoices) happens. Non-pending orders just point at the Orders tab.
import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { Button, EmptyState } from 'components/ui';
import { getVendorOrder, updateVendorOrderStatus } from 'api/actions/vendorOrderInboxActions';
import { formatPrice } from '../Customer/components/ProductCard';
import OrderStatusBadge from '../Customer/components/OrderStatusBadge';

export default function VendorOrderDetailScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
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

  const acceptMutation = useMutation({
    mutationFn: () => updateVendorOrderStatus(orderId, 'confirmed'),
    onSuccess: () => {
      invalidate();
      // Acceptance materializes the order in the vendor's order book.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Toast.success('Order added to your order book');
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to accept order'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => updateVendorOrderStatus(orderId, 'cancelled'),
    onSuccess: () => {
      Toast.success('Order rejected');
      invalidate();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to reject order'),
  });

  const confirmReject = () => {
    Dialog.confirm(
      'Reject Order?',
      'This cancels the order and the customer will be notified. This cannot be undone.',
      {
        confirmText: 'Reject',
        cancelText: 'Keep Order',
        destructive: true,
        onConfirm: () => rejectMutation.mutate(),
      }
    );
  };

  if (isLoading || !order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Anything past pending is mirrored into (or closed out of) the order book —
  // the inbox endpoints reject further changes, so send the vendor there.
  if (order.status !== 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="book-open-variant"
          title="This order is managed in your Orders book"
          subtitle={`${order.orderNumber} · Status, payments, returns and invoices live in the Orders tab.`}
          action={
            <Button
              title="Go to Orders"
              icon="cart"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
            />
          }
        />
      </View>
    );
  }

  const customer = (order as any).customer;
  const customerName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Customer';
  const isActing = acceptMutation.isPending || rejectMutation.isPending;

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

        {/* Accept — adds the order to the vendor's order book */}
        <Button
          title="Accept Order"
          icon="check"
          onPress={() => acceptMutation.mutate()}
          loading={acceptMutation.isPending}
          disabled={isActing}
          style={{ marginTop: 20 }}
        />

        {/* Reject — cancels the app order (kept out of the order book) */}
        <Pressable
          disabled={isActing}
          onPress={confirmReject}
          style={{
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.error,
            opacity: isActing ? 0.6 : 1,
          }}>
          {rejectMutation.isPending ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={{ color: colors.error, fontWeight: '700' }}>Reject Order</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
