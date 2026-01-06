// context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from 'api/clients';
import { User, ProfileStatus, AuthResponseData } from 'api/actions/authActions';

// ==================== TYPES ====================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: AuthResponseData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // ==================== HELPERS ====================

  const saveValue = async (key: string, value: string | null) => {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  };

  const loadValue = async (key: string): Promise<string | null> => {
    const value = await AsyncStorage.getItem(key);
    if (!value || value === 'null' || value === 'undefined') return null;
    return value;
  };

  // ==================== FETCH USER PROFILE ====================

  const fetchUserProfile = async (): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/me', 'GET');

      if (response.success && response.data?.data?.user) {
        const fetchedUser = response.data.data.user;
        await saveValue('user', JSON.stringify(fetchedUser));
        setUser(fetchedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return false;
    }
  };

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initialize = async () => {
      try {
        const accessToken = await loadValue('accessToken');
        const refreshToken = await loadValue('refreshToken');
        const storedUser = await loadValue('user');

        // No tokens -> not authenticated
        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        // Try to load stored user first for faster UI
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // Invalid JSON, ignore
          }
        }

        // Try to fetch fresh user data
        const success = await fetchUserProfile();

        if (!success) {
          // Token might be expired, try refreshing
          const refreshResponse = await apiRequest('/auth/refresh-token', 'POST', {
            refreshToken,
          });

          if (refreshResponse.success && refreshResponse.data?.data) {
            await saveValue('accessToken', refreshResponse.data.data.accessToken);
            await saveValue('refreshToken', refreshResponse.data.data.refreshToken);

            // Try fetching user again
            await fetchUserProfile();
          } else {
            // Refresh failed, clear auth state
            await logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // ==================== LOGIN ====================

  const login = useCallback(async (data: AuthResponseData) => {
    const { accessToken, refreshToken, user: userData, profileStatus } = data;

    // Save tokens
    await saveValue('accessToken', accessToken);
    await saveValue('refreshToken', refreshToken);
    await saveValue('user', JSON.stringify(userData));

    if (profileStatus) {
      await saveValue('profileStatus', profileStatus);
    }

    setUser(userData);
  }, []);

  // ==================== LOGOUT ====================

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', 'DELETE');
    } catch {
      // Ignore logout API errors
    }

    // Clear all storage
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'profileStatus']);
    setUser(null);
  }, []);

  // ==================== UPDATE USER ====================

  const updateUser = useCallback((updatedUser: User) => {
    saveValue('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  // ==================== REFRESH USER ====================

  const refreshUser = useCallback(async () => {
    await fetchUserProfile();
  }, []);

  // ==================== CONTEXT VALUE ====================

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================== HOOK ====================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
