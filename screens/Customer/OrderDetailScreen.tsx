// screens/Customer/OrderDetailScreen.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import Toast from 'utils/Toast';
import { getOrder, cancelOrder } from 'api/actions/customerOrderActions';
import { getOrderStatusMeta, TIMELINE_STEPS } from 'utils/orderStatus';
import { formatPrice } from './components/ProductCard';
import OrderStatusBadge from './components/OrderStatusBadge';

export default function OrderDetailScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number = route.params?.orderId;
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
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
  const currentStepIndex = TIMELINE_STEPS.indexOf(order.status as any);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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
              return (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons
                    name={done ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={done ? colors.success : colors.muted}
                  />
                  <Text
                    style={{
                      color: done ? colors.text : colors.muted,
                      marginLeft: 10,
                      fontWeight: idx === currentStepIndex ? '700' : '400',
                    }}>
                    {meta.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 14,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#FECACA',
            }}>
            <Text style={{ color: '#991B1B', fontWeight: '700' }}>
              {order.status === 'refunded' ? 'Order refunded' : 'Order cancelled'}
            </Text>
            {!!order.cancellationReason && (
              <Text style={{ color: '#991B1B', fontSize: 13, marginTop: 4 }}>
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

        {/* Cancel */}
        {canCancel && (
          <Pressable
            disabled={cancelMutation.isPending}
            onPress={() => cancelMutation.mutate()}
            style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 20,
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
    </View>
  );
}
