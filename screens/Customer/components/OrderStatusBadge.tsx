// screens/Customer/components/OrderStatusBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { getOrderStatusMeta, toneColor } from 'utils/orderStatus';
import type { OrderStatus } from 'api/actions/customerOrderActions';

export default function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const { colors } = useThemeContext();
  const meta = getOrderStatusMeta(status);
  const color = toneColor(meta.tone, colors);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: color + '14',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{meta.label}</Text>
    </View>
  );
}
