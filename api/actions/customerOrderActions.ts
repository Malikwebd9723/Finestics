// api/actions/customerOrderActions.ts
import { apiRequest, getErrorMessage } from '../clients';
import type { Pagination } from './marketplaceActions';

// ==================== TYPES ====================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_delivery'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderVendorRef {
  id: number;
  businessName: string;
  logo?: string | null;
  businessPhone?: string | null;
}

export interface OrderLineItem {
  id: number;
  productId: number;
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  total: string;
  notes?: string | null;
}

export interface OrderStatusEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  changedAt: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string;
  totalAmount: string;
  notes?: string | null;
  requestedDeliveryDate?: string | null;
  requestedDeliveryTime?: string | null;
  placedAt: string;
  cancellationReason?: string | null;
  itemCount?: number;
  vendor?: OrderVendorRef;
  items?: OrderLineItem[];
  statusHistory?: OrderStatusEntry[];
  deliveryAddress?: CustomerAddress | null;
}

export interface CustomerAddress {
  id: number;
  type: string;
  label?: string | null;
  street: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  isPrimary?: boolean;
  instructions?: string | null;
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
  notes?: string;
}

export interface CreateOrderPayload {
  vendorId: number;
  items: CreateOrderItem[];
  paymentMethod: 'cash' | 'credit' | 'card' | 'bank_transfer';
  deliveryAddressId?: number | null;
  requestedDeliveryDate?: string | null;
  requestedDeliveryTime?: string | null;
  notes?: string | null;
}

// ==================== ORDERS ====================

export const createOrder = async (payload: CreateOrderPayload): Promise<CustomerOrder> => {
  const res = await apiRequest('/customer/orders', 'POST', payload);
  if (!res.success) {
    const err: any = new Error(getErrorMessage(res.data, 'Failed to place order'));
    err.code = res.data?.error?.code || res.data?.code;
    err.details = res.data?.error?.details || res.data?.details;
    throw err;
  }
  return res.data.data;
};

export const getOrders = async (
  status?: OrderStatus
): Promise<{ items: CustomerOrder[]; pagination: Pagination }> => {
  const query = status ? `?status=${status}` : '';
  const res = await apiRequest(`/customer/orders${query}`, 'GET');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to load orders'));
  return { items: res.data.data, pagination: res.data.pagination };
};

export const getOrder = async (orderId: number): Promise<CustomerOrder> => {
  const res = await apiRequest(`/customer/orders/${orderId}`, 'GET');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to load order'));
  return res.data.data;
};

export const cancelOrder = async (orderId: number, reason?: string): Promise<CustomerOrder> => {
  const res = await apiRequest(`/customer/orders/${orderId}/cancel`, 'POST', { reason });
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to cancel order'));
  return res.data.data;
};

// ==================== ADDRESSES ====================

export const getAddresses = async (): Promise<CustomerAddress[]> => {
  const res = await apiRequest('/customer/addresses', 'GET');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to load addresses'));
  return res.data.data;
};

export const createAddress = async (data: Partial<CustomerAddress>): Promise<CustomerAddress> => {
  const res = await apiRequest('/customer/addresses', 'POST', data);
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to save address'));
  return res.data.data;
};

export const deleteAddress = async (addressId: number) => {
  const res = await apiRequest(`/customer/addresses/${addressId}`, 'DELETE');
  if (!res.success) throw new Error(getErrorMessage(res.data, 'Failed to delete address'));
  return res.data;
};
