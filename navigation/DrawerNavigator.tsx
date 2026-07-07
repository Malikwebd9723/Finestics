import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AppState, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeContext } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { getNotifications } from 'api/actions/notificationActions';
import { getConnectionRequests } from 'api/actions/connectionActions';
import { getVendorOrders } from 'api/actions/vendorOrderInboxActions';

// Import your TabNavigator
import TabNavigator from './TabNavigator';
import NavigationList from './NavigationList';
import VendorProfile from '../screens/Vendor/VendorProfile';
import Statistics from '../screens/Vendor/Statistics';
import AdminStatistics from '../screens/Admin/Statistics';
import Customers from '../screens/Vendor/Customers';
import PaymentsScreen from 'screens/Vendor/PaymentsScreen';
import ReturnsScreen from 'screens/Vendor/ReturnsScreen';

// Admin Screens
import AdminProfile from '../screens/Admin/AdminProfile';
import Vendors from '../screens/Admin/Vendors';
import Users from '../screens/Admin/Users';

// Customer Screens (detail screens pushed from tabs)
import VendorDetailScreen from '../screens/Customer/VendorDetailScreen';
import ProductCatalogScreen from '../screens/Customer/ProductCatalogScreen';
import CartScreen from '../screens/Customer/CartScreen';
import CheckoutScreen from '../screens/Customer/CheckoutScreen';
import CustomerOrderDetailScreen from '../screens/Customer/OrderDetailScreen';

// Vendor connection + order management
import ConnectionRequestsScreen from '../screens/Vendor/ConnectionRequestsScreen';
import IncomingOrdersScreen from '../screens/Vendor/IncomingOrdersScreen';
import VendorOrderDetailScreen from '../screens/Vendor/VendorOrderDetailScreen';

