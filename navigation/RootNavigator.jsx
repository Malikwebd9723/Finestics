import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import CategoryDetails from 'screens/Admin/CategoryDetails';
import Users from 'screens/Admin/Users';
import Expense from 'screens/Admin/Expense';
import Statistics from 'screens/Admin/Statistics';
import TransactionHistory from 'screens/TransactionHistory';
import InvoiceScreen from 'screens/InvoiceScreen';
import OrdersScreen from 'screens/OrdersScreen';
import CreateOrderScreen from 'screens/CreateOrderScreen';
import RoleSelectionScreen from 'screens/Onboarding/RoleSelectionScreen';
// import BusinessInfoScreen from 'screens/Onboarding/BusinessInfoScreen';
// import BusinessAddressScreen from 'screens/Onboarding/BusinessAddressScreen';
// import SubscriptionScreen from 'screens/Onboarding/SubscriptionScreen';
// import SubmitOnboardingScreen from 'screens/Onboarding/SubmitOnboardingScreen';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import BusinessInfoScreen from 'screens/Onboarding/BusinessInfoScreen';
import BusinessAddressScreen from 'screens/Onboarding/BusinessAddressScreen';

const Stack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

// --- Onboarding Flow Navigator ---
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="RoleSelectionScreen" component={RoleSelectionScreen} />
      {/* <OnboardingStack.Screen name="BusinessInfoScreen" component={BusinessInfoScreen} />
      <OnboardingStack.Screen name="BusinessAddressScreen" component={BusinessAddressScreen} />
      <OnboardingStack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <OnboardingStack.Screen name="SubmitOnboardingScreen" component={SubmitOnboardingScreen} /> */}
    </OnboardingStack.Navigator>
  );
}

// --- Function to determine initial route ---
function getInitialRoute(user) {
  if (!user) return 'Login';

  if (user.role === 'super_admin') return 'Main';

  if (user.role === 'customer') {
    if (!user.onboardingCompleted) {
      if (!user.profileSetupCompleted) return 'Onboarding';
      if (!user.preferencesCompleted) return 'Onboarding';
      if (!user.paymentSetupCompleted) return 'Onboarding';
    }
    return 'Main';
  }

  return 'Login';
}

// --- Root Navigator ---
export default function RootNavigator() {
  const { colors } = useThemeContext();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialRoute = getInitialRoute(user);

  return (
    <Stack.Navigator
      initialRouteName={"BusinessAddressScreen"}
      screenOptions={{ headerShown: false }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="BusinessAddressScreen" component={BusinessAddressScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />

      {/* Main App */}
      <Stack.Screen name="Main" component={TabNavigator} />

      {/* Onboarding Flow */}
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />

      {/* Admin/Other Screens */}
      <Stack.Screen name="Users" component={Users} />
      <Stack.Screen name="Expense" component={Expense} />
      <Stack.Screen name="Statistics" component={Statistics} />
      <Stack.Screen
        name="CategoryDetails"
        component={CategoryDetails}
        options={{
          headerShown: true,
          title: 'Category Details',
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistory}
        options={{
          headerShown: true,
          title: 'Transaction History',
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <Stack.Screen
        name="InvoiceScreen"
        component={InvoiceScreen}
        options={{
          headerShown: true,
          title: 'Invoice',
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <Stack.Screen
        name="OrdersScreen"
        component={OrdersScreen}
        options={{
          headerShown: true,
          title: 'Orders',
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <Stack.Screen
        name="CreateOrderScreen"
        component={CreateOrderScreen}
        options={{
          headerShown: true,
          title: 'Update Order',
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
    </Stack.Navigator>
  );
}
