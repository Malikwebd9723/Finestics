// api/actions/paymentActions.ts
import { apiRequest } from 'api/clients';

const BASE_PATH = '/payments';

// ==================== TYPES ====================

export interface PaymentOverview {
  totalSales: number;
  totalCollections: number;
  totalOutstanding: number;
  orderCount: number;
  avgOrderValue: number;
  byPaymentStatus: {
    paid: { count: number; totalAmount: number; balanceAmount: number };
    partial: { count: number; totalAmount: number; balanceAmount: number };
    unpaid: { count: number; totalAmount: number; balanceAmount: number };
  };
  expenses?: { total: number; count: number };
  netCashFlow?: number;
}

export type CollectionGroupBy = 'day' | 'week' | 'month' | 'customer' | 'paymentMethod';

export interface CollectionItem {
  period?: string;
  customerId?: number;
  businessName?: string;
  contactPerson?: string;
  orderCount: number;
  totalCollected: number;
}

export interface CollectionsData {
  groupBy: CollectionGroupBy;
  period: { startDate: string; endDate: string };
  data: CollectionItem[];
  total: number;
}

export interface DailyCollectionPayment {
  id: number;
  orderNumber: string;
  customerId: number;
  businessName: string;
  contactPerson: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string;
}

export interface DailyCollectionData {
  date: string;
  totalCollected: number;
  paymentCount: number;
  byPaymentMethod: { method: string; count: number; totalAmount: number }[];
  payments: DailyCollectionPayment[];
}

export interface OutstandingOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  customerId: number;
  businessName: string;
  contactPerson: string;
  phone: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  daysOutstanding: number;
}

export interface OutstandingData {
  data: OutstandingOrder[];
  summary: { totalOrders: number; totalOutstanding: number };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AgingBucket {
  count: number;
  amount: number;
  percentage: number;
}

export interface AgingCustomer {
  customerId: number;
  businessName: string;
  buckets: Record<string, number>;
  total: number;
}

export interface AgingData {
  asOfDate: string;
  buckets: Record<string, AgingBucket>;
  totalOutstanding: number;
  totalOrdersOutstanding: number;
  customerBreakdown: AgingCustomer[];
}

export interface CustomerPaymentSummary {
  id: number;
  businessName: string;
  contactPerson: string;
  phone: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  totalOrders: number;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  lastOrderDate: string;
  lastPaymentDate: string;
  creditUtilization: number;
}

export interface CustomersSummaryData {
  data: CustomerPaymentSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CustomerDetailSummary {
  customer: {
    id: number;
    businessName: string;
    contactPerson: string;
    phone: string;
    creditLimit: number;
    currentBalance: number;
    paymentTerms: string;
    creditUtilization: number;
  };
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    totalBalance: number;
    lastOrderDate: string;
    lastPaymentDate: string;
    avgOrderValue: number;
  };
  byPaymentStatus: {
    paid: { count: number; totalAmount: number };
    partial: { count: number; totalAmount: number };
    unpaid: { count: number; totalAmount: number };
  };
  recentUnpaidOrders: {
    id: number;
    orderNumber: string;
    orderDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: string;
  }[];
}

export interface LedgerEntry {
  date: string;
  type: 'debit' | 'credit';
  description: string;
  orderId: number;
  orderNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerData {
  customer: {
    id: number;
    businessName: string;
    contactPerson: string;
    phone: string;
    currentBalance: number;
  };
  period: { startDate: string; endDate: string };
  openingBalance: number;
  closingBalance: number;
  summary: { totalDebits: number; totalCredits: number; netMovement: number };
  entries: LedgerEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface SalesReportPeriodItem {
  period: string;
  orderCount: number;
  totalSales: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface SalesReportData {
  period: { startDate: string; endDate: string };
  groupBy: string;
  summary: {
    totalSales: number;
    totalCollected: number;
    totalOutstanding: number;
    orderCount: number;
    totalCOGS: number;
    grossProfit: number;
    grossMargin: number;
    totalExpenses?: number;
    netProfit?: number;
    netMargin?: number;
  };
  data: SalesReportPeriodItem[];
  expenses?: {
    byCategory: { category: string; totalAmount: number; count: number }[];
    total: number;
  };
}

export interface ProfitLossPeriod {
  period: { startDate: string; endDate: string };
  revenue: { total: number; collected: number; orderCount: number };
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  expenses: { byCategory: Record<string, number>; total: number };
  netProfit: number;
  netMargin: number;
}

export interface ProfitLossData {
  current: ProfitLossPeriod;
  previous?: ProfitLossPeriod;
  comparison?: {
    revenueChange: number;
    grossProfitChange: number;
    netProfitChange: number;
    expenseChange: number;
  };
  // flat fields for non-comparison mode
  period?: { startDate: string; endDate: string };
  revenue?: { total: number; collected: number; orderCount: number };
  cogs?: number;
  grossProfit?: number;
  grossMargin?: number;
  expenses?: { byCategory: Record<string, number>; total: number };
  netProfit?: number;
  netMargin?: number;
}

// ==================== API CALLS ====================

/**
 * Get payments overview
 */
export const fetchPaymentOverview = async (params?: {
  startDate?: string;
  endDate?: string;
  includeExpenses?: boolean;
}): Promise<{ success: boolean; data: PaymentOverview }> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.includeExpenses) queryParams.append('includeExpenses', 'true');

  const queryString = queryParams.toString();
  const url = queryString ? `${BASE_PATH}/overview?${queryString}` : `${BASE_PATH}/overview`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get payment collections grouped by dimension
 */
export const fetchPaymentCollections = async (params: {
  startDate: string;
  endDate: string;
  groupBy?: CollectionGroupBy;
  paymentMethod?: string;
}): Promise<{ success: boolean; data: CollectionsData }> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  if (params.groupBy) queryParams.append('groupBy', params.groupBy);
  if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);

