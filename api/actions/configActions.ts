// api/actions/configActions.ts
import { apiRequest, getErrorMessage } from 'api/clients';

/** Throw if the API response indicates failure */
function throwIfError(res: { success: boolean; data: any }, fallback: string) {
  if (!res.success) {
    throw new Error(getErrorMessage(res.data, fallback));
  }
}

export interface AppConfig {
  currency: { code: string; symbol: string; prefix: boolean; decimals: number };
  productUnits: string[];
  orderStatuses: { value: string; label: string; color: string }[];
  paymentStatuses: { value: string; label: string; color: string }[];
  paymentMethods: { value: string; label: string }[];
  itemStatuses: { value: string; label: string }[];
  returnActions: { value: string; label: string; color: string; description: string }[];
  policies: {
    canEditCompletedOrders: boolean;
    canCancelCollectedOrders: boolean;
    maxDiscountPercent: number;
    defaultPaymentTermsDays: number;
    creditLimitRequired: boolean;
  };
  features: {
    returnsEnabled: boolean;
    expensesEnabled: boolean;
    multiVanEnabled: boolean;
  };
}

export const fetchConfig = async (): Promise<{ success: boolean; data: AppConfig }> => {
  const res = await apiRequest('/config', 'GET');
  throwIfError(res, 'Failed to load app config');
  return res.data;
};
