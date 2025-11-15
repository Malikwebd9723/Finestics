import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import GlobalDataTable from 'components/GlobalDataTable';
import { useThemeContext } from 'context/ThemeProvider';

export default function Dashboard() {
  const { colors, theme } = useThemeContext();
  
  const items = [
    { name: 'Apple', orders: 5, total: 22, picked: 10, pending: 12 },
    { name: 'Mangos', orders: 3, total: 29, picked: 6, pending: 23 },
    { name: 'Papaya', orders: 6, total: 12, picked: 6, pending: 6 },
    { name: 'Ginger', orders: 9, total: 32, picked: 30, pending: 2 },
    { name: 'Avocado', orders: 12, total: 25, picked: 25, pending: 0 },
  ];

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'orders', label: 'Orders', numeric: true },
    { key: 'total', label: 'Total', numeric: true },
    { key: 'picked', label: 'Picked', numeric: true },
    { key: 'pending', label: 'Pending', numeric: true },
  ];



  const orderItems = [
    { name: 'Org name', items: 5, payment: 'PAID', paymentDate: '(on app)', amount: '$675.00' },
    { name: 'Org name', items: 5, payment: 'PAID', paymentDate: '(on app)', amount: '$675.00' },
  ];

  const orderColumns = [
    { key: 'name', label: 'Name' },
    { key: 'items', label: 'Items' },
    { key: 'payment', label: 'Payment' },
    { key: 'amount', label: 'Amount' },
  ];

  // Recent Transactions Table
  const transactionItems = [
    { name: 'Usman', date: '13 Feb, 25', status: 'PAID', payment: '$3,432.00' },
    { name: 'Maaz', date: '13 Feb, 25', status: 'PAID', payment: '$3,432.00' },
    { name: 'Usman', date: '13 Feb, 25', status: 'CREDIT', payment: '$3,432.00' },
    { name: 'Maaz', date: '13 Feb, 25', status: 'PAID', payment: '$3,432.00' },
  ];

  const transactionColumns = [
    { key: 'name', label: 'Name' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'payment', label: 'Payment' },
  ];
  return (
    <ScrollView className="flex-1 px-2" style={{ backgroundColor: colors.background }}>
      {/* Top Card Section */}
      <View className="flex-1 py-2">
        {/* Top Stats Card */}
        <View
          className="flex-row justify-between rounded-2xl p-2 shadow-sm"
          style={{ backgroundColor: colors.card }}>
          {/* Left — Today’s Order */}
          <View
            className="mr-4 flex-1 justify-between rounded-lg p-2"
            backgroundColor={colors.gray}>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Today’s Order
            </Text>

            <View className="flex-row justify-between">
              <Text className="text-4xl font-bold" style={{ color: colors.text }}>
                124
              </Text>

              <Text className="mb-3 text-lg font-semibold" style={{ color: colors.text }}>
                $5,374.32
              </Text>
            </View>

            {/* Growth Indicator */}
            <View className="flex-row items-center">
              <View className="flex-row items-center self-start rounded-full bg-green-100 px-2 py-1 dark:bg-green-800">
                <MaterialIcons name="arrow-upward" size={12} color={colors.success} />
                <Text className="ml-1 text-xs font-semibold" style={{ color: colors.success }}>
                  +2.3%
                </Text>
              </View>
              <Text className="ml-1 text-xs" style={{ color: colors.muted }}>
                then yesterday
              </Text>
            </View>
          </View>

          {/* Right — Order Summary */}
          <View className="w-48 gap-3">
            {/* Processed */}
            <View className="flex-row items-start">
              <Ionicons name="cart-outline" size={20} color={colors.muted} />
              <View className="ml-2">
                <Text className="text-sm" style={{ color: colors.text }}>
                  Processed
                </Text>
                <Text className="text-base font-bold" style={{ color: colors.muted }}>
                  24
                </Text>
              </View>
            </View>

            {/* Pending */}
            <View className="flex-row items-start">
              <Ionicons name="time-outline" size={20} color={colors.muted} />
              <View className="ml-2">
                <Text className="text-sm" style={{ color: colors.text }}>
                  Pending
                </Text>
                <Text className="text-base font-bold" style={{ color: colors.muted }}>
                  100
                </Text>
              </View>
            </View>

            {/* Delivered */}
            <View className="flex-row items-start">
              <Ionicons name="cube-outline" size={20} color={colors.muted} />
              <View className="ml-2">
                <Text className="text-sm" style={{ color: colors.text }}>
                  Delivered
                </Text>
                <Text className="text-base font-bold" style={{ color: colors.muted }}>
                  00
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <GlobalDataTable title="Items to Pick" columns={columns} items={items} />
      <GlobalDataTable title="Recent Orders" columns={orderColumns} items={orderItems} route={"OrdersScreen"}/>
      <GlobalDataTable title="Recent Transactions" columns={transactionColumns} items={transactionItems} route={"TransactionHistory"} />
    </ScrollView>
  );
}
