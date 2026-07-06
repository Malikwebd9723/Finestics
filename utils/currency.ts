// utils/currency.ts
// Single source for the money symbol used across the customer module.
// ConfigProvider syncs it from GET /config (currency.symbol) on load, so the
// whole app follows the backend's currency without prop-drilling.

let currencySymbol = '£';

export const setCurrencySymbol = (symbol?: string | null) => {
  if (symbol) currencySymbol = symbol;
};

export const getCurrencySymbol = () => currencySymbol;

export const formatPrice = (value: string | number | null | undefined): string => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return `${currencySymbol}0`;
  return `${currencySymbol}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
