// api/actions/vendorActions.ts
import { apiRequest } from 'api/clients';

// ==================== VENDOR PROFILE ====================

/**
 * Get own vendor profile
 */
export const fetchVendorProfile = async () => {
  const res = await apiRequest('/vendors/me', 'GET');
  return res.data;
};

/**
 * Update own vendor profile
 */
export const updateVendorProfile = async (data: {
  businessName?: string;
  businessType?: string;
  description?: string;
  taxId?: string;
  businessLicense?: string;
  businessPhone?: string;
  businessEmail?: string;
  operatingHours?: object;
  deliveryAreas?: string[];
}) => {
  const res = await apiRequest('/vendors/me', 'PUT', data);
  return res.data;
};

/**
 * Get vendor statistics
 */
export const fetchVendorStats = async () => {
  const res = await apiRequest('/vendors/me/stats', 'GET');
  return res.data;
};

// ==================== VAN MANAGEMENT ====================

/**
 * Get vendor vans
 */
export const fetchVans = async () => {
  const res = await apiRequest('/vendors/me/vans', 'GET');
  return res.data;
};

/**
 * Add a van
 */
export const addVan = async (vanName: string) => {
  const res = await apiRequest('/vendors/me/vans', 'POST', { vanName });
  return res.data;
};

/**
 * Remove a van
 */
export const removeVan = async (vanName: string) => {
  const res = await apiRequest(`/vendors/me/vans/${encodeURIComponent(vanName)}`, 'DELETE');
  return res.data;
};
