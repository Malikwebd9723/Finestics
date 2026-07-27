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
import { typo, fonts } from 'constants/design';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { useCart } from 'context/CartContext';
import {
  getOrder,
  cancelOrder,
  acceptQuote,
  declineQuote,
  OrderStatus,
} from 'api/actions/customerOrderActions';
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
  const justPlaced: boolean = !!route.params?.justPlaced;
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

  const invalidateOrder = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      Toast.success('Order cancelled');
      invalidateOrder();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to cancel'),
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: () => acceptQuote(orderId),
    onSuccess: () => {
      Toast.success('Quote accepted — order confirmed');
      invalidateOrder();
    },
    onError: (e: any) => {
      if (e?.code === 'CREDIT_LIMIT_EXCEEDED') {
        Dialog.alert(
          'Over your credit limit',
          'This quote exceeds your credit limit with the vendor. Settle your balance or contact the vendor, then try again.'
        );
      } else {
        Toast.error(e?.message || 'Failed to accept quote');
      }
    },
  });

  const declineQuoteMutation = useMutation({
    mutationFn: () => declineQuote(orderId),
    onSuccess: () => {
      Toast.success('Quote declined');
      invalidateOrder();
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to decline quote'),
  });

  const confirmDecline = () => {
    Dialog.confirm(
      'Decline this quote?',
      'This cancels the order. You can always place a new one later.',
      {
        confirmText: 'Decline Quote',
        cancelText: 'Keep Looking',
        destructive: true,
        onConfirm: () => declineQuoteMutation.mutate(),
      }
    );
  };

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
  const isQuotePhase = order.status === 'quote_requested' || order.status === 'quoted';
  const isQuoted = order.status === 'quoted';
  // Once the vendor accepts (or a quote is accepted), the order is locked —
  // no cancellation or changes from the customer side (backend-enforced).
  // While a quote is open, declining is the way out, so no separate link.
  const canCancel = order.status === 'pending' || order.status === 'quote_requested';
  const isActive = !TERMINAL_STATUSES.includes(order.status);
  const canReorder = TERMINAL_STATUSES.includes(order.status);
  const showPlacedHero = justPlaced && (order.status === 'pending' || order.status === 'quote_requested');
  // Prices exist only once the vendor has quoted.
  const pricesPending = order.pricingMode === 'quote' && order.status === 'quote_requested';
  const currentStepIndex = TIMELINE_STEPS.indexOf(order.status as any);
  const continueShopping = () => navigation.navigate('MainTabs', { screen: 'Marketplace' });
  const quoteActing = acceptQuoteMutation.isPending || declineQuoteMutation.isPending;

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
        {/* Just-placed confirmation */}
        {showPlacedHero && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
            }}>
            <MaterialCommunityIcons name="check-decagram" size={40} color={colors.accent} />
            <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 19, marginTop: 8 }}>
              {pricesPending ? 'Quote requested' : 'Order placed'}
            </Text>
            <Text
              style={{ color: colors.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              {pricesPending
                ? `${order.vendor?.businessName || 'The vendor'} will price your order — you'll be notified when the quote is ready.`
                : `${order.vendor?.businessName || 'The vendor'} has been notified — track progress here.`}
            </Text>
          </View>
        )}

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

        {/* Quote phase — replaces the fulfilment timeline until confirmed */}
        {isQuotePhase && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            {isQuoted ? (
              <>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Quote ready</Text>
                <Text style={[typo.num, { color: colors.text, fontSize: 24, marginTop: 6 }]}>
                  {formatPrice(order.totalAmount)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                  Review the item prices below, then accept to confirm the order or decline to
                  cancel it.
                </Text>
                <Pressable
                  disabled={quoteActing}
                  onPress={() => acceptQuoteMutation.mutate()}
                  style={{
                    backgroundColor: colors.cta,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginTop: 14,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    opacity: quoteActing ? 0.7 : 1,
                  }}>
                  {acceptQuoteMutation.isPending ? (
                    <ActivityIndicator color={colors.onCta} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={18} color={colors.onCta} />
                      <Text style={{ color: colors.onCta, fontWeight: '700', marginLeft: 8 }}>
                        Accept Quote
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  disabled={quoteActing}
                  onPress={confirmDecline}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: 'center',
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: colors.error,
                    opacity: quoteActing ? 0.6 : 1,
                  }}>
                  {declineQuoteMutation.isPending ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <Text style={{ color: colors.error, fontWeight: '700' }}>Decline Quote</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="tag-outline" size={22} color={colors.muted} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    Waiting for the vendor{"'"}s quote
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    You{"'"}ll get a notification when prices are ready to review.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Timeline */}
        {!isCancelled && !isQuotePhase ? (
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
        ) : isCancelled ? (
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
        ) : null}

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
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {pricesPending ? '—' : formatPrice(it.total)}
              </Text>
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
              {pricesPending ? 'To be quoted' : formatPrice(order.totalAmount)}
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

        {/* Actions. One filled CTA: right after placing it's "Continue Shopping",
            afterwards it's the invoice; the other renders as a quiet bordered
            secondary. */}
        {isActive && justPlaced && (
          <ActionButton
            label="Continue Shopping"
            icon="storefront-outline"
            filled
            colors={colors}
            onPress={continueShopping}
            style={{ marginTop: 20 }}
          />
        )}

        {/* No invoice while prices are still being quoted; during 'quoted' the
            filled CTA is Accept Quote (in the card above), so this stays quiet. */}
        {!isCancelled && !pricesPending && (
          <ActionButton
            label="View Invoice"
            icon="file-document-outline"
            filled={!(isActive && justPlaced) && !isQuoted}
            colors={colors}
            onPress={() => setInvoiceOpen(true)}
            style={{ marginTop: isActive && justPlaced ? 12 : 20 }}
          />
        )}

        {isActive && !justPlaced && (
          <ActionButton
            label="Continue Shopping"
            icon="storefront-outline"
            colors={colors}
            onPress={continueShopping}
            style={{ marginTop: 12 }}
          />
        )}

        {/* Reorder — rebuild the cart from this order's lines */}
        {canReorder && (
          <ActionButton
            label="Reorder These Items"
            icon="cart-plus"
            filled={isCancelled}
            colors={colors}
            onPress={reorder}
            style={{ marginTop: isCancelled ? 20 : 12 }}
          />
        )}

        {/* Locked once accepted — point the customer at the vendor for changes */}
        {isActive && !canCancel && !isQuotePhase && (
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 16,
              paddingHorizontal: 12,
            }}>
            Order accepted — contact{' '}
            {order.vendor?.businessName || 'the vendor'}
            {order.vendor?.businessPhone ? ` on ${order.vendor.businessPhone}` : ''} for any
            changes.
          </Text>
        )}

        {/* Cancel — deliberately quiet: a text link, not a button */}
        {canCancel && (
          <Pressable
            disabled={cancelMutation.isPending}
            onPress={confirmCancel}
            hitSlop={8}
            style={{ alignItems: 'center', marginTop: 20, paddingVertical: 6 }}>
            {cancelMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={{ color: colors.error, fontSize: 13 }}>
                Need to cancel this order?
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>

      <InvoiceModal visible={invoiceOpen} order={order} onClose={() => setInvoiceOpen(false)} />
    </View>
  );
}

function ActionButton({
  label,
  icon,
  filled = false,
  colors,
  onPress,
  style,
}: {
  label: string;
  icon: string;
  filled?: boolean;
  colors: any;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundColor: filled ? colors.cta : colors.card,
          borderWidth: filled ? 0 : 1,
          borderColor: colors.border,
        },
        style,
      ]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={filled ? colors.onCta : colors.text}
      />
      <Text style={{ color: filled ? colors.onCta : colors.text, fontWeight: '700', marginLeft: 8 }}>
        {label}
      </Text>
    </Pressable>
  );
}
