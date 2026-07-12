// screens/Customer/CartsScreen.tsx
// Overview of every vendor cart — the customer's global "Cart" tab.
import React from 'react';
import { View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useThemeContext } from 'context/ThemeProvider';
import { useCart } from 'context/CartContext';
import { Button, EmptyState, ListRow } from 'components/ui';
import { formatPrice } from 'utils/currency';

export default function CartsScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const { getAllCarts } = useCart();

  const carts = getAllCarts();

  if (carts.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <EmptyState
          icon="cart-outline"
          title="No items in your carts"
          subtitle={`Browse a connected vendor${'’'}s catalog and add products to get started.`}
          action={
            <Button
              title="Go to My Vendors"
              onPress={() => navigation.navigate('MainTabs', { screen: 'My Vendors' })}
            />
          }
        />
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
