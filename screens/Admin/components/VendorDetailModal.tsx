// screens/Admin/components/VendorDetailModal.tsx
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchVendorById, fetchVendorStatsById, deleteVendor } from 'api/actions/adminActions';
import { formatPrice } from 'types/order.types';
import { typo } from 'constants/design';
import { Button } from 'components/ui';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';

const { height } = Dimensions.get('window');

interface VendorDetailModalProps {
  visible: boolean;
  vendorId: number | null;
  onClose: () => void;
  /** Invoked with the vendor id when the admin taps Edit; the modal closes itself right after. */
  onEdit?: (vendorId: number) => void;
}

export default function VendorDetailModal({
  visible,
  vendorId,
  onClose,
  onEdit,
}: VendorDetailModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(height));

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendorDetail', vendorId],
    queryFn: () => fetchVendorById(vendorId!),
    enabled: !!vendorId && visible,
  });

  const vendor = data?.data;

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['vendorAdminStats', vendorId],
    queryFn: () => fetchVendorStatsById(vendorId!),
    enabled: visible && !!vendorId,
  });

  const stats = statsData?.data;

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(vendorId!),
    onSuccess: () => {
      Toast.success('Vendor deleted');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorsSummary'] });
      onClose();
    },
    onError: (e: any) => {
      Toast.error(e?.message || 'Failed to delete vendor');
    },
  });

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleEdit = () => {
    if (vendorId != null) {
      onEdit?.(vendorId);
    }
    onClose();
  };

  const handleDelete = () => {
    Dialog.confirm(
      'Delete Vendor?',
      'This permanently deletes the vendor AND their user account. This cannot be undone.',
      {
        destructive: true,
        confirmText: 'Delete',
        onConfirm: () => deleteMutation.mutate(),
      }
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'pending':
        return colors.muted;
      case 'suspended':
      case 'rejected':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable style={{ height: height * 0.15 }} onPress={onClose} />

        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.card,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 20,
          }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between p-5 border-b"
            style={{ borderColor: colors.border }}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Vendor Details
            </Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.background }}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading vendor details...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.error} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                Failed to load details
              </Text>
            </View>
          ) : vendor ? (
            <>
              <ScrollView className="flex-1 px-5 py-4">
                {/* Business Info Card */}
                <View className="p-4 rounded-3xl mb-4" style={{ backgroundColor: colors.background }}>
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary + '20' }}>
                      <MaterialCommunityIcons name="store" size={32} color={colors.primary} />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-xl font-bold" style={{ color: colors.text }}>
                        {vendor.businessName || 'Unnamed Business'}
                      </Text>
                      <View
                        className="px-3 py-1 rounded-full self-start mt-1"
                        style={{ backgroundColor: getStatusColor(vendor.status) + '20' }}>
                        <Text
                          className="text-xs font-bold capitalize"
                          style={{ color: getStatusColor(vendor.status) }}>
                          {vendor.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="space-y-2">
                    <InfoRow
                      icon="shape-outline"
                      label="Business Type"
                      value={vendor.businessType || 'Not specified'}
                      colors={colors}
                    />
                    <InfoRow
                      icon="text-box-outline"
                      label="Description"
                      value={vendor.description || 'No description'}
                      colors={colors}
                    />
                    <InfoRow
                      icon="phone"
                      label="Business Phone"
                      value={vendor.businessPhone || 'Not provided'}
                      colors={colors}
                    />
                    <InfoRow
                      icon="email-outline"
                      label="Business Email"
                      value={vendor.businessEmail || 'Not provided'}
                      colors={colors}
                    />
                    <InfoRow
                      icon="calendar"
                      label="Registered"
                      value={formatDate(vendor.createdAt)}
                      colors={colors}
                    />
                  </View>
                </View>

                {/* Owner Info Card */}
                {vendor.user && (
                  <View className="p-4 rounded-3xl mb-4" style={{ backgroundColor: colors.background }}>
                    <View className="flex-row items-center mb-3">
                      <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
                      <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                        Owner Information
                      </Text>
                    </View>

                    <InfoRow
                      icon="account"
                      label="Name"
                      value={`${vendor.user.firstName} ${vendor.user.lastName}`}
                      colors={colors}
                    />
                    <InfoRow
                      icon="email-outline"
                      label="Email"
                      value={vendor.user.email}
                      colors={colors}
                    />
                    <InfoRow
                      icon="phone"
                      label="Phone"
                      value={vendor.user.phone || 'Not provided'}
                      colors={colors}
                    />
                  </View>
                )}

                {/* Statistics */}
                <View className="p-4 rounded-3xl mb-4" style={{ backgroundColor: colors.background }}>
                  <View className="flex-row items-center mb-3">
                    <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
                    <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                      Statistics
                    </Text>
                  </View>

                  {statsLoading ? (
                    <View className="items-center py-3">
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : statsError || !stats ? (
                    <Text className="text-sm" style={{ color: colors.muted }}>
                      Stats unavailable
                    </Text>
                  ) : (
                    <View>
                      <StatRow
                        label="Total revenue"
                        value={formatPrice(stats.totalRevenue)}
                        valueColor={colors.success}
                        colors={colors}
                      />
                      <StatRow label="Total orders" value={String(stats.totalOrders)} colors={colors} />
                      <StatRow
                        label="Revenue this month"
                        value={formatPrice(stats.revenueThisMonth)}
                        colors={colors}
                      />
                      <StatRow
                        label="Orders this month"
                        value={String(stats.ordersThisMonth)}
                        colors={colors}
                      />
                      <StatRow label="Products" value={String(stats.totalProducts)} colors={colors} />
                      <StatRow label="Customers" value={String(stats.totalCustomers)} colors={colors} />
                      <StatRow
                        label="Outstanding balance"
                        value={formatPrice(stats.outstandingBalance)}
                        valueColor={stats.outstandingBalance > 0 ? colors.error : undefined}
                        colors={colors}
                      />
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View className="flex-row gap-3 p-5 border-t" style={{ borderColor: colors.border }}>
                <Button
                  title="Edit"
                  variant="secondary"
                  icon="pencil"
                  onPress={handleEdit}
                  style={{ flex: 1 }}
                />
                <Pressable
                  onPress={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 flex-row items-center justify-center rounded-xl"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.error + '55',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    opacity: deleteMutation.isPending ? 0.55 : 1,
                  }}>
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
                      <Text
                        className="ml-2 text-[15px] font-bold"
                        style={{ color: colors.error }}>
                        Delete
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.muted} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                No vendor data available
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Helper Components
const InfoRow = ({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  colors: any;
}) => (
  <View className="flex-row items-center py-2">
    <MaterialCommunityIcons name={icon} size={18} color={colors.muted} />
    <Text className="text-sm ml-2 w-32" style={{ color: colors.muted }}>
      {label}:
    </Text>
    <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>
      {value}
    </Text>
  </View>
);

const StatRow = ({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) => (
  <View className="flex-row items-center justify-between py-1.5">
    <Text className="text-sm" style={{ color: colors.muted }}>
      {label}
    </Text>
    <Text className="text-sm" style={[typo.num, { color: valueColor || colors.text }]}>
      {value}
    </Text>
  </View>
);
