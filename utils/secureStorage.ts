// utils/secureStorage.ts
//
// Thin wrapper that prefers expo-secure-store (Keychain / Keystore) when the
// module is available, and transparently falls back to AsyncStorage otherwise.
// Install the real backend with:
//   npx expo install expo-secure-store
//
// After install the app should be rebuilt (EAS build) — SecureStore requires
// native modules. No code change is needed at call sites.

import AsyncStorage from '@react-native-async-storage/async-storage';

type SecureStoreModule = {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let secureStore: SecureStoreModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-secure-store');
  if (mod?.setItemAsync && mod?.getItemAsync) {
    secureStore = mod;
  }
} catch {
  secureStore = null;
}

// Keys considered "sensitive" are stored in SecureStore when possible.
const SENSITIVE_KEYS = new Set(['accessToken', 'refreshToken']);

export async function setStoredValue(key: string, value: string | null) {
  if (value === null || value === undefined) {
    return removeStoredValue(key);
  }
  if (secureStore && SENSITIVE_KEYS.has(key)) {
    await secureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function getStoredValue(key: string): Promise<string | null> {
  if (secureStore && SENSITIVE_KEYS.has(key)) {
    try {
      const v = await secureStore.getItemAsync(key);
      if (v !== null) return v;
    } catch {
      // fall through to AsyncStorage (handles one-time migration)
    }
  }
  const v = await AsyncStorage.getItem(key);
  if (!v || v === 'null' || v === 'undefined') return null;
  // Migrate the value into SecureStore if we're supposed to use it
  if (secureStore && SENSITIVE_KEYS.has(key)) {
    try {
      await secureStore.setItemAsync(key, v);
      await AsyncStorage.removeItem(key);
    } catch {
      // best effort
    }
  }
  return v;
}

export async function removeStoredValue(key: string) {
  if (secureStore && SENSITIVE_KEYS.has(key)) {
    try {
      await secureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  }
  await AsyncStorage.removeItem(key);
}

export async function clearStoredKeys(keys: string[]) {
  await Promise.all(keys.map(removeStoredValue));
}

export const isSecureStorageAvailable = () => secureStore !== null;
