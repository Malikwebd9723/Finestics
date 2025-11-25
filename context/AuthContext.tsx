import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from 'api/clients';

interface AuthContextType {
  loading: boolean;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  getUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null)
  console.log(user);
  
  // Load User Profile and Save to Storage
  const fetchUserProfile = async (): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/me', 'POST');
      if (response.success && response.data?.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  // Initialization on App Start
  useEffect(() => {
    const initialize = async () => {
      try {
        let accessToken = await AsyncStorage.getItem('accessToken');
        let refreshToken = await AsyncStorage.getItem('refreshToken');
        const savedUser = await AsyncStorage.getItem('user');
        setUser(savedUser)
        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        // Attempt profile fetch
        let userProfile = await fetchUserProfile();

        // If token invalid → refresh token
        if (!userProfile) {
          const refreshRes = await apiRequest('/auth/refresh-token', 'POST', {
            refreshToken,
          });

          if (refreshRes.success && refreshRes.data?.accessToken) {
            await AsyncStorage.setItem('accessToken', refreshRes.data.accessToken);
            await AsyncStorage.setItem('refreshToken', refreshRes.data.refreshToken);

            // Fetch profile again
            userProfile = await fetchUserProfile();
          }
        }

        // If still not valid → logout completely
        if (!userProfile) {
          await logout();
        }
      } catch (error) {
        console.log('Auth init error:', error);
        await logout();
      }

      setLoading(false);
    };

    initialize();
  }, []);

  // LOGIN
  const login = async (userData: any) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData.data.user));
    await AsyncStorage.setItem('accessToken', userData.data.accessToken);
    await AsyncStorage.setItem('refreshToken', userData.data.refreshToken);
  };

  // LOGOUT
  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ loading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
