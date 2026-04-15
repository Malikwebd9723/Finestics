// types/return.types.ts

// ==================== ENUMS ====================

export type ReturnAction = 'credit' | 'refund' | 'replace_next_order';
export type PendingItemStatus = 'pending' | 'added_to_order' | 'cancelled';

// ==================== ENTITIES ====================

export interface VendorReturn {
  id: number;
  orderId: number;
  vendorId: number;
  returnDate: string;
  totalRefundAmount: string | number;
  processedBy: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  order?: {
    id: number;
    orderNumber: string;
    orderDate: string;
    customerId: number;
    customer?: {
      id: number;
      businessName: string;
      contactPerson: string;
      phone: string;
    };
  };
  items?: VendorReturnItem[];
  processor?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface VendorReturnItem {
  id: number;
  returnId: number;
  orderItemId: number;
  productId: number;
  quantity: string | number;
  refundAmount: string | number;
  reason: string | null;
  action: ReturnAction;
  product?: {
    id: number;
    name: string;
    unit: string;
  };
  orderItem?: {
    id: number;
    productName: string;
    unit: string;
    orderedQuantity: string | number;
    deliveredQuantity: string | number;
    returnedQuantity: string | number;
    sellingPrice: string | number;
    buyingPrice: string | number;
  };
}

export interface VendorPendingItem {
  id: number;
  vendorId: number;
  customerId: number;
  productId: number;
  quantity: string | number;
  status: PendingItemStatus;
  notes: string | null;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    unit: string;
    sellingPrice: string | number;
    isActive: boolean;
  };
  originalReturn?: {
    id: number;
    returnDate: string;
    order?: {
      id: number;
      orderNumber: string;
    };
  };
  fulfilledInOrder?: {
    id: number;
    orderNumber: string;
  } | null;
}

// ==================== API RESPONSE TYPES ====================

export interface ReturnsApiResponse {
  success: boolean;
  data: VendorReturn[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ReturnDetailResponse {
  success: boolean;
  data: VendorReturn;
}

export interface PendingItemsResponse {
  success: boolean;
  data: {
    customer: {
      id: number;
      businessName: string;
      contactPerson: string;
    };
    pendingItems: VendorPendingItem[];
    totalPendingItems: number;
  };
}

export interface PendingItemsCheckResponse {
  success: boolean;
  data: {
    hasPendingItems: boolean;
    count: number;
  };
}

export interface ExpirePendingItemsResponse {
  success: boolean;
  message: string;
  data: {
    expiredCount: number;
    customers: {
      customerId: number;
      expiredCount: number;
      creditAmount: number;
    }[];
  };
}

// ==================== FORM / PAYLOAD TYPES ====================

export interface ProcessReturnPayload {
  items: ProcessReturnItemPayload[];
  returnDate?: string;
  notes?: string;
}

export interface ProcessReturnItemPayload {
  orderItemId: number;
  quantity: number;
  reason?: string;
  action?: ReturnAction;
}

export interface CancelPendingItemPayload {
  reason?: string;
}

export interface ReturnsQueryParams {
  page?: number;
  limit?: number;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ==================== CONSTANTS ====================

export const RETURN_ACTIONS: {
  label: string;
  value: ReturnAction;
  color: string;
  description: string;
}[] = [
  {
    label: 'Credit',
    value: 'credit',
    color: '#10b981',
    description: 'Reduce customer balance (credit for future orders)',
  },
  {
    label: 'Refund',
    value: 'refund',
    color: '#ef4444',
    description: 'Cash refund (money returned to customer)',
  },
  {
    label: 'Replace',
    value: 'replace_next_order',
    color: '#3b82f6',
    description: 'Free replacement in next order',
  },
];

export const PENDING_ITEM_STATUSES: {
  label: string;
  value: PendingItemStatus;
  color: string;
}[] = [
  { label: 'Pending', value: 'pending', color: '#f59e0b' },
  { label: 'Added to Order', value: 'added_to_order', color: '#10b981' },
  { label: 'Cancelled', value: 'cancelled', color: '#ef4444' },
];

// ==================== HELPER FUNCTIONS ====================

export const getReturnActionLabel = (action: ReturnAction): string => {
  const found = RETURN_ACTIONS.find((a) => a.value === action);
  return found?.label || action;
};

export const getReturnActionColor = (action: ReturnAction): string => {
  const found = RETURN_ACTIONS.find((a) => a.value === action);
  return found?.color || '#6b7280';
};

export const getReturnActionDescription = (action: ReturnAction): string => {
  const found = RETURN_ACTIONS.find((a) => a.value === action);
  return found?.description || '';
};

export const getPendingItemStatusLabel = (status: PendingItemStatus): string => {
  const found = PENDING_ITEM_STATUSES.find((s) => s.value === status);
  return found?.label || status;
};

export const getPendingItemStatusColor = (status: PendingItemStatus): string => {
  const found = PENDING_ITEM_STATUSES.find((s) => s.value === status);
  return found?.color || '#6b7280';
};

export const canProcessReturn = (status: string): boolean => {
  return status === 'delivered' || status === 'completed';
};
