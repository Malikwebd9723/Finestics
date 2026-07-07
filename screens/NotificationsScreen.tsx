import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { typo } from 'constants/design';
import { ListRow } from 'components/ui';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from 'api/actions/notificationActions';
import { routeForNotification } from 'utils/notificationRouting';

const ICON_BY_TYPE: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  order_status: 'receipt-text-outline',
  delivery_update: 'truck-outline',
  payment_reminder: 'cash-clock',
  system: 'bell-outline',
};

// Compact relative timestamp for the trailing slot ("2h", "3d").
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

/** Notifications inbox for all roles — order updates + connection activity. */
export default function NotificationsScreen() {
  const { colors } = useThemeContext();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: isFocused ? 30000 : false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const readMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const openNotification = (n: AppNotification) => {
    if (!n.isRead) readMutation.mutate(n.id);
    const route = routeForNotification(n.data, user?.role);
    if (route) navigation.navigate(route.name, route.params);
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          items.length > 0 ? (
            <View
              className="flex-row items-center justify-between px-4"
              style={{ paddingTop: 14, paddingBottom: 4 }}>
              <Text className="text-[13px] font-medium" style={{ color: colors.muted }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={() => readAllMutation.mutate()} hitSlop={8}>
                  <Text className="text-[13px] font-medium" style={{ color: colors.primary }}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View className="px-4" style={{ opacity: item.isRead ? 0.62 : 1 }}>
            <ListRow
              icon={ICON_BY_TYPE[item.type] || 'bell-outline'}
              title={item.title}
              subtitle={item.message}
              amount={timeAgo(item.createdAt)}
              badge={!item.isRead ? { label: 'NEW' } : undefined}
              divider={index > 0}
              onPress={() => openNotification(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8" style={{ paddingTop: 90 }}>
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.gray }}>
              <MaterialCommunityIcons name="bell-outline" size={30} color={colors.muted} />
            </View>
            <Text style={[typo.title, { color: colors.text, fontSize: 18 }]}>
              You{'’'}re all caught up
            </Text>
            <Text className="mt-1 text-center text-sm" style={{ color: colors.muted }}>
              Order updates and connection activity will land here.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </View>
  );
}
