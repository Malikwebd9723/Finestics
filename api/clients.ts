import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from 'config';

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

export const apiRequest = async (
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any
) => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${config.BaseUrl}${route}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const json = await response.json();
    return { success: response.ok, status: response.status, data: json };
  } catch (error) {
    return { ok: false, status: 500, data: { message: 'Network error' } };
  }
};
