// utils/orderStatus.ts
// Maps the 8 backend order statuses to customer-facing labels + colors.
import type { OrderStatus } from 'api/actions/customerOrderActions';

interface StatusMeta {
  label: string;
  color: string; // text/icon color
  bg: string; // badge background
}

const META: Record<OrderStatus, StatusMeta> = {
  pending: { label: 'Placed', color: '#92400E', bg: '#FEF3C7' },
  confirmed: { label: 'Accepted', color: '#1E40AF', bg: '#DBEAFE' },
  processing: { label: 'Preparing', color: '#5B21B6', bg: '#EDE9FE' },
  ready_for_delivery: { label: 'Ready', color: '#5B21B6', bg: '#EDE9FE' },
  dispatched: { label: 'Out for delivery', color: '#075985', bg: '#E0F2FE' },
  delivered: { label: 'Delivered', color: '#166534', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' },
  refunded: { label: 'Refunded', color: '#374151', bg: '#E5E7EB' },
};

export const getOrderStatusMeta = (status: OrderStatus | string): StatusMeta =>
  META[status as OrderStatus] || { label: String(status), color: '#374151', bg: '#E5E7EB' };

// Ordered steps shown in the customer's order timeline (excludes cancelled/refunded).
export const TIMELINE_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_delivery',
  'dispatched',
  'delivered',
];
