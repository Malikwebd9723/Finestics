// api/actions/configActions.ts
import { apiRequest } from 'api/clients';

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
  return res.data;
};
