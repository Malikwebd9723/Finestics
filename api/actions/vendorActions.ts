// api/actions/vendorActions.ts
import { apiRequest, getErrorMessage } from 'api/clients';

/** Throw if the API response indicates failure */
function throwIfError(res: { success: boolean; data: any }, fallback: string) {
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, fallback));
  }
}

// ==================== VENDOR PROFILE ====================

/**
 * Get own vendor profile
 */
export const fetchVendorProfile = async () => {
  const res = await apiRequest('/vendors/me', 'GET');
  throwIfError(res, 'Failed to load vendor profile');
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
  throwIfError(res, 'Failed to update profile');
  return res.data;
};

/**
 * Get vendor statistics
 */
export const fetchVendorStats = async () => {
  const res = await apiRequest('/vendors/me/stats', 'GET');
  throwIfError(res, 'Failed to load vendor stats');
  return res.data;
};

// ==================== VAN MANAGEMENT ====================

/**
 * Get vendor vans
 */
export const fetchVans = async () => {
  const res = await apiRequest('/vendors/me/vans', 'GET');
  throwIfError(res, 'Failed to load vans');
  return res.data;
};

/**
 * Add a van
 */
export const addVan = async (vanName: string) => {
  const res = await apiRequest('/vendors/me/vans', 'POST', { vanName });
  throwIfError(res, 'Failed to add van');
  return res.data;
};

/**
 * Remove a van
 */
export const removeVan = async (vanName: string) => {
  const res = await apiRequest(`/vendors/me/vans/${encodeURIComponent(vanName)}`, 'DELETE');
  throwIfError(res, 'Failed to remove van');
  return res.data;
};
