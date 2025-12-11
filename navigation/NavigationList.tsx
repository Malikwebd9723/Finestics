import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../context/ThemeProvider';
import { navigationItems } from './NavigationItems';

export default function NavigationList({ navigation, closeDrawer }) {
  const { colors } = useThemeContext();

  const renderIcon = (iconName, color, size = 22) => {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  };

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
