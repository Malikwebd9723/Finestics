import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import CategoryDetails from 'screens/Admin/CategoryDetails';
import { useThemeContext } from 'context/ThemeProvider';
import Users from 'screens/Admin/Users';
import Expense from 'screens/Admin/Expense';
import Statistics from 'screens/Admin/Statistics';
import TransactionHistory from 'screens/TransactionHistory';
import InvoiceScreen from 'screens/InvoiceScreen';
import OrdersScreen from 'screens/OrdersScreen';
import CreateOrderScreen from 'screens/CreateOrderScreen';
import { useAuth } from 'context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import SetupProfileScreen from 'screens/Onboarding/SetupProfileScreen';

const Stack = createNativeStackNavigator();

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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && user.role === 'super_admin' ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : user && user.role === 'customer' ? (
        <Stack.Screen name="onboarding" component={SetupProfileScreen} />
      ) : (
        <Stack.Screen name="Login" component={Login} />
      )}
      <Stack.Screen name="Signup" component={Signup} />
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
