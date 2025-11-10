import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import Login from "../screens/Login";
import Signup from "../screens/Signup";
import CategoryDetails from "screens/Admin/CategoryDetails";
import { useThemeContext } from 'context/ThemeProvider';
import Users from "screens/Admin/Users";
import Expense from "screens/Admin/Expense";
import Statistics from "screens/Admin/Statistics";
import TransactionHistory from "screens/TransactionHistory";
import InvoiceScreen from "screens/InvoiceScreen";
import OrdersScreen from "screens/OrdersScreen";
import CreateOrderScreen from "screens/CreateOrderScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { colors } = useThemeContext();
  return (
    <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Users" component={Users} />
      <Stack.Screen name="Expense" component={Expense} />
      <Stack.Screen name="Statistics" component={Statistics} />
      <Stack.Screen name="CategoryDetails" component={CategoryDetails}       options={{ 
        headerShown: true, 
        title: "Category Details", 
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        }} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistory}       options={{ 
        headerShown: true, 
        title: "Transaction History", 
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        }} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen}       options={{ 
        headerShown: true, 
        title: "Invoice", 
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        }} />
      <Stack.Screen name="OrdersScreen" component={OrdersScreen}       options={{ 
        headerShown: true, 
        title: "Orders", 
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        }} />
      <Stack.Screen name="CreateOrderScreen" component={CreateOrderScreen}       options={{ 
        headerShown: true, 
        title: "Update Order", 
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        }} />
    </Stack.Navigator>
  );
}
