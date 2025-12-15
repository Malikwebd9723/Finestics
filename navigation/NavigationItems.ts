// navigation/navigationItems.ts

export type UserRole = 'admin' | 'customer' | 'vendor';

export const navigationItems = [
  {
    label: 'Dashboard',
    screen: 'Dashboard',
    icon: 'view-dashboard',
    roles: ['vendor'],
  },
  {
    label: 'Categories',
    screen: 'Categories',
    icon: 'format-list-bulleted',
    roles: ['vendor', 'admin'],
  },
  {
    label: 'Users',
    screen: 'Users',
    icon: 'account-group',
    roles: ['admin'],
  },
  {
    label: 'Expense',
    screen: 'Expense',
    icon: 'cash-multiple',
    roles: ['admin', 'vendor'],
  },
  {
    label: 'Statistics',
    screen: 'Statistics',
    icon: 'chart-bar',
    roles: ['admin'],
  },
];

// navigation/getNavigationItems.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getNavigationItems = async () => {
  const userString = await AsyncStorage.getItem('user');

  if (!userString) return [];

  const user = JSON.parse(userString);
  const role: UserRole = user.role;

  return navigationItems.filter(item =>
    item.roles.includes(role)
  );
};
