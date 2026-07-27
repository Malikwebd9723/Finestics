// utils/uiPrefs.ts
// Tiny JSON persistence for per-screen UI preferences (filters, sort, view
// modes). Keys should be namespaced per user, e.g. `vendor_orders_prefs_v1:42`,
// so switching accounts never leaks another user's defaults.
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadUiPrefs<T extends object>(key: string): Promise<Partial<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export async function saveUiPrefs(key: string, value: object): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preferences are best-effort — never surface storage failures.
  }
}
