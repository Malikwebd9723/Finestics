// navigation/navigationItems.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'admin' | 'customer' | 'vendor';
export type NavigationLocation = 'tab' | 'drawer' | 'both';

export interface NavigationItem {
  label: string;
  screen: string;
  icon: string;
  roles: UserRole[];
  location: NavigationLocation;
}

export const navigationItems: NavigationItem[] = [
  // ==================== VENDOR ITEMS ====================
  // Tab items
  {
    label: 'Dashboard',
    screen: 'Dashboard',
    icon: 'view-dashboard',
    roles: ['vendor'],
    location: 'both',
  },
  {
    label: 'Products',
    screen: 'ProductsScreen',
    icon: 'package-variant',
    roles: ['vendor'],
    location: 'both',
  },
  {
    label: 'Orders',
    screen: 'OrdersScreen',
    icon: 'cart',
    roles: ['vendor'],
    location: 'both',
  },
  {
    label: 'Expenses',
    screen: 'ExpensesScreen',
    icon: 'cash-minus',
    roles: ['vendor'],
    location: 'both',
  },
  {
    label: 'Payments',
    screen: 'PaymentsScreen',
    icon: 'cash-plus',
    roles: ['vendor'],
    location: 'both',
  },
  // Drawer-only items
  {
    label: 'Statistics',
    screen: 'Statistics',
    icon: 'chart-bar',
    roles: ['vendor'],
    location: 'drawer',
  },
  {
    label: 'Customers',
    screen: 'Customers',
    icon: 'account-group',
    roles: ['vendor'],
    location: 'drawer',
  },

  // ==================== ADMIN TABS ====================
  {
    label: 'Dashboard',
    screen: 'AdminDashboard',
    icon: 'view-dashboard',
    roles: ['admin'],
    location: 'both',
  },
  {
    label: 'Users',
    screen: 'Users',
    icon: 'account-group',
    roles: ['admin'],
    location: 'both',
  },
  {
    label: 'Categories',
    screen: 'Categories',
    icon: 'format-list-bulleted',
    roles: ['admin'],
    location: 'both',
  },

  // ==================== CUSTOMER TABS ====================
  {
    label: 'Dashboard',
    screen: 'CustomersDashboard',
    icon: 'view-dashboard',
    roles: ['customer'],
    location: 'both',
  },
];

/**
 * Get user role from AsyncStorage
 */
const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const userString = await AsyncStorage.getItem('user');
    if (!userString) return null;
    const user = JSON.parse(userString);
    return user.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Get navigation items for bottom tabs (filtered by role)
 */
export const getTabNavigationItems = async (): Promise<NavigationItem[]> => {
  const role = await getUserRole();
  if (!role) return [];
  return navigationItems.filter(
    (item) => item.roles.includes(role) && (item.location === 'tab' || item.location === 'both')
  );
};

/**
 * Get navigation items for drawer menu (filtered by role)
 */
export const getDrawerNavigationItems = async (): Promise<NavigationItem[]> => {
  const role = await getUserRole();
  if (!role) return [];
  return navigationItems.filter(
    (item) => item.roles.includes(role) && (item.location === 'drawer' || item.location === 'both')
  );
};

/**
 * Get drawer-only items (items that appear only in drawer, not in tabs)
 */
export const getDrawerOnlyItems = async (): Promise<NavigationItem[]> => {
  const role = await getUserRole();
  if (!role) return [];
  return navigationItems.filter(
    (item) => item.roles.includes(role) && item.location === 'drawer'
  );
};

/**
 * @deprecated Use getTabNavigationItems or getDrawerNavigationItems instead
 * Get all navigation items filtered by user role (for backwards compatibility)
 */
export const getNavigationItems = async (): Promise<NavigationItem[]> => {
  const role = await getUserRole();
  if (!role) return [];
  return navigationItems.filter((item) => item.roles.includes(role));
};
