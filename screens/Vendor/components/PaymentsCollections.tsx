// screens/Vendor/components/PaymentsCollections.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchPaymentCollections,
  fetchDailyCollection,
  CollectionGroupBy,
  CollectionItem,
  DailyCollectionData,
} from 'api/actions/paymentActions';
import { formatPrice, formatShortDate, getPaymentMethodLabel } from 'types/order.types';
import { copyToClipboard, formatCollectionsText } from 'utils/paymentClipboard';

interface Props {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const GROUP_OPTIONS: { key: CollectionGroupBy; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'customer', label: 'Customer' },
  { key: 'paymentMethod', label: 'Method' },
];

export default function PaymentsCollectionsTab({ startDate, endDate, isActive }: Props) {
  const { colors } = useThemeContext();
  const [groupBy, setGroupBy] = useState<CollectionGroupBy>('day');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', 'collections', startDate, endDate, groupBy],
    queryFn: () => fetchPaymentCollections({ startDate, endDate, groupBy }),
    enabled: isActive,
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['payments', 'collections', 'daily', selectedDate],
    queryFn: () => fetchDailyCollection(selectedDate!),
    enabled: isActive && !!selectedDate,
  });

  const collections = data?.data;
  const dailyDetails: DailyCollectionData | null = dailyData?.data || null;

  const handleRowPress = (item: CollectionItem) => {
    if (groupBy === 'day' && item.period) {
      setSelectedDate(selectedDate === item.period ? null : item.period);
    }
  };

  const getItemLabel = (item: CollectionItem): string => {
    if (groupBy === 'customer') return item.businessName || 'Unknown';
    if (groupBy === 'paymentMethod')
      return getPaymentMethodLabel(item.period as any) || item.period || '-';
    return formatShortDate(item.period || null);
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
          Failed to load collections
        </Text>
      </View>
    );
  }

  const handleCopy = () => {
    if (collections) copyToClipboard(formatCollectionsText(collections, startDate, endDate));
  };

  return (
    <View className="flex-1 px-4 pt-4">
      {/* Group by + Copy */}
      <View className="mb-4 flex-row items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flex: 1 }}>
          <View className="flex-row gap-1.5">
            {GROUP_OPTIONS.map((opt) => {
              const active = groupBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setGroupBy(opt.key);
                    setSelectedDate(null);
                  }}
                  className="items-center justify-center rounded-full px-3.5"
                  style={{
                    height: 30,
                    backgroundColor: active ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                  }}>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: active ? '#fff' : colors.muted }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        {collections && (
          <TouchableOpacity
            onPress={handleCopy}
            className="ml-2 flex-row items-center rounded-full px-3"
            style={{ height: 30, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="copy-outline" size={13} color={colors.muted} />
            <Text className="ml-1.5 text-xs" style={{ color: colors.muted }}>Copy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Total banner */}
      {collections && (
        <View
          className="mb-4 flex-row items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: colors.success + '10' }}>
          <Text className="text-sm" style={{ color: colors.text }}>
            Total Collected
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.success }}>
            {formatPrice(collections.total)}
          </Text>
        </View>
      )}

      {/* Data list */}
      {collections && collections.data.length === 0 ? (
        <View className="items-center py-12">
          <MaterialCommunityIcons name="cash-remove" size={40} color={colors.muted} />
          <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
            No collections found
          </Text>
        </View>
      ) : (
        collections?.data.map((item, idx) => (
          <View key={idx}>
            <TouchableOpacity
              onPress={() => handleRowPress(item)}
              activeOpacity={groupBy === 'day' ? 0.7 : 1}
              className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: selectedDate === item.period ? colors.primary : colors.border,
              }}>
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {getItemLabel(item)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-base font-bold" style={{ color: colors.success }}>
                  {formatPrice(item.totalCollected)}
                </Text>
                {groupBy === 'day' && (
                  <MaterialIcons
                    name={selectedDate === item.period ? 'expand-less' : 'expand-more'}
                    size={18}
                    color={colors.muted}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Expanded daily detail */}
            {groupBy === 'day' && selectedDate === item.period && (
              <View
                className="mb-3 ml-3 rounded-xl p-3"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                {dailyLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : dailyDetails ? (
                  <>
                    <View className="mb-2 flex-row flex-wrap gap-2">
                      {dailyDetails.byPaymentMethod.map((pm) => (
                        <View
                          key={pm.method}
                          className="rounded-lg px-3 py-1.5"
                          style={{ backgroundColor: colors.card }}>
                          <Text className="text-xs capitalize" style={{ color: colors.muted }}>
                            {pm.method?.replace('_', ' ')}
                          </Text>
                          <Text className="text-sm font-bold" style={{ color: colors.text }}>
                            {formatPrice(pm.totalAmount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {dailyDetails.payments.slice(0, 8).map((p) => (
                      <View
                        key={p.id}
                        className="flex-row items-center justify-between border-t py-2"
                        style={{ borderColor: colors.border }}>
                        <View className="flex-1">
                          <Text className="text-sm" style={{ color: colors.text }}>
                            {p.businessName}
                          </Text>
                          <Text className="text-xs" style={{ color: colors.muted }}>
                            {p.orderNumber}
                          </Text>
                        </View>
                        <Text className="text-sm font-bold" style={{ color: colors.success }}>
                          {formatPrice(p.paidAmount)}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    No details available
                  </Text>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}
