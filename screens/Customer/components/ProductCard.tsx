// screens/Customer/components/ProductCard.tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import type { MarketplaceProduct } from 'api/actions/marketplaceActions';

// Currency symbol for displayed prices. Adjust to match the business locale.
export const CURRENCY = '£';

export const formatPrice = (value: string | number | null | undefined) => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return `${CURRENCY}0`;
  return `${CURRENCY}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

interface Props {
  product: MarketplaceProduct;
}

export default function ProductCard({ product }: Props) {
  const { colors } = useThemeContext();
  const initial = product.name?.[0]?.toUpperCase() || 'P';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
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
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>{initial}</Text>
        </View>
      )}

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <MaterialCommunityIcons name="scale" size={13} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 12, marginLeft: 4 }}>
            per {product.unit}
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
        {formatPrice(product.sellingPrice)}
      </Text>
    </View>
  );
}
