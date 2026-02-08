// screens/Vendor/PaymentsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import DateRangeSelector from './components/DateRangeSelector';
import PaymentsOverviewTab from './components/PaymentsOverview';
import PaymentsCollectionsTab from './components/PaymentsCollections';
import PaymentsOutstandingTab from './components/PaymentsOutstanding';
import PaymentsCustomersTab from './components/PaymentsCustomers';
import PaymentsReportsTab from './components/PaymentsReports';
import CustomerPaymentModal from './components/CustomerPaymentModal';

type TabKey = 'overview' | 'collections' | 'outstanding' | 'customers' | 'reports';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'collections', label: 'Collections' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'customers', label: 'Customers' },
  { key: 'reports', label: 'Reports' },
];

const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function PaymentsScreen() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(toLocalDateString(monthStart));
  const [endDate, setEndDate] = useState(toLocalDateString(now));
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDateChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleCustomerPress = useCallback((customerId: number) => {
    setSelectedCustomerId(customerId);
    setCustomerModalVisible(true);
  }, []);

  const handleCloseCustomerModal = useCallback(() => {
    setCustomerModalVisible(false);
    setSelectedCustomerId(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['payments'] });
    setIsRefreshing(false);
  }, [queryClient]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header + Date picker in one area */}
      <View className="px-4 pt-4 pb-1">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Payments
        </Text>
      </View>

      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {/* Tab bar */}
      <View style={{ flexGrow: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="mr-1 items-center justify-center rounded-full px-4"
                style={{
                  height: 34,
                  backgroundColor: active ? colors.primary : 'transparent',
                }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: active ? '#fff' : colors.muted }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 8 }} />

      {/* Tab Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {activeTab === 'overview' && (
          <PaymentsOverviewTab startDate={startDate} endDate={endDate} isActive />
        )}
        {activeTab === 'collections' && (
          <PaymentsCollectionsTab startDate={startDate} endDate={endDate} isActive />
        )}
        {activeTab === 'outstanding' && (
          <PaymentsOutstandingTab
            startDate={startDate}
            endDate={endDate}
            isActive
            onCustomerPress={handleCustomerPress}
          />
        )}
        {activeTab === 'customers' && (
          <PaymentsCustomersTab
            startDate={startDate}
            endDate={endDate}
            isActive
            onCustomerPress={handleCustomerPress}
          />
        )}
        {activeTab === 'reports' && (
          <PaymentsReportsTab startDate={startDate} endDate={endDate} isActive />
        )}
      </ScrollView>

      <CustomerPaymentModal
        visible={customerModalVisible}
        customerId={selectedCustomerId}
        startDate={startDate}
        endDate={endDate}
        onClose={handleCloseCustomerModal}
      />
    </View>
  );
}
