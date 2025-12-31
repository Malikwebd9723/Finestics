// screens/Vendor/components/BulkActionsBar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { bulkUpdateStatus, bulkAssignVan } from 'api/actions/orderActions';
import { fetchVans } from 'api/actions/vendorActions';
import { ORDER_STATUSES, OrderStatus } from 'types/order.types';

interface BulkActionsBarProps {
  selectedOrderIds: number[];
  onCancel: () => void;
  onComplete: () => void;
}

export default function BulkActionsBar({
  selectedOrderIds,
  onCancel,
  onComplete,
}: BulkActionsBarProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [vanModalVisible, setVanModalVisible] = useState(false);

  // Fetch vans
  const { data: vansData } = useQuery({
    queryKey: ['vans'],
    queryFn: fetchVans,
  });

  const vans: string[] = vansData?.data || [];

  // Bulk status mutation
  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => bulkUpdateStatus(selectedOrderIds, status),
    onSuccess: (response) => {
      ToastAndroid.show(
        `${response?.data?.updated || selectedOrderIds.length} orders updated`,
        ToastAndroid.SHORT
      );
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusModalVisible(false);
      onComplete();
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update orders');
    },
  });

  // Bulk van assignment mutation
  const vanMutation = useMutation({
    mutationFn: ({ vanName }: { vanName: string }) => bulkAssignVan(selectedOrderIds, vanName),
    onSuccess: (response) => {
      ToastAndroid.show(
        `${response?.data?.updated || selectedOrderIds.length} orders assigned to ${response?.data?.vanName}`,
        ToastAndroid.SHORT
      );
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setVanModalVisible(false);
      onComplete();
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to assign van');
    },
  });

  const handleStatusSelect = (status: OrderStatus) => {
    Alert.alert('Update Status', `Change ${selectedOrderIds.length} order(s) to "${status}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: () => statusMutation.mutate({ status }),
      },
    ]);
  };

  const handleVanSelect = (vanName: string) => {
    Alert.alert('Assign Van', `Assign ${selectedOrderIds.length} order(s) to "${vanName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign',
        onPress: () => vanMutation.mutate({ vanName }),
      },
    ]);
  };

  const isLoading = statusMutation.isPending || vanMutation.isPending;

  // Allowed statuses for bulk update (not cancelled)
  const allowedStatuses = ORDER_STATUSES.filter((s) => !['cancelled'].includes(s.value));

  return (
    <>
      {/* Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-around border-t px-4 py-3"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        }}>
        {/* Update Status */}
        <TouchableOpacity
          onPress={() => setStatusModalVisible(true)}
          disabled={isLoading}
          className="items-center px-4 py-2">
          <MaterialIcons name="sync" size={22} color={colors.primary} />
          <Text className="mt-1 text-xs font-medium" style={{ color: colors.text }}>
            Status
          </Text>
        </TouchableOpacity>

        {/* Assign Van */}
        <TouchableOpacity
          onPress={() => setVanModalVisible(true)}
          disabled={isLoading}
          className="items-center px-4 py-2">
          <Ionicons name="car" size={22} color={colors.primary} />
          <Text className="mt-1 text-xs font-medium" style={{ color: colors.text }}>
            Assign Van
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          onPress={onCancel}
          disabled={isLoading}
          className="items-center px-4 py-2">
          <Ionicons name="close-circle-outline" size={22} color={colors.error} />
          <Text className="mt-1 text-xs font-medium" style={{ color: colors.error }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Selection Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-3xl pb-8 pt-4" style={{ backgroundColor: colors.card }}>
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
            </View>

            <Text className="mb-4 px-4 text-lg font-bold" style={{ color: colors.text }}>
              Update Status ({selectedOrderIds.length} orders)
            </Text>

            {statusMutation.isPending ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-2" style={{ color: colors.muted }}>
                  Updating orders...
                </Text>
              </View>
            ) : (
              <ScrollView className="max-h-80">
                {allowedStatuses.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    onPress={() => handleStatusSelect(status.value as OrderStatus)}
                    className="mx-4 mb-2 flex-row items-center rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: status.color + '15',
                      borderWidth: 1,
                      borderColor: status.color + '30',
                    }}>
                    <View
                      className="mr-3 h-3 w-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <Text className="flex-1 font-medium" style={{ color: colors.text }}>
                      {status.label}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setStatusModalVisible(false)}
              className="mx-4 mt-4 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.background }}>
              <Text className="font-semibold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Van Selection Modal */}
      <Modal
        visible={vanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVanModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setVanModalVisible(false)}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-3xl pb-8 pt-4" style={{ backgroundColor: colors.card }}>
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
            </View>

            <Text className="mb-4 px-4 text-lg font-bold" style={{ color: colors.text }}>
              Assign Van ({selectedOrderIds.length} orders)
            </Text>

            {vanMutation.isPending ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-2" style={{ color: colors.muted }}>
                  Assigning van...
                </Text>
              </View>
            ) : vans.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="car-outline" size={48} color={colors.muted} />
                <Text className="mt-2 px-8 text-center" style={{ color: colors.muted }}>
                  No vans available. Add vans in Business Profile.
                </Text>
              </View>
            ) : (
              <ScrollView className="max-h-80">
                {vans.map((van) => (
                  <TouchableOpacity
                    key={van}
                    onPress={() => handleVanSelect(van)}
                    className="mx-4 mb-2 flex-row items-center rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}>
                    <Ionicons name="car" size={20} color={colors.primary} />
                    <Text className="ml-3 flex-1 font-medium" style={{ color: colors.text }}>
                      {van}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setVanModalVisible(false)}
              className="mx-4 mt-4 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.background }}>
              <Text className="font-semibold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
