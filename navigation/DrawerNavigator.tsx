import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeContext } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import your TabNavigator
import TabNavigator from './TabNavigator';
import NavigationList from './NavigationList';
import VendorProfile from '../screens/Vendor/VendorProfile';
import Statistics from '../screens/Vendor/Statistics';
import Customers from '../screens/Vendor/Customers';
import PaymentsScreen from 'screens/Vendor/PaymentsScreen';

// Admin Screens
import AdminProfile from '../screens/Admin/AdminProfile';
import Vendors from '../screens/Admin/Vendors';
import Users from '../screens/Admin/Users';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  const { colors, theme, setTheme } = useThemeContext();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // Clear all stored data
      logout?.();
      props.navigation.closeDrawer();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateTo = (screenName: string) => {
    props.navigation.closeDrawer();
    props.navigation.navigate(screenName);
  };

  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'admin';

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
                <Ionicons name="business-outline" size={22} color={colors.text} />
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
                <Ionicons name="storefront-outline" size={22} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Vendors</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo('Users')}
                style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
                activeOpacity={0.7}>
                <Ionicons name="people-outline" size={22} color={colors.text} />
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
            <Ionicons
              name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
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
              // Navigate to notifications if you have a screen
            }}
            style={[styles.menuItem, { backgroundColor: colors.background + '50' }]}
            activeOpacity={0.7}>
            <View>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  width: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>3</Text>
              </View>
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.menuItem, { backgroundColor: '#ef444410' }]}
            activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: '600' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
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
