import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { ThemeProvider, useThemeContext } from './context/ThemeProvider';
import './global.css';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from 'context/AuthContext';
import { SnackbarProvider } from 'context/SnackbarContext';
import { ConfigProvider } from 'context/ConfigProvider';
import { DialogProvider } from 'context/DialogProvider';
import { CartProvider } from 'context/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// ✅ FIX: Move QueryClient OUTSIDE the component
// This prevents creating a new client on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function ThemedApp() {
  const { colors, theme } = useThemeContext();

  return (
    <PaperProvider>
      {/* ✅ FIX: Add StatusBar with dynamic style based on theme */}
      {/* 'dark' style = light content (for dark backgrounds) */}
      {/* 'light' style = dark content (for light backgrounds) */}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <AuthProvider>
              <ConfigProvider>
                <DialogProvider>
                  <SnackbarProvider>
                    <CartProvider>
                      <RootNavigator />
                    </CartProvider>
                  </SnackbarProvider>
                </DialogProvider>
              </ConfigProvider>
            </AuthProvider>
          </NavigationContainer>
        </QueryClientProvider>
      </View>
    </PaperProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Render once fonts are ready, or proceed with system fallback on error so the
  // app never hangs on a blank screen if the font assets can't load.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
