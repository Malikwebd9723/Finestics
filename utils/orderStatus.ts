// utils/orderStatus.ts
// Maps the 8 backend order statuses to customer-facing labels + a theme tone.
// Tones resolve to theme colors at render time (no hex literals; dark-mode safe):
//   neutral -> colors.muted, active -> colors.primary,
//   positive -> colors.success, negative -> colors.error
import type { OrderStatus } from 'api/actions/customerOrderActions';

export type StatusTone = 'neutral' | 'active' | 'positive' | 'negative';

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const META: Record<OrderStatus, StatusMeta> = {
  pending: { label: 'Placed', tone: 'neutral' },
  confirmed: { label: 'Accepted', tone: 'active' },
  processing: { label: 'Preparing', tone: 'active' },
  ready_for_delivery: { label: 'Ready', tone: 'active' },
  dispatched: { label: 'Out for delivery', tone: 'active' },
  delivered: { label: 'Delivered', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

export const getOrderStatusMeta = (status: OrderStatus | string): StatusMeta =>
  META[status as OrderStatus] || { label: String(status), tone: 'neutral' };

/** Resolve a tone to a concrete theme color. */
export const toneColor = (tone: StatusTone, colors: Record<string, string>): string => {
  switch (tone) {
    case 'active':
      return colors.primary;
    case 'positive':
      return colors.success;
    case 'negative':
      return colors.error;
    default:
      return colors.muted;
  }
};

// Ordered steps shown in the customer's order timeline (excludes cancelled/refunded).
export const TIMELINE_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_delivery',
  'dispatched',
  'delivered',
];
