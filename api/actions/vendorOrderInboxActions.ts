// api/actions/vendorOrderInboxActions.ts
// Vendor-facing view of customer-placed orders (the Order model).
import { apiRequest, getErrorMessage } from '../clients';
import type { CustomerOrder, OrderStatus } from './customerOrderActions';
import type { Pagination } from './marketplaceActions';

export type VendorOrderStatusAction =
  | 'confirmed'
  | 'processing'
  | 'ready_for_delivery'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export const getVendorOrders = async (
  status?: OrderStatus
): Promise<{ items: CustomerOrder[]; pagination: Pagination }> => {
  const query = status ? `?status=${status}` : '';
  const res = await apiRequest(`/vendor/customer-orders${query}`, 'GET');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to load orders'));
  return { items: res.data.data, pagination: res.data.pagination };
};

export const getVendorOrder = async (orderId: number): Promise<CustomerOrder> => {
  const res = await apiRequest(`/vendor/customer-orders/${orderId}`, 'GET');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to load order'));
  return res.data.data;
};

export const updateVendorOrderStatus = async (
  orderId: number,
  status: VendorOrderStatusAction,
  notes?: string
): Promise<CustomerOrder> => {
  const res = await apiRequest(`/vendor/customer-orders/${orderId}/status`, 'PATCH', {
    status,
    notes,
  });
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to update order'));
  return res.data.data;
};
