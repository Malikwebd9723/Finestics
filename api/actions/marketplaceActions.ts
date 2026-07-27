// api/actions/marketplaceActions.ts
import { apiRequest, getErrorMessage } from '../clients';

// ==================== TYPES ====================

export interface MarketplaceVendor {
  id: number;
  businessName: string;
  businessType: string | null;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  website: string | null;
  city?: string | null;
  productCount?: number;
  /** Shareable 6-char code customers can search to find this vendor. */
  vendorCode?: string | null;
  /** Vendor hides catalog prices — orders become quote requests. */
  hidePrices?: boolean;
}

export interface MarketplaceProduct {
  id: number;
  name: string;
  unit: string;
  /** Absent until the customer's connection with the vendor is approved. */
  sellingPrice?: string;
  tags?: string[];
  description?: string | null;
  imageUrl?: string | null;
}

export interface VendorDetail extends MarketplaceVendor {
  addresses?: any[];
  products?: MarketplaceProduct[];
  /** Whether the requesting customer has an approved connection. */
  connected?: boolean;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface VendorListParams {
  search?: string;
  city?: string;
  businessType?: string;
  page?: number;
  limit?: number;
}

const buildQuery = (params: Record<string, any> = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
};

// ==================== API FUNCTIONS ====================

/**
 * Browse active vendors on the marketplace.
 */
export const listVendors = async (
  params: VendorListParams = {}
): Promise<{ items: MarketplaceVendor[]; pagination: Pagination }> => {
  const res = await apiRequest(`/marketplace/vendors${buildQuery(params)}`, 'GET');
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to load vendors'));
  }
  return { items: res.data.data, pagination: res.data.pagination };
};

/**
 * Get a single vendor profile with a small catalog preview.
 */
export const getVendor = async (vendorId: number): Promise<VendorDetail> => {
  const res = await apiRequest(`/marketplace/vendors/${vendorId}`, 'GET');
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to load vendor'));
  }
  return res.data.data;
};

/**
 * Get a vendor's full active catalog.
 */
export const getVendorProducts = async (
  vendorId: number,
  params: { search?: string; page?: number; limit?: number } = {}
): Promise<{ items: MarketplaceProduct[]; pagination: Pagination; hidePrices: boolean }> => {
  const res = await apiRequest(
    `/marketplace/vendors/${vendorId}/products${buildQuery(params)}`,
    'GET'
  );
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, 'Failed to load products'));
  }
  return {
    items: res.data.data,
    pagination: res.data.pagination,
    hidePrices: !!res.data.hidePrices,
  };
};
