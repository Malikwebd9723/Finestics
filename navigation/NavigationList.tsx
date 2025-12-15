import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeProvider';
import { getNavigationItems } from './NavigationItems';
import { ActivityIndicator } from 'react-native-paper';

interface NavigationListProps {
  navigation: any;
  closeDrawer?: () => void;
}

export default function NavigationList({ navigation, closeDrawer }: NavigationListProps) {
  const { colors } = useThemeContext();
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

  const renderIcon = (iconName: any, color: any, size = 22) => {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  };

  if (loading || navigationItems.length === 0) {
    return <ActivityIndicator/>; // or a loading spinner
  }
  return (
    <View>
      {navigationItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            navigation.navigate('MainTabs', { screen: item.screen });
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
        >
          {renderIcon(item.icon, colors.text)}

          <Text style={{ color: colors.text, marginLeft: 16, fontSize: 15 }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
