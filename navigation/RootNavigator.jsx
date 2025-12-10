import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { apiRequest } from 'api/clients';

import TabNavigator from './TabNavigator';
import Login from '../screens/Login';
import Signup from '../screens/Signup';

import RoleSelectionScreen from 'screens/Onboarding/RoleSelectionScreen';
import BusinessInfoScreen from 'screens/Onboarding/BusinessInfoScreen';
import BusinessAddressScreen from 'screens/Onboarding/BusinessAddressScreen';
import SubscriptionScreen from 'screens/Onboarding/SubscriptionScreen';
import SubmitOnboardingScreen from 'screens/Onboarding/SubmitOnboardingScreen';
import PendingVerificationScreen from 'screens/Onboarding/PendingVerificationScreen';

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

      // Not logged in
      console.log(user);
      
      if (!user || !accessToken) {
        setTargetRoute('Login');
        setTargetParams(undefined);
        setInitializing(false);
        return;
      }

      // admin
      if (user.role === 'admin') {
        setTargetRoute('Main');
        setTargetParams(undefined);
        setInitializing(false);
        return;
      }

      // Approved user
      // if profileStatus === 'approved') {
      //   setTargetRoute('Main');
      //   setTargetParams(undefined);
      //   setInitializing(false);
      //   return;
      // }

      // Pending verification
      // if profileStatus === 'pending') {
      //   setTargetRoute('Onboarding');
      //   setTargetParams({ screen: 'PendingVerificationScreen' });
      //   setInitializing(false);
      //   return;
      // }

      // Check onboarding status
      try {
        const res = await apiRequest('/onboarding/status', 'GET');

        if (!res.success) {
          setTargetRoute('Login');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }
        // const profileStatus = res.data.data.profileStatus;
        // // Approved user
        // if (profileStatus === 'approved') {
        //   setTargetRoute('Main');
        //   setTargetParams(undefined);
        //   setInitializing(false);
        //   return;
        // }

        // // Pending verification
        // if (profileStatus === 'pending') {
        //   setTargetRoute('Onboarding');
        //   setTargetParams({ screen: 'PendingVerificationScreen' });
        //   setInitializing(false);
        //   return;
        // }

        if (!res.data.data.onboardingCompleted) {
          setTargetRoute('SubmitOnboardingScreen');
          setTargetParams(undefined);
          setInitializing(false);
          return;
        }
        const steps = res.data.data.steps;
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
          nextScreen = 'PendingVerificationScreen';
        }

        setTargetRoute('Onboarding');
        setTargetParams({ screen: nextScreen });
        setInitializing(false);
      } catch (error) {
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
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
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
        <Stack.Screen name="Main" component={TabNavigator} />
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
      <Stack.Screen name="Main" component={TabNavigator} />
    </Stack.Navigator>
  );
}
