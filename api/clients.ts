import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from 'config';

export const apiRequest = async (
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any
) => {
  try {
    // const accessToken = await AsyncStorage.getItem('accessToken');
    const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJjdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOm51bGwsImlhdCI6MTc2NDcwMzE0NywiZXhwIjoxNzY0Nzg5NTQ3fQ.R5DdqAtt3H_dh7IgmymDnmhpCOe78NQjkFV7sUkG_tU";
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
