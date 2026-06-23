// screens/Customer/CartScreen.tsx
import React, { useLayoutEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useThemeContext } from 'context/ThemeProvider';
import { useCart } from 'context/CartContext';
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

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: `Cart · ${vendorName}` });
  }, [navigation, vendorName]);

  if (items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}>
        <MaterialCommunityIcons name="cart-outline" size={56} color={colors.muted} />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16 }}>
          Your cart is empty
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 16,
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Browse products</Text>
        </Pressable>
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
              borderRadius: 14,
              padding: 12,
              marginHorizontal: 16,
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                {formatPrice(item.sellingPrice)} / {item.unit}
              </Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4 }}>
                {formatPrice(Number(item.sellingPrice) * item.quantity)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.background,
                borderRadius: 10,
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
                style={{ color: colors.text, fontWeight: '700', minWidth: 22, textAlign: 'center' }}>
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
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
            {formatPrice(total)}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('CheckoutScreen', { vendorId, vendorName })}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 15,
            alignItems: 'center',
          }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}
