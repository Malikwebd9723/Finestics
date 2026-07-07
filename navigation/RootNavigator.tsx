// navigation/RootNavigator.tsx

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { getOnboardingStatus } from 'api/actions/onboardingActions';
import { getStoredValue } from 'utils/secureStorage';

// Import DrawerNavigator
import DrawerNavigator from './DrawerNavigator';

// Auth Screens
import LoginScreen from 'screens/LoginScreen';
import SignupScreen from 'screens/SignupScreen';
import ForgotPasswordScreen from 'screens/ForgotPasswordScreen';

// Onboarding Screens
import BusinessDetailsScreen from 'screens/Onboarding/BusinessDetailsScreen';
import PendingVerificationScreen from 'screens/Onboarding/PendingVerificationScreen';

// Other Screens
import CreateOrderScreen from 'screens/Vendor/CreateOrderScreen';
import CollectionSheet from 'screens/Vendor/CollectionSheet';
import CustomerOrdersScreen from 'screens/Vendor/CustomerOrdersScreen';
import VanOrdersScreen from 'screens/Vendor/VanOrdersScreen';
import NotificationsScreen from 'screens/NotificationsScreen';

// ==================== TYPE DEFINITIONS ====================

type OnboardingScreen = 'BusinessDetailsScreen' | 'PendingVerificationScreen';

type TargetRoute = 'Login' | 'Onboarding' | 'Main';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Onboarding: { screen?: OnboardingScreen } | undefined;
  Main: undefined;
  CreateOrderScreen: { orderId?: number } | undefined;
  CollectionSheet: undefined;
  CustomerOrdersScreen: { customerId: number };
  VanOrdersScreen: { vanName: string };
  Notifications: undefined;
};

export type OnboardingStackParamList = {
  BusinessDetailsScreen: undefined;
  PendingVerificationScreen: undefined;
};

// ==================== STACKS ====================

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

// ==================== ONBOARDING NAVIGATOR ====================

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="BusinessDetailsScreen" component={BusinessDetailsScreen} />
      <OnboardingStack.Screen
        name="PendingVerificationScreen"
        component={PendingVerificationScreen}
      />
    </OnboardingStack.Navigator>
  );
}

// ==================== ROOT NAVIGATOR ====================

export default function RootNavigator() {
  const { colors } = useThemeContext();
  const { user, loading: authLoading } = useAuth();

  const [initializing, setInitializing] = useState(true);
  const [targetRoute, setTargetRoute] = useState<TargetRoute>('Login');
  const [targetParams, setTargetParams] = useState<{ screen?: OnboardingScreen } | undefined>(
    undefined
  );

  useEffect(() => {
    const determineRoute = async () => {
      setInitializing(true);

      try {
        // Check if user exists in storage. Tokens may live in SecureStore, so
        // read through the wrapper — a raw AsyncStorage read can miss them.
        const accessToken = await getStoredValue('accessToken');
        const profileStatus = await getStoredValue('profileStatus');

        // No user or token -> Login
        if (!user || !accessToken) {
          setTargetRoute('Login');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        // Admin goes straight to Main
        if (user.role === 'admin') {
          setTargetRoute('Main');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        // Customers are self-serve: no onboarding, no approval. Straight to Main.
        if (user.role === 'customer') {
          setTargetRoute('Main');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        // Profile is active -> Main app
        if (profileStatus === 'active') {
          setTargetRoute('Main');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        // Fetch onboarding status from API
        const response = await getOnboardingStatus();

        if (!response.success || !response.data?.data) {
          setTargetRoute('Login');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        const { onboardingCompleted, profileStatus: apiProfileStatus } = response.data.data;

        // Onboarding not completed -> the single business-details screen
        if (!onboardingCompleted) {
          setTargetRoute('Onboarding');
          setTargetParams({ screen: 'BusinessDetailsScreen' });
          setInitializing(false);
          return;
        }

        // Onboarding completed but pending approval
        if (apiProfileStatus === 'pending' || profileStatus === 'pending') {
          setTargetRoute('Onboarding');
          setTargetParams({ screen: 'PendingVerificationScreen' });
          setInitializing(false);
          return;
        }

        // Profile is rejected - allow editing + resubmission
        if (apiProfileStatus === 'rejected') {
          setTargetRoute('Onboarding');
          setTargetParams({ screen: 'BusinessDetailsScreen' });
          setInitializing(false);
          return;
        }

        // Default: go to Main
        setTargetRoute('Main');
        setTargetParams(undefined);
        setInitializing(false);
      } catch (error) {
        console.error('Error determining route:', error);
        setTargetRoute('Login');
        setTargetParams(undefined);
        setInitializing(false);
      }
    };

    // Run after auth finishes loading
    if (!authLoading) {
      determineRoute();
    }
  }, [authLoading, user]);

  // ==================== LOADING STATE ====================

  if (authLoading || initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ==================== MAIN APP STACK ====================

  if (targetRoute === 'Main') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="CreateOrderScreen" component={CreateOrderScreen} />
        <Stack.Screen name="CollectionSheet" component={CollectionSheet} />
        <Stack.Screen name="CustomerOrdersScreen" component={CustomerOrdersScreen} />
        <Stack.Screen name="VanOrdersScreen" component={VanOrdersScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    );
  }

  // ==================== ONBOARDING STACK ====================

  if (targetRoute === 'Onboarding') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          initialParams={targetParams}
        />
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    );
  }

  // ==================== AUTH STACK (DEFAULT) ====================

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
