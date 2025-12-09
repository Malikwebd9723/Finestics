import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { useNavigationContainerRef } from '@react-navigation/native';
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
      <OnboardingStack.Screen name="PendingVerificationScreen" component={PendingVerificationScreen} />
    </OnboardingStack.Navigator>
  );
}

export default function RootNavigator() {
  const { colors } = useThemeContext();
  const { user, loading, profileStatus } = useAuth();

  const navigationRef = useNavigationContainerRef();

  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      if (!user) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        setStatusLoading(false);
        return;
      }

      if (user.role === 'super_admin') {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        setStatusLoading(false);
        return;
      }

      if (profileStatus === 'pending') {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Onboarding', params: { screen: 'PendingVerificationScreen' }}],
        });
        setStatusLoading(false);
        return;
      }

      const res = await apiRequest('/onboarding/status', 'GET');

      if (!res.success) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        setStatusLoading(false);
        return;
      }

      const status = res.data.data.steps;

      let nextScreen = 'RoleSelectionScreen';
      if (status.roleSelected && !status.businessInfoCompleted) nextScreen = 'BusinessInfoScreen';
      else if (status.businessInfoCompleted && !status.addressCompleted) nextScreen = 'BusinessAddressScreen';
      else if (status.addressCompleted && !status.PaymentPlanSelected) nextScreen = 'SubscriptionScreen';
      else if (status.PaymentPlanSelected && !status.submitted) nextScreen = 'SubmitOnboardingScreen';
      else if (status.submitted) nextScreen = 'PendingVerificationScreen';
      else nextScreen = 'RoleSelectionScreen';

      // Redirect user to EXACT onboarding step
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Onboarding', params: { screen: nextScreen }}],
      });

      setStatusLoading(false);
    }

    fetchStatus();
  }, [user]);

  const shouldShowLoader = loading || statusLoading;

  return shouldShowLoader ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  ) : (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
    </Stack.Navigator>
  );
}
