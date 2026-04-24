import {
  getStoredValue,
  setStoredValue,
  clearStoredKeys,
} from 'utils/secureStorage';
import { config } from 'config';

// Emitted when the client fails to refresh a 401 — AuthContext listens and
// forces the user to the login screen.
type AuthEventListener = () => void;
const authEventListeners = new Set<AuthEventListener>();
export const onUnauthorized = (listener: AuthEventListener) => {
  authEventListeners.add(listener);
  return () => authEventListeners.delete(listener);
};
const emitUnauthorized = () => {
  authEventListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
};

// In-flight refresh promise so concurrent 401s share a single refresh attempt.
let refreshInFlight: Promise<string | null> | null = null;

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = await getStoredValue('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch(`${config.BaseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;

      const json = await response.json();
      const data = json?.data || json;
      const newAccess = data?.accessToken;
      const newRefresh = data?.refreshToken;
      if (!newAccess) return null;

      await setStoredValue('accessToken', newAccess);
      if (newRefresh) await setStoredValue('refreshToken', newRefresh);
      return newAccess;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Extract a human-readable error message from any server response shape.
 * Checks common fields: message, error, errors array, etc.
 */
export function getErrorMessage(data: any, fallback = 'Something went wrong'): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof data.error === 'string' && data.error) return data.error;
  if (typeof data.error?.message === 'string') return data.error.message;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    return typeof first === 'string' ? first : first?.message || first?.msg || fallback;
  }
  return fallback;
}

const doFetch = async (
  route: string,
  method: string,
  body?: any,
  accessToken?: string | null
) =>
  fetch(`${config.BaseUrl}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

export const apiRequest = async (
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any
) => {
  try {
    let accessToken = await getStoredValue('accessToken');
    let response = await doFetch(route, method, body, accessToken);

    // Transparent 401 recovery: try one refresh, then retry, else sign out.
    if (response.status === 401 && !route.startsWith('/auth/')) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        accessToken = refreshed;
        response = await doFetch(route, method, body, accessToken);
      } else {
        await clearStoredKeys([
          'accessToken',
          'refreshToken',
          'user',
          'profileStatus',
        ]);
        emitUnauthorized();
      }
    }

    const json = await response.json().catch(() => ({}));
    return { success: response.ok, status: response.status, data: json };
  } catch (error) {
    return { success: false, status: 0, data: { message: 'Network error' } };
  }
};
