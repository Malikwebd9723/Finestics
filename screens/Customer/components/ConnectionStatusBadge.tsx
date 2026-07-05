// screens/Customer/components/ConnectionStatusBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { toneColor, type StatusTone } from 'utils/orderStatus';
import type { ConnectionStatus } from 'api/actions/connectionActions';

interface Props {
  status?: ConnectionStatus | null;
  size?: 'sm' | 'md';
}

const CONFIG: Record<ConnectionStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  active: { label: 'Connected', tone: 'active' },
  rejected: { label: 'Rejected', tone: 'negative' },
  blocked: { label: 'Disconnected', tone: 'neutral' },
};

export default function ConnectionStatusBadge({ status, size = 'md' }: Props) {
  const { colors } = useThemeContext();
  if (!status) return null;

  const cfg = CONFIG[status] || CONFIG.blocked;
  const color = toneColor(cfg.tone, colors);
  const pad = size === 'sm' ? { px: 8, py: 2, font: 11 } : { px: 10, py: 4, font: 12 };

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: color + '14',
        paddingHorizontal: pad.px,
        paddingVertical: pad.py,
        borderRadius: 999,
      }}>
      <Text style={{ color, fontSize: pad.font, fontWeight: '700' }}>{cfg.label}</Text>
    </View>
  );
}
