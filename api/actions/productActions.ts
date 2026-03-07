// api/actions/productActions.ts
import { apiRequest } from 'api/clients';

// ==================== PRODUCTS ====================

interface FetchProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  isActive?: boolean;
}

export const fetchAllProducts = async ({
  page = 1,
  limit = 20,
  search,
  tag,
  isActive,
}: FetchProductsParams = {}) => {
  const parts: string[] = [`page=${page}`, `limit=${limit}`];
  if (search) parts.push(`search=${encodeURIComponent(search)}`);
  if (tag) parts.push(`tag=${encodeURIComponent(tag)}`);
  if (isActive !== undefined) parts.push(`isActive=${isActive}`);
  const res = await apiRequest(`/products?${parts.join('&')}`, 'GET');
  return res.data;
};

/**
 * Fetch single product details
 */
export const fetchProductDetails = async (productId: number) => {
  const res = await apiRequest(`/products/${productId}`, 'GET');
  return res.data;
};

/**
 * Create new product
 */
export const addProduct = async (data: any) => {
  const res = await apiRequest('/products', 'POST', data);
  return res.data;
};

/**
 * Update existing product
 */
export const updateProduct = async (productId: number, data: any) => {
  const res = await apiRequest(`/products/${productId}`, 'PUT', data);
  return res.data;
};

/**
 * Delete product
 */
export const deleteProduct = async (productId: number) => {
  const res = await apiRequest(`/products/${productId}`, 'DELETE');
  return res.data;
};

/**
 * Fetch all unique tags for the vendor
 */
export const fetchTags = async () => {
  const res = await apiRequest('/products/tags', 'GET');
  // API returns { success: true, data: string[] }
  return res.data?.data || res.data || [];
};
