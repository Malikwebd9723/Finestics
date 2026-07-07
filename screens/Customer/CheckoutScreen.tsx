// screens/Customer/CheckoutScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { useCart } from 'context/CartContext';
import { typo, fonts, radius } from 'constants/design';
import Toast from 'utils/Toast';
import { getAddresses, createOrder } from 'api/actions/customerOrderActions';
import { formatPrice } from './components/ProductCard';
import AddAddressModal from './components/AddAddressModal';

type PaymentMethod = 'cash' | 'credit';

export default function CheckoutScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId: number = route.params?.vendorId;
  const vendorName: string = route.params?.vendorName || 'Vendor';
  const queryClient = useQueryClient();

  const { getCart, getTotal, clearCart, updatePrices } = useCart();
  const items = getCart(vendorId);
  const total = getTotal(vendorId);

  const [addressId, setAddressId] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<any>(null);
  const [pricesChanged, setPricesChanged] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getAddresses,
  });

  // Default to the primary address once loaded.
  useEffect(() => {
    if (addresses && addresses.length && addressId === null) {
      const primary = addresses.find((a) => a.isPrimary) || addresses[0];
      setAddressId(primary.id);
    }
  }, [addresses]);

  const placeMutation = useMutation({
    mutationFn: () =>
      createOrder({
        vendorId,
        paymentMethod: payment,
        deliveryAddressId: addressId,
        requestedDeliveryDate: deliveryDate,
        notes: notes.trim() || null,
        expectedTotal: Math.round(total * 100) / 100,
        items: items.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      }),
    onSuccess: (order) => {
      clearCart(vendorId);
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      Toast.success('Order placed successfully');
      navigation.navigate('CustomerOrderDetailScreen', { orderId: order.id });
    },
    onError: (e: any) => {
      if (e?.code === 'CREDIT_LIMIT_EXCEEDED') {
        setCreditError(e.details || {});
      } else if (e?.code === 'PRICES_CHANGED') {
        // Refresh cart lines with the vendor's current prices; the summary and
        // total re-render and the customer confirms the new amount explicitly.
        if (e.details?.items) updatePrices(vendorId, e.details.items);
        setPricesChanged(true);
      } else {
        Toast.error(e?.message || 'Failed to place order');
      }
    },
  });

  const selectedAddress = addresses?.find((a) => a.id === addressId) || null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Order summary */}
        <Section title="Order Summary" colors={colors}>
          {items.map((l) => (
            <View
              key={l.productId}
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                {l.quantity} × {l.name}
              </Text>
              <Text style={[typo.num, { color: colors.text }]}>
                {formatPrice(Number(l.sellingPrice) * l.quantity)}
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
            <Text style={{ color: colors.text, fontFamily: fonts.bold }}>Total</Text>
            <Text style={[typo.num, { color: colors.text, fontSize: 15 }]}>
              {formatPrice(total)}
            </Text>
          </View>
        </Section>

        {/* Delivery address */}
        <Section title="Delivery Address" colors={colors}>
          {addresses && addresses.length > 0 ? (
            addresses.map((a) => (
              <AddressOption
                key={a.id}
                address={a}
                selected={a.id === addressId}
                onSelect={() => setAddressId(a.id)}
                colors={colors}
              />
            ))
          ) : (
            <Text style={{ color: colors.muted, marginBottom: 8 }}>
              No saved address. You can add one (optional).
            </Text>
          )}
          <Pressable
            onPress={() => setAddOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600', marginLeft: 6 }}>
              Add new address
            </Text>
          </Pressable>
        </Section>

        {/* Delivery day (optional quick-select; no native picker dependency) */}
        <Section title="Delivery Day (optional)" colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'No preference', offset: null },
              { label: 'Tomorrow', offset: 1 },
              { label: 'In 2 days', offset: 2 },
              { label: 'In 3 days', offset: 3 },
            ].map((opt) => {
              const value =
                opt.offset === null
                  ? null
                  : new Date(Date.now() + opt.offset * 864e5).toISOString().slice(0, 10);
              const selected = deliveryDate === value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setDeliveryDate(value)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.primary : colors.background,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}>
                  <Text style={{ color: selected ? colors.white : colors.text, fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Payment method */}
        <Section title="Payment Method" colors={colors}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['cash', 'credit'] as PaymentMethod[]).map((m) => {
              const selected = payment === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setPayment(m);
                    setCreditError(null);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary + '12' : colors.card,
                  }}>
                  <MaterialCommunityIcons
                    name={m === 'cash' ? 'cash' : 'credit-card-outline'}
                    size={22}
                    color={selected ? colors.primary : colors.muted}
                  />
                  <Text
                    style={{
                      color: selected ? colors.primary : colors.text,
                      fontWeight: '600',
                      marginTop: 4,
                    }}>
                    {m === 'cash' ? 'Cash on delivery' : 'On credit'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Price-drift notice: totals above already reflect the fresh prices */}
        {pricesChanged && (
          <View
            style={{
              backgroundColor: colors.primary + '10',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.primary + '44',
              padding: 14,
              marginTop: 4,
              marginBottom: 4,
            }}>
            <Text style={{ color: colors.text, fontFamily: fonts.bold, marginBottom: 4 }}>
              Prices were updated
            </Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>
              The vendor changed some prices since you added these items. The totals above are
              refreshed — review and place the order again to confirm.
            </Text>
          </View>
        )}

        {/* Credit-limit warning (error tone: this is a money/limit breach) */}
        {creditError && (
          <View
            style={{
              backgroundColor: colors.error + '12',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.error + '55',
              padding: 14,
              marginTop: 4,
              marginBottom: 4,
            }}>
            <Text style={{ color: colors.error, fontFamily: fonts.bold, marginBottom: 4 }}>
              Over your credit limit
            </Text>
            <Text style={{ color: colors.error, fontSize: 13 }}>
              Limit {formatPrice(creditError.creditLimit)} · Outstanding{' '}
              {formatPrice(creditError.currentBalance)} · This order{' '}
              {formatPrice(creditError.orderTotal)}.
            </Text>
            <Text style={{ color: colors.error, fontSize: 13, marginTop: 4 }}>
              Switch to Cash on delivery to place this order.
            </Text>
          </View>
        )}

        {/* Notes */}
        <Section title="Notes (optional)" colors={colors}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any instructions for the vendor"
            placeholderTextColor={colors.placeholder}
            multiline
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              color: colors.text,
              height: 70,
              textAlignVertical: 'top',
            }}
          />
        </Section>
      </ScrollView>

      {/* Place order */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          padding: 16,
          paddingBottom: 28,
        }}>
        <Pressable
          disabled={placeMutation.isPending || items.length === 0}
          onPress={() => {
            setCreditError(null);
            setPricesChanged(false);
            placeMutation.mutate();
          }}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 15,
            alignItems: 'center',
            opacity: placeMutation.isPending ? 0.7 : 1,
          }}>
          {placeMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[typo.num, { color: colors.white, fontSize: 16 }]}>
              Place Order · {formatPrice(total)}
            </Text>
          )}
        </Pressable>
      </View>

      <AddAddressModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(a) => {
          setAddressId(a.id);
          setAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
        }}
      />
    </View>
  );
}

// ==================== SUBCOMPONENTS ====================

function Section({ title, colors, children }: any) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={[typo.eyebrow, { color: colors.muted, marginBottom: 10 }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
        }}>
        {children}
      </View>
    </View>
  );
}

function AddressOption({ address, selected, onSelect, colors }: any) {
  return (
    <Pressable
      onPress={onSelect}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
      }}>
      <MaterialCommunityIcons
        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={20}
        color={selected ? colors.primary : colors.muted}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        {!!address.label && (
          <Text style={{ color: colors.text, fontWeight: '600' }}>{address.label}</Text>
        )}
        <Text style={{ color: colors.text }}>
          {[address.street, address.city, address.postalCode].filter(Boolean).join(', ')}
        </Text>
      </View>
    </Pressable>
  );
}

