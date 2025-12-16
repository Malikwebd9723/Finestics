import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from 'api/clients';
import { ToastAndroid } from 'react-native';

interface AuthContextType {
  loading: boolean;
  user: any;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: any) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Save safely (no undefined allowed)
  const saveValue = async (key: string, value: any) => {
    if (value === undefined || value === null) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, String(value));
  };

  // Fetch profile using valid access token
  const fetchUserProfile = async (): Promise<boolean> => {
    try {
      const res = await apiRequest('/users/me', 'GET');
      const resUser = res.data.data;
      if (res.data.success && resUser) {
        await saveValue('user', JSON.stringify(resUser));
        setUser(resUser);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const loadStorageValue = async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    if (!value || value === 'null' || value === 'undefined') return null;
    return value;
  };

  // Initial Load (Runs once when app starts)
  useEffect(() => {
    const init = async () => {
      try {
        const accessToken = await loadStorageValue('accessToken');
        const refreshToken = await loadStorageValue('refreshToken');
        
        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        let ok = await fetchUserProfile();
        
        if (!ok) {
          // THEN try refreshing
          const refreshRes = await apiRequest('/auth/refresh-token', 'POST', {
            refreshToken,
          });

          if (!refreshRes.success) {
            await logout();
            setLoading(false);
            return;
          }

          await saveValue('accessToken', refreshRes.data.accessToken);
          await saveValue('refreshToken', refreshRes.data.refreshToken);
          await fetchUserProfile();
        }
      } catch (err) {
        console.log('INIT ERROR:', err);
        await logout();
      }

      setLoading(false);
    };

    init();
  }, []);

  // Login
  const login = async (userData: any) => {
    const { accessToken, refreshToken, user, profileStatus } = userData.data;
    console.log(profileStatus);
    
    // Only save if exists, never undefined
    if (accessToken) await AsyncStorage.setItem('accessToken', accessToken);
    if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
    if (profileStatus) await AsyncStorage.setItem('profileStatus', profileStatus);

    await AsyncStorage.setItem('user', JSON.stringify(user));

    setUser(user);
  };

  // Logout
  const logout = async () => {
    await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken', 'profileStatus']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ loading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
