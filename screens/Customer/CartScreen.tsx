// screens/Customer/CartScreen.tsx
import React, { useLayoutEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { useCart } from 'context/CartContext';
import { EmptyState } from 'components/ui';
import { typo, fonts } from 'constants/design';
import { getVendor } from 'api/actions/marketplaceActions';
import { formatPrice } from './components/ProductCard';

export default function CartScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const vendorId: number = route.params?.vendorId;
  const vendorName: string = route.params?.vendorName || 'Cart';

  const { getCart, getTotal, setQty } = useCart();
  const items = getCart(vendorId);
  const total = getTotal(vendorId);

  // Hidden-price vendors: no amounts anywhere — the vendor quotes at checkout.
  const { data: vendorInfo } = useQuery({
    queryKey: ['marketplace-vendor', vendorId],
    queryFn: () => getVendor(vendorId),
    enabled: !!vendorId,
  });
  const isQuote = !!vendorInfo?.hidePrices;

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: `Cart · ${vendorName}` });
  }, [navigation, vendorName]);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          action={
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: colors.cta,
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}>
              <Text style={{ color: colors.onCta, fontWeight: '600' }}>Browse products</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 12,
              marginHorizontal: 16,
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontSize: 15, fontFamily: fonts.bold }}
                numberOfLines={1}>
                {item.name}
              </Text>
              {isQuote ? (
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                  per {item.unit} · price on request
                </Text>
              ) : (
                <>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    {formatPrice(item.sellingPrice)} / {item.unit}
                  </Text>
                  <Text style={[typo.num, { color: colors.text, fontSize: 14, marginTop: 4 }]}>
                    {formatPrice(Number(item.sellingPrice) * item.quantity)}
                  </Text>
                </>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Pressable
                onPress={() => setQty(vendorId, item.productId, item.quantity - 1)}
                hitSlop={8}
                style={{ padding: 8 }}>
                <MaterialCommunityIcons name="minus" size={18} color={colors.primary} />
              </Pressable>
              <Text
                style={[typo.num, { color: colors.text, minWidth: 22, textAlign: 'center' }]}>
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => setQty(vendorId, item.productId, item.quantity + 1)}
                hitSlop={8}
                style={{ padding: 8 }}>
                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Footer */}
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 15 }}>Subtotal</Text>
          <Text style={[typo.stat, { color: colors.text }]}>
            {isQuote ? 'Quoted at checkout' : formatPrice(total)}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('CheckoutScreen', { vendorId, vendorName })}
          style={{
            backgroundColor: colors.cta,
            borderRadius: 12,
            paddingVertical: 15,
            alignItems: 'center',
          }}>
          <Text style={{ color: colors.onCta, fontWeight: '700', fontSize: 16 }}>
            Proceed to Checkout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
