// types/customer.types.ts

export interface Address {
  id?: number;
  vendorCustomerId?: number;
  type: 'business' | 'billing' | 'delivery';
  label: string;
  street: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isPrimary?: boolean;
  instructions: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  vendorId: number;
  businessName: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  creditLimit: string;
  currentBalance: string;
  paymentTerms: string;
  businessType: string;
  status: 'active' | 'inactive' | 'blocked';
  notes: string | null;
  deliveryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  address?: Address;
}

export interface CustomerFormData {
  businessName: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  creditLimit: string;
  paymentTerms: string;
  businessType: string;
  notes: string;
  deliveryInstructions: string;
  // Address fields (flat structure for form)
  type: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions: string;
}

export interface CustomerApiResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CustomerDetailResponse {
  success: boolean;
  data: Customer;
}

// Dropdown options
export const BUSINESS_TYPES = [
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Retailer', value: 'retailer' },
  { label: 'Wholesaler', value: 'wholesaler' },
  { label: 'Hotel', value: 'hotel' },
  { label: 'Café', value: 'cafe' },
  { label: 'Other', value: 'other' },
] as const;

export const PAYMENT_TERMS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Net 7 Days', value: 'net_7' },
  { label: 'Net 15 Days', value: 'net_15' },
  { label: 'Net 30 Days', value: 'net_30' },
  { label: 'Net 60 Days', value: 'net_60' },
  { label: 'Net 90 Days', value: 'net_90' },
] as const;

export const ADDRESS_TYPES = [
  { label: 'Business', value: 'business' },
  { label: 'Billing', value: 'billing' },
  { label: 'Delivery', value: 'delivery' },
] as const;

// Helper functions
export const getBusinessTypeLabel = (type: string): string => {
  const found = BUSINESS_TYPES.find((t) => t.value === type);
  return found?.label || type;
};

export const getPaymentTermsLabel = (terms: string): string => {
  const found = PAYMENT_TERMS.find((t) => t.value === terms);
  return found?.label || terms;
};

export const getInitials = (name: string): string => {
  if (!name) return '??';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const isNewCustomer = (dateString: string): boolean => {
  const createdDate = new Date(dateString);
  const today = new Date();
  const diffDays = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
};

export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0' : num.toLocaleString();
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
