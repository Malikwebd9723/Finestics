// screens/Vendor/components/ReturnDetailModal.tsx
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
import { fetchReturnDetail, undoReturn } from 'api/actions/returnActions';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { formatPrice, formatDate } from 'types/order.types';
import {
  VendorReturn,
  ReturnDetailResponse,
  getReturnActionColor,
  getReturnActionLabel,
} from 'types/return.types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface ReturnDetailModalProps {
  visible: boolean;
  returnId: number | null;
  onClose: () => void;
}

export default function ReturnDetailModal({
  visible,
  returnId,
  onClose,
}: ReturnDetailModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));

  const undoMutation = useMutation({
    mutationFn: () => undoReturn(returnId!),
    onSuccess: () => {
      Toast.success('Return reversed successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingItems'] });
      onClose();
    },
    onError: (error: any) => {
      Dialog.alert('Error', error?.message || 'Failed to undo return');
    },
  });

  const handleUndo = () => {
    Dialog.confirm(
      'Undo Return',
      'This will reverse the return: restore order totals, undo balance/payment changes, and remove any pending replacement items created by this return.',
      {
        confirmText: 'Undo Return',
        destructive: true,
        onConfirm: () => undoMutation.mutate(),
      }
    );
  };

  const { data, isLoading, error } = useQuery<ReturnDetailResponse>({
    queryKey: ['returns', returnId],
    queryFn: () => fetchReturnDetail(returnId!),
    enabled: !!returnId && visible,
  });

  const returnData: VendorReturn | undefined = data?.data;

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
            height: height * 0.85,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 20,
          }}>
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Return Details
            </Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading return...
              </Text>
            </View>
          ) : error || !returnData ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.error} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                Failed to load return
              </Text>
            </View>
          ) : (
            <View className="flex-1">
            <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Return Info Card */}
              <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: colors.background }}>
                <View className="mb-3 flex-row items-center">
                  <MaterialIcons name="assignment-return" size={18} color={colors.primary} />
                  <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                    Return Info
                  </Text>
                </View>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm" style={{ color: colors.muted }}>Return Date</Text>
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {formatDate(returnData.returnDate)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm" style={{ color: colors.muted }}>Total Refund</Text>
                    <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                      {formatPrice(returnData.totalRefundAmount)}
                    </Text>
                  </View>
                  {(() => {
                    const profitLost = (returnData.items || [])
                      .filter((i) => i.action === 'credit' || i.action === 'refund')
                      .reduce((sum, i) => {
                        const qty = parseFloat(String(i.quantity)) || 0;
                        const sell = parseFloat(String(i.orderItem?.sellingPrice || 0));
                        const buy = parseFloat(String(i.orderItem?.buyingPrice || 0));
                        return sum + qty * (sell - buy);
                      }, 0);
                    const replaceCost = (returnData.items || [])
                      .filter((i) => i.action === 'replace_next_order')
                      .reduce((sum, i) => {
                        const qty = parseFloat(String(i.quantity)) || 0;
                        const buy = parseFloat(String(i.orderItem?.buyingPrice || 0));
                        return sum + qty * buy;
                      }, 0);
                    const totalImpact = profitLost + replaceCost;
                    return totalImpact > 0 ? (
                      <View className="flex-row justify-between">
                        <Text className="text-sm" style={{ color: colors.muted }}>Profit Impact</Text>
                        <Text className="text-sm font-bold" style={{ color: colors.error }}>
                          -{formatPrice(totalImpact)}
                        </Text>
                      </View>
                    ) : null;
                  })()}
                  {returnData.processor && (
                    <View className="flex-row justify-between">
                      <Text className="text-sm" style={{ color: colors.muted }}>Processed By</Text>
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {returnData.processor.firstName} {returnData.processor.lastName}
                      </Text>
                    </View>
                  )}
                  {returnData.notes && (
                    <View className="mt-1">
                      <Text className="text-sm" style={{ color: colors.muted }}>Notes</Text>
                      <Text className="mt-0.5 text-sm" style={{ color: colors.text }}>
                        {returnData.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Order Info Card */}
              {returnData.order && (
                <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: colors.background }}>
                  <View className="mb-3 flex-row items-center">
                    <MaterialIcons name="receipt" size={18} color={colors.primary} />
                    <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                      Order Info
                    </Text>
                  </View>
                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-sm" style={{ color: colors.muted }}>Order Number</Text>
                      <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                        {returnData.order.orderNumber}
                      </Text>
                    </View>
                    {returnData.order.customer && (
                      <>
                        <View className="flex-row justify-between">
                          <Text className="text-sm" style={{ color: colors.muted }}>Business</Text>
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {returnData.order.customer.businessName}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm" style={{ color: colors.muted }}>Contact</Text>
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {returnData.order.customer.contactPerson}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm" style={{ color: colors.muted }}>Phone</Text>
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {returnData.order.customer.phone}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Return Items Card */}
              <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: colors.background }}>
                <View className="mb-3 flex-row items-center">
                  <MaterialIcons name="inventory" size={18} color={colors.primary} />
                  <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                    Returned Items ({returnData.items?.length || 0})
                  </Text>
                </View>
                {returnData.items?.map((item, index) => {
                  const actionColor = getReturnActionColor(item.action);
                  return (
                    <View
                      key={item.id}
                      className={`py-3 ${index > 0 ? 'border-t' : ''}`}
                      style={{ borderColor: colors.border }}>
                      <View className="flex-row items-start justify-between">
                        <View className="mr-3 flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {item.product?.name || 'Unknown Product'}
                          </Text>
                          <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                            Qty: {item.quantity} {item.product?.unit || ''}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="font-bold" style={{ color: colors.text }}>
                            {formatPrice(item.refundAmount)}
                          </Text>
                          <View
                            className="mt-1 rounded px-1.5 py-0.5"
                            style={{ backgroundColor: actionColor + '20' }}>
                            <Text className="text-xs font-semibold" style={{ color: actionColor }}>
                              {getReturnActionLabel(item.action)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {item.reason && (
                        <Text className="mt-1 text-xs italic" style={{ color: colors.muted }}>
                          Reason: {item.reason}
                        </Text>
                      )}
                      {item.orderItem && (
                        <View className="mt-2 rounded-lg p-2" style={{ backgroundColor: colors.card }}>
                          <Text className="text-xs font-semibold" style={{ color: colors.muted }}>
                            Original Order Item
                          </Text>
                          <View className="mt-1 flex-row flex-wrap gap-x-4 gap-y-0.5">
                            <Text className="text-xs" style={{ color: colors.muted }}>
                              Ordered: {item.orderItem.orderedQuantity} {item.orderItem.unit || ''}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                              Delivered: {item.orderItem.deliveredQuantity} {item.orderItem.unit || ''}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.muted }}>
                              Price: {formatPrice(item.orderItem.sellingPrice)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <View className="h-4" />
            </ScrollView>
            <View className="border-t px-5 py-4" style={{ borderColor: colors.border }}>
              <TouchableOpacity
                onPress={handleUndo}
                disabled={undoMutation.isPending}
                className="flex-row items-center justify-center rounded-xl py-3"
                style={{
                  backgroundColor: colors.error + '15',
                  borderWidth: 1,
                  borderColor: colors.error,
                  opacity: undoMutation.isPending ? 0.7 : 1,
                }}>
                {undoMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <View className="flex-row items-center">
                    <MaterialIcons name="undo" size={18} color={colors.error} />
                    <Text className="ml-2 text-sm font-bold" style={{ color: colors.error }}>
                      Undo Return
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
