// navigation/navigationItems.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'admin' | 'customer' | 'vendor';

export const navigationItems = [
  // ==================== VENDOR TABS ====================
  {
    label: 'Dashboard',
    screen: 'Dashboard',
    icon: 'view-dashboard',
    roles: ['vendor'],
  },
  {
    label: 'Customers',
    screen: 'Customers',
    icon: 'account-group',
    roles: ['vendor'],
  },
  {
    label: 'Products',
    screen: 'ProductsScreen',
    icon: 'package-variant',
    roles: ['vendor'],
  },
  {
    label: 'Orders',
    screen: 'OrdersScreen',
    icon: 'cart',
    roles: ['vendor'],
  },
  {
    label: 'Statistics',
    screen: 'Statistics',
    icon: 'chart-bar',
    roles: ['vendor'],
  },

  // ==================== ADMIN TABS ====================
  {
    label: 'Dashboard',
    screen: 'AdminDashboard',
    icon: 'view-dashboard',
    roles: ['admin'],
  },
  {
    label: 'Users',
    screen: 'Users',
    icon: 'account-group',
    roles: ['admin'],
  },
  {
    label: 'Categories',
    screen: 'Categories',
    icon: 'format-list-bulleted',
    roles: ['admin'],
  },

  // ==================== CUSTOMER TABS ====================
  {
    label: 'Dashboard',
    screen: 'CustomersDashboard',
    icon: 'view-dashboard',
    roles: ['customer'],
  },
];

/**
 * Get navigation items filtered by user role
 */
export const getNavigationItems = async () => {
  try {
    const userString = await AsyncStorage.getItem('user');
    if (!userString) return [];

    const user = JSON.parse(userString);
    const role: UserRole = user.role;

    return navigationItems.filter((item) => item.roles.includes(role));
  } catch (error) {
    console.error('Error getting navigation items:', error);
    return [];
  }
};
