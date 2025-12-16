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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function ThemedApp() {
  const { colors, theme } = useThemeContext();
  const queryClient = new QueryClient()
  return (
    <PaperProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </NavigationContainer>
        </QueryClientProvider>
      </View>
    </PaperProvider>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
