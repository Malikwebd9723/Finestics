// api/actions/adminActions.ts
import { apiRequest, getErrorMessage } from 'api/clients';

/** Throw if the API response indicates failure */
function throwIfError(res: { success: boolean; data: any }, fallback: string) {
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, fallback));
  }
}

// ==================== TYPES ====================
// Shapes mirror the backend exactly (finestics-backend adminStats.service.js).
// "Revenue" is gross order value across BOTH channels: vendor-authored
// wholesale orders (direct) + customer-app marketplace orders.

export interface ChannelSplit {
  direct: { orders: number; revenue: number };
  marketplace: { orders: number; revenue: number };
}

export interface AdminDashboardStats {
  vendors: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    rejected: number;
  };
  users: {
    total: number;
    active: number;
    suspended: number;
    byRole: { admin: number; vendor: number; customer: number };
  };
  overview: {
    totalOrders: number;
    totalRevenue: number;
    byChannel: ChannelSplit;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  attentionRequired: {
    pendingVendors: number;
    suspendedVendors: number;
    pendingCustomers: number;
    unverifiedUsers: number;
  };
}

export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface PlatformOverviewStats {
  period: StatsPeriod;
  range: { from: string; to: string };
  revenue: {
    total: number;
    previousPeriod: number;
    percentageChange: number;
    byChannel: ChannelSplit;
  };
  orders: {
    total: number;
    previousPeriod: number;
    percentageChange: number;
    averageOrderValue: number;
  };
  users: { newUsers: number; activeUsers: number };
  chartData: { labels: string[]; revenue: number[]; orders: number[] };
}

export interface AdminVendorStats {
  period: StatsPeriod;
  totalVendors: number;
  activeVendors: number;
  newVendors: number;
  vendorsByStatus: { active: number; pending: number; suspended: number; rejected: number };
  topVendors: {
    id: number;
    businessName: string;
    status: string | null;
    totalOrders: number;
    totalRevenue: number;
  }[];
  vendorGrowth: { labels: string[]; newVendors: number[] };
}

export interface AdminUserGrowthStats {
  period: StatsPeriod;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByRole: { admin: number; vendor: number; customer: number };
  userGrowth: { labels: string[]; newUsers: number[] };
  verificationRate: number;
}

export interface VendorsSummary {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  rejected: number;
  newThisWeek: number;
  newThisMonth: number;
}

export interface UsersSummary {
  total: number;
  active: number;
  suspended: number;
  deleted: number;
  byRole: { admin: number; vendor: number; customer: number };
  verified: number;
  unverified: number;
  newThisWeek: number;
  newThisMonth: number;
  completedOnboarding: number;
  pendingOnboarding: number;
  pendingApprovals: number;
}

/** GET /vendors/:id/stats — admin detail view, both order channels. */
export interface VendorAdminStats {
  vendorId: number;
  businessName: string;
  status: string;
  totalOrders: number;
  totalRevenue: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  totalProducts: number;
  totalCustomers: number;
  outstandingBalance: number;
  byChannel: ChannelSplit;
}

export interface VendorFilters {
  status?: 'pending' | 'active' | 'suspended' | 'rejected';
  search?: string;
}

export interface UserFilters {
  status?: 'active' | 'suspended';
  role?: 'admin' | 'vendor' | 'customer';
  search?: string;
}

export interface Vendor {
  id: number;
  userId: number;
  businessName: string;
  businessType: string;
  description: string;
  businessPhone: string;
  businessEmail: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'vendor' | 'customer';
  accountStatus: 'active' | 'suspended' | 'deleted';
  isEmailVerified: boolean;
  profileImage: string | null;
  createdAt: string;
  lastLoginAt: string;
}

// ==================== DASHBOARD STATS ====================

/**
 * Fetch admin dashboard statistics
 */
export const fetchAdminDashboardStats = async (): Promise<{ data: AdminDashboardStats }> => {
  const res = await apiRequest('/admin/dashboard/stats', 'GET');
  throwIfError(res, 'Failed to load dashboard stats');
  return res.data;
};

// ==================== VENDOR MANAGEMENT ====================

/**
 * Fetch all vendors stats summary
 */
export const fetchAllVendorsStats = async (): Promise<{ data: VendorsSummary }> => {
  const res = await apiRequest('/vendors/stats', 'GET');
  throwIfError(res, 'Failed to load vendor stats');
  return res.data;
};

/**
 * Fetch pending vendors for approval
 */
export const fetchPendingVendorsForApproval = async (page = 1, limit = 20) => {
  const res = await apiRequest(`/vendors/pending?page=${page}&limit=${limit}`, 'GET');
  throwIfError(res, 'Failed to load pending vendors');
  return res.data;
};

/**
 * Fetch all vendors with filters
 */
export const fetchAllVendors = async (page = 1, limit = 20, filters?: VendorFilters) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const res = await apiRequest(`/vendors?${params.toString()}`, 'GET');
  throwIfError(res, 'Failed to load vendors');
  return res.data;
};

/**
 * Create a new vendor
 */
export const createVendor = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  businessName: string;
  businessType?: string;
  description?: string;
  businessPhone?: string;
  businessEmail?: string;
}) => {
  const res = await apiRequest('/vendors', 'POST', data);
  return res;
};

/**
 * Fetch vendor by ID
 */
