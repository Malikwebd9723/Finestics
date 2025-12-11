import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useThemeContext } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Import your TabNavigator
import TabNavigator from './TabNavigator';
import NavigationList from './NavigationList';

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

  // Navigation items matching your tab screens
  const navigationItems = [
    {
      label: 'Dashboard',
      icon: 'view-dashboard',
      iconType: 'MaterialCommunityIcons',
      onPress: () => props.navigation.navigate('MainTabs', { screen: 'Dashboard' })
    },
    {
      label: 'Categories',
      icon: 'list',
      iconType: 'Ionicons',
      onPress: () => props.navigation.navigate('MainTabs', { screen: 'Categories' })
    },
    {
      label: 'Users',
      icon: 'person',
      iconType: 'Ionicons',
      onPress: () => props.navigation.navigate('MainTabs', { screen: 'Users' })
    },
    {
      label: 'Expense',
      icon: 'money-bill-wave',
      iconType: 'FontAwesome5',
      onPress: () => props.navigation.navigate('MainTabs', { screen: 'Expense' })
    },
    {
      label: 'Statistics',
      icon: 'chart-bar',
      iconType: 'MaterialCommunityIcons',
      onPress: () => props.navigation.navigate('MainTabs', { screen: 'States' })
    },
  ];

  const renderIcon = (iconName: string, iconType: string, color: string, size: number = 22) => {
    if (iconType === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
    } else if (iconType === 'FontAwesome5') {
      return <FontAwesome5 name={iconName as any} size={size} color={color} />;
    } else {
      return <Ionicons name={iconName as any} size={size} color={color} />;
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={[styles.drawerContent, { backgroundColor: colors.card }]}
      contentContainerStyle={{ flex: 1 }}
    >
      {/* User Header */}
      <View style={[styles.userSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'N/A'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.firstName + " " + user?.lastName || ''}
        </Text>
        <Text style={[styles.userEmail, { color: colors.muted }]}>
          {user?.email || ''}
        </Text>
        {user?.role && (
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.roleText, { color: colors.muted }]}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Navigation Menu Items */}
      {/* Navigation Menu Items */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>MENU</Text>

        <NavigationList
          navigation={props.navigation}
          closeDrawer={() => props.navigation.closeDrawer()}
        />
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
          activeOpacity={0.7}
        >
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
          activeOpacity={0.7}
        >
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
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Notifications
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.menuItem, { backgroundColor: '#ef444410' }]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: '600' }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
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
      }}
    >
      {/* Main Tab Navigator */}
      <Drawer.Screen
        name="MainTabs"
        component={TabNavigator}
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