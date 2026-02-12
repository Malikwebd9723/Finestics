// navigation/RootNavigator.tsx

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { getOnboardingStatus } from 'api/actions/onboardingActions';

// Import DrawerNavigator
import DrawerNavigator from './DrawerNavigator';

// Auth Screens
import LoginScreen from 'screens/LoginScreen';
import SignupScreen from 'screens/SignupScreen';

// Onboarding Screens
import BusinessInfoScreen from 'screens/Onboarding/BusinessInfoScreen';
import BusinessAddressScreen from 'screens/Onboarding/BusinessAddressScreen';
import SubmitOnboardingScreen from 'screens/Onboarding/SubmitOnboardingScreen';
import PendingVerificationScreen from 'screens/Onboarding/PendingVerificationScreen';

// Other Screens
import CreateOrderScreen from 'screens/Vendor/CreateOrderScreen';
import CollectionSheet from 'screens/Vendor/CollectionSheet';
import CustomerOrdersScreen from 'screens/Vendor/CustomerOrdersScreen';
import VanOrdersScreen from 'screens/Vendor/VanOrdersScreen';

// ==================== TYPE DEFINITIONS ====================

type OnboardingScreen =
  | 'BusinessInfoScreen'
  | 'BusinessAddressScreen'
  | 'SubmitOnboardingScreen'
  | 'PendingVerificationScreen';

type TargetRoute = 'Login' | 'Onboarding' | 'Main';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: { screen?: OnboardingScreen } | undefined;
  Main: undefined;
  CreateOrderScreen: { orderId?: number } | undefined;
  CollectionSheet: undefined;
  CustomerOrdersScreen: { customerId: number };
  VanOrdersScreen: { vanName: string };
};

export type OnboardingStackParamList = {
  BusinessInfoScreen: undefined;
  BusinessAddressScreen: undefined;
  SubmitOnboardingScreen: undefined;
  PendingVerificationScreen: undefined;
};

// ==================== STACKS ====================

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

// ==================== ONBOARDING NAVIGATOR ====================

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="BusinessInfoScreen" component={BusinessInfoScreen} />
      <OnboardingStack.Screen name="BusinessAddressScreen" component={BusinessAddressScreen} />
      <OnboardingStack.Screen name="SubmitOnboardingScreen" component={SubmitOnboardingScreen} />
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
        // Check if user exists in storage
        const accessToken = await AsyncStorage.getItem('accessToken');
        const profileStatus = await AsyncStorage.getItem('profileStatus');

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

        const { onboardingCompleted, steps, profileStatus: apiProfileStatus } = response.data.data;

        // If onboarding is not completed, determine which step to show
        if (!onboardingCompleted) {
          let nextScreen: OnboardingScreen = 'BusinessInfoScreen';

          if (!steps.businessInfoCompleted) {
            nextScreen = 'BusinessInfoScreen';
          } else if (!steps.addressCompleted) {
            nextScreen = 'BusinessAddressScreen';
          } else {
            // All steps done but not submitted
            nextScreen = 'SubmitOnboardingScreen';
          }

          setTargetRoute('Onboarding');
          setTargetParams({ screen: nextScreen });
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

        // Profile is rejected - allow editing
        if (apiProfileStatus === 'rejected') {
          setTargetRoute('Onboarding');
          setTargetParams({ screen: 'BusinessInfoScreen' });
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
        <Stack.Screen name="CreateOrderScreen" component={CreateOrderScreen} />
        <Stack.Screen name="CollectionSheet" component={CollectionSheet} />
        <Stack.Screen name="CustomerOrdersScreen" component={CustomerOrdersScreen} />
        <Stack.Screen name="VanOrdersScreen" component={VanOrdersScreen} />
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
      </Stack.Navigator>
    );
  }

  // ==================== AUTH STACK (DEFAULT) ====================

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
