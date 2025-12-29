import React, { useEffect, useState } from 'react';
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
import { getNavigationItems } from './NavigationItems';
import { ActivityIndicator } from 'react-native-paper';
import Customers from 'screens/Vendor/Customers';
import CustomersDashboard from 'screens/Customers/CustomersDashboard';
import OrdersScreen from 'screens/OrdersScreen';
import ProductsScreen from 'screens/Vendor/ProductsScreen';

const Tab = createBottomTabNavigator();

// ✔ simplified icon renderer — MaterialCommunityIcons only
const renderIcon = (icon: any, size: any, color: any) => {
  return <MaterialCommunityIcons name={icon} size={size} color={color} />;
};

export default function TabNavigator() {
  const { theme, colors, setTheme } = useThemeContext();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [navigationItems, setNavigationItems] = React.useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchNavigationItems = async () => {
      const items = await getNavigationItems();
      setNavigationItems(items);
      setLoading(false);
    }
    fetchNavigationItems();
  }, []);
  
  const screenComponents = {
    Dashboard,
    Categories,
    Users,
    Expense,
    Statistics,
    Customers,
    ProductsScreen,
    CustomersDashboard,
    OrdersScreen,
  };

  const renderHeader = (title: any) => ({
    headerTitleAlign: 'start',
    headerStyle: { backgroundColor: colors.card },
    headerTitleStyle: { color: colors.text, fontWeight: 'bold', fontSize: 18 },

    // headerRight: () => (
    //   <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
    //     <Pressable onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
    //       <Ionicons
    //         name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
    //         size={22}
    //         color={theme === 'dark' ? '#facc15' : colors.text}
    //         style={{ marginRight: 20 }}
    //       />
    //     </Pressable>

    //     <View>
    //       <Ionicons name="notifications-outline" size={24} color={colors.text} />
    //       <View
    //         style={{
    //           position: 'absolute',
    //           top: -5,
    //           right: -5,
    //           backgroundColor: colors.primary,
    //           borderRadius: 10,
    //           width: 18,
    //           height: 18,
    //           justifyContent: 'center',
    //           alignItems: 'center',
    //         }}>
    //         <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>3</Text>
    //       </View>
    //     </View>
    //   </View>
    // ),

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
    return <ActivityIndicator/>; // or a loading spinner
  }
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 70,
        },
      }}
    >
      
      {navigationItems.map((item, index) => (
        <Tab.Screen
          key={index}
          name={item.label}
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
