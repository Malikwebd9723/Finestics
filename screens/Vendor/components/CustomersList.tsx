// screens/Vendor/components/CustomersList.tsx
import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllCustomers } from 'api/actions/customerActions';
import {
  Customer,
  CustomerApiResponse,
  getBusinessTypeLabel,
  getPaymentTermsLabel,
  getInitials,
  isNewCustomer,
  formatCurrency,
} from 'types/customer.types';
import CustomerCardSkeleton from './CustomerCardSkeleton';

interface CustomersListProps {
  searchQuery: string;
  onViewCustomer: (customerId: number) => void;
  onEditCustomer: (customerId: number) => void;
}

export default function CustomersList({
  searchQuery,
  onViewCustomer,
  onEditCustomer,
}: CustomersListProps) {
  const { colors } = useThemeContext();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<CustomerApiResponse>({
    queryKey: ['customers'],
    queryFn: fetchAllCustomers,
  });

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!data?.data) return [];

    if (!searchQuery.trim()) return data.data;

    const query = searchQuery.toLowerCase().trim();
    return data.data.filter((customer) => {
      const businessName = customer.businessName?.toLowerCase() || '';
      const contactPerson = customer.contactPerson?.toLowerCase() || '';
      const email = customer.email?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';

      return (
        businessName.includes(query) ||
        contactPerson.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [data, searchQuery]);

  // Loading state
  if (isLoading) {
    return <CustomerCardSkeleton count={6} />;
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
          Failed to load customers
        </Text>
        <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
          Please check your connection and try again
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 rounded-xl px-6 py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text className="font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header with count */}
      <View className="mb-3 flex-row items-center justify-between px-4">
        <Text className="text-base font-bold" style={{ color: colors.text }}>
          All Customers
        </Text>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.primary + '20' }}>
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            {filteredCustomers.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="people-outline" size={72} color={colors.muted} />
            <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
              No customers found
            </Text>
            <Text className="mt-2 px-8 text-center text-sm" style={{ color: colors.muted }}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first customer to get started'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            colors={colors}
            onPress={() => onViewCustomer(item.id)}
            onEdit={() => onEditCustomer(item.id)}
          />
        )}
      />
    </View>
  );
}

// Customer Card Component
interface CustomerCardProps {
  customer: Customer;
  colors: any;
  onPress: () => void;
  onEdit: () => void;
}

function CustomerCard({ customer, colors, onPress, onEdit }: CustomerCardProps) {
  const hasBalance = parseFloat(customer.currentBalance) > 0;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl p-4"
      style={{
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}>
      <View className="flex-row">
        {/* Avatar */}
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary + '15' }}>
          <Text className="text-base font-bold" style={{ color: colors.primary }}>
            {getInitials(customer.contactPerson || customer.businessName)}
          </Text>
        </View>

        {/* Main Content */}
        <View className="ml-3 flex-1">
          {/* Business Name + New Badge */}
          <View className="flex-row flex-wrap items-center">
            <Text className="text-base font-bold" style={{ color: colors.text }} numberOfLines={1}>
              {customer.businessName}
            </Text>
            {isNewCustomer(customer.createdAt) && (
              <View
                className="ml-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.success + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                  New
                </Text>
              </View>
            )}
          </View>

          {/* Contact Person */}
          <View className="mt-1 flex-row items-center">
            <Ionicons name="person-outline" size={13} color={colors.muted} />
            <Text className="ml-1.5 text-sm" style={{ color: colors.text }}>
              {customer.contactPerson}
            </Text>
          </View>

          {/* Phone */}
          <View className="mt-0.5 flex-row items-center">
            <Ionicons name="call-outline" size={13} color={colors.muted} />
            <Text className="ml-1.5 text-sm" style={{ color: colors.muted }}>
              {customer.phone}
            </Text>
          </View>

          {/* Tags Row */}
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            {/* Business Type */}
            <View className="rounded-lg px-2 py-1" style={{ backgroundColor: colors.background }}>
              <Text className="text-xs font-medium" style={{ color: colors.text }}>
                {getBusinessTypeLabel(customer.businessType)}
              </Text>
            </View>

            {/* Payment Terms */}
            <View className="rounded-lg px-2 py-1" style={{ backgroundColor: colors.background }}>
              <Text className="text-xs font-medium" style={{ color: colors.text }}>
                {getPaymentTermsLabel(customer.paymentTerms)}
              </Text>
            </View>

            {/* Status Badge */}
            <View
              className="rounded-lg px-2 py-1"
              style={{
                backgroundColor:
                  customer.status === 'active' ? colors.success + '20' : colors.error + '20',
              }}>
              <Text
                className="text-xs font-semibold capitalize"
                style={{
                  color: customer.status === 'active' ? colors.success : colors.error,
                }}>
                {customer.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Side Actions */}
        <View className="ml-2 items-end justify-between">
          {/* Edit Button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-lg p-2"
            style={{ backgroundColor: colors.background }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>

          {/* Credit Limit */}
          <View className="mt-2 items-end">
            <Text className="text-xs" style={{ color: colors.muted }}>
              Credit
            </Text>
            <Text className="text-sm font-bold" style={{ color: colors.primary }}>
              {formatCurrency(customer.creditLimit)}
            </Text>
          </View>
        </View>
      </View>

      {/* Balance Footer */}
      {hasBalance && (
        <View
          className="mt-3 flex-row items-center justify-between pt-3"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <View className="flex-row items-center">
            <Ionicons name="wallet-outline" size={14} color={colors.error} />
            <Text className="ml-1 text-xs font-medium" style={{ color: colors.muted }}>
              Outstanding Balance
            </Text>
          </View>
          <Text className="text-sm font-bold" style={{ color: colors.error }}>
            {formatCurrency(customer.currentBalance)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
