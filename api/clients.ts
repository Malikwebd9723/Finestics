import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from 'config';

export const apiRequest = async (
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