// Customer account screens
import MyProfileScreen from '../screens/Customer/MyProfileScreen';
import AddressesScreen from '../screens/Customer/AddressesScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  const { colors, theme, setTheme } = useThemeContext();
  const { user, logout } = useAuth();
  const { clearAll: clearCarts } = useCart();
  const { unregisterCurrentToken } = useNotifications();

  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'admin';

  // Only poll while the app is foregrounded — these queries live for the
  // whole session, so an unguarded interval would poll in the background.
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);
  const pollInterval = appActive ? 60000 : false;

  // Real unread count for the Notifications badge.
  const { data: notificationData } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false,
  });
  const unreadCount = notificationData?.unreadCount ?? 0;

  // Vendor menu badges: pending connection requests + new app orders.
  const { data: pendingRequests } = useQuery({
    queryKey: ['vendor-connection-requests'],
    queryFn: () => getConnectionRequests('pending'),
    enabled: isVendor,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false,
  });
  const { data: pendingOrders } = useQuery({
    queryKey: ['vendor-customer-orders', 'pending-badge'],
    queryFn: () => getVendorOrders('pending'),
    enabled: isVendor,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: false,
  });

  const menuBadges = isVendor
    ? {
        ConnectionRequestsScreen: pendingRequests?.length || 0,
        IncomingOrdersScreen: pendingOrders?.pagination?.totalItems ?? pendingOrders?.items.length ?? 0,
      }
    : undefined;

  const handleLogout = async () => {
    try {
      // Order matters: kill this device's push token and the server session
      // while the auth token still exists, THEN wipe local storage.
      await unregisterCurrentToken();
      clearCarts();
      await logout?.();
      await AsyncStorage.clear(); // Clear remaining local data (theme prefs stay default)
      props.navigation.closeDrawer();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateTo = (screenName: string) => {
    props.navigation.closeDrawer();
    props.navigation.navigate(screenName);
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={[styles.drawerContent, { backgroundColor: colors.card }]}
      contentContainerStyle={{ flex: 1 }}>
      {/* User Header - Touchable for Admin to open profile */}
      <ScrollView>
        <TouchableOpacity
          style={[styles.userSection, { borderBottomColor: colors.border }]}
          onPress={() => {
            if (isAdmin) {
              navigateTo('AdminProfile');
            } else if (isVendor) {
              navigateTo('VendorProfile');
            }
          }}
          activeOpacity={0.7}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'N/A'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.firstName + ' ' + user?.lastName || ''}
          </Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{user?.email || ''}</Text>
          {user?.role && (
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.roleText, { color: colors.muted }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
          )}
          {(isAdmin || isVendor) && (
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
              Tap to view profile
            </Text>
          )}
        </TouchableOpacity>

        {/* Navigation Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>MENU</Text>

          <NavigationList
            navigation={props.navigation}
            closeDrawer={() => props.navigation.closeDrawer()}
            badges={menuBadges}
          />

          {/* Vendor-specific menu items */}
          {isVendor && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                BUSINESS
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo('VendorProfile')}
                style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name="office-building-outline" size={22} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Business Profile</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Admin-specific menu items */}
          {isAdmin && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                MANAGEMENT
              </Text>
              <TouchableOpacity
                onPress={() => navigateTo('Vendors')}
                style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name="storefront-outline" size={22} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Vendors</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo('Users')}
                style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Users</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Additional Options */}
        <View style={[styles.bottomSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>SETTINGS</Text>

          {/* Theme Toggle */}
          <TouchableOpacity
            onPress={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
            activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={theme === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
              size={22}
              color={colors.text}
            />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            onPress={() => {
              props.navigation.closeDrawer();
              props.navigation.navigate('Notifications');
            }}
            style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
            activeOpacity={0.7}>
            <View>
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 3,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: colors.white, fontSize: 9, fontWeight: 'bold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.menuItem, { backgroundColor: colors.error + '10' }]}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error, fontWeight: '600' }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.muted }]}>Version 1.5.0</Text>
        </View>
      </ScrollView>
    </DrawerContentScrollView>
  );
}

// Drawer Navigator Component
export default function DrawerNavigator() {
  const { colors } = useThemeContext();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: colors.card,
          width: 300,
        },
        headerShown: false, // Hide drawer header since TabNavigator has its own
        drawerType: 'front', // Drawer slides over content
      }}>
      {/* Main Tab Navigator */}
      <Drawer.Screen name="MainTabs" component={TabNavigator} />

      {/* Vendor Profile Screen */}
      <Drawer.Screen
        name="VendorProfile"
        component={VendorProfile}
        options={{
          headerShown: false,
          headerTitle: 'Business Profile',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Statistics Screen (Drawer-only for Vendor) */}
      <Drawer.Screen
        name="Statistics"
        component={Statistics}
        options={{
          headerShown: true,
          headerTitle: 'Statistics',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Admin platform statistics — direct route target for admin screens */}
      <Drawer.Screen
        name="AdminStatistics"
        component={AdminStatistics}
        options={{
          headerShown: true,
          headerTitle: 'Statistics',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customers Screen (Drawer-only for Vendor) */}
      <Drawer.Screen
        name="Customers"
        component={Customers}
        options={{
          headerShown: true,
          headerTitle: 'Customers',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <Drawer.Screen
        name="PaymentsScreen"
        component={PaymentsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Payments',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Returns Screen (Drawer-only for Vendor) */}
      <Drawer.Screen
        name="ReturnsScreen"
        component={ReturnsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Returns',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Admin Profile Screen */}
      <Drawer.Screen
        name="AdminProfile"
        component={AdminProfile}
        options={{
          headerShown: false,
        }}
      />

      {/* Vendors Screen (Admin) */}
      <Drawer.Screen
        name="Vendors"
        component={Vendors}
        options={{
          headerShown: true,
          headerTitle: 'Vendors',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Users Screen (Admin) */}
      <Drawer.Screen
        name="Users"
        component={Users}
        options={{
          headerShown: true,
          headerTitle: 'Users',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Vendor detail (pushed from Marketplace / My Vendors) */}
      <Drawer.Screen
        name="VendorDetailScreen"
        component={VendorDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Vendor',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Vendor product catalog */}
      <Drawer.Screen
        name="ProductCatalogScreen"
        component={ProductCatalogScreen}
        options={{
          headerShown: true,
          headerTitle: 'Catalog',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Vendor: Connection requests from self-serve customers */}
      <Drawer.Screen
        name="ConnectionRequestsScreen"
        component={ConnectionRequestsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Connection Requests',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Cart */}
      <Drawer.Screen
        name="CartScreen"
        component={CartScreen}
        options={{
          headerShown: true,
          headerTitle: 'Cart',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Checkout */}
      <Drawer.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Order detail */}
      <Drawer.Screen
        name="CustomerOrderDetailScreen"
        component={CustomerOrderDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Order',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Vendor: Incoming customer orders */}
      <Drawer.Screen
        name="IncomingOrdersScreen"
        component={IncomingOrdersScreen}
        options={{
          headerShown: true,
          headerTitle: 'Incoming Orders',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Vendor: Customer order detail */}
      <Drawer.Screen
        name="VendorOrderDetailScreen"
        component={VendorOrderDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Order',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Profile */}
      <Drawer.Screen
        name="MyProfileScreen"
        component={MyProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'My Profile',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {/* Customer: Addresses */}
      <Drawer.Screen
        name="AddressesScreen"
        component={AddressesScreen}
        options={{
          headerShown: true,
          headerTitle: 'Addresses',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userSection: {
    padding: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  menuSection: {
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 10,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 16,
  },
  bottomSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    paddingHorizontal: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
