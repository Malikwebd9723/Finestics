// screens/Customer/components/OrderStatusBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { getOrderStatusMeta } from 'utils/orderStatus';
import type { OrderStatus } from 'api/actions/customerOrderActions';

export default function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const meta = getOrderStatusMeta(status);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: meta.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}>
      <Text style={{ color: meta.color, fontSize: 12, fontWeight: '700' }}>{meta.label}</Text>
    </View>
  );
}
