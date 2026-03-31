// api/actions/returnActions.ts
import { apiRequest, getErrorMessage } from 'api/clients';
import {
  ProcessReturnPayload,
  CancelPendingItemPayload,
  ReturnsQueryParams,
} from 'types/return.types';

const ORDERS_BASE = '/vendor-orders';
const RETURNS_BASE = '/vendor-returns';
const CUSTOMERS_BASE = '/vendor-customers';

/** Throw if the API response indicates failure */
function throwIfError(res: { success: boolean; data: any }, fallback: string) {
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, fallback));
  }
}

// ==================== RETURNS ====================

/**
 * Process a return for an order
 */
export const processReturn = async (orderId: number, data: ProcessReturnPayload) => {
  const res = await apiRequest(`${ORDERS_BASE}/${orderId}/return`, 'POST', data);
  throwIfError(res, 'Failed to process return');
  return res.data;
};

/**
 * Get all returns for a specific order
 */
export const fetchReturnsByOrder = async (orderId: number) => {
  const res = await apiRequest(`${ORDERS_BASE}/${orderId}/returns`, 'GET');
  return res.data;
};

/**
 * Get all returns with optional filters
 */
export const fetchAllReturns = async (params?: ReturnsQueryParams) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const url = queryString ? `${RETURNS_BASE}?${queryString}` : RETURNS_BASE;

  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get single return by ID
 */
export const fetchReturnDetail = async (returnId: number) => {
  const res = await apiRequest(`${RETURNS_BASE}/${returnId}`, 'GET');
  return res.data;
};

/**
 * Undo/reverse a processed return
 */
export const undoReturn = async (returnId: number) => {
  const res = await apiRequest(`${RETURNS_BASE}/${returnId}/undo`, 'POST');
  throwIfError(res, 'Failed to undo return');
  return res.data;
};

// ==================== PENDING ITEMS ====================

/**
 * Get pending items for a customer
 */
export const fetchPendingItems = async (
  customerId: number,
  params?: { status?: string; includeAll?: boolean }
) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `${CUSTOMERS_BASE}/${customerId}/pending-items?${queryString}`
    : `${CUSTOMERS_BASE}/${customerId}/pending-items`;

  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Quick check if customer has pending items
 */
export const checkPendingItems = async (customerId: number) => {
  const res = await apiRequest(`${CUSTOMERS_BASE}/${customerId}/pending-items/check`, 'GET');
  return res.data;
};

/**
 * Cancel a pending item
 */
export const cancelPendingItem = async (pendingItemId: number, data?: CancelPendingItemPayload) => {
  const res = await apiRequest(
    `${RETURNS_BASE}/pending-items/${pendingItemId}/cancel`,
    'POST',
    data || {}
  );
  throwIfError(res, 'Failed to cancel pending item');
  return res.data;
};

/**
 * Expire all pending items older than 30 days (converts to balance credit)
 */
export const expirePendingItems = async () => {
  const res = await apiRequest(`${RETURNS_BASE}/pending-items/expire`, 'POST');
  throwIfError(res, 'Failed to expire pending items');
  return res.data;
};
