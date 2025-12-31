// screens/Vendor/components/CustomerSelectModal.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllCustomers } from 'api/actions/customerActions';
import { Customer } from 'types/customer.types';

interface CustomerSelectModalProps {
  visible: boolean;
  selectedCustomerId: number | null;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export default function CustomerSelectModal({
  visible,
  selectedCustomerId,
  onSelect,
  onClose,
}: CustomerSelectModalProps) {
  const { colors } = useThemeContext();
  const [search, setSearch] = useState('');

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchAllCustomers,
    enabled: visible,
  });

  // Filter customers
  const filteredCustomers = useMemo(() => {
    const customers = data?.data || [];
    if (!search.trim()) return customers;

    const query = search.toLowerCase().trim();
    return customers.filter(
      (c: Customer) =>
        c.businessName?.toLowerCase().includes(query) ||
        c.contactPerson?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
    );
  }, [data, search]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    onClose();
    setSearch('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl" style={{ backgroundColor: colors.card, maxHeight: '80%' }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{ borderColor: colors.border }}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Select Customer
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.background }}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-5 py-3">
            <View
              className="flex-row items-center rounded-xl px-4"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                className="ml-2 flex-1 py-3"
                style={{ color: colors.text }}
                placeholder="Search customers..."
                placeholderTextColor={colors.placeholder}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Customer List */}
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.muted }}>
                Loading customers...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              ListEmptyComponent={
                <View className="items-center py-12">
                  <Ionicons name="people" size={48} color={colors.muted} />
                  <Text className="mt-4 text-center" style={{ color: colors.muted }}>
                    {search ? 'No customers match your search' : 'No customers found'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedCustomerId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className="mb-2 flex-row items-center rounded-xl p-4"
                    style={{
                      backgroundColor: isSelected ? colors.primary + '15' : colors.background,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}>
                    {/* Avatar */}
                    <View
                      className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isSelected ? colors.primary : colors.primary + '20',
                      }}>
                      <Text
                        className="text-sm font-bold"
                        style={{ color: isSelected ? '#fff' : colors.primary }}>
                        {item.businessName?.slice(0, 2).toUpperCase() || '??'}
                      </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {item.businessName}
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: colors.muted }}>
                        {item.contactPerson} • {item.phone}
                      </Text>
                    </View>

                    {/* Check Icon */}
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
