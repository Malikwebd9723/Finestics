// screens/Vendor/CustomerOrdersScreen.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllCustomers } from 'api/actions/customerActions';
import {
  formatPrice,
} from 'types/order.types';
import { Customer } from 'types/customer.types';
import CustomerOrderDetailsModal from './components/CustomerOrderDetailsModal';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CustomerOrdersScreenProps {
  navigation: any;
  route: any;
}

export default function CustomerOrdersScreen({ navigation, route }: CustomerOrdersScreenProps) {
  const { colors } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Get customer from route params (if navigated from another screen)
  const customerFromParams = route?.params?.customer as Customer | any;
  const openOrdersModal = route?.params?.openOrdersModal as boolean | undefined;

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetchAllCustomers(),
  });

  const customers: Customer[] = customersData?.data || [];

  // Auto-select customer if coming from route params
  useEffect(() => {
    if (customerFromParams && openOrdersModal) {
      setSelectedCustomer(customerFromParams);
      // Clear the params after using them
      navigation.setParams({ customer: undefined, openOrdersModal: undefined });
    }
  }, [customerFromParams, openOrdersModal, navigation]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.businessName?.toLowerCase().includes(query) ||
        c.contactPerson?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
    );
  }, [customers, searchQuery]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
    setSelectedOrderId(null);
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center border-b px-4 py-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Customer Orders
          </Text>
          <Text className="text-xs" style={{ color: colors.muted }}>
            Select a customer to view orders
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View
          className="flex-row items-center rounded-xl px-4 py-2"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search customers..."
            placeholderTextColor={colors.placeholder}
            className="ml-2 flex-1"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customer List */}
      {customersLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.muted }}>
            Loading customers...
          </Text>
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="people-outline" size={64} color={colors.muted} />
          <Text
            className="mt-4 text-center text-lg font-semibold"
            style={{ color: colors.text }}>
            {searchQuery ? 'No customers found' : 'No customers yet'}
          </Text>
          <Text className="mt-2 text-center" style={{ color: colors.muted }}>
            {searchQuery
              ? 'Try a different search term'
              : 'Add customers to see their orders here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectCustomer(item)}
              activeOpacity={0.7}
              className="mb-3 rounded-xl p-4"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View className="flex-row items-center">
                <View
                  className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.primary + '20' }}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {item.businessName}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.muted }}>
                    {item.contactPerson} • {item.phone}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  {parseFloat(item.currentBalance as string) > 0 && (
                    <View
                      className="mr-2 rounded-full px-2 py-1"
                      style={{ backgroundColor: colors.error + '15' }}>
                      <Text className="text-xs font-semibold" style={{ color: colors.error }}>
                        {formatPrice(item.currentBalance)} due
                      </Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <CustomerOrderDetailsModal
          visible={!!selectedCustomer}
          customer={selectedCustomer}
          selectedOrderId={selectedOrderId}
          onClose={handleCloseModal}
          onViewOrder={handleViewOrder}
        />
      )}
    </SafeAreaView>
  );
}