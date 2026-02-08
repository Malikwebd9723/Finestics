// screens/Vendor/components/PaymentsCustomers.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchCustomerPaymentSummaries, CustomerPaymentSummary } from 'api/actions/paymentActions';
import { formatPrice } from 'types/order.types';
import { copyToClipboard, formatCustomersText } from 'utils/paymentClipboard';
import SearchBar from 'components/SearchBar';

type SortField = 'totalAmount' | 'totalBalance' | 'totalOrders' | 'businessName';

interface Props {
  startDate: string;
  endDate: string;
  isActive: boolean;
  onCustomerPress?: (customerId: number) => void;
}

const SORT_OPTIONS: { key: SortField; label: string }[] = [
  { key: 'totalAmount', label: 'Sales' },
  { key: 'totalBalance', label: 'Balance' },
  { key: 'totalOrders', label: 'Orders' },
  { key: 'businessName', label: 'Name' },
];

export default function PaymentsCustomersTab({
  startDate,
  endDate,
  isActive,
  onCustomerPress,
}: Props) {
  const { colors } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('totalAmount');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', 'customers', startDate, endDate, sortBy, sortOrder, hasBalanceOnly],
    queryFn: () =>
      fetchCustomerPaymentSummaries({
        startDate,
        endDate,
        sortBy,
        sortOrder,
        hasBalance: hasBalanceOnly || undefined,
        limit: 100,
      }),
    enabled: isActive,
  });

  const customers: CustomerPaymentSummary[] = data?.data || [];

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.businessName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, searchQuery]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortOrder(field === 'businessName' ? 'ASC' : 'DESC');
    }
  };

  if (isLoading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-16 px-6">
        <MaterialIcons name="error-outline" size={40} color={colors.error} />
        <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
          Failed to load customers
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-4">
      {/* Search */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search customers..."
      />

      <View className="px-4">
        {/* Filter + Sort + Copy row */}
        <View className="mb-3 flex-row items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flex: 1 }}>
          <View className="flex-row gap-1.5">
            {/* Balance filter chip */}
            <TouchableOpacity
              onPress={() => setHasBalanceOnly(!hasBalanceOnly)}
              className="flex-row items-center rounded-full px-3"
              style={{
                height: 28,
                backgroundColor: hasBalanceOnly ? colors.error + '15' : colors.card,
                borderWidth: 1,
                borderColor: hasBalanceOnly ? colors.error : colors.border,
              }}>
              <Text
                className="text-xs"
                style={{ color: hasBalanceOnly ? colors.error : colors.muted }}>
                Owing
              </Text>
              {hasBalanceOnly && (
                <MaterialIcons name="close" size={12} color={colors.error} style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 4 }} />

            {/* Sort chips */}
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => toggleSort(opt.key)}
                  className="flex-row items-center rounded-full px-3"
                  style={{
                    height: 28,
                    backgroundColor: active ? colors.primary + '15' : colors.card,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                  }}>
                  <Text
                    className="text-xs"
                    style={{ color: active ? colors.primary : colors.muted }}>
                    {opt.label}
                  </Text>
                  {active && (
                    <MaterialIcons
                      name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
                      size={12}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        {filteredCustomers.length > 0 && (
          <TouchableOpacity
            onPress={() => copyToClipboard(formatCustomersText(filteredCustomers, startDate, endDate))}
            className="ml-2 flex-row items-center rounded-full px-3"
            style={{ height: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="copy-outline" size={13} color={colors.muted} />
          </TouchableOpacity>
        )}
        </View>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <View className="items-center py-12">
            <MaterialCommunityIcons name="account-search" size={40} color={colors.muted} />
            <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
              {searchQuery ? 'No customers match your search' : 'No customers found'}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() => onCustomerPress?.(customer.id)}
              className="mb-2 rounded-xl px-4 py-3"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              {/* Name + Balance badge */}
              <View className="mb-1.5 flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {customer.businessName}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    {customer.contactPerson}
                  </Text>
                </View>
                {customer.totalBalance > 0 && (
                  <Text className="text-sm font-bold" style={{ color: colors.error }}>
                    {formatPrice(customer.totalBalance)}
                  </Text>
                )}
              </View>

              {/* Stats */}
              <View className="flex-row items-center gap-4">
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Sales{' '}
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {formatPrice(customer.totalAmount)}
                  </Text>
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Paid{' '}
                  <Text style={{ color: colors.success, fontWeight: '600' }}>
                    {formatPrice(customer.totalPaid)}
                  </Text>
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  {customer.totalOrders} orders
                </Text>
              </View>

              {/* Credit bar */}
              {customer.creditLimit > 0 && (
                <View className="mt-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      Credit {formatPrice(customer.currentBalance)} / {formatPrice(customer.creditLimit)}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color: customer.creditUtilization > 80 ? colors.error : colors.muted,
                      }}>
                      {customer.creditUtilization}%
                    </Text>
                  </View>
                  <View
                    className="mt-1 h-1.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: colors.border }}>
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(customer.creditUtilization, 100)}%`,
                        backgroundColor:
                          customer.creditUtilization > 80
                            ? colors.error
                            : customer.creditUtilization > 50
                              ? '#f59e0b'
                              : colors.success,
                      }}
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}
