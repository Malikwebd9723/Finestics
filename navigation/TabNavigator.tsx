// navigation/TabNavigator.tsx

import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNavigationItems } from './NavigationItems';

// ==================== ADMIN SCREENS ====================
import AdminDashboard from '../screens/Admin/Dashboard';
import Categories from '../screens/Admin/Categories';
import Users from '../screens/Admin/Users';

// ==================== VENDOR SCREENS ====================
import Dashboard from '../screens/Vendor/Dashboard';
import Customers from '../screens/Vendor/Customers';
import ProductsScreen from '../screens/Vendor/ProductsScreen';
import OrdersScreen from '../screens/Vendor/OrdersScreen';
import Statistics from '../screens/Vendor/Statistics';

// ==================== CUSTOMER SCREENS ====================
import CustomersDashboard from '../screens/Customers/CustomersDashboard';

const Tab = createBottomTabNavigator();

// Screen component mapping
const screenComponents: Record<string, React.ComponentType<any>> = {
  // Admin
  AdminDashboard,
  Categories,
  Users,

  // Vendor
  Dashboard,
  Customers,
  ProductsScreen,
  OrdersScreen,
  Statistics,

  // Customer
  CustomersDashboard,
};

// Icon renderer
const renderIcon = (icon: string, size: number, color: string) => {
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
};

export default function TabNavigator() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // ✅ FIX: Get safe area insets for Android navigation buttons
  const insets = useSafeAreaInsets();

  const [navigationItems, setNavigationItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNavigationItems = async () => {
      const items = await getNavigationItems();
      setNavigationItems(items);
      setLoading(false);
    };
    fetchNavigationItems();
  }, []);

  // Header configuration
  const renderHeader = (title: string) => ({
    headerTitleAlign: 'left' as const,
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text, fontWeight: 'bold' as const, fontSize: 18 },
    headerLeft: () => (
      <View style={{ marginLeft: 15 }}>
        <Pressable onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={24} color={colors.text} />
        </Pressable>
      </View>
    ),
    headerTitle: title,
  });

  if (loading || navigationItems.length === 0) {
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

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          // ✅ FIX: Account for Android navigation buttons using safe area insets
          // Base height + bottom inset for devices with software nav buttons
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      {navigationItems.map((item, index) => {
        const ScreenComponent = screenComponents[item.screen];

        if (!ScreenComponent) {
          console.warn(`Screen component not found for: ${item.screen}`);
          return null;
        }

        return (
          <Tab.Screen
            key={index}
            name={item.label}
            component={ScreenComponent}
            options={{
              ...renderHeader(item.label),
              tabBarIcon: ({ color, size }) => renderIcon(item.icon, size, color),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
