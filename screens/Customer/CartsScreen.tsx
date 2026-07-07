// screens/Customer/CartsScreen.tsx
// Overview of every vendor cart — the customer's global "Cart" tab.
import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useThemeContext } from 'context/ThemeProvider';
import { useCart } from 'context/CartContext';
import { ListRow } from 'components/ui';
import { formatPrice } from 'utils/currency';

export default function CartsScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const { getAllCarts } = useCart();

  const carts = getAllCarts();

  if (carts.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.background }}>
        <MaterialCommunityIcons name="cart-outline" size={56} color={colors.muted} />
        <Text className="mt-4 text-[16px] font-bold" style={{ color: colors.text }}>
          No items in your carts
        </Text>
        <Text
          className="mt-1.5 text-center text-[13px] font-medium"
          style={{ color: colors.muted }}>
          Browse a connected vendor{'’'}s catalog and add products to get started.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('MainTabs', { screen: 'My Vendors' })}
          style={{
            marginTop: 16,
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
          <Text style={{ color: colors.white, fontWeight: '600' }}>Go to My Vendors</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={carts}
        keyExtractor={(item) => String(item.vendorId)}
        renderItem={({ item, index }) => (
          <View className="px-4">
            <ListRow
              icon="storefront-outline"
              title={item.vendorName || `Vendor #${item.vendorId}`}
              subtitle={`${item.count} item${item.count === 1 ? '' : 's'}`}
              amount={formatPrice(item.total)}
              divider={index > 0}
              onPress={() =>
                navigation.navigate('CartScreen', {
                  vendorId: item.vendorId,
                  vendorName: item.vendorName,
                })
              }
            />
          </View>
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
      />
    </View>
  );
}
