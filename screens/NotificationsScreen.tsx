import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useThemeContext } from 'context/ThemeProvider';
import { useAuth } from 'context/AuthContext';
import { fonts } from 'constants/design';
import { ListRow, EmptyState } from 'components/ui';
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

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header — this screen sits on the root stack with no navigator header */}
      <View
        className="flex-row items-center px-4"
        style={{
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View className="flex-1 flex-row items-center">
          <Text style={{ color: colors.text, fontSize: 18, fontFamily: fonts.bold }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              className="ml-2 items-center justify-center rounded-full px-2"
              style={{ backgroundColor: colors.primary, minWidth: 22, height: 20 }}>
              <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            hitSlop={8}>
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
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
            <EmptyState
              icon="bell-outline"
              title="You’re all caught up"
              subtitle="Order updates and connection activity will land here."
            />
          }
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
