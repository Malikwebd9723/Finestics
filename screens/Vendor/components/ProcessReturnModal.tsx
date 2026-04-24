// screens/Vendor/components/ProcessReturnModal.tsx
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
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchOrderDetails } from 'api/actions/orderActions';
import { processReturn } from 'api/actions/returnActions';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { OrderDetailResponse, formatPrice } from 'types/order.types';
import {
  ReturnAction,
  RETURN_ACTIONS,
  getReturnActionColor,
  ProcessReturnPayload,
} from 'types/return.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInvalidateStats } from 'hooks/useInvalidateStats';

const { height } = Dimensions.get('window');

interface ReturnItemSelection {
  orderItemId: number;
  selected: boolean;
  quantity: string;
  maxQuantity: number;
  action: ReturnAction;
  reason: string;
  productName: string;
  unit: string;
  sellingPrice: number;
  buyingPrice: number;
}

interface ProcessReturnModalProps {
  visible: boolean;
  orderId: number | null;
  onClose: () => void;
}

export default function ProcessReturnModal({
  visible,
  orderId,
  onClose,
}: ProcessReturnModalProps) {
  const { colors } = useThemeContext();
  const invalidateStats = useInvalidateStats();
  const [slideAnim] = useState(new Animated.Value(height));
  const [returnItems, setReturnItems] = useState<ReturnItemSelection[]>([]);
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery<OrderDetailResponse>({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrderDetails(orderId!),
    enabled: !!orderId && visible,
  });

  const order = data?.data;

  // Initialize return items when modal opens or order data changes
  useEffect(() => {
    if (visible && order?.items) {
      const items: ReturnItemSelection[] = order.items
        .map((item) => {
          // Use deliveredQuantity if set, otherwise fall back to orderedQuantity
          // (for orders marked delivered without explicit delivery quantities)
          let delivered = parseFloat(String(item.deliveredQuantity)) || 0;
          if (delivered === 0 && (order.status === 'delivered' || order.status === 'completed')) {
            delivered = parseFloat(String(item.orderedQuantity)) || 0;
          }
          const returned = parseFloat(String(item.returnedQuantity)) || 0;
          const maxQty = Math.max(0, delivered - returned);
          return {
            orderItemId: item.id,
            selected: false,
            quantity: maxQty.toString(),
            maxQuantity: maxQty,
            action: 'credit' as ReturnAction,
            reason: '',
            productName: item.productName,
            unit: item.unit,
            sellingPrice: parseFloat(String(item.sellingPrice)) || 0,
            buyingPrice: parseFloat(String(item.buyingPrice)) || 0,
          };
        })
        .filter((item) => item.maxQuantity > 0);
      setReturnItems(items);
      setNotes('');
    } else if (!visible) {
      setReturnItems([]);
      setNotes('');
    }
  }, [visible, order]);

  const returnMutation = useMutation({
    mutationFn: (data: ProcessReturnPayload) => processReturn(orderId!, data),
    onSuccess: () => {
      Toast.success('Return processed successfully!');
      invalidateStats();
      onClose();
    },
    onError: (error: any) => {
      Dialog.alert('Error', error?.message || 'Failed to process return');
    },
  });

  // Computed values
  const selectedItems = returnItems.filter((i) => i.selected);
  const getItemRefund = (item: ReturnItemSelection) => {
    const qty = parseFloat(item.quantity) || 0;
    return qty * item.sellingPrice;
  };
  const totalRefund = selectedItems
    .filter((i) => i.action === 'credit' || i.action === 'refund')
    .reduce((sum, i) => sum + getItemRefund(i), 0);
  const replaceCount = selectedItems.filter((i) => i.action === 'replace_next_order').length;
  const profitLost = selectedItems
    .filter((i) => i.action === 'credit' || i.action === 'refund')
    .reduce((sum, i) => {
      const qty = parseFloat(i.quantity) || 0;
      return sum + qty * (i.sellingPrice - i.buyingPrice);
    }, 0);
  const replaceCost = selectedItems
    .filter((i) => i.action === 'replace_next_order')
    .reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * i.buyingPrice, 0);

  const updateItem = (index: number, updates: Partial<ReturnItemSelection>) => {
    setReturnItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      Dialog.alert('Error', 'Please select at least one item to return');
      return;
    }

    for (const item of selectedItems) {
      const qty = parseFloat(item.quantity);
      if (!qty || qty <= 0) {
        Dialog.alert('Error', `Quantity must be positive for ${item.productName}`);
        return;
      }
      if (qty > item.maxQuantity) {
        Dialog.alert('Error', `Cannot return more than ${item.maxQuantity} for ${item.productName}`);
        return;
      }
    }

    const payload: ProcessReturnPayload = {
      items: selectedItems.map((item) => ({
        orderItemId: item.orderItemId,
        quantity: parseFloat(item.quantity),
        reason: item.reason || undefined,
        action: item.action,
      })),
      notes: notes || undefined,
    };

    Dialog.confirm(
      'Confirm Return',
      `Process return for ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}?${totalRefund > 0 ? ` Total refund: ${formatPrice(totalRefund)}` : ''}${replaceCount > 0 ? ` (${replaceCount} replacement${replaceCount !== 1 ? 's' : ''})` : ''}`,
      {
        onConfirm: () => returnMutation.mutate(payload),
      }
    );
  };

  // Slide animation
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
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Process Return
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
                Loading order...
              </Text>
            </View>
          ) : !order ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.error} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                Failed to load order
              </Text>
            </View>
          ) : (
            <>
              <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View
                  className="mb-4 rounded-2xl p-3"
                  style={{ backgroundColor: colors.background }}>
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {order.orderNumber}
                  </Text>
                  <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                    {order.customer?.businessName} • {order.customer?.contactPerson}
                  </Text>
                </View>

                {/* Items */}
                {returnItems.length === 0 ? (
                  <View className="items-center py-8">
                    <MaterialIcons name="check-circle" size={48} color={colors.success} />
                    <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
                      No returnable items on this order
                    </Text>
                  </View>
                ) : (
                  returnItems.map((item, index) => (
                    <View
                      key={item.orderItemId}
                      className="mb-3 rounded-2xl p-4"
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: item.selected ? 2 : 1,
                        borderColor: item.selected ? colors.primary : colors.border,
                      }}>
                      {/* Checkbox + Product Name */}
                      <TouchableOpacity
                        onPress={() => updateItem(index, { selected: !item.selected })}
                        className="flex-row items-center">
                        <View
                          className="h-6 w-6 items-center justify-center rounded-md mr-3"
                          style={{
                            backgroundColor: item.selected ? colors.primary : 'transparent',
                            borderWidth: item.selected ? 0 : 2,
                            borderColor: colors.border,
                          }}>
                          {item.selected && (
                            <MaterialIcons name="check" size={16} color="#fff" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold" style={{ color: colors.text }}>
                            {item.productName}
                          </Text>
                          <Text className="text-xs mt-0.5" style={{ color: colors.muted }}>
                            Up to {item.maxQuantity} {item.unit} available •{' '}
                            {formatPrice(item.sellingPrice)}/{item.unit}
                          </Text>
                        </View>
                        {item.selected && getItemRefund(item) > 0 && item.action !== 'replace_next_order' && (
                          <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                            {formatPrice(getItemRefund(item))}
                          </Text>
                        )}
                      </TouchableOpacity>

                      {/* Expanded details when selected */}
                      {item.selected && (
                        <View className="mt-3 ml-9">
                          {/* Quantity */}
                          <View className="mb-3">
                            <Text className="text-xs font-semibold mb-1" style={{ color: colors.muted }}>
                              Quantity to Return
                            </Text>
                            <TextInput
                              value={item.quantity}
                              onChangeText={(text) => updateItem(index, { quantity: text })}
                              keyboardType="decimal-pad"
                              className="rounded-lg px-3 py-2"
                              style={{
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                            />
                          </View>

                          {/* Action Picker */}
                          <View className="mb-3">
                            <Text className="text-xs font-semibold mb-2" style={{ color: colors.muted }}>
                              What should happen?
                            </Text>
                            <View className="gap-2">
                              {RETURN_ACTIONS.map((action) => {
                                const isActive = item.action === action.value;
                                const actionColor = getReturnActionColor(action.value);
                                const icon =
                                  action.value === 'credit'
                                    ? 'account-balance-wallet'
                                    : action.value === 'refund'
                                    ? 'payments'
                                    : 'autorenew';
                                return (
                                  <TouchableOpacity
                                    key={action.value}
                                    onPress={() => updateItem(index, { action: action.value })}
                                    className="flex-row items-center rounded-xl p-3"
                                    style={{
                                      backgroundColor: isActive ? actionColor + '12' : colors.card,
                                      borderWidth: isActive ? 2 : 1,
                                      borderColor: isActive ? actionColor : colors.border,
                                    }}>
                                    <View
                                      className="h-9 w-9 items-center justify-center rounded-full mr-3"
                                      style={{ backgroundColor: isActive ? actionColor + '25' : colors.background }}>
                                      <MaterialIcons
                                        name={icon}
                                        size={18}
                                        color={isActive ? actionColor : colors.muted}
                                      />
                                    </View>
                                    <View className="flex-1">
                                      <Text
                                        className="text-sm font-bold"
                                        style={{ color: isActive ? actionColor : colors.text }}>
                                        {action.label}
                                      </Text>
                                      <Text
                                        className="text-xs mt-0.5"
                                        style={{ color: isActive ? actionColor : colors.muted }}>
                                        {action.description}
                                      </Text>
                                    </View>
                                    {isActive && (
                                      <MaterialIcons name="check-circle" size={20} color={actionColor} />
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>

                          {/* Reason */}
                          <View>
                            <Text className="text-xs font-semibold mb-1" style={{ color: colors.muted }}>
                              Reason (optional)
                            </Text>
                            <TextInput
                              value={item.reason}
                              onChangeText={(text) => updateItem(index, { reason: text })}
                              placeholder="e.g., Rotten, Damaged, Wrong item"
                              placeholderTextColor={colors.muted}
                              className="rounded-lg px-3 py-2"
                              style={{
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  ))
                )}

                {/* Notes */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>
                    General Notes (optional)
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Notes about this return..."
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={3}
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Summary */}
                {selectedItems.length > 0 && (
                  <View
                    className="mb-4 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                    <View className="px-4 py-3" style={{ backgroundColor: '#f59e0b15' }}>
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>
                        Return Summary
                      </Text>
                    </View>
                    <View className="px-4 py-3 gap-2">
                      <View className="flex-row justify-between">
                        <Text className="text-sm" style={{ color: colors.muted }}>
                          Items to return
                        </Text>
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {selectedItems.length}
                        </Text>
                      </View>
                      {totalRefund > 0 && (
                        <View className="flex-row justify-between">
                          <Text className="text-sm" style={{ color: colors.muted }}>
                            Total refund
                          </Text>
                          <Text className="text-base font-bold" style={{ color: colors.primary }}>
                            {formatPrice(totalRefund)}
                          </Text>
                        </View>
                      )}
                      {replaceCount > 0 && (
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <MaterialIcons name="autorenew" size={14} color="#3b82f6" />
                            <Text className="ml-1 text-sm" style={{ color: colors.muted }}>
                              Free replacements
                            </Text>
                          </View>
                          <Text className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                            {replaceCount} item{replaceCount !== 1 ? 's' : ''} in next order
                          </Text>
                        </View>
                      )}
                      {(profitLost > 0 || replaceCost > 0) && (
                        <View className="border-t pt-2 mt-1" style={{ borderColor: colors.border }}>
                          {profitLost > 0 && (
                            <View className="flex-row justify-between">
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                Profit lost
                              </Text>
                              <Text className="text-sm font-semibold" style={{ color: colors.error }}>
                                -{formatPrice(profitLost)}
                              </Text>
                            </View>
                          )}
                          {replaceCost > 0 && (
                            <View className="flex-row justify-between mt-1">
                              <Text className="text-sm" style={{ color: colors.muted }}>
                                Replacement cost (future)
                              </Text>
                              <Text className="text-sm font-semibold" style={{ color: colors.error }}>
                                -{formatPrice(replaceCost)}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View className="h-4" />
              </ScrollView>

              {/* Submit Button */}
              <View className="border-t px-5 py-4" style={{ borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={selectedItems.length === 0 || returnMutation.isPending}
                  className="flex-row items-center justify-center rounded-xl py-3.5"
                  style={{
                    backgroundColor:
                      selectedItems.length === 0 ? colors.muted : '#f59e0b',
                    opacity: returnMutation.isPending ? 0.7 : 1,
                  }}>
                  {returnMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="assignment-return" size={20} color="#fff" />
                      <Text className="ml-2 text-base font-bold text-white">
                        Process Return ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
