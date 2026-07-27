// navigation/TabNavigator.tsx

import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppState, Pressable, View, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from '../context/ThemeProvider';
import { fonts } from '../constants/design';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabNavigationItems } from './NavigationItems';
import { getVendorOrders } from 'api/actions/vendorOrderInboxActions';
import HeaderBell from 'components/HeaderBell';

// ==================== ADMIN SCREENS ====================
import AdminDashboard from '../screens/Admin/Dashboard';
import AdminStatistics from '../screens/Admin/Statistics';
import Users from '../screens/Admin/Users';
import Vendors from '../screens/Admin/Vendors';

// ==================== VENDOR SCREENS ====================
import Dashboard from '../screens/Vendor/Dashboard';
import ProductsScreen from '../screens/Vendor/ProductsScreen';
import OrdersScreen from '../screens/Vendor/OrdersScreen';
import ExpensesScreen from '../screens/Vendor/ExpensesScreen';
import PaymentsScreen from '../screens/Vendor/PaymentsScreen';
import Statistics from '../screens/Vendor/Statistics';

// ==================== CUSTOMER SCREENS ====================
import MarketplaceScreen from '../screens/Customer/MarketplaceScreen';
import MyVendorsScreen from '../screens/Customer/MyVendorsScreen';
import MyOrdersScreen from '../screens/Customer/MyOrdersScreen';
import CartsScreen from '../screens/Customer/CartsScreen';

const Tab = createBottomTabNavigator();

// Screen component mapping
const screenComponents: Record<string, React.ComponentType<any>> = {
  // Admin
  AdminDashboard,
  AdminStatistics,
  AdminVendors: Vendors,
  AdminUsers: Users,

  // Vendor
  Dashboard,
  ProductsScreen,
  OrdersScreen,
  ExpensesScreen,
  PaymentsScreen,
  Statistics,

  // Customer
  MarketplaceScreen,
  MyVendorsScreen,
  MyOrdersScreen,
  CartsScreen,
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
      const items = await getTabNavigationItems();
      setNavigationItems(items);
      setLoading(false);
    };
    fetchNavigationItems();
  }, []);

  // Only poll while the app is foregrounded — this navigator lives for the
  // whole session, so an unguarded interval would poll in the background.
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // Vendor only: app orders awaiting action (new + quote requests) drive a
  // badge on the Orders tab.
  const hasOrdersTab = navigationItems.some((item) => item.screen === 'OrdersScreen');
  const { data: pendingAppOrders } = useQuery({
    queryKey: ['vendor-customer-orders', 'needs-action-badge'],
    queryFn: () => getVendorOrders('pending,quote_requested'),
    enabled: hasOrdersTab,
    refetchInterval: appActive ? 60000 : false,
    refetchIntervalInBackground: false,
  });
  const pendingAppOrderCount = hasOrdersTab
    ? (pendingAppOrders?.pagination?.totalItems ?? pendingAppOrders?.items.length ?? 0)
    : 0;

  // Header configuration — clean flat bar: hamburger · title · notification bell
  const renderHeader = (title: string) => ({
    headerTitleAlign: 'left' as const,
    headerStyle: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTitleStyle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
    headerLeft: () => (
      <View style={{ marginLeft: 15 }}>
        <Pressable hitSlop={8} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
        </Pressable>
      </View>
    ),
    headerTitle: title,
    headerRight: () => (
      <View style={{ marginRight: 15 }}>
        <HeaderBell onPress={() => navigation.navigate('Notifications')} />
      </View>
    ),
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
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      {navigationItems.map((item, index) => {
        const ScreenComponent = screenComponents[item.screen];

        if (!ScreenComponent) {
          console.warn(`Screen component not found for: ${item.screen}`);
          return null;
        }

        // Pending app-order badge, on the vendor Orders tab only.
        const badge =
          item.screen === 'OrdersScreen' && pendingAppOrderCount > 0
            ? {
                tabBarBadge: pendingAppOrderCount,
                tabBarBadgeStyle: {
                  backgroundColor: colors.cta,
                  color: colors.onCta,
                  fontSize: 10,
                  fontWeight: '700' as const,
                  minWidth: 16,
                  maxHeight: 16,
                  borderRadius: 8,
                  lineHeight: 14,
                },
              }
            : {};

        return (
          <Tab.Screen
            key={index}
            name={item.label}
            component={ScreenComponent}
            options={{
              ...renderHeader(item.label),
              tabBarIcon: ({ color, size }) => renderIcon(item.icon, size, color),
              ...badge,
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
