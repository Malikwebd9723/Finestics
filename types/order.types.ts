// types/order.types.ts

// ==================== ORDER ====================

export interface Order {
  id: number;
  vendorId: number;
  customerId: number;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string | null;
  deliveredAt: string | null;
  status: OrderStatus;
  subtotal: string | number;
  deliveryFee: string | number;
  discount: string | number;
  totalAmount: string | number;
  paymentStatus: PaymentStatus;
  paidAmount: string | number;
  balanceAmount: string | number;
  paymentMethod: PaymentMethod | null;
  paymentDate: string | null;
  notes: string | null;
  deliveryAddress: string | null;
  vanName: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  customer?: OrderCustomer;
  items?: OrderItem[];
}

export interface OrderCustomer {
  id: number;
  businessName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  currentBalance?: string | number;
  deliveryInstructions?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  unit: string;
  orderedQuantity: string | number;
  deliveredQuantity: string | number;
  buyingPrice: string | number;
  sellingPrice: string | number;
  subtotal: string | number;
  status: ItemStatus;
  notes: string | null;
  product?: {
    id: number;
    name: string;
    unit: string;
    isActive: boolean;
  };
}

// ==================== ENUMS ====================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'collected'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'credit';

export type ItemStatus = 'pending' | 'delivered' | 'partially_delivered' | 'cancelled';

// Sort options
export type SortField = 'orderDate' | 'deliveryDate' | 'createdAt' | 'totalAmount' | 'orderNumber';
export type SortOrder = 'ASC' | 'DESC';
export type DateFilterField = 'orderDate' | 'deliveryDate';

// ==================== CONSTANTS ====================

export const ORDER_STATUSES: { label: string; value: OrderStatus; color: string }[] = [
  { label: 'Pending', value: 'pending', color: '#f59e0b' },
  { label: 'Confirmed', value: 'confirmed', color: '#3b82f6' },
  { label: 'Collected', value: 'collected', color: '#8b5cf6' },
  { label: 'Delivered', value: 'delivered', color: '#10b981' },
  { label: 'Completed', value: 'completed', color: '#059669' },
  { label: 'Cancelled', value: 'cancelled', color: '#ef4444' },
];

export const PAYMENT_STATUSES: { label: string; value: PaymentStatus; color: string }[] = [
  { label: 'Unpaid', value: 'unpaid', color: '#ef4444' },
  { label: 'Partial', value: 'partial', color: '#f59e0b' },
  { label: 'Paid', value: 'paid', color: '#10b981' },
];

export const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'UPI', value: 'upi' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Credit', value: 'credit' },
];

export const ITEM_STATUSES: { label: string; value: ItemStatus; color: string }[] = [
  { label: 'Pending', value: 'pending', color: '#f59e0b' },
  { label: 'Delivered', value: 'delivered', color: '#10b981' },
  { label: 'Partial', value: 'partially_delivered', color: '#3b82f6' },
  { label: 'Cancelled', value: 'cancelled', color: '#ef4444' },
];

// Sort options for UI
export const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: 'Order Date', value: 'orderDate' },
  { label: 'Delivery Date', value: 'deliveryDate' },
  { label: 'Created', value: 'createdAt' },
  { label: 'Amount', value: 'totalAmount' },
  { label: 'Order #', value: 'orderNumber' },
];

// ==================== API TYPES ====================

export interface OrdersApiResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  data: Order;
}

export interface DailySummary {
  date: string;
  totalOrders: number;
  totalSales: number;
  totalCollected: number;
  totalOutstanding: number;
  totalBuyingCost: number;
  grossProfit: number;
  byStatus: {
    pending: number;
    confirmed: number;
    collected: number;
    delivered: number;
    completed: number;
  };
}

export interface CollectionSheet {
  date: string;
  totalOrders: number;
  items: CollectionSheetItem[];
}

export interface CollectionSheetItem {
  productId: number;
  productName: string;
  unit: string;
  totalQuantity: number;
  avgBuyingPrice: number;
  orders: {
    orderId: number;
    orderNumber: string;
    customerName: string;
    quantity: number;
  }[];
}

