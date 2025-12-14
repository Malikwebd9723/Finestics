import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, View, Text } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import Dashboard from '../screens/Admin/Dashboard';
import Categories from '../screens/Admin/Categories';
import Users from '../screens/Admin/Users';
import Expense from '../screens/Admin/Expense';
import Statistics from '../screens/Admin/Statistics';

import { navigationItems } from './NavigationItems';

const Tab = createBottomTabNavigator();

// ✔ simplified icon renderer — MaterialCommunityIcons only
const renderIcon = (icon:any, size:any, color:any) => {
  return <MaterialCommunityIcons name={icon} size={size} color={color} />;
};

export default function TabNavigator() {
  const { theme, colors, setTheme } = useThemeContext();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const screenComponents = {
    Dashboard,
    Categories,
    Users,
    Expense,
    States: Statistics,
  };

  const renderHeader = (title:any) => ({
    headerTitleAlign: 'start',
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text, fontWeight: 'bold', fontSize: 18 },

    headerRight: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
        <Pressable onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons
            name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={22}
            color={theme === 'dark' ? '#facc15' : colors.text}
            style={{ marginRight: 20 }}
          />
        </Pressable>

        <View>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <View
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              backgroundColor: colors.primary,
              borderRadius: 10,
              width: 18,
              height: 18,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>3</Text>
          </View>
        </View>
      </View>
    ),

    headerLeft: () => (
      <View style={{ marginLeft: 15 }}>
        <Pressable onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={24} color={colors.text} />
        </Pressable>
      </View>
    ),

    headerTitle: title,
  });

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 60,
        },
      }}
    >
      {navigationItems.map((item, index) => (
        <Tab.Screen
          key={index}
          name={item.screen}
          component={screenComponents[item.screen]}
          options={{
            ...renderHeader(item.label),
            tabBarIcon: ({ color, size }) =>
              renderIcon(item.icon, size, color), // ✔ no more iconType
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
