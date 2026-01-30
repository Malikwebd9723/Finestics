// api/actions/expensesActions.ts

import { apiRequest } from 'api/clients';
import {
  ExpensesQueryParams,
  CreateExpensePayload,
  UpdateExpensePayload,
  BulkDeletePayload,
} from 'types/expense.types';

const BASE_PATH = '/expenses';

// ==================== CRUD OPERATIONS ====================

/**
 * Fetch all expenses with optional filtering, sorting, and pagination
 */
export const fetchAllExpenses = async (params?: ExpensesQueryParams) => {
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
 * Fetch a single expense by ID
 */
export const fetchExpenseDetails = async (id: number) => {
  const res = await apiRequest(`${BASE_PATH}/${id}`, 'GET');
  return res.data;
};

/**
 * Create a new expense
 */
export const createExpense = async (data: CreateExpensePayload) => {
  const res = await apiRequest(BASE_PATH, 'POST', data);
  return res.data;
};

/**
 * Update an existing expense
 */
export const updateExpense = async (id: number, data: UpdateExpensePayload) => {
  const res = await apiRequest(`${BASE_PATH}/${id}`, 'PUT', data);
  return res.data;
};

/**
 * Delete a single expense
 */
export const deleteExpense = async (id: number) => {
  const res = await apiRequest(`${BASE_PATH}/${id}`, 'DELETE');
  return res.data;
};

// ==================== BULK OPERATIONS ====================

/**
 * Delete multiple expenses at once
 */
export const bulkDeleteExpenses = async (data: BulkDeletePayload) => {
  const res = await apiRequest(`${BASE_PATH}/bulk-delete`, 'POST', data);
  return res.data;
};

// ==================== CATEGORIES & SUMMARY ====================

/**
 * Get all unique expense categories used by the vendor
 */
export const fetchExpenseCategories = async () => {
  const res = await apiRequest(`${BASE_PATH}/categories`, 'GET');
  return res.data;
};

/**
 * Get expense summary (totals grouped by category)
 */
export const fetchExpenseSummary = async (startDate?: string, endDate?: string) => {
  const queryParams = new URLSearchParams();

  if (startDate) {
    queryParams.append('startDate', startDate);
  }
  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `${BASE_PATH}/summary?${queryString}` : `${BASE_PATH}/summary`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};
