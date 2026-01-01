// navigation/RootNavigator.jsx

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { apiRequest } from 'api/clients';

// Import DrawerNavigator instead of TabNavigator
import DrawerNavigator from './DrawerNavigator';
import Login from '../screens/Login';
import Signup from '../screens/Signup';

import RoleSelectionScreen from 'screens/Onboarding/RoleSelectionScreen';
import BusinessInfoScreen from 'screens/Onboarding/BusinessInfoScreen';
import BusinessAddressScreen from 'screens/Onboarding/BusinessAddressScreen';
import SubscriptionScreen from 'screens/Onboarding/SubscriptionScreen';
import SubmitOnboardingScreen from 'screens/Onboarding/SubmitOnboardingScreen';
import PendingVerificationScreen from 'screens/Onboarding/PendingVerificationScreen';
import CategoryDetails from 'screens/Admin/CategoryDetails';
import CreateOrderScreen from 'screens/Vendor/CreateOrderScreen';
import CollectionSheet from '../screens/Vendor/CollectionSheet';

const Stack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="RoleSelectionScreen" component={RoleSelectionScreen} />
      <OnboardingStack.Screen name="BusinessInfoScreen" component={BusinessInfoScreen} />
      <OnboardingStack.Screen name="BusinessAddressScreen" component={BusinessAddressScreen} />
      <OnboardingStack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <OnboardingStack.Screen name="SubmitOnboardingScreen" component={SubmitOnboardingScreen} />
      <OnboardingStack.Screen
        name="PendingVerificationScreen"
        component={PendingVerificationScreen}
      />
    </OnboardingStack.Navigator>
  );
}

export default function RootNavigator() {
  const { colors } = useThemeContext();
  const { user, loading: authLoading } = useAuth();

  const [initializing, setInitializing] = useState(true);
  const [targetRoute, setTargetRoute] = useState('Login');
  const [targetParams, setTargetParams] = useState(undefined);

  useEffect(() => {
    const determineRoute = async () => {
      setInitializing(true);

      // Check if user exists in storage
      const accessToken = await AsyncStorage.getItem('accessToken');
      const profileStatus = await AsyncStorage.getItem('profileStatus');

      if (!user || !accessToken) {
        setTargetRoute('Login');
        setTargetParams(undefined);
        setInitializing(false);
        return;
      }

      // Main
      if (user.role === 'admin') {
        setTargetRoute('Main');
        setTargetParams(undefined);
        setInitializing(false);
        return;
      }

      // Check onboarding status
      try {
        const res = await apiRequest('/onboarding/status', 'GET');
        if (!res.success) {
          setTargetRoute('Login');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        // If profile is approved, user should go to Main
        if (profileStatus === 'active') {
          setTargetRoute('Main');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }

        const onboardingCompetionStatus = res.data.data.onboardingCompleted;
        const steps = res.data.data.steps;

        // If onboarding is not completed, check which step to show
        if (!onboardingCompetionStatus) {
          // Determine which onboarding step the user should see
          let nextScreen = 'RoleSelectionScreen';

          if (!steps.roleSelected) {
            nextScreen = 'RoleSelectionScreen';
          } else if (!steps.businessInfoCompleted) {
            nextScreen = 'BusinessInfoScreen';
          } else if (!steps.addressCompleted) {
            nextScreen = 'BusinessAddressScreen';
          } else if (!steps.paymentPlanSelected) {
            nextScreen = 'SubscriptionScreen';
          } else {
            // All steps completed but onboarding not marked complete
            nextScreen = 'SubmitOnboardingScreen';
          }

          setTargetRoute('Onboarding');
          setTargetParams({ screen: nextScreen });
          setInitializing(false);
          return;
        }

        // Onboarding is completed, check if pending verification
        if (profileStatus === 'pending') {
          setTargetRoute('Onboarding');
          setTargetParams({ screen: 'PendingVerificationScreen' });
          setInitializing(false);
          return;
        }

        // Default if everything is complete
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

  // Show loader while auth or route is loading
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

  if (targetRoute === 'Main') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Replace TabNavigator with DrawerNavigator */}
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="CategoryDetails" component={CategoryDetails} />
        <Stack.Screen name="CreateOrderScreen" component={CreateOrderScreen} />
        <Stack.Screen name="CollectionSheet" component={CollectionSheet} />
      </Stack.Navigator>
    );
  }

  if (targetRoute === 'Onboarding') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          initialParams={targetParams}
        />
        {/* Replace TabNavigator with DrawerNavigator */}
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
      </Stack.Navigator>
    );
  }

  // Default: Login (and Signup)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      {/* Replace TabNavigator with DrawerNavigator */}
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
