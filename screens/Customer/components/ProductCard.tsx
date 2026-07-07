// screens/Customer/components/ProductCard.tsx
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { typo, fonts } from 'constants/design';
import type { MarketplaceProduct } from 'api/actions/marketplaceActions';
import { formatPrice } from 'utils/currency';

// Re-exported so existing `import { formatPrice } from './components/ProductCard'`
// callsites keep working; the implementation (and symbol) live in utils/currency.
export { formatPrice };

interface Props {
  product: MarketplaceProduct;
  // Cart controls (optional). When provided, an add button / stepper is shown.
  cartQty?: number;
  onAdd?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export default function ProductCard({
  product,
  cartQty,
  onAdd,
  onIncrement,
  onDecrement,
}: Props) {
  const { colors } = useThemeContext();
  const initial = product.name?.[0]?.toUpperCase() || 'P';
  const cartEnabled = !!onAdd;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: colors.gray }}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: colors.primary, fontSize: 18, fontFamily: fonts.bold }}>
            {initial}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{ color: colors.text, fontSize: 15, fontFamily: fonts.bold }}
          numberOfLines={1}>
          {product.name}
        </Text>
        {product.sellingPrice != null ? (
          <Text style={[typo.num, { color: colors.text, fontSize: 14, marginTop: 2 }]}>
            {formatPrice(product.sellingPrice)}
            <Text style={{ color: colors.muted, fontFamily: fonts.regular }}> / {product.unit}</Text>
          </Text>
        ) : (
          // Marketplace preview before connecting — prices are connection-gated.
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
            per {product.unit} · price after connecting
          </Text>
        )}
      </View>

      {/* Cart control */}
      {cartEnabled &&
        (cartQty && cartQty > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Pressable onPress={onDecrement} hitSlop={8} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="minus" size={18} color={colors.primary} />
            </Pressable>
            <Text style={[typo.num, { color: colors.text, minWidth: 20, textAlign: 'center' }]}>
              {cartQty}
            </Text>
            <Pressable onPress={onIncrement} hitSlop={8} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAdd}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}>
            <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '600', marginLeft: 4 }}>Add</Text>
          </Pressable>
        ))}
    </View>
  );
}
