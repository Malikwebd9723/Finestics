// types/expense.types.ts

// ==================== MAIN ENTITY TYPES ====================

export interface Expense {
  id: number;
  vendorId: number;
  category: string;
  amount: string | number;
  description: string | null;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== ENUMS & CONSTANTS ====================

export const EXPENSE_CATEGORIES: { label: string; value: string; icon: string }[] = [
  { label: 'Gas', value: 'gas', icon: 'gas-station' },
  { label: 'Labor', value: 'labor', icon: 'account-hard-hat' },
  { label: 'Tickets', value: 'tickets', icon: 'ticket' },
  { label: 'Forklift', value: 'forklift', icon: 'forklift' },
  { label: 'Maintenance', value: 'maintenance', icon: 'wrench' },
  { label: 'Utilities', value: 'utilities', icon: 'lightning-bolt' },
  { label: 'Rent', value: 'rent', icon: 'home-city' },
  { label: 'Packaging', value: 'packaging', icon: 'package-variant' },
  { label: 'Other', value: 'other', icon: 'dots-horizontal' },
];

// ==================== API RESPONSE TYPES ====================

export interface ExpensesApiResponse {
  success: boolean;
  data: Expense[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ExpenseDetailResponse {
  success: boolean;
  data: Expense;
}

export interface ExpenseCategoriesResponse {
  success: boolean;
  data: string[];
}

export interface ExpenseSummaryResponse {
  success: boolean;
  data: {
    byCategory: CategorySummary[];
    grandTotal: number;
  };
}

export interface CategorySummary {
  category: string;
  totalAmount: number;
  count: number;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

// ==================== QUERY PARAMETER TYPES ====================

export type ExpenseSortField = 'date' | 'amount' | 'category' | 'createdAt';
export type SortOrder = 'ASC' | 'DESC';

export interface ExpensesQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: ExpenseSortField;
  sortOrder?: SortOrder;
}

// ==================== PAYLOAD TYPES ====================

export interface CreateExpensePayload {
  category: string;
  amount: number;
  description?: string;
  date?: string;
  notes?: string;
}

export interface UpdateExpensePayload {
  category?: string;
  amount?: number;
  description?: string;
  date?: string;
  notes?: string;
}

export interface BulkDeletePayload {
  expenseIds: number[];
}

// ==================== FORM DATA TYPES ====================

export interface ExpenseFormData {
  category: string;
  amount: string;
  description: string;
  date: Date;
  notes: string;
}

// ==================== HELPER FUNCTIONS ====================

export const formatPrice = (value: string | number | null | undefined): string => {
  const num = parseFloat(String(value || 0));
  const formatted = num.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `£${formatted}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getCategoryIcon = (category: string): string => {
  const found = EXPENSE_CATEGORIES.find(
    (c) => c.value.toLowerCase() === category.toLowerCase()
  );
  return found?.icon || 'dots-horizontal';
};

export const getCategoryLabel = (category: string): string => {
  const found = EXPENSE_CATEGORIES.find(
    (c) => c.value.toLowerCase() === category.toLowerCase()
  );
  return found?.label || category.charAt(0).toUpperCase() + category.slice(1);
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    gas: '#f59e0b',
    labor: '#3b82f6',
    tickets: '#ef4444',
    forklift: '#8b5cf6',
    maintenance: '#10b981',
    utilities: '#06b6d4',
    rent: '#ec4899',
    packaging: '#84cc16',
    other: '#6b7280',
  };
  return colors[category.toLowerCase()] || '#6b7280';
};
