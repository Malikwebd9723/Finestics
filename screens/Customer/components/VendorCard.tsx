// screens/Customer/components/VendorCard.tsx
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import type { MarketplaceVendor } from 'api/actions/marketplaceActions';

interface Props {
  vendor: MarketplaceVendor;
  onPress: () => void;
  rightSlot?: React.ReactNode;
}

const prettyType = (t?: string | null) =>
  t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Vendor';

export default function VendorCard({ vendor, onPress, rightSlot }: Props) {
  const { colors } = useThemeContext();
  const initial = vendor.businessName?.[0]?.toUpperCase() || 'V';

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      {/* Logo / initial */}
      {vendor.logo ? (
        <Image
          source={{ uri: vendor.logo }}
          style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.gray }}
        />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>{initial}</Text>
        </View>
      )}

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
          {vendor.businessName}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
          {prettyType(vendor.businessType)}
          {vendor.city ? ` · ${vendor.city}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <MaterialCommunityIcons name="package-variant" size={14} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 12, marginLeft: 4 }}>
            {vendor.productCount ?? 0} products
          </Text>
        </View>
      </View>

      {/* Right slot or chevron */}
      {rightSlot ?? (
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
      )}
    </Pressable>
  );
}
