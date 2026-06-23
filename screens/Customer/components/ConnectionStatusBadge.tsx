// screens/Customer/components/ConnectionStatusBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { ConnectionStatus } from 'api/actions/connectionActions';

interface Props {
  status?: ConnectionStatus | null;
  size?: 'sm' | 'md';
}

const CONFIG: Record<
  ConnectionStatus,
  { label: string; bg: string; fg: string }
> = {
  pending: { label: 'Pending', bg: '#FEF3C7', fg: '#92400E' },
  active: { label: 'Connected', bg: '#DCFCE7', fg: '#166534' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', fg: '#991B1B' },
  blocked: { label: 'Disconnected', bg: '#E5E7EB', fg: '#374151' },
};

export default function ConnectionStatusBadge({ status, size = 'md' }: Props) {
  if (!status) return null;
  const cfg = CONFIG[status] || CONFIG.blocked;
  const pad = size === 'sm' ? { px: 8, py: 2, font: 11 } : { px: 10, py: 4, font: 12 };

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: cfg.bg,
        paddingHorizontal: pad.px,
        paddingVertical: pad.py,
        borderRadius: 999,
      }}>
      <Text style={{ color: cfg.fg, fontSize: pad.font, fontWeight: '700' }}>{cfg.label}</Text>
    </View>
  );
}
