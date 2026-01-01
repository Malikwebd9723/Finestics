// types/product.types.ts

export interface Product {
  id: number;
  vendorId: number;
  name: string;
  unit: string;
  buyingPrice: string | number;
  sellingPrice: string | number;
  tags: string[];
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductFormData {
  name: string;
  unit: string;
  buyingPrice: string;
  sellingPrice: string;
  tags: string[];
  description: string;
  isActive: boolean;
}

export interface ProductApiResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

export interface TagsResponse {
  success: boolean;
  data: string[];
}

// Common units for products
export const PRODUCT_UNITS = [
  { label: 'Kilogram', value: 'kg' },
  { label: 'Gram', value: 'g' },
  { label: 'Piece', value: 'piece' },
  { label: 'Dozen', value: 'dozen' },
  { label: 'Bag', value: 'bag' },
  { label: 'Crate', value: 'crate' },
  { label: 'Bundle', value: 'bundle' },
  { label: 'Box', value: 'box' },
  { label: 'Liter', value: 'liter' },
] as const;

// Helper functions
export const formatPrice = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0' : num.toLocaleString();
};

export const calculateProfit = (
  buyingPrice: string | number,
  sellingPrice: string | number
): number => {
  const buying = typeof buyingPrice === 'string' ? parseFloat(buyingPrice) : buyingPrice;
  const selling = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
  return selling - buying;
};

export const calculateProfitMargin = (
  buyingPrice: string | number,
  sellingPrice: string | number
): number => {
  const buying = typeof buyingPrice === 'string' ? parseFloat(buyingPrice) : buyingPrice;
  const selling = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
  if (buying === 0) return 0;
  return ((selling - buying) / buying) * 100;
};

export const getUnitLabel = (unit: string): string => {
  const found = PRODUCT_UNITS.find((u) => u.value === unit);
  return found?.label || unit;
};

export const getInitials = (name: string): string => {
  if (!name) return '??';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};
