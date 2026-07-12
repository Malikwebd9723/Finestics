// components/HeaderBell.tsx
// The header notification bell with the live unread badge. Uses the same
// ['notifications'] query key as DrawerNavigator's menu badge, so both read
// one cache entry and stay in sync without extra requests.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, AppState } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { getNotifications } from 'api/actions/notificationActions';

export default function HeaderBell({ onPress }: { onPress: () => void }) {
  const { colors } = useThemeContext();
  const { user } = useAuth();

  // Poll only while foregrounded — this component lives for the whole session.
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user,
    refetchInterval: appActive ? 60000 : false,
    refetchIntervalInBackground: false,
  });
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Pressable hitSlop={8} onPress={onPress}>
      <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            backgroundColor: colors.cta,
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 3,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={{ color: colors.onCta, fontSize: 9, fontWeight: 'bold' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
