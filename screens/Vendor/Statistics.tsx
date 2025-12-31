// screens/Vendor/Statistics.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllOrders } from 'api/actions/orderActions';
import { fetchAllProducts } from 'api/actions/productActions';
import { fetchAllCustomers } from 'api/actions/customerActions';
import { formatPrice } from 'types/order.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type TimeFilter = '7days' | '30days' | 'all';

export default function Statistics() {
  const { colors } = useThemeContext();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');

  // Fetch all data
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
    isRefetching,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchAllOrders({ limit: 500 }),
  });

  const { data: productsData, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchAllProducts,
  });

  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchAllCustomers,
  });

  // Filter orders by time
  const filteredOrders = useMemo(() => {
    const orders = ordersData?.data || [];
    const now = new Date();

    if (timeFilter === 'all') return orders;

    const daysAgo = timeFilter === '7days' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return orders.filter((order: any) => new Date(order.orderDate) >= cutoffDate);
  }, [ordersData, timeFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const orders = filteredOrders;
    const products = productsData?.data || [];
    const customers = customersData?.data || [];

    // Order stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o: any) => o.status === 'completed').length;
    const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length;
    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;

    // Revenue stats
    const totalRevenue = orders
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);

    const totalCollected = orders.reduce(
      (sum: number, o: any) => sum + parseFloat(o.paidAmount || 0),
      0
    );

    const totalOutstanding = orders.reduce(
      (sum: number, o: any) => sum + parseFloat(o.balanceAmount || 0),
      0
    );

    // Profit calculation (from order items)
    let totalCost = 0;
    let totalSelling = 0;
    orders
      .filter((o: any) => o.status !== 'cancelled')
      .forEach((order: any) => {
        (order.items || []).forEach((item: any) => {
          const qty = parseFloat(item.orderedQuantity || 0);
          totalCost += parseFloat(item.buyingPrice || 0) * qty;
          totalSelling += parseFloat(item.sellingPrice || 0) * qty;
        });
      });

    const grossProfit = totalSelling - totalCost;
    const profitMargin = totalSelling > 0 ? (grossProfit / totalSelling) * 100 : 0;

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment stats
    const paidOrders = orders.filter((o: any) => o.paymentStatus === 'paid').length;
    const partialOrders = orders.filter((o: any) => o.paymentStatus === 'partial').length;
    const unpaidOrders = orders.filter((o: any) => o.paymentStatus === 'unpaid').length;

    // Product stats
    const activeProducts = products.filter((p: any) => p.isActive).length;
    const inactiveProducts = products.filter((p: any) => !p.isActive).length;

    // Customer stats
    const activeCustomers = customers.filter((c: any) => c.status === 'active').length;
    const customersWithBalance = customers.filter(
      (c: any) => parseFloat(c.currentBalance || 0) > 0
    ).length;

    return {
      // Orders
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      // Revenue
      totalRevenue,
      totalCollected,
      totalOutstanding,
      grossProfit,
      profitMargin,
      avgOrderValue,
      // Payment
      paidOrders,
      partialOrders,
      unpaidOrders,
      // Products
      totalProducts: products.length,
      activeProducts,
      inactiveProducts,
      // Customers
      totalCustomers: customers.length,
      activeCustomers,
      customersWithBalance,
    };
  }, [filteredOrders, productsData, customersData]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {};

    filteredOrders
      .filter((o: any) => o.status !== 'cancelled')
      .forEach((order: any) => {
        (order.items || []).forEach((item: any) => {
          const id = item.productId;
          if (!productSales[id]) {
            productSales[id] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[id].quantity += parseFloat(item.orderedQuantity || 0);
          productSales[id].revenue += parseFloat(item.subtotal || 0);
        });
      });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Top customers
  const topCustomers = useMemo(() => {
    const customerOrders: Record<number, { name: string; orders: number; revenue: number }> = {};

    filteredOrders
      .filter((o: any) => o.status !== 'cancelled')
      .forEach((order: any) => {
        const id = order.customerId;
        if (!customerOrders[id]) {
          customerOrders[id] = {
            name: order.customer?.businessName || 'Unknown',
            orders: 0,
            revenue: 0,
          };
        }
        customerOrders[id].orders += 1;
        customerOrders[id].revenue += parseFloat(order.totalAmount || 0);
      });

    return Object.values(customerOrders)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  const handleRefresh = () => {
    refetchOrders();
    refetchProducts();
    refetchCustomers();
  };

  const timeFilters: { label: string; value: TimeFilter }[] = [
    { label: '7 Days', value: '7days' },
    { label: '30 Days', value: '30days' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      <View className="px-4 py-4">
        {/* Time Filter */}
        <View className="mb-6 flex-row gap-2">
          {timeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => setTimeFilter(filter.value)}
              className="flex-1 items-center rounded-xl py-2.5"
              style={{
                backgroundColor: timeFilter === filter.value ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: timeFilter === filter.value ? colors.primary : colors.border,
              }}>
              <Text
                className="text-sm font-semibold"
                style={{
                  color: timeFilter === filter.value ? '#fff' : colors.text,
                }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue Summary */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
            Revenue
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <StatCard
              title="Total Revenue"
              value={formatPrice(stats.totalRevenue)}
              icon="attach-money"
              iconColor="#10b981"
              colors={colors}
            />
            <StatCard
              title="Collected"
              value={formatPrice(stats.totalCollected)}
              icon="account-balance-wallet"
              iconColor="#3b82f6"
              colors={colors}
            />
            <StatCard
              title="Outstanding"
              value={formatPrice(stats.totalOutstanding)}
              icon="schedule"
              iconColor="#ef4444"
              colors={colors}
            />
            <StatCard
              title="Gross Profit"
              value={formatPrice(stats.grossProfit)}
              subtitle={`${stats.profitMargin.toFixed(1)}% margin`}
              icon="trending-up"
              iconColor="#8b5cf6"
              colors={colors}
            />
          </View>
        </View>

        {/* Orders Summary */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
            Orders
          </Text>
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <View className="mb-4 flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  {stats.totalOrders}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: '#10b981' }}>
                  {stats.completedOrders}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Completed
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                  {stats.pendingOrders}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Pending
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                  {stats.cancelledOrders}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Cancelled
                </Text>
              </View>
            </View>
            <View
              className="flex-row justify-between border-t pt-3"
              style={{ borderColor: colors.border }}>
              <Text className="text-sm" style={{ color: colors.muted }}>
                Avg. Order Value
              </Text>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {formatPrice(stats.avgOrderValue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
            Payment Status
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View
              className="mb-3 items-center rounded-xl p-4"
              style={{
                width: CARD_WIDTH,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View
                className="mb-2 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#10b981' + '20' }}>
                <MaterialIcons name="check-circle" size={24} color="#10b981" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#10b981' }}>
                {stats.paidOrders}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Paid
              </Text>
            </View>
            <View
              className="mb-3 items-center rounded-xl p-4"
              style={{
                width: CARD_WIDTH,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View
                className="mb-2 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#f59e0b' + '20' }}>
                <MaterialIcons name="timelapse" size={24} color="#f59e0b" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                {stats.partialOrders}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Partial
              </Text>
            </View>
            <View
              className="mb-3 items-center rounded-xl p-4"
              style={{
                width: CARD_WIDTH,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <View
                className="mb-2 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: '#ef4444' + '20' }}>
                <MaterialIcons name="cancel" size={24} color="#ef4444" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#ef4444' }}>
                {stats.unpaidOrders}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Unpaid
              </Text>
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
            Top Selling Products
          </Text>
          <View
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            {topProducts.length === 0 ? (
              <View className="items-center p-6">
                <Text style={{ color: colors.muted }}>No data available</Text>
              </View>
            ) : (
              topProducts.map((product, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-4"
                  style={{
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                  }}>
                  <View className="flex-1 flex-row items-center">
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + '20' }}>
                      <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-semibold"
                        style={{ color: colors.text }}
                        numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {product.quantity} units sold
                      </Text>
                    </View>
                  </View>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {formatPrice(product.revenue)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Top Customers */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
            Top Customers
          </Text>
          <View
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            {topCustomers.length === 0 ? (
              <View className="items-center p-6">
                <Text style={{ color: colors.muted }}>No data available</Text>
              </View>
            ) : (
              topCustomers.map((customer, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-4"
                  style={{
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                  }}>
                  <View className="flex-1 flex-row items-center">
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + '20' }}>
                      <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-semibold"
                        style={{ color: colors.text }}
                        numberOfLines={1}>
                        {customer.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {customer.orders} orders
                      </Text>
                    </View>
                  </View>
                  <Text className="font-bold" style={{ color: colors.text }}>
                    {formatPrice(customer.revenue)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Inventory & Customers */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
            Inventory & Customers
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View
              className="mb-3 rounded-xl p-4"
              style={{
                width: CARD_WIDTH,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
              <Text className="mt-2 text-xl font-bold" style={{ color: colors.text }}>
                {stats.totalProducts}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Products ({stats.activeProducts} active)
              </Text>
            </View>
            <View
              className="mb-3 rounded-xl p-4"
              style={{
                width: CARD_WIDTH,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <MaterialIcons name="people" size={24} color={colors.primary} />
              <Text className="mt-2 text-xl font-bold" style={{ color: colors.text }}>
                {stats.totalCustomers}
              </Text>
              <Text className="text-xs" style={{ color: colors.muted }}>
                Customers ({stats.customersWithBalance} with balance)
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View className="h-6" />
      </View>
    </ScrollView>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  colors,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  colors: any;
}) {
  return (
    <View
      className="mb-3 rounded-xl p-4"
      style={{
        width: CARD_WIDTH,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <View
        className="mb-2 h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconColor + '20' }}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text className="text-xl font-bold" style={{ color: colors.text }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: colors.muted }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="mt-0.5 text-xs" style={{ color: iconColor }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
