// screens/Vendor/ReturnsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllReturns, expirePendingItems } from 'api/actions/returnActions';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { formatPrice, formatDate } from 'types/order.types';
import {
  VendorReturn,
  ReturnAction,
  getReturnActionColor,
  getReturnActionLabel,
} from 'types/return.types';
import ReturnDetailModal from './components/ReturnDetailModal';
import SearchBar from 'components/SearchBar';

export default function ReturnsScreen() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['returns', { search: searchQuery }],
    queryFn: () => fetchAllReturns({ search: searchQuery || undefined }),
  });

  const returns: VendorReturn[] = data?.data || [];

  const expireMutation = useMutation({
    mutationFn: () => expirePendingItems(),
    onSuccess: (data) => {
      const count = data?.data?.expiredCount || 0;
      Toast.success(
        count > 0
          ? `${count} item(s) expired and converted to credit`
          : 'No items to expire'
      );
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) =>
      Toast.error(error?.message || 'Failed to expire items'),
  });

  const handleOpenDetail = useCallback((returnId: number) => {
    setSelectedReturnId(returnId);
    setDetailModalVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedReturnId(null);
  }, []);

  const getUniqueActions = (items: VendorReturn['items']): ReturnAction[] => {
    if (!items || items.length === 0) return [];
    const unique = new Set(items.map((item) => item.action));
    return Array.from(unique);
  };

  const renderReturnCard = useCallback(
    ({ item }: { item: VendorReturn }) => {
      const uniqueActions = getUniqueActions(item.items);
      const itemCount = item.items?.length || 0;

      return (
        <TouchableOpacity
          onPress={() => handleOpenDetail(item.id)}
          activeOpacity={0.7}
          className="mb-3 mx-4 rounded-2xl p-4"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="assignment-return" size={16} color={colors.primary} />
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                {item.order?.orderNumber || `Return #${item.id}`}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: colors.muted }}>
              {formatDate(item.returnDate)}
            </Text>
          </View>

          <Text
            className="mb-2 text-sm font-semibold"
            style={{ color: colors.text }}
            numberOfLines={1}>
            {item.order?.customer?.businessName || 'Unknown Customer'}
          </Text>

          {uniqueActions.length > 0 && (
            <View className="mb-2 flex-row flex-wrap gap-1.5">
              {uniqueActions.map((action) => {
                const actionColor = getReturnActionColor(action);
                return (
                  <View
                    key={action}
                    className="rounded-full px-2.5 py-0.5"
                    style={{ backgroundColor: actionColor + '20' }}>
                    <Text className="text-xs font-semibold" style={{ color: actionColor }}>
                      {getReturnActionLabel(action)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View
            className="flex-row items-center justify-between border-t pt-3"
            style={{ borderColor: colors.border }}>
            <View className="flex-row items-center">
              <MaterialIcons name="inventory" size={14} color={colors.muted} />
              <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''} returned
              </Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {formatPrice(item.totalRefundAmount)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleOpenDetail]
  );

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center px-6 py-20">
        <MaterialIcons name="assignment-return" size={64} color={colors.muted} />
        <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
          No returns found
        </Text>
        <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
          {searchQuery
            ? 'Try adjusting your search query'
            : 'Returns will appear here once processed'}
        </Text>
      </View>
    );
  }, [isLoading, colors, searchQuery]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="pt-2">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search returns, customers, orders..."
        />
      </View>

      <View className="flex-row px-4 pb-3">
        <TouchableOpacity
          onPress={() => {
            Dialog.confirm(
              'Expire Old Items',
              'This will convert all pending replacement items older than 30 days to customer balance credit. Continue?',
              {
                confirmText: 'Expire',
                destructive: true,
                onConfirm: () => expireMutation.mutate(),
              }
            );
          }}
          disabled={expireMutation.isPending}
          className="flex-row items-center rounded-lg px-3 py-2"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: expireMutation.isPending ? 0.6 : 1,
          }}>
          {expireMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="timer-off" size={16} color={colors.primary} />
          )}
          <Text className="ml-1.5 text-sm font-medium" style={{ color: colors.text }}>
            Expire Old Items
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
            Loading returns...
          </Text>
        </View>
      ) : (
        <FlatList
          data={returns}
          renderItem={renderReturnCard}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingBottom: 24,
            flexGrow: returns.length === 0 ? 1 : undefined,
          }}
          showsVerticalScrollIndicator={false}
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

      <ReturnDetailModal
        visible={detailModalVisible}
        returnId={selectedReturnId}
        onClose={handleCloseDetail}
      />
    </SafeAreaView>
  );
}
