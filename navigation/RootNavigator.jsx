import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import Login from "../screens/Login";
import Signup from "../screens/Signup";
import CategoryDetails from "screens/Admin/CategoryDetails";
import { useThemeContext } from 'context/ThemeProvider';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { colors } = useThemeContext();
  return (
    <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="CategoryDetails" component={CategoryDetails}       options={{ 
        headerShown: true, 
        title: "Category Details", 
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        }} />
    </Stack.Navigator>
  );
}
