// screens/Vendor/components/PendingItemsModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchPendingItems, cancelPendingItem } from 'api/actions/returnActions';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { formatPrice, formatDate } from 'types/order.types';
import {
  VendorPendingItem,
  PendingItemsResponse,
  getPendingItemStatusColor,
  getPendingItemStatusLabel,
} from 'types/return.types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface PendingItemsModalProps {
  visible: boolean;
  customerId: number | null;
  onClose: () => void;
}

export default function PendingItemsModal({
  visible,
  customerId,
  onClose,
}: PendingItemsModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery<PendingItemsResponse>({
    queryKey: ['pendingItems', customerId],
    queryFn: () => fetchPendingItems(customerId!, { includeAll: true }),
    enabled: !!customerId && visible,
  });

  const customer = data?.data?.customer;
  const pendingItems: VendorPendingItem[] = data?.data?.pendingItems || [];
  const totalPending = data?.data?.totalPendingItems || 0;

  const cancelMutation = useMutation({
    mutationFn: (pendingItemId: number) => cancelPendingItem(pendingItemId),
    onSuccess: () => {
      setCancellingId(null);
      Toast.success('Pending item cancelled');
      queryClient.invalidateQueries({ queryKey: ['pendingItems', customerId] });
      queryClient.invalidateQueries({ queryKey: ['pendingItemsCheck', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      setCancellingId(null);
      Dialog.alert('Error', error?.message || 'Failed to cancel item');
    },
  });

  const handleCancel = (item: VendorPendingItem) => {
    Dialog.confirm(
      'Cancel Pending Item',
      `Cancel replacement for ${item.product?.name || 'this item'} (${item.quantity} ${item.product?.unit || ''})?`,
      {
        cancelText: 'No',
        confirmText: 'Yes, Cancel',
        destructive: true,
        onConfirm: () => {
          setCancellingId(item.id);
          cancelMutation.mutate(item.id);
        },
      }
    );
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            height: height * 0.75,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 20,
          }}>
          {/* Header */}
          <View
            className="border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  Pending Items
                </Text>
                {customer && (
                  <Text className="mt-0.5 text-sm" style={{ color: colors.muted }}>
                    {customer.businessName}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            {totalPending > 0 && (
              <View className="mt-2 flex-row items-center rounded-lg px-3 py-1.5"
                style={{ backgroundColor: '#f59e0b20' }}>
                <MaterialIcons name="schedule" size={16} color="#f59e0b" />
                <Text className="ml-1.5 text-sm font-semibold" style={{ color: '#f59e0b' }}>
                  {totalPending} pending item{totalPending !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading pending items...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.error} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                Failed to load items
              </Text>
            </View>
          ) : pendingItems.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="check-circle-outline" size={64} color={colors.success} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                No pending items
              </Text>
              <Text className="mt-2 text-sm text-center" style={{ color: colors.muted }}>
                All replacement items have been fulfilled or cancelled
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
              {pendingItems.map((item, index) => {
                const statusColor = getPendingItemStatusColor(item.status);
                const isPending = item.status === 'pending';
                return (
                  <View
                    key={item.id}
                    className={`rounded-2xl p-4 ${index > 0 ? 'mt-3' : ''}`}
                    style={{ backgroundColor: colors.background }}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {item.product?.name || 'Unknown Product'}
                        </Text>
                        <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                          {item.quantity} {item.product?.unit || ''} •{' '}
                          {formatPrice(
                            parseFloat(String(item.quantity)) *
                              parseFloat(String(item.product?.sellingPrice || 0))
                          )}
                        </Text>
                      </View>
                      <View
                        className="rounded-full px-2.5 py-1"
                        style={{ backgroundColor: statusColor + '20' }}>
                        <Text className="text-xs font-bold" style={{ color: statusColor }}>
                          {getPendingItemStatusLabel(item.status)}
                        </Text>
                      </View>
                    </View>

                    {item.notes && (
                      <Text className="mt-2 text-xs" style={{ color: colors.muted }}>
                        {item.notes}
                      </Text>
                    )}

                    {item.originalReturn?.order && (
                      <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
                        From order {item.originalReturn.order.orderNumber} on{' '}
                        {formatDate(item.originalReturn.returnDate)}
                      </Text>
                    )}

                    {item.fulfilledInOrder && (
                      <Text className="mt-1 text-xs" style={{ color: colors.success }}>
                        Added to order {item.fulfilledInOrder.orderNumber}
                      </Text>
                    )}

                    {isPending && (
                      <TouchableOpacity
                        onPress={() => handleCancel(item)}
                        disabled={cancellingId === item.id}
                        className="mt-3 flex-row items-center justify-center rounded-lg py-2"
                        style={{
                          backgroundColor: colors.error + '15',
                          borderWidth: 1,
                          borderColor: colors.error,
                        }}>
                        {cancellingId === item.id ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <>
                            <MaterialIcons name="cancel" size={16} color={colors.error} />
                            <Text
                              className="ml-1.5 text-sm font-semibold"
                              style={{ color: colors.error }}>
                              Cancel Item
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              <View className="h-4" />
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
