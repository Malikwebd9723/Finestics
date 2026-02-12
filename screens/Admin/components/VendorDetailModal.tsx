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
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchVendorById } from 'api/actions/adminActions';

const { height } = Dimensions.get('window');

interface VendorDetailModalProps {
  visible: boolean;
  vendorId: number | null;
  onClose: () => void;
}

export default function VendorDetailModal({ visible, vendorId, onClose }: VendorDetailModalProps) {
  const { colors } = useThemeContext();
  const [slideAnim] = useState(new Animated.Value(height));

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendorDetail', vendorId],
    queryFn: () => fetchVendorById(vendorId!),
    enabled: !!vendorId && visible,
  });

  const vendor = data?.data;

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
        return '#f59e0b';
      case 'suspended':
        return colors.error;
      case 'rejected':
        return '#6b7280';
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
              <MaterialIcons name="close" size={24} color={colors.text} />
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
              <MaterialIcons name="error-outline" size={64} color={colors.error} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                Failed to load details
              </Text>
            </View>
          ) : vendor ? (
            <ScrollView className="flex-1 px-5 py-4">
              {/* Business Info Card */}
              <View className="p-4 rounded-3xl mb-4" style={{ backgroundColor: colors.background }}>
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + '20' }}>
                    <MaterialIcons name="store" size={32} color={colors.primary} />
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
                    icon="category"
                    label="Business Type"
                    value={vendor.businessType || 'Not specified'}
                    colors={colors}
                  />
                  <InfoRow
                    icon="description"
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
                    icon="email"
                    label="Business Email"
                    value={vendor.businessEmail || 'Not provided'}
                    colors={colors}
                  />
                  <InfoRow
                    icon="event"
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
                    <MaterialIcons name="person" size={24} color={colors.primary} />
                    <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                      Owner Information
                    </Text>
                  </View>

                  <InfoRow
                    icon="person"
                    label="Name"
                    value={`${vendor.user.firstName} ${vendor.user.lastName}`}
                    colors={colors}
                  />
                  <InfoRow
                    icon="email"
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

              {/* Statistics Placeholder */}
              <View className="p-4 rounded-3xl mb-4" style={{ backgroundColor: colors.background }}>
                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="insights" size={24} color={colors.primary} />
                  <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                    Statistics
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <View
                    className="flex-1 items-center rounded-lg p-3"
                    style={{ backgroundColor: colors.card }}>
                    <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                      0
                    </Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      Total Orders
                    </Text>
                  </View>
                  <View
                    className="flex-1 items-center rounded-lg p-3"
                    style={{ backgroundColor: colors.card }}>
                    <Text className="text-xl font-bold" style={{ color: colors.success }}>
                      $0
                    </Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      Revenue
                    </Text>
                  </View>
                  <View
                    className="flex-1 items-center rounded-lg p-3"
                    style={{ backgroundColor: colors.card }}>
                    <Text className="text-xl font-bold" style={{ color: colors.text }}>
                      0
                    </Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      Products
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.muted} />
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

// Helper Component
const InfoRow = ({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) => (
  <View className="flex-row items-center py-2">
    <MaterialIcons name={icon as any} size={18} color={colors.muted} />
    <Text className="text-sm ml-2 w-32" style={{ color: colors.muted }}>
      {label}:
    </Text>
    <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>
      {value}
    </Text>
  </View>
);