  const res = await apiRequest(`${BASE_PATH}/collections?${queryParams.toString()}`, 'GET');
  return res.data;
};

/**
 * Get daily collection details
 */
export const fetchDailyCollection = async (
  date: string
): Promise<{ success: boolean; data: DailyCollectionData }> => {
  const res = await apiRequest(`${BASE_PATH}/collections/daily/${date}`, 'GET');
  return res.data;
};

/**
 * Get outstanding orders
 */
export const fetchOutstandingOrders = async (params?: {
  customerId?: number;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean } & OutstandingData> => {
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
    ? `${BASE_PATH}/outstanding?${queryString}`
    : `${BASE_PATH}/outstanding`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get aging report
 */
export const fetchAgingReport = async (
  asOfDate?: string
): Promise<{ success: boolean; data: AgingData }> => {
  const url = asOfDate
    ? `${BASE_PATH}/outstanding/aging?asOfDate=${asOfDate}`
    : `${BASE_PATH}/outstanding/aging`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get outstanding amounts grouped by order date
 */
export const fetchOutstandingByOrderDate = async (params: {
  startDate: string;
  endDate: string;
}): Promise<{
  success: boolean;
  data: {
    period: { startDate: string; endDate: string };
    data: { date: string; orderCount: number; totalAmount: number; outstandingAmount: number }[];
    totalOutstanding: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);

  const res = await apiRequest(
    `${BASE_PATH}/outstanding/by-order-date?${queryParams.toString()}`,
    'GET'
  );
  return res.data;
};

/**
 * Get customer payment summaries
 */
export const fetchCustomerPaymentSummaries = async (params?: {
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
  hasBalance?: boolean;
}): Promise<{ success: boolean } & CustomersSummaryData> => {
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
    ? `${BASE_PATH}/customers/summary?${queryString}`
    : `${BASE_PATH}/customers/summary`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get single customer payment detail summary
 */
export const fetchCustomerPaymentDetail = async (
  customerId: number,
  params?: { startDate?: string; endDate?: string }
): Promise<{ success: boolean; data: CustomerDetailSummary }> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = queryString
    ? `${BASE_PATH}/customers/${customerId}/summary?${queryString}`
    : `${BASE_PATH}/customers/${customerId}/summary`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get customer ledger
 */
export const fetchCustomerLedger = async (
  customerId: number,
  params?: { startDate?: string; endDate?: string; page?: number; limit?: number }
): Promise<{ success: boolean; data: LedgerData }> => {
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
    ? `${BASE_PATH}/customers/${customerId}/ledger?${queryString}`
    : `${BASE_PATH}/customers/${customerId}/ledger`;
  const res = await apiRequest(url, 'GET');
  return res.data;
};

/**
 * Get sales report
 */
export const fetchSalesReport = async (params: {
  startDate: string;
  endDate: string;
  includeExpenses?: boolean;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<{ success: boolean; data: SalesReportData }> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  if (params.includeExpenses) queryParams.append('includeExpenses', 'true');
  if (params.groupBy) queryParams.append('groupBy', params.groupBy);

  const res = await apiRequest(
    `${BASE_PATH}/reports/sales?${queryParams.toString()}`,
    'GET'
  );
  return res.data;
};

/**
 * Get profit & loss report
 */
export const fetchProfitLossReport = async (params: {
  startDate: string;
  endDate: string;
  compareWithPrevious?: boolean;
}): Promise<{ success: boolean; data: ProfitLossData }> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  if (params.compareWithPrevious) queryParams.append('compareWithPrevious', 'true');

  const res = await apiRequest(
    `${BASE_PATH}/reports/profit-loss?${queryParams.toString()}`,
    'GET'
  );
  return res.data;
};
