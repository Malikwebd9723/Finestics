// api/actions/customerActions.ts
import { apiRequest } from 'api/clients';

// ==================== CUSTOMERS ====================

/**
 * Fetch all customers for the vendor
 */
export const fetchAllCustomers = async () => {
  const res = await apiRequest('/vendor-customers', 'GET');
  return res.data;
};

/**
 * Fetch single customer details
 */
export const fetchCustomerDetails = async (customerId: number) => {
  const res = await apiRequest(`/vendor-customers/${customerId}`, 'GET');
  return res.data;
};

/**
 * Create new customer
 */
export const addCustomer = async (data: any) => {
  const res = await apiRequest('/vendor-customers', 'POST', data);
  return res.data;
};

/**
 * Update existing customer
 */
export const updateCustomer = async (customerId: number, data: any) => {
  const res = await apiRequest(`/vendor-customers/${customerId}`, 'PUT', data);
  return res.data;
};

/**
 * Delete customer
 */
export const deleteCustomer = async (customerId: number) => {
  const res = await apiRequest(`/vendor-customers/${customerId}`, 'DELETE');
  return res.data;
};

/**
 * Fetch customers with outstanding balance
 */
export const fetchOutstandingCustomers = async () => {
  const res = await apiRequest('/vendor-customers/outstanding', 'GET');
  return res.data;
};

/**
 * Update customer status
 */
export const updateCustomerStatus = async (customerId: number, status: string) => {
  const res = await apiRequest(`/vendor-customers/${customerId}/status`, 'PATCH', { status });
  return res.data;
};
