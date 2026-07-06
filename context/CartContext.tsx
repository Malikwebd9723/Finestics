// context/CartContext.tsx
// Per-vendor shopping carts persisted locally, namespaced per signed-in user so
// carts never leak between accounts on a shared device. One cart per vendor.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = 'customer_carts_v1';
const LEGACY_KEY = 'customer_carts_v1'; // pre-P4 un-namespaced key

export interface CartLine {
  productId: number;
  name: string;
  unit: string;
  sellingPrice: string;
  quantity: number;
}

interface VendorCart {
  vendorName?: string;
  items: CartLine[];
}

type Carts = Record<string, VendorCart>;

export interface CartSummary {
  vendorId: number;
  vendorName?: string;
  count: number;
  total: number;
}

interface CartContextType {
  ready: boolean;
  getCart: (vendorId: number) => CartLine[];
  getCount: (vendorId: number) => number;
  getTotal: (vendorId: number) => number;
  getAllCarts: () => CartSummary[];
  addItem: (vendorId: number, vendorName: string, line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQty: (vendorId: number, productId: number, qty: number) => void;
  removeItem: (vendorId: number, productId: number) => void;
  /** Refresh stored unit prices (after a PRICES_CHANGED rejection). */
  updatePrices: (vendorId: number, prices: { productId: number; sellingPrice: string }[]) => void;
  clearCart: (vendorId: number) => void;
  clearAll: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [carts, setCarts] = useState<Carts>({});
  const [ready, setReady] = useState(false);

  const storageKey = user ? `${STORAGE_PREFIX}:${user.id}` : null;

  // Load the signed-in user's carts; carts are empty (and unpersisted) signed out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storageKey) {
        setCarts({});
        setReady(true);
        return;
      }
      try {
        let raw = await AsyncStorage.getItem(storageKey);
        // One-time adoption of the pre-P4 un-namespaced cart.
        if (!raw) {
          const legacy = await AsyncStorage.getItem(LEGACY_KEY);
          if (legacy) {
            raw = legacy;
            await AsyncStorage.setItem(storageKey, legacy);
            await AsyncStorage.removeItem(LEGACY_KEY);
          }
        }
        if (!cancelled) setCarts(raw ? JSON.parse(raw) : {});
      } catch {
        if (!cancelled) setCarts({});
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const persist = useCallback(
    (next: Carts) => {
      setCarts(next);
      if (storageKey) {
        AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      }
    },
    [storageKey]
  );

  const getCart = useCallback(
    (vendorId: number) => carts[String(vendorId)]?.items ?? [],
    [carts]
  );

  const getCount = useCallback(
    (vendorId: number) =>
      (carts[String(vendorId)]?.items ?? []).reduce((sum, l) => sum + l.quantity, 0),
    [carts]
  );

  const getTotal = useCallback(
    (vendorId: number) =>
      (carts[String(vendorId)]?.items ?? []).reduce(
        (sum, l) => sum + Number(l.sellingPrice) * l.quantity,
        0
      ),
    [carts]
  );

  const getAllCarts = useCallback((): CartSummary[] => {
    return Object.entries(carts)
      .map(([vendorId, cart]) => ({
        vendorId: Number(vendorId),
        vendorName: cart.vendorName,
        count: cart.items.reduce((sum, l) => sum + l.quantity, 0),
        total: cart.items.reduce((sum, l) => sum + Number(l.sellingPrice) * l.quantity, 0),
      }))
      .filter((c) => c.count > 0);
  }, [carts]);

  const addItem: CartContextType['addItem'] = useCallback(
    (vendorId, vendorName, line, qty = 1) => {
      const key = String(vendorId);
      const cart = carts[key] ?? { vendorName, items: [] };
      const items = [...cart.items];
      const idx = items.findIndex((l) => l.productId === line.productId);
      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
      } else {
        items.push({ ...line, quantity: qty });
      }
      persist({ ...carts, [key]: { vendorName, items } });
    },
    [carts, persist]
  );

  const setQty: CartContextType['setQty'] = useCallback(
    (vendorId, productId, qty) => {
      const key = String(vendorId);
      const cart = carts[key];
      if (!cart) return;
      let items = cart.items.map((l) =>
        l.productId === productId ? { ...l, quantity: qty } : l
      );
      items = items.filter((l) => l.quantity > 0);
      const next = { ...carts };
      if (items.length === 0) delete next[key];
      else next[key] = { ...cart, items };
      persist(next);
    },
    [carts, persist]
  );

  const removeItem: CartContextType['removeItem'] = useCallback(
    (vendorId, productId) => setQty(vendorId, productId, 0),
    [setQty]
  );

  const updatePrices: CartContextType['updatePrices'] = useCallback(
    (vendorId, prices) => {
      const key = String(vendorId);
      const cart = carts[key];
      if (!cart) return;
      const priceMap = new Map(prices.map((p) => [p.productId, String(p.sellingPrice)]));
      const items = cart.items.map((l) =>
        priceMap.has(l.productId) ? { ...l, sellingPrice: priceMap.get(l.productId)! } : l
      );
      persist({ ...carts, [key]: { ...cart, items } });
    },
    [carts, persist]
  );

  const clearCart: CartContextType['clearCart'] = useCallback(
    (vendorId) => {
      const next = { ...carts };
      delete next[String(vendorId)];
      persist(next);
    },
    [carts, persist]
  );

  const clearAll = useCallback(() => persist({}), [persist]);

  const value: CartContextType = {
    ready,
    getCart,
    getCount,
    getTotal,
    getAllCarts,
    addItem,
    setQty,
    removeItem,
    updatePrices,
    clearCart,
    clearAll,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
