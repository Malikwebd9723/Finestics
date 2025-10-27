import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { ThemeProvider, useThemeContext } from './context/ThemeProvider';
import './global.css';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

function ThemedApp() {
  const { colors, theme } = useThemeContext();

  return (
    <PaperProvider>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
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
