import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View, Text } from 'react-native';
import { useThemeContext } from '../context/ThemeProvider';

import Dashboard from '../screens/Admin/Dashboard';
import Categories from '../screens/Admin/Categories';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme, colors, setTheme } = useThemeContext();
  const navigation = useNavigation();

  // Common header for all screens
  const renderHeader = (title) => ({
    headerTitleAlign: 'start', // centralized title
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text, fontWeight: 'bold', fontSize: 18 },
    headerRight: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
        {/* Theme Toggle */}
        <Pressable onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons
            name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={22}
            color={theme === 'dark' ? '#facc15' : colors.text}
            style={{ marginRight: 20 }}
          />
        </Pressable>

        {/* Notification Bell */}
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
        <Pressable onPress={() => navigation.navigate('Login')}>
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
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopWidth: 0,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          ...renderHeader('Dashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={Categories}
        options={{
          ...renderHeader('Categories'),
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Users"
        component={Categories}
        options={{
          ...renderHeader('Users'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Expense"
        component={Categories}
        options={{
          ...renderHeader('Expense'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="money-bill-wave" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="States"
        component={Categories}
        options={{
          ...renderHeader('States'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
