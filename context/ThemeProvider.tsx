import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useColorScheme as useNativeWindScheme } from 'nativewind';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: Record<string, string>;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const { colorScheme, setColorScheme } = useNativeWindScheme();

  const [theme, setThemeState] = useState<Theme>((deviceScheme as Theme) || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('app-theme');
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
        setColorScheme(saved);
      } else {
        const system = deviceScheme || 'light';
        setThemeState(system);
        setColorScheme(system);
      }
    };
    loadTheme();
  }, [deviceScheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setColorScheme(newTheme);
    AsyncStorage.setItem('app-theme', newTheme).catch(console.warn);
  };

  const colors =
    theme === 'dark'
      ? {
          background: '#09090B',
          card: '#18181B',
          text: '#FAFAFA',
          muted: '#71717A',
          primary: '#52525B',
          accent: '#FAFAFA',
          white: '#ffffff',
          placeholder: '#52525B',
          gray: '#1F1F23',
          success: '#10B981',
          error: '#EF4444',
          border: '#27272A',
        }
      : {
          background: '#F9FAFB',
          card: '#FFFFFF',
          text: '#111827',
          muted: '#94a3b8',
          primary: '#0F172A',
          accent: '#0F172A',
          white: '#ffffff',
          placeholder: '#64748b',
          gray: '#f1f2f5ff',
          success: '#10B981',
          error: '#EF4444',
          border: '#E5E7EB',
        };

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used inside ThemeProvider');
  return ctx;
};
