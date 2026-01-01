// navigation/NavigationList.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeProvider';
import { getNavigationItems } from './NavigationItems';

interface NavigationListProps {
  navigation: any;
  closeDrawer?: () => void;
}

export default function NavigationList({ navigation, closeDrawer }: NavigationListProps) {
  const { colors } = useThemeContext();
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

  const renderIcon = (iconName: any, color: any, size = 22) => {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  };

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (navigationItems.length === 0) {
    return null;
  }

  return (
    <View>
      {navigationItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            // Navigate to MainTabs with the tab screen
            // TabNavigator uses item.label as the screen name
            navigation.navigate('MainTabs', { screen: item.label });
            closeDrawer?.();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: colors.background + '50',
            marginBottom: 6,
          }}
          activeOpacity={0.7}>
          {renderIcon(item.icon, colors.text)}
          <Text style={{ color: colors.text, marginLeft: 16, fontSize: 15, fontWeight: '500' }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
