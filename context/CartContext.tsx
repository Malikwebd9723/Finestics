// context/CartContext.tsx
// Per-vendor shopping carts persisted locally in AsyncStorage. One cart per vendor.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'customer_carts_v1';

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

interface CartContextType {
  ready: boolean;
  getCart: (vendorId: number) => CartLine[];
  getCount: (vendorId: number) => number;
  getTotal: (vendorId: number) => number;
  addItem: (vendorId: number, vendorName: string, line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQty: (vendorId: number, productId: number, qty: number) => void;
  removeItem: (vendorId: number, productId: number) => void;
  clearCart: (vendorId: number) => void;
  clearAll: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carts, setCarts] = useState<Carts>({});
  const [ready, setReady] = useState(false);

  // Load persisted carts once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCarts(JSON.parse(raw));
      } catch {
        // ignore corrupt cart
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist on every change.
  const persist = useCallback((next: Carts) => {
    setCarts(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

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
    addItem,
    setQty,
    removeItem,
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