// Customer orders response (NEW)
export interface CustomerOrdersResponse {
  success: boolean;
  data: {
    customer: {
      id: number;
      businessName: string;
      contactPerson: string;
      phone: string;
      currentBalance: string | number;
    };
    stats: {
      totalOrders: number;
      totalSpent: number;
      totalPaid: number;
      totalBalance: number;
    };
    orders: Order[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

// Bulk operation responses (NEW)
export interface BulkOperationResponse {
  success: boolean;
  message: string;
  data: {
    updated?: number;
    cancelled?: number;
    orderNumbers: string[];
    vanName?: string;
  };
}

// ==================== FORM TYPES ====================

export interface CreateOrderPayload {
  customerId: number;
  orderDate?: string;
  deliveryDate?: string | null;
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  vanName?: string | null;
  items: CreateOrderItemPayload[];
}

export interface CreateOrderItemPayload {
  productId: number;
  orderedQuantity: number;
  sellingPrice?: number;
  notes?: string | null;
}

export interface UpdateOrderPayload {
  deliveryDate?: string | null;
  deliveryFee?: number;
  discount?: number;
  notes?: string | null;
  deliveryAddress?: string | null;
  vanName?: string | null;
  allowCompletedEdit?: boolean; // NEW: flag to allow editing completed orders
}

export interface RecordPaymentPayload {
  amount: number;
  paymentMethod?: PaymentMethod | null;
  isAdjustment?: boolean; // NEW: flag for refunds/adjustments
  notes?: string | null; // NEW: payment notes
}

// Query params for fetching orders (NEW)
export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: number;
  vanName?: string;
  dateFrom?: string;
  dateTo?: string;
  dateFilterField?: DateFilterField;
  search?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

// ==================== CART TYPES ====================

export interface CartItem {
  productId: number;
  name: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  notes?: string;
}

// ==================== HELPER FUNCTIONS ====================

export const formatPrice = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0' : num.toLocaleString();
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
};

export const getStatusColor = (status: OrderStatus): string => {
  const found = ORDER_STATUSES.find((s) => s.value === status);
  return found?.color || '#6b7280';
};

export const getStatusLabel = (status: OrderStatus): string => {
  const found = ORDER_STATUSES.find((s) => s.value === status);
  return found?.label || status;
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const found = PAYMENT_STATUSES.find((s) => s.value === status);
  return found?.color || '#6b7280';
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const found = PAYMENT_STATUSES.find((s) => s.value === status);
  return found?.label || status;
};

export const getPaymentMethodLabel = (method: PaymentMethod | null): string => {
  if (!method) return '-';
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
};

export const getItemStatusColor = (status: ItemStatus): string => {
  const found = ITEM_STATUSES.find((s) => s.value === status);
  return found?.color || '#6b7280';
};

/**
 * Get available next statuses (UPDATED - no restrictions, all statuses available)
 * Returns all statuses except the current one
 */
export const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  return ORDER_STATUSES.map((s) => s.value).filter((s) => s !== currentStatus);
};

/**
 * Get available statuses for cancelled orders (reopen options)
 */
export const getReopenStatuses = (): OrderStatus[] => {
  return ['pending', 'confirmed', 'collected', 'delivered', 'completed'];
};

/**
 * Check if order can be updated (UPDATED - more permissive)
 * Now allows updating most orders except completed (unless flagged)
 */
export const canUpdateOrder = (status: OrderStatus): boolean => {
  return status !== 'completed';
};

/**
 * Check if order can be reopened (NEW)
 */
export const canReopenOrder = (status: OrderStatus): boolean => {
  return status === 'cancelled';
};

/**
 * Check if order allows payment adjustments (NEW)
 */
export const canAdjustPayment = (status: OrderStatus): boolean => {
  // Allow payment adjustments on all orders
  return true;
};

export const getOrderItemsCount = (items?: OrderItem[]): number => {
  if (!items) return 0;
  return items.reduce((sum, item) => sum + parseFloat(item.orderedQuantity as string), 0);
};

export const calculateCartTotal = (
  items: CartItem[],
  deliveryFee: number = 0,
  discount: number = 0
): { subtotal: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const total = subtotal + deliveryFee - discount;
  return { subtotal, total: Math.max(0, total) };
};

export const isToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const canCancelOrder = (status: OrderStatus): boolean => {
  return status !== 'cancelled' && status !== 'completed';
};

export const canDeleteOrder = (status: OrderStatus): boolean => {
  return status === 'cancelled' || status === 'pending';
};