export const fetchVendorById = async (id: number) => {
  const res = await apiRequest(`/vendors/${id}`, 'GET');
  throwIfError(res, 'Failed to load vendor');
  return res.data;  // Return data for queries
};

/**
 * Update vendor
 */
export const updateVendor = async (id: number, data: Partial<Vendor>) => {
  const res = await apiRequest(`/vendors/${id}`, 'PUT', data);
  return res;
};

/**
 * Approve vendor
 */
export const approveVendor = async (id: number) => {
  const res = await apiRequest(`/vendors/${id}/approve`, 'PATCH');
  return res;
};

/**
 * Reject vendor
 */
export const rejectVendor = async (id: number, reason: string) => {
  const res = await apiRequest(`/vendors/${id}/reject`, 'PATCH', { reason });
  return res;
};

/**
 * Suspend vendor
 */
export const suspendVendor = async (id: number, reason: string) => {
  const res = await apiRequest(`/vendors/${id}/suspend`, 'PATCH', { reason });
  return res;
};

/**
 * Reactivate vendor
 */
export const reactivateVendor = async (id: number) => {
  const res = await apiRequest(`/vendors/${id}/reactivate`, 'PATCH');
  return res;
};

/**
 * Delete vendor
 */
export const deleteVendor = async (id: number) => {
  const res = await apiRequest(`/vendors/${id}`, 'DELETE');
  throwIfError(res, 'Failed to delete vendor');
  return res.data;
};

/**
 * Fetch vendor statistics
 */
export const fetchVendorStatsById = async (id: number): Promise<{ data: VendorAdminStats }> => {
  const res = await apiRequest(`/vendors/${id}/stats`, 'GET');
  throwIfError(res, 'Failed to load vendor stats');
  return res.data;
};

// ==================== USER MANAGEMENT ====================

/**
 * Fetch user stats summary
 */
export const fetchUserStats = async (): Promise<{ data: UsersSummary }> => {
  const res = await apiRequest('/users/stats', 'GET');
  throwIfError(res, 'Failed to load user stats');
  return res.data;
};

/**
 * Fetch all users with filters
 */
export const fetchAllUsersAdmin = async (page = 1, limit = 20, filters?: UserFilters) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.status) params.append('status', filters.status);
  if (filters?.role) params.append('role', filters.role);
  if (filters?.search) params.append('search', filters.search);

  const res = await apiRequest(`/users?${params.toString()}`, 'GET');
  throwIfError(res, 'Failed to load users');
  return res.data;
};

/**
 * Fetch user by ID
 */
export const fetchUserByIdAdmin = async (id: number) => {
  const res = await apiRequest(`/users/${id}`, 'GET');
  throwIfError(res, 'Failed to load user');
  return res.data;
};

/**
 * Update user
 */
export const updateUserAdmin = async (id: number, data: Partial<AdminUser>) => {
  const res = await apiRequest(`/users/${id}`, 'PUT', data);
  throwIfError(res, 'Failed to update user');
  return res.data;
};

/**
 * Update user status
 */
export const updateUserStatusAdmin = async (id: number, status: string) => {
  const res = await apiRequest(`/users/${id}/status`, 'PATCH', { accountStatus: status });
  throwIfError(res, 'Failed to update user status');
  return res.data;
};

/**
 * Update user role
 */
export const updateUserRoleAdmin = async (id: number, role: string) => {
  const res = await apiRequest(`/users/${id}/role`, 'PATCH', { role });
  throwIfError(res, 'Failed to update user role');
  return res.data;
};

/**
 * Delete user
 */
export const deleteUserAdmin = async (id: number) => {
  const res = await apiRequest(`/users/${id}`, 'DELETE');
  throwIfError(res, 'Failed to delete user');
  return res.data;
};

// ==================== ADMIN PROFILE ====================

/**
 * Fetch admin profile
 */
export const fetchAdminProfile = async () => {
  const res = await apiRequest('/users/me', 'GET');
  throwIfError(res, 'Failed to load profile');
  return res.data;
};

/**
 * Update admin profile
 */
export const updateAdminProfile = async (data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}) => {
  const res = await apiRequest('/users/me', 'PUT', data);
  throwIfError(res, 'Failed to update profile');
  return res.data;
};

// ==================== ADMIN STATISTICS ====================

/**
 * Fetch platform overview statistics
 */
export const fetchPlatformStats = async (
  period: StatsPeriod
): Promise<{ data: PlatformOverviewStats }> => {
  const res = await apiRequest(`/admin/statistics/overview?period=${period}`, 'GET');
  throwIfError(res, 'Failed to load platform stats');
  return res.data;
};

/**
 * Fetch vendor performance statistics
 */
export const fetchVendorPerformanceStats = async (
  period: StatsPeriod
): Promise<{ data: AdminVendorStats }> => {
  const res = await apiRequest(`/admin/statistics/vendors?period=${period}`, 'GET');
  throwIfError(res, 'Failed to load vendor performance stats');
  return res.data;
};

/**
 * Fetch user growth statistics
 */
export const fetchUserGrowthStats = async (
  period: StatsPeriod
): Promise<{ data: AdminUserGrowthStats }> => {
  const res = await apiRequest(`/admin/statistics/users?period=${period}`, 'GET');
  throwIfError(res, 'Failed to load user growth stats');
  return res.data;
};
