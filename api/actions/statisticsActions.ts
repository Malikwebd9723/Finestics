// api/actions/statisticsActions.ts
import { apiRequest } from 'api/clients';

const BASE_PATH = '/statistics';

// ==================== TYPES ====================

export interface DashboardStats {
  today: {
    orders: number;
    sales: number;
    collected: number;
    deliveries: number;
  };
  week: {
    orders: number;
    sales: number;
    collected: number;
  };
  month: {
    orders: number;
    sales: number;
    collected: number;
  };
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
  };
  summary: {
    totalOrders: number;
    totalSales: number;
    totalCollected: number;
    totalOutstanding: number;
    avgOrderValue: number;
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
 * Get dashboard overview stats
 */
export const fetchDashboardStats = async (): Promise<{
  success: boolean;
  data: DashboardStats;
}> => {
  const res = await apiRequest(`${BASE_PATH}/dashboard`, 'GET');
  return res.data;
};

/**
 * Get detailed statistics
 */
export const fetchDetailedStats = async (
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<{ success: boolean; data: DetailedStats }> => {
  const res = await apiRequest(`${BASE_PATH}/detailed?period=${period}`, 'GET');
  return res.data;
};

/**
 * Get sales trend data
 */
export const fetchSalesTrend = async (
  days: number = 30
): Promise<{ success: boolean; data: SalesTrendItem[] }> => {
  const res = await apiRequest(`${BASE_PATH}/sales-trend?days=${days}`, 'GET');
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
