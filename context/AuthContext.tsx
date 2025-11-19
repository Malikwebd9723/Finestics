import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Run once when app starts
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log('Auth load error:', error);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // login function
  const login = async (userData: any) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData.data.user));
    await AsyncStorage.setItem('accessToken', JSON.stringify(userData.data.accessToken));
    await AsyncStorage.setItem('refreshToken', JSON.stringify(userData.data.refreshToken));
  };

  // logout function
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

// shortcut hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be inside AuthProvider');
  }
  return context;
}
