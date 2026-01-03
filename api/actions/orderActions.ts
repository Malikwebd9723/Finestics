// api/actions/orderActions.ts
import { apiRequest } from 'api/clients';
import {
  CreateOrderPayload,
  UpdateOrderPayload,
  RecordPaymentPayload,
  OrderStatus,
  OrdersQueryParams,
} from 'types/order.types';

// Base path for vendor orders
const BASE_PATH = '/vendor-orders';

// ==================== ORDERS CRUD ====================

/**
 * Fetch all orders with optional filters (ENHANCED)
 */
export const fetchAllOrders = async (params?: OrdersQueryParams) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;

  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Fetch single order by ID
 */
export const fetchOrderDetails = async (orderId: number) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}`, 'GET');
  return res.data;
};

/**
 * Create new order
 */
export const createOrder = async (data: CreateOrderPayload) => {
  const res = await apiRequest(BASE_PATH, 'POST', data);
  return res.data;
};

/**
 * Update order details
 */
export const updateOrder = async (orderId: number, data: UpdateOrderPayload) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}`, 'PUT', data);
  return res.data;
};

// ==================== ORDER ACTIONS ====================

/**
 * Update order status (no restrictions now)
 */
export const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/status`, 'PATCH', { status });
  return res.data;
};

/**
 * Record payment for order (supports adjustments)
 */
export const recordPayment = async (orderId: number, data: RecordPaymentPayload) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/payment`, 'POST', data);
  return res.data;
};

/**
 * Cancel order (reason optional)
 */
export const cancelOrder = async (orderId: number, reason?: string) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/cancel`, 'POST', { reason });
  return res.data;
};

/**
 * Duplicate order
 */
export const duplicateOrder = async (
  orderId: number,
  data?: { deliveryDate?: string; vanName?: string; notes?: string }
) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/duplicate`, 'POST', data || {});
  return res.data;
};

// ==================== ORDER ITEMS ====================

/**
 * Add item to order
 */
export const addOrderItem = async (
  orderId: number,
  data: {
    productId: number;
    orderedQuantity: number;
    sellingPrice?: number;
    notes?: string;
  }
) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/items`, 'POST', data);
  return res.data;
};

/**
 * Add multiple items to order
 */
export const addMultipleOrderItems = async (
  orderId: number,
  items: {
    productId: number;
    orderedQuantity: number;
    sellingPrice?: number;
    notes?: string;
  }[]
) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/items/bulk`, 'POST', { items });
  return res.data;
};

/**
 * Update order item
 */
export const updateOrderItem = async (
  orderId: number,
  itemId: number,
  data: {
    orderedQuantity?: number;
    deliveredQuantity?: number;
    sellingPrice?: number;
    status?: string;
    notes?: string;
  }
) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/items/${itemId}`, 'PATCH', data);
  return res.data;
};

/**
 * Remove item from order
 */
export const removeOrderItem = async (orderId: number, itemId: number) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}/items/${itemId}`, 'DELETE');
  return res.data;
};

// ==================== REPORTS & VIEWS ====================

/**
 * Get orders by delivery date
 */
export const fetchOrdersByDate = async (date: string) => {
  const res = await apiRequest(`${BASE_PATH}/by-date/${date}`, 'GET');
  return res.data;
};

/**
 * Get collection sheet (items to buy from market)
 */
export const fetchCollectionSheet = async (date: string) => {
  const res = await apiRequest(`${BASE_PATH}/collection-sheet/${date}`, 'GET');
  return res.data;
};

/**
 * Get orders by van
 */
export const fetchOrdersByVan = async (vanName: string, date?: string) => {
  const url = date
    ? `${BASE_PATH}/by-van/${encodeURIComponent(vanName)}?date=${date}`
    : `${BASE_PATH}/by-van/${encodeURIComponent(vanName)}`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get daily summary
 */
export const fetchDailySummary = async (date: string) => {
  const res = await apiRequest(`${BASE_PATH}/summary/${date}`, 'GET');
  return res.data;
};

// ==================== BULK OPERATIONS ====================

/**
 * Bulk update order status (no restrictions)
 */
export const bulkUpdateStatus = async (orderIds: number[], status: OrderStatus) => {
  const res = await apiRequest(`${BASE_PATH}/bulk/status`, 'POST', { orderIds, status });
  return res.data;
};

/**
 * Bulk assign van to orders
 */
export const bulkAssignVan = async (orderIds: number[], vanName: string) => {
  const res = await apiRequest(`${BASE_PATH}/bulk/assign-van`, 'POST', { orderIds, vanName });
  return res.data;
};

/**
 * Bulk cancel orders (NEW)
 */
export const bulkCancel = async (orderIds: number[], reason?: string) => {
  const res = await apiRequest(`${BASE_PATH}/bulk/cancel`, 'POST', { orderIds, reason });
  return res.data;
};

// ==================== CUSTOMER ORDERS ====================

/**
 * Get orders by customer ID (NEW - uses order routes)
 */
export const fetchOrdersByCustomer = async (
  customerId: number,
  params?: { page?: number; limit?: number; status?: string }
) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `${BASE_PATH}/customer/${customerId}?${queryString}`
    : `${BASE_PATH}/customer/${customerId}`;

  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get customer's order history (legacy - keeping for backward compatibility)
 */
export const fetchCustomerOrders = async (
  customerId: number,
  params?: { page?: number; limit?: number; status?: string }
) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/vendor-customers/${customerId}/orders?${queryString}`
    : `/vendor-customers/${customerId}/orders`;

  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get customer's last order (for quick reorder)
 */
export const fetchCustomerLastOrder = async (customerId: number) => {
  const res = await apiRequest(`/vendor-customers/${customerId}/last-order`, 'GET');
  return res.data;
};

/**
 * Delete order (soft delete - only cancelled/pending)
 */
export const deleteOrder = async (orderId: number) => {
  const res = await apiRequest(`${BASE_PATH}/${orderId}`, 'DELETE');
  return res.data;
};
