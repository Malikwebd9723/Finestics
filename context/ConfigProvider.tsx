import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConfig, AppConfig } from 'api/actions/configActions';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  ITEM_STATUSES,
  CURRENCY,
} from 'types/order.types';
import { PRODUCT_UNITS } from 'types/product.types';
import { RETURN_ACTIONS } from 'types/return.types';

// Fallback config matches the hardcoded constants in types/* so the app still works
// when the /config endpoint is unreachable or the user is unauthenticated.
const FALLBACK_CONFIG: AppConfig = {
  currency: {
    code: CURRENCY.code,
    symbol: CURRENCY.symbol,
    prefix: CURRENCY.position === 'prefix',
    decimals: CURRENCY.decimalPlaces,
  },
  productUnits: PRODUCT_UNITS.map((u) => u.value),
  orderStatuses: ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label, color: s.color })),
  paymentStatuses: PAYMENT_STATUSES.map((s) => ({ value: s.value, label: s.label, color: s.color })),
  paymentMethods: PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label })),
  itemStatuses: ITEM_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  returnActions: RETURN_ACTIONS.map((a) => ({
    value: a.value,
    label: a.label,
    color: a.color,
    description: a.description,
  })),
  policies: {
    canEditCompletedOrders: false,
    canCancelCollectedOrders: true,
    maxDiscountPercent: 100,
    defaultPaymentTermsDays: 30,
    creditLimitRequired: false,
  },
  features: {
    returnsEnabled: true,
    expensesEnabled: true,
    multiVanEnabled: true,
  },
};

const ConfigContext = createContext<AppConfig>(FALLBACK_CONFIG);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
  const config = data?.data ?? FALLBACK_CONFIG;
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): AppConfig {
  return useContext(ConfigContext);
}
