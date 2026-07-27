// screens/Vendor/VendorOrderDetailScreen.tsx
// Acceptance screen for customer app orders. A pending order is reviewed and
// accepted or rejected here; on acceptance the backend mirrors it into the
// vendor's order book, where all further management (status, payments,
// returns, invoices) happens. Non-pending orders just point at the Orders tab.
// If the vendor has vans, accepting first asks which van will carry the order
// (skippable); with no vans configured it accepts directly.
// Quote requests (hidden-price vendors) show a pricing form instead: the
// vendor prices each line and sends the quote; the customer then accepts.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { typo } from 'constants/design';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { Button, EmptyState, BottomSheet } from 'components/ui';
import {
  getVendorOrder,
  updateVendorOrderStatus,
  submitVendorQuote,
} from 'api/actions/vendorOrderInboxActions';
import { fetchVans } from 'api/actions/vendorActions';
import { formatPrice } from '../Customer/components/ProductCard';
import OrderStatusBadge from '../Customer/components/OrderStatusBadge';

export default function VendorOrderDetailScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number = route.params?.orderId;
  const queryClient = useQueryClient();
  const [vanSheetOpen, setVanSheetOpen] = useState(false);
  // Quote pricing form: itemId → price text as the vendor types it.
  const [quotePrices, setQuotePrices] = useState<Record<number, string>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ['vendor-customer-order', orderId],
    queryFn: () => getVendorOrder(orderId),
    enabled: !!orderId,
  });

  const { data: vansData } = useQuery({ queryKey: ['vans'], queryFn: fetchVans });
  const vans: string[] = vansData?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendor-customer-order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['vendor-customer-orders'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-customer-order-stats'] });
  };

  const acceptMutation = useMutation({
    mutationFn: (vanName: string | null) =>
      updateVendorOrderStatus(orderId, 'confirmed', undefined, vanName),
    onSuccess: (_data, vanName) => {
      invalidate();
      // Acceptance materializes the order in the vendor's order book.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Toast.success(
        vanName ? `Order accepted — assigned to ${vanName}` : 'Order added to your order book'
      );
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to accept order'),
  });

  const handleAcceptPress = () => {
    if (vans.length === 0) {
      acceptMutation.mutate(null);
    } else {
      setVanSheetOpen(true);
    }
  };

  const acceptWithVan = (vanName: string | null) => {
    setVanSheetOpen(false);
    acceptMutation.mutate(vanName);
  };

  const quoteMutation = useMutation({
    mutationFn: (items: { itemId: number; unitPrice: number }[]) =>
      submitVendorQuote(orderId, { items }),
    onSuccess: () => {
      invalidate();
      Toast.success('Quote sent to the customer');
    },
    onError: (e: any) => Toast.error(e?.message || 'Failed to send quote'),
  });

  const handleSendQuote = () => {
    const items = order?.items ?? [];
    const parsed: { itemId: number; unitPrice: number }[] = [];
    for (const it of items) {
      const raw = (quotePrices[it.id] ?? '').trim().replace(',', '.');
      const price = parseFloat(raw);
      if (raw === '' || Number.isNaN(price) || price < 0) {
        Dialog.alert('Price missing', `Enter a price per ${it.unit} for ${it.productName}.`);
        return;
      }
      parsed.push({ itemId: it.id, unitPrice: Math.round(price * 100) / 100 });
    }
    quoteMutation.mutate(parsed);
  };

  // Live total preview while the vendor types prices.
  const quoteTotal = (order?.items ?? []).reduce((sum, it) => {
    const price = parseFloat((quotePrices[it.id] ?? '').replace(',', '.'));
    if (Number.isNaN(price)) return sum;
    return sum + price * parseFloat(it.quantity);
  }, 0);

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

  // The inbox handles pending orders and the whole quote phase. Anything past
  // that is mirrored into (or closed out of) the order book — the inbox
  // endpoints reject further changes, so send the vendor there.
  if (!['pending', 'quote_requested', 'quoted'].includes(order.status)) {
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
  const isQuoteRequest = order.status === 'quote_requested';
  const isQuoteSent = order.status === 'quoted';
  const isActing =
    acceptMutation.isPending || rejectMutation.isPending || quoteMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
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
          {!!order.requestedDeliveryDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <MaterialCommunityIcons name="truck-outline" size={14} color={colors.muted} />
              <Text style={{ color: colors.text, fontSize: 13, marginLeft: 6 }}>
                Wants delivery:{' '}
                {new Date(`${order.requestedDeliveryDate}T12:00:00`).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Items — for quote requests each line gets a price input */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 12 }}>
            {isQuoteRequest ? 'Price this order' : 'Items'}
          </Text>
          {order.items?.map((it) =>
            isQuoteRequest ? (
              <View
                key={it.id}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: colors.text, flex: 1, paddingRight: 10 }} numberOfLines={2}>
                  {it.quantity} {it.unit} × {it.productName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontSize: 13, marginRight: 4 }}>£</Text>
                  <TextInput
                    value={quotePrices[it.id] ?? ''}
                    onChangeText={(text) =>
                      setQuotePrices((prev) => ({ ...prev, [it.id]: text }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.placeholder}
                    style={{
                      minWidth: 74,
                      textAlign: 'right',
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.text,
                    }}
                  />
                  <Text style={{ color: colors.muted, fontSize: 12, marginLeft: 4 }}>
                    /{it.unit}
                  </Text>
                </View>
              </View>
            ) : (
              <View
                key={it.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                  {it.quantity} {it.unit} × {it.productName}
                </Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {formatPrice(it.total)}
                </Text>
              </View>
            )
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {isQuoteRequest ? 'Quote total' : 'Total'}
            </Text>
            <Text style={[typo.num, { color: colors.text, fontSize: 15 }]}>
              {isQuoteRequest ? formatPrice(quoteTotal) : formatPrice(order.totalAmount)}
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

        {/* Customer instructions */}
        {!!order.notes && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Notes</Text>
            <Text style={{ color: colors.text }}>{order.notes}</Text>
          </View>
        )}

        {/* Primary action depends on the phase:
            pending → Accept (van sheet), quote_requested → Send Quote,
            quoted → nothing to do but wait (or reject). */}
        {isQuoteSent ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 16,
              marginTop: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={colors.muted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                Quote sent — waiting for {customerName}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                {formatPrice(order.totalAmount)} · the order confirms automatically when they
                accept.
              </Text>
            </View>
          </View>
        ) : isQuoteRequest ? (
          <Button
            title="Send Quote"
            icon="send"
            onPress={handleSendQuote}
            loading={quoteMutation.isPending}
            disabled={isActing}
            style={{ marginTop: 20 }}
          />
        ) : (
          <Button
            title="Accept Order"
            icon="check"
            onPress={handleAcceptPress}
            loading={acceptMutation.isPending}
            disabled={isActing}
            style={{ marginTop: 20 }}
          />
        )}

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
      </KeyboardAvoidingView>

      {/* Van assignment on accept */}
      <BottomSheet
        visible={vanSheetOpen}
        onClose={() => setVanSheetOpen(false)}
        title="Which van takes this order?"
        maxHeightRatio={0.7}>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
          The order lands in your order book already assigned — you can change it later.
        </Text>
        {vans.map((van) => (
          <Pressable
            key={van}
            onPress={() => acceptWithVan(van)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
            <MaterialCommunityIcons name="truck-outline" size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginLeft: 12, flex: 1 }}>
              {van}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => acceptWithVan(null)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
          <MaterialCommunityIcons name="truck-remove-outline" size={20} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 15, marginLeft: 12, flex: 1 }}>
            No van — assign later
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>
      </BottomSheet>
    </View>
  );
}
