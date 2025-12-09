import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from 'config';

export const apiRequest = async (
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any
) => {
  try {
    console.log(JSON.stringify(body));
    
    const accessToken = await AsyncStorage.getItem('accessToken');
    // const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ2ZW5kb3JAZXhhbXBsZS5jb20iLCJyb2xlIjoidmVuZG9yIiwiaWF0IjoxNzY1Mjk4NDMwLCJleHAiOjE3NjUzODQ4MzB9.OAv5cNJzrk9b5VeGO7UehwL3XrRJVELcep1QdIJVAeQ";
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
