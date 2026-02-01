// screens/Admin/components/VendorsList.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchAllVendors,
  approveVendor,
  Vendor,
} from 'api/actions/adminActions';
import VendorDetailModal from './VendorDetailModal';
import VendorActionsModal from './VendorActionsModal';
import Snackbar, { useSnackbar } from 'components/Snackbar';

interface VendorsListProps {
  searchQuery: string;
  statusFilter: 'all' | 'pending' | 'active' | 'suspended' | 'rejected';
}

interface ApiResponse {
  success?: boolean;
  data?: Vendor[] | { vendors?: Vendor[]; data?: Vendor[] };
  pagination?: any;
}

export default function VendorsList({ searchQuery, statusFilter }: VendorsListProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'reactivate'>('approve');
  const [processingVendorId, setProcessingVendorId] = useState<number | null>(null);
  const snackbar = useSnackbar();

  const filters = statusFilter !== 'all' ? { status: statusFilter as any } : undefined;

  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ['vendors', 'allVendors', statusFilter],
    queryFn: () => fetchAllVendors(1, 100, filters),
  });

  // Quick approve mutation
  const approveMutation = useMutation({
    mutationFn: approveVendor,
    onSuccess: (response) => {
      setProcessingVendorId(null);
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['vendors'] });
        snackbar.showSuccess(response.data?.message || 'Vendor approved successfully');
      } else {
        const errorMsg = response.data?.error?.message || response.data?.message || 'Failed to approve vendor';
        snackbar.showError(errorMsg);
      }
    },
    onError: (error: any) => {
      setProcessingVendorId(null);
      const errorMsg = error?.data?.error?.message || error?.message || 'Failed to approve vendor';
      snackbar.showError(errorMsg);
    },
  });

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading]);

  const shimmerOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const filteredVendors = useMemo(() => {
    // Handle different API response structures
    let vendors: Vendor[] = [];

    if (data?.data) {
      // If data.data is an array, use it directly
      if (Array.isArray(data.data)) {
        vendors = data.data;
      }
      // If data.data.vendors exists (nested structure)
      else if (Array.isArray(data.data.vendors)) {
        vendors = data.data.vendors;
      }
      // If data.data.data exists (double nested)
      else if (Array.isArray((data.data as any).data)) {
        vendors = (data.data as any).data;
      }
    }
    // If data itself is an array
    else if (Array.isArray(data)) {
      vendors = data;
    }

    if (!vendors.length) return [];

    let filtered = vendors;

    if (searchQuery) {
      filtered = filtered.filter((vendor) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          vendor.businessName?.toLowerCase().includes(searchLower) ||
          vendor.businessEmail?.toLowerCase().includes(searchLower) ||
          vendor.user?.firstName?.toLowerCase().includes(searchLower) ||
          vendor.user?.lastName?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [data, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'pending':
        return '#f59e0b';
      case 'suspended':
        return colors.error;
      case 'rejected':
        return '#6b7280';
      default:
        return colors.muted;
    }
  };

  const handleVendorPress = (vendorId: number) => {
    setSelectedVendorId(vendorId);
    setDetailModalVisible(true);
  };

  const handleAction = (vendorId: number, action: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
    setSelectedVendorId(vendorId);
    setActionType(action);
    setActionsModalVisible(true);
  };

  const handleQuickApprove = (vendorId: number) => {
    setProcessingVendorId(vendorId);
    approveMutation.mutate(vendorId);
  };

  const renderSkeleton = () => (
    <View className="px-4">
      {[...Array(6)].map((_, i) => (
        <Animated.View
          key={i}
          className="flex-row items-center justify-between p-4 mb-3 rounded-3xl shadow-sm"
          style={{ backgroundColor: colors.card, opacity: shimmerOpacity }}>
          <View className="flex-row items-center flex-1">
            <Animated.View
              className="w-14 h-14 rounded-full mr-4"
              style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
            />
            <View className="flex-1">
              <Animated.View
                className="w-32 h-5 mb-2 rounded-lg"
                style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
              />
              <Animated.View
                className="w-40 h-3 mb-1 rounded-lg"
                style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
              />
              <Animated.View
                className="w-24 h-3 rounded-lg"
                style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
              />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  if (isLoading) return renderSkeleton();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
          Failed to load vendors
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 px-6 py-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}>
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <MaterialIcons name="store" size={64} color={colors.muted} />
            <Text className="text-center mt-4 text-base font-medium" style={{ color: colors.text }}>
              No vendors found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleVendorPress(item.id)}
            className="p-4 mb-3 rounded-3xl shadow-sm"
            style={{
              backgroundColor: colors.card,
              elevation: 2,
              borderLeftWidth: item.status === 'pending' ? 3 : 0,
              borderLeftColor: '#f59e0b',
            }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center flex-1">
                {/* Avatar */}
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary + '20' }}>
                  <MaterialIcons name="store" size={24} color={colors.primary} />
                </View>

                <View className="ml-4 flex-1">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="font-bold text-base mr-2" style={{ color: colors.text }}>
                      {item.businessName || 'Unnamed Business'}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: getStatusColor(item.status) + '20' }}>
                      <Text
                        className="text-xs font-semibold capitalize"
                        style={{ color: getStatusColor(item.status) }}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm mt-0.5" style={{ color: colors.muted }}>
                    {item.user?.firstName} {item.user?.lastName}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {item.businessEmail || item.user?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-2 mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
              {item.status === 'pending' && (
                <>
                  <TouchableOpacity
                    onPress={() => handleQuickApprove(item.id)}
                    disabled={processingVendorId === item.id}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-lg"
                    style={{ backgroundColor: colors.success + '15' }}>
                    {processingVendorId === item.id ? (
                      <ActivityIndicator size="small" color={colors.success} />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={16} color={colors.success} />
                        <Text className="ml-1 text-sm font-medium" style={{ color: colors.success }}>
                          Approve
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(item.id, 'reject')}
                    disabled={processingVendorId === item.id}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-lg"
                    style={{ backgroundColor: colors.error + '15' }}>
                    <MaterialIcons name="close" size={16} color={colors.error} />
                    <Text className="ml-1 text-sm font-medium" style={{ color: colors.error }}>
                      Reject
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {item.status === 'active' && (
                <TouchableOpacity
                  onPress={() => handleAction(item.id, 'suspend')}
                  className="flex-1 flex-row items-center justify-center py-2 rounded-lg"
                  style={{ backgroundColor: colors.error + '15' }}>
                  <MaterialIcons name="block" size={16} color={colors.error} />
                  <Text className="ml-1 text-sm font-medium" style={{ color: colors.error }}>
                    Suspend
                  </Text>
                </TouchableOpacity>
              )}

              {item.status === 'suspended' && (
                <TouchableOpacity
                  onPress={() => handleAction(item.id, 'reactivate')}
                  className="flex-1 flex-row items-center justify-center py-2 rounded-lg"
                  style={{ backgroundColor: colors.success + '15' }}>
                  <MaterialIcons name="refresh" size={16} color={colors.success} />
                  <Text className="ml-1 text-sm font-medium" style={{ color: colors.success }}>
                    Reactivate
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handleVendorPress(item.id)}
                className="px-4 flex-row items-center justify-center py-2 rounded-lg"
                style={{ backgroundColor: colors.background }}>
                <MaterialIcons name="info-outline" size={16} color={colors.text} />
                <Text className="ml-1 text-sm font-medium" style={{ color: colors.text }}>
                  Details
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
      />

      {/* Vendor Detail Modal */}
      <VendorDetailModal
        visible={detailModalVisible}
        vendorId={selectedVendorId}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedVendorId(null);
        }}
      />

      {/* Vendor Actions Modal */}
      <VendorActionsModal
        visible={actionsModalVisible}
        vendorId={selectedVendorId}
        actionType={actionType}
        onClose={() => {
          setActionsModalVisible(false);
          setSelectedVendorId(null);
        }}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={snackbar.hideSnackbar}
      />
    </>
  );
}
