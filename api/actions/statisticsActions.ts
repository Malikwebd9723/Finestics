// api/actions/statisticsActions.ts
import { apiRequest } from 'api/clients';

const BASE_PATH = '/statistics';

// ==================== TYPES ====================

export interface PeriodBucket {
  orders: number;
  sales: number;
  collected: number;
  cost: number;
  // Legacy aliases
  profit: number;
  margin: number;
  // Canonical fields (v1.5.0+)
  grossProfit: number;
  grossMargin: number;
  expenses: number;
  netProfit: number;
  netMargin: number;
  returnsValue: number;
}

export interface DashboardStats {
  today: PeriodBucket & { deliveries: number };
  week: PeriodBucket;
  month: PeriodBucket;
  custom?: PeriodBucket;
  range: { from: string | null; to: string | null } | null;
  pendingOrders: number;
  outstandingBalance: number;
  ordersByStatus: Record<string, number>;
  customers: {
    total: number;
    active: number;
  };
}

export interface DetailedStats {
  period: {
    start: string;
    end: string;
    name: string;
    from: string | null;
    to: string | null;
  };
  summary: {
    totalOrders: number;
    totalSales: number;
    totalCollected: number;
    totalOutstanding: number;
    avgOrderValue: number;
    totalCost: number;
    grossProfit: number;
    grossMargin: number;
    returnsValue: number;
    netRevenue: number;
    totalExpenses: number;
    netProfit: number;
    netMargin: number;
  };
  ordersByStatus: Record<string, number>;
  ordersByPayment: Record<string, number>;
  dailyBreakdown: {
    date: string;
    orders: number;
    sales: number;
    collected: number;
  }[];
  topCustomers: {
    id: number;
    businessName: string;
    contactPerson: string;
    orderCount: number;
    totalSpent: number;
  }[];
  topProducts: {
    id: number;
    name: string;
    unit: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }[];
  vanPerformance: {
    vanName: string;
    orders: number;
    sales: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
  }[];
}

export interface SalesTrendItem {
  date: string;
  orders: number;
  sales: number;
  collected: number;
  outstanding: number;
}

export interface CustomerStats {
  total: number;
  withBalance: number;
  totalOutstanding: number;
  newThisMonth: number;
  topDebtors: {
    id: number;
    businessName: string;
    contactPerson: string;
    phone: string;
    currentBalance: number;
  }[];
}

export interface ProductStats {
  totalProducts: number;
  uniqueProductsSold: number;
  totalQuantitySold: number;
  totalRevenue: number;
  bestSellers: {
    id: number;
    name: string;
    unit: string;
    quantity: number;
    revenue: number;
  }[];
  slowMovers: {
    id: number;
    name: string;
    unit: string;
    sellingPrice: number;
  }[];
}

// ==================== API CALLS ====================

/**
 * Get dashboard overview stats. Optional from/to date range produces a `custom` bucket.
 */
export const fetchDashboardStats = async (params?: {
  from?: string;
  to?: string;
}): Promise<{ success: boolean; data: DashboardStats }> => {
  const qs = new URLSearchParams();
  if (params?.from) qs.append('from', params.from);
  if (params?.to) qs.append('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await apiRequest(`${BASE_PATH}/dashboard${suffix}`, 'GET');
  return res.data;
};

/**
 * Get detailed statistics. Prefer passing from/to; period= remains for backcompat.
 */
export const fetchDetailedStats = async (params: {
  period?: 'week' | 'month' | 'quarter' | 'year';
  from?: string;
  to?: string;
}): Promise<{ success: boolean; data: DetailedStats }> => {
  const qs = new URLSearchParams();
  if (params.period) qs.append('period', params.period);
  if (params.from) qs.append('from', params.from);
  if (params.to) qs.append('to', params.to);
  const res = await apiRequest(`${BASE_PATH}/detailed?${qs.toString()}`, 'GET');
  return res.data;
};

/**
 * Get sales trend data. Prefer from/to/interval; days= remains for backcompat.
 */
export const fetchSalesTrend = async (params: {
  days?: number;
  from?: string;
  to?: string;
  interval?: 'day' | 'week' | 'month';
}): Promise<{ success: boolean; data: SalesTrendItem[] }> => {
  const qs = new URLSearchParams();
  if (params.days) qs.append('days', String(params.days));
  if (params.from) qs.append('from', params.from);
  if (params.to) qs.append('to', params.to);
  if (params.interval) qs.append('interval', params.interval);
  const res = await apiRequest(`${BASE_PATH}/sales-trend?${qs.toString()}`, 'GET');
  return res.data;
};

/**
 * Get customer statistics
 */
export const fetchCustomerStats = async (): Promise<{ success: boolean; data: CustomerStats }> => {
  const res = await apiRequest(`${BASE_PATH}/customers`, 'GET');
  return res.data;
};

/**
 * Get product statistics
 */
export const fetchProductStats = async (
  days: number = 30
): Promise<{ success: boolean; data: ProductStats }> => {
  const res = await apiRequest(`${BASE_PATH}/products?days=${days}`, 'GET');
  return res.data;
};
