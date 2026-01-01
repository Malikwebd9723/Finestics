// screens/Vendor/components/CustomerDetailModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { deleteCustomer, fetchCustomerDetails } from 'api/actions/customerActions';
import ConfirmDeleteModal from 'components/DeleteConfirmationModal';
import CustomerOrderHistory from './CustomerOrderHistory';
import {
  Customer,
  CustomerDetailResponse,
  getBusinessTypeLabel,
  getPaymentTermsLabel,
  getInitials,
  formatCurrency,
  formatDate,
} from 'types/customer.types';

const { height } = Dimensions.get('window');

interface CustomerDetailModalProps {
  visible: boolean;
  customerId: number | null;
  onClose: () => void;
  onEdit: (customerId: number) => void;
}

export default function CustomerDetailModal({
  visible,
  customerId,
  onClose,
  onEdit,
}: CustomerDetailModalProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Fetch customer details
  const { data, isLoading, error } = useQuery<CustomerDetailResponse>({
    queryKey: ['customers', customerId],
    queryFn: () => fetchCustomerDetails(customerId!),
    enabled: !!customerId && visible,
  });

  const customer = data?.data;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customerId!),
    onSuccess: () => {
      ToastAndroid.show('Customer deleted successfully!', ToastAndroid.SHORT);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteModalVisible(false);
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete customer';
      ToastAndroid.show(message, ToastAndroid.SHORT);
    },
  });

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return colors.success;
      case 'inactive':
      case 'blocked':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
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
              Customer Details
            </Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                Loading details...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.error} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                Failed to load details
              </Text>
              <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
                Please try again later
              </Text>
            </View>
          ) : customer ? (
            <>
              <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View
                  className="mb-4 rounded-2xl p-5"
                  style={{ backgroundColor: colors.background }}>
                  <View className="flex-row items-center">
                    <View
                      className="h-16 w-16 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + '15' }}>
                      <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                        {getInitials(customer.businessName)}
                      </Text>
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-xl font-bold" style={{ color: colors.text }}>
                        {customer.businessName}
                      </Text>
                      <View
                        className="mt-1 self-start rounded-full px-3 py-1"
                        style={{
                          backgroundColor: getStatusColor(customer.status) + '20',
                        }}>
                        <Text
                          className="text-xs font-bold uppercase"
                          style={{ color: getStatusColor(customer.status) }}>
                          {customer.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Contact Information */}
                <SectionCard title="Contact Information" icon="person" colors={colors}>
                  <InfoRow
                    icon="person"
                    label="Contact Person"
                    value={customer.contactPerson}
                    colors={colors}
                  />
                  <InfoRow icon="phone" label="Phone" value={customer.phone} colors={colors} />
                  {customer.alternatePhone && (
                    <InfoRow
                      icon="phone"
                      label="Alt. Phone"
                      value={customer.alternatePhone}
                      colors={colors}
                    />
                  )}
                  {customer.email && (
                    <InfoRow icon="email" label="Email" value={customer.email} colors={colors} />
                  )}
                  <InfoRow
                    icon="business"
                    label="Business Type"
                    value={getBusinessTypeLabel(customer.businessType)}
                    colors={colors}
                  />
                  <InfoRow
                    icon="event"
                    label="Joined"
                    value={formatDate(customer.createdAt)}
                    colors={colors}
                  />
                </SectionCard>

                {/* Financial Information */}
                <SectionCard
                  title="Financial Information"
                  icon="account-balance-wallet"
                  colors={colors}>
                  <InfoRow
                    icon="credit-card"
                    label="Payment Terms"
                    value={getPaymentTermsLabel(customer.paymentTerms)}
                    colors={colors}
                  />
                  <InfoRow
                    icon="trending-up"
                    label="Credit Limit"
                    value={formatCurrency(customer.creditLimit)}
                    colors={colors}
                  />
                  <InfoRow
                    icon="account-balance"
                    label="Current Balance"
                    value={formatCurrency(customer.currentBalance)}
                    colors={colors}
                    highlight={parseFloat(customer.currentBalance) > 0}
                    highlightColor={colors.error}
                  />
                </SectionCard>

                {/* Address Information */}
                {customer.address && (
                  <SectionCard title="Address" icon="location-on" colors={colors}>
                    <View className="mb-3 flex-row flex-wrap items-center gap-2">
                      {customer.address.label && (
                        <View
                          className="rounded-lg px-3 py-1"
                          style={{ backgroundColor: colors.primary + '15' }}>
                          <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                            {customer.address.label}
                          </Text>
                        </View>
                      )}
                      <View
                        className="rounded-lg px-3 py-1"
                        style={{ backgroundColor: colors.card }}>
                        <Text
                          className="text-xs font-semibold capitalize"
                          style={{ color: colors.text }}>
                          {customer.address.type}
                        </Text>
                      </View>
                    </View>

                    <Text className="mb-1 text-sm" style={{ color: colors.text }}>
                      {customer.address.street}
                    </Text>
                    <Text className="mb-1 text-sm" style={{ color: colors.text }}>
                      {customer.address.city}
                      {customer.address.state && `, ${customer.address.state}`}
                      {customer.address.postalCode && ` ${customer.address.postalCode}`}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.muted }}>
                      {customer.address.country}
                    </Text>

                    {customer.address.instructions && (
                      <View
                        className="mt-3 rounded-xl p-3"
                        style={{ backgroundColor: colors.card }}>
                        <Text className="mb-1 text-xs font-semibold" style={{ color: colors.text }}>
                          Delivery Instructions
                        </Text>
                        <Text className="text-xs" style={{ color: colors.muted }}>
                          {customer.address.instructions}
                        </Text>
                      </View>
                    )}
                  </SectionCard>
                )}

                {/* Additional Notes */}
                {(customer.notes || customer.deliveryInstructions) && (
                  <SectionCard title="Additional Notes" icon="info" colors={colors}>
                    {customer.notes && (
                      <View className="mb-3">
                        <Text
                          className="mb-1 text-xs font-semibold"
                          style={{ color: colors.muted }}>
                          Notes
                        </Text>
                        <Text className="text-sm" style={{ color: colors.text }}>
                          {customer.notes}
                        </Text>
                      </View>
                    )}
                    {customer.deliveryInstructions && (
                      <View>
                        <Text
                          className="mb-1 text-xs font-semibold"
                          style={{ color: colors.muted }}>
                          Delivery Instructions
                        </Text>
                        <Text className="text-sm" style={{ color: colors.text }}>
                          {customer.deliveryInstructions}
                        </Text>
                      </View>
                    )}
                  </SectionCard>
                )}

                {/* Order History */}
                <SectionCard title="Order History" icon="receipt-long" colors={colors}>
                  <CustomerOrderHistory customerId={customerId!} maxOrders={5} />
                </SectionCard>

                {/* Spacer for bottom buttons */}
                <View className="h-4" />
              </ScrollView>

              {/* Action Buttons */}
              <View
                className="flex-row gap-3 border-t px-5 py-4"
                style={{ borderColor: colors.border }}>
                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(true)}
                  className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                  style={{
                    backgroundColor: colors.error + '15',
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}>
                  <MaterialIcons name="delete" size={18} color={colors.error} />
                  <Text className="ml-2 text-sm font-bold" style={{ color: colors.error }}>
                    Delete
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    setTimeout(() => onEdit(customerId!), 300);
                  }}
                  className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                  style={{ backgroundColor: colors.primary }}>
                  <MaterialIcons name="edit" size={18} color="#fff" />
                  <Text className="ml-2 text-sm font-bold text-white">Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Delete Confirmation Modal */}
              <ConfirmDeleteModal
                visible={deleteModalVisible}
                loading={deleteMutation.isPending}
                onCancel={() => setDeleteModalVisible(false)}
                onConfirm={() => deleteMutation.mutate()}
              />
            </>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialIcons name="error-outline" size={64} color={colors.muted} />
              <Text className="mt-4 text-lg font-semibold" style={{ color: colors.text }}>
                No data available
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Section Card Component
interface SectionCardProps {
  title: string;
  icon: string;
  colors: any;
  children: React.ReactNode;
}

function SectionCard({ title, icon, colors, children }: SectionCardProps) {
  return (
    <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: colors.background }}>
      <View className="mb-3 flex-row items-center">
        <MaterialIcons name={icon as any} size={20} color={colors.primary} />
        <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// Info Row Component
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
  highlightColor?: string;
}

function InfoRow({ icon, label, value, colors, highlight, highlightColor }: InfoRowProps) {
  return (
    <View className="flex-row items-center py-2">
      <MaterialIcons name={icon as any} size={16} color={colors.muted} />
      <Text className="ml-2 w-28 text-sm" style={{ color: colors.muted }}>
        {label}
      </Text>
      {highlight ? (
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: (highlightColor || colors.primary) + '20' }}>
          <Text
            className="text-xs font-semibold"
            style={{ color: highlightColor || colors.primary }}>
            {value}
          </Text>
        </View>
      ) : (
        <Text
          className="flex-1 text-sm font-medium"
          style={{ color: colors.text }}
          numberOfLines={1}>
          {value || '-'}
        </Text>
      )}
    </View>
  );
}
