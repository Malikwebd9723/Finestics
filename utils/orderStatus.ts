// utils/orderStatus.ts
// Maps the 8 backend order statuses to customer-facing labels + a theme tone.
// Tone vocabulary + color resolution live in utils/statusTones (canonical).
import type { OrderStatus } from 'api/actions/customerOrderActions';
import { StatusTone, toneColor } from './statusTones';

export type { StatusTone };
export { toneColor };

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const META: Record<OrderStatus, StatusMeta> = {
  quote_requested: { label: 'Quote requested', tone: 'neutral' },
  quoted: { label: 'Quote ready', tone: 'active' },
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

// Ordered steps shown in the customer's order timeline (excludes cancelled/refunded).
export const TIMELINE_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_delivery',
  'dispatched',
  'delivered',
];
