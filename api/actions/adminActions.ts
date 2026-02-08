// api/actions/adminActions.ts
import { apiRequest } from 'api/clients';

// ==================== TYPES ====================

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
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
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
  // Placeholder - will be connected to API later
  const res = await apiRequest('/admin/dashboard/stats', 'GET');
  return res.data;
};

// ==================== VENDOR MANAGEMENT ====================

/**
 * Fetch all vendors stats summary
 */
export const fetchAllVendorsStats = async () => {
  const res = await apiRequest('/vendors/stats', 'GET');
  return res.data;
};

/**
 * Fetch pending vendors for approval
 */
export const fetchPendingVendorsForApproval = async (page = 1, limit = 20) => {
  const res = await apiRequest(`/vendors/pending?page=${page}&limit=${limit}`, 'GET');
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
  return res.data;
};

/**
 * Fetch vendor statistics
 */
export const fetchVendorStatsById = async (id: number) => {
  const res = await apiRequest(`/vendors/${id}/stats`, 'GET');
  return res.data;
};

// ==================== USER MANAGEMENT ====================

/**
 * Fetch user stats summary
 */
export const fetchUserStats = async () => {
  const res = await apiRequest('/users/stats', 'GET');
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
  return res.data;
};

/**
 * Fetch user by ID
 */
export const fetchUserByIdAdmin = async (id: number) => {
  const res = await apiRequest(`/users/${id}`, 'GET');
  return res.data;
};

/**
 * Update user
 */
export const updateUserAdmin = async (id: number, data: Partial<AdminUser>) => {
  const res = await apiRequest(`/users/${id}`, 'PUT', data);
  return res.data;
};

/**
 * Update user status
 */
export const updateUserStatusAdmin = async (id: number, status: string) => {
  const res = await apiRequest(`/users/${id}/status`, 'PATCH', { accountStatus: status });
  return res.data;
};

/**
 * Update user role
 */
export const updateUserRoleAdmin = async (id: number, role: string) => {
  const res = await apiRequest(`/users/${id}/role`, 'PATCH', { role });
  return res.data;
};

/**
 * Delete user
 */
export const deleteUserAdmin = async (id: number) => {
  const res = await apiRequest(`/users/${id}`, 'DELETE');
  return res.data;
};

// ==================== ADMIN PROFILE ====================

/**
 * Fetch admin profile
 */
export const fetchAdminProfile = async () => {
  const res = await apiRequest('/users/me', 'GET');
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
  return res.data;
};

// ==================== ADMIN STATISTICS ====================

/**
 * Fetch platform overview statistics
 */
export const fetchPlatformStats = async (period: 'week' | 'month' | 'quarter' | 'year') => {
  const res = await apiRequest(`/admin/statistics/overview?period=${period}`, 'GET');
  return res.data;
};

/**
 * Fetch vendor performance statistics
 */
export const fetchVendorPerformanceStats = async (period: 'week' | 'month' | 'quarter' | 'year') => {
  const res = await apiRequest(`/admin/statistics/vendors?period=${period}`, 'GET');
  return res.data;
};

/**
 * Fetch user growth statistics
 */
export const fetchUserGrowthStats = async (period: 'week' | 'month' | 'quarter' | 'year') => {
  const res = await apiRequest(`/admin/statistics/users?period=${period}`, 'GET');
  return res.data;
};
