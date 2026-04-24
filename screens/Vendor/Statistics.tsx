// screens/Vendor/Statistics.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchDetailedStats,
  fetchCustomerStats,
  fetchProductStats,
  fetchSalesTrend,
  DetailedStats,
  CustomerStats,
  ProductStats,
  SalesTrendItem,
} from 'api/actions/statisticsActions';
import { formatPrice } from 'types/order.types';
import DatePresetSelector, {
  DateRange,
  defaultRange,
} from 'components/shared/DatePresetSelector';

export default function Statistics() {
  const { colors } = useThemeContext();
  const [range, setRange] = useState<DateRange>(() => defaultRange('thisMonth'));
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'products'>('overview');

  // Choose a trend bucket interval based on the range span.
  const rangeSpanDays = React.useMemo(() => {
    const start = new Date(range.from);
    const end = new Date(range.to);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  }, [range]);
  const trendInterval: 'day' | 'week' | 'month' =
    rangeSpanDays <= 31 ? 'day' : rangeSpanDays <= 120 ? 'week' : 'month';

  // Fetch detailed stats
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching: statsRefetching,
  } = useQuery({
    queryKey: ['detailedStats', range.from, range.to],
    queryFn: () => fetchDetailedStats({ from: range.from, to: range.to }),
  });

  // Fetch customer stats
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customerStats'],
    queryFn: fetchCustomerStats,
    enabled: activeTab === 'customers',
  });

  // Fetch product stats
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['productStats', range.from, range.to],
    queryFn: () => fetchProductStats(rangeSpanDays),
    enabled: activeTab === 'products',
  });

  // Fetch sales trend (backend buckets + zero-fills)
  const { data: trendData } = useQuery({
    queryKey: ['salesTrend', range.from, range.to, trendInterval],
    queryFn: () =>
      fetchSalesTrend({ from: range.from, to: range.to, interval: trendInterval }),
    enabled: activeTab === 'overview',
  });

  const stats: DetailedStats | null = statsData?.data || null;
  const customerStats: CustomerStats | null = customerData?.data || null;
  const productStats: ProductStats | null = productData?.data || null;
  const salesTrend: SalesTrendItem[] = trendData?.data || [];

  const chartData = React.useMemo(() => {
    if (!salesTrend || salesTrend.length === 0) return [];
    return salesTrend.map((item, idx) => {
      const d = new Date(item.date + 'T12:00:00');
      const label =
        trendInterval === 'day'
          ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          : trendInterval === 'week'
            ? `w/c ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
            : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { id: `t-${idx}`, label, sales: item.sales };
    });
  }, [salesTrend, trendInterval]);

  const isLoading =
    statsLoading ||
    (activeTab === 'customers' && customerLoading) ||
    (activeTab === 'products' && productLoading);
  const isRefetching = statsRefetching;

  if (isLoading && !stats) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.muted }}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Statistics
        </Text>
      </View>

      {/* Date Range Selector */}
      <View className="py-2">
        <DatePresetSelector value={range} onChange={setRange} />
      </View>

      {/* Tab Selector */}
      <View className="flex-row border-b px-4" style={{ borderColor: colors.border }}>
        {[
          { key: 'overview', label: 'Overview', icon: 'bar-chart' },
          { key: 'customers', label: 'Customers', icon: 'people' },
          { key: 'products', label: 'Products', icon: 'cube' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className="mr-4 flex-row items-center pb-3 pt-2"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.key ? colors.primary : 'transparent',
            }}>
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? colors.primary : colors.muted}
            />
            <Text
              className="ml-1.5 text-sm font-medium"
              style={{ color: activeTab === tab.key ? colors.primary : colors.muted }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchStats}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <View className="px-4 py-4">
            {/* Summary Cards */}
            <View className="mb-4 flex-row gap-3">
              <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.primary }}>
                <Text className="text-2xl font-bold text-white">
                  {formatPrice(stats.summary.totalSales)}
                </Text>
                <Text className="text-sm text-white/80">Total Sales</Text>
              </View>
              <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: colors.success }}>
                <Text className="text-2xl font-bold text-white">
                  {formatPrice(stats.summary.totalCollected)}
                </Text>
                <Text className="text-sm text-white/80">Collected</Text>
              </View>
            </View>

            {/* Gross Profit + Cost */}
            <View className="mb-4 flex-row gap-3">
              <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: '#8b5cf6' }}>
                <Text className="text-2xl font-bold text-white">
                  {formatPrice(stats.summary.grossProfit || 0)}
                </Text>
                <Text className="text-sm text-white/80">
                  Gross Profit ({stats.summary.grossMargin ?? 0}%)
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-xl font-bold" style={{ color: colors.error }}>
                  {formatPrice(stats.summary.totalCost || 0)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Cost of Goods
                </Text>
              </View>
            </View>

            {/* Net Profit + Expenses */}
            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor:
                    (stats.summary.netProfit ?? 0) >= 0 ? '#059669' : colors.error,
                }}>
                <Text className="text-2xl font-bold text-white">
                  {formatPrice(stats.summary.netProfit || 0)}
                </Text>
                <Text className="text-sm text-white/80">
                  Net Profit ({stats.summary.netMargin ?? 0}%)
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <Text className="text-xl font-bold" style={{ color: colors.error }}>
                  {formatPrice(stats.summary.totalExpenses || 0)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Expenses
                </Text>
              </View>
            </View>

            {/* Returns value */}
            {(stats.summary.returnsValue ?? 0) > 0 && (
              <View className="mb-4 rounded-xl p-3" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <View className="flex-row justify-between">
                  <Text className="text-sm" style={{ color: colors.muted }}>Returns / Refunds in range</Text>
                  <Text className="font-semibold" style={{ color: colors.error }}>
                    -{formatPrice(stats.summary.returnsValue || 0)}
                  </Text>
                </View>
                <View className="mt-1 flex-row justify-between">
                  <Text className="text-sm" style={{ color: colors.muted }}>Net revenue</Text>
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    {formatPrice(stats.summary.netRevenue || 0)}
                  </Text>
                </View>
              </View>
            )}

            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  {stats.summary.totalOrders}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Orders
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.error }}>
                  {formatPrice(stats.summary.totalOutstanding)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Outstanding
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                  {formatPrice(stats.summary.avgOrderValue)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Avg Order
                </Text>
              </View>
            </View>

            {/* Daily Trend Mini Chart */}
            {chartData.length > 0 && (
              <View
                className="mb-4 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold uppercase" style={{ color: colors.muted }}>
                  SALES TREND
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row items-end justify-between" style={{ height: 80, minWidth: '100%' }}>
                    {chartData.map((item) => {
                      const maxSales = Math.max(...chartData.map((d) => d.sales), 1);
                      const height = (item.sales / maxSales) * 60 + 10;
                      return (
                        <View key={item.id} className="items-center px-2" style={{ minWidth: 40, flex: 1 }}>
                          <View
                            className="w-6 rounded-t"
                            style={{ height, backgroundColor: colors.primary }}
                          />
                          <Text className="mt-1 text-xs" style={{ color: colors.muted }} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Order Status Breakdown */}
            <View
              className="mb-4 rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                ORDER STATUS
              </Text>
              <View className="gap-2">
                {[
                  { key: 'pending', label: 'Pending', color: '#f59e0b' },
                  { key: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
                  { key: 'collected', label: 'Collected', color: '#8b5cf6' },
                  { key: 'delivered', label: 'Delivered', color: '#10b981' },
                  { key: 'completed', label: 'Completed', color: '#059669' },
                  { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
                ].map((status) => {
                  const count = stats.ordersByStatus[status.key] || 0;
                  const total = stats.summary.totalOrders + (stats.ordersByStatus.cancelled || 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <View key={status.key} className="flex-row items-center">
                      <View className="w-20">
                        <Text className="text-sm" style={{ color: colors.text }}>
                          {status.label}
                        </Text>
                      </View>
                      <View
                        className="mx-3 h-2 flex-1 overflow-hidden rounded-full"
                        style={{ backgroundColor: colors.border }}>
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: status.color }}
                        />
                      </View>
                      <Text
                        className="w-8 text-right text-sm font-medium"
                        style={{ color: colors.text }}>
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Payment Status */}
            <View
              className="mb-4 rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                PAYMENT STATUS
              </Text>
              <View className="flex-row gap-3">
                {[
                  { key: 'paid', label: 'Paid', color: colors.success },
                  { key: 'partial', label: 'Partial', color: '#f59e0b' },
                  { key: 'unpaid', label: 'Unpaid', color: colors.error },
                ].map((status) => (
                  <View
                    key={status.key}
                    className="flex-1 items-center rounded-lg p-3"
                    style={{ backgroundColor: status.color + '15' }}>
                    <Text className="text-xl font-bold" style={{ color: status.color }}>
                      {stats.ordersByPayment[status.key] || 0}
                    </Text>
                    <Text className="text-xs" style={{ color: status.color }}>
                      {status.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Top Customers */}
            {stats.topCustomers.length > 0 && (
              <View
                className="mb-4 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  TOP CUSTOMERS
                </Text>
                {stats.topCustomers.slice(0, 5).map((customer, idx) => (
                  <View
                    key={customer.id}
                    className={`flex-row items-center py-2`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + '20' }}>
                      <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                        #{idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {customer.businessName}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {customer.orderCount} orders
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.primary }}>
                      {formatPrice(customer.totalSpent)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Top Products */}
            {stats.topProducts.length > 0 && (
              <View
                className="mb-4 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  TOP PRODUCTS
                </Text>
                {stats.topProducts.slice(0, 5).map((product, idx) => (
                  <View
                    key={product.id}
                    className={`flex-row items-center py-2`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.success + '20' }}>
                      <Text className="text-xs font-bold" style={{ color: colors.success }}>
                        #{idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {product.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {product.totalQuantity} {product.unit}
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.success }}>
                      {formatPrice(product.totalRevenue)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Van Performance */}
            {stats.vanPerformance.length > 0 && (
              <View
                className="mb-4 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  VAN PERFORMANCE
                </Text>
                {stats.vanPerformance.map((van, idx) => (
                  <View
                    key={van.vanName}
                    className={`flex-row items-center py-2`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 rounded-full p-2"
                      style={{ backgroundColor: colors.primary + '15' }}>
                      <MaterialIcons name="local-shipping" size={16} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {van.vanName}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {van.orders} orders
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: colors.text }}>
                      {formatPrice(van.sales)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Payment Methods */}
            {stats.paymentMethods.length > 0 && (
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  PAYMENT METHODS
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {stats.paymentMethods.map((pm) => (
                    <View
                      key={pm.method}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: colors.background }}>
                      <Text className="text-xs capitalize" style={{ color: colors.muted }}>
                        {pm.method?.replace('_', ' ')}
                      </Text>
                      <Text className="font-bold" style={{ color: colors.text }}>
                        {formatPrice(pm.amount)}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {pm.count} payments
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && customerStats && (
          <View className="px-4 py-4">
            {/* Customer Overview Cards */}
            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Ionicons name="people" size={24} color={colors.primary} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>
                  {customerStats.total}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Customers
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <MaterialIcons name="person-add" size={24} color={colors.success} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.success }}>
                  {customerStats.newThisMonth}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  New This Month
                </Text>
              </View>
            </View>

            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.error + '10',
                  borderWidth: 1,
                  borderColor: colors.error + '30',
                }}>
                <MaterialCommunityIcons name="account-clock" size={24} color={colors.error} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.error }}>
                  {customerStats.withBalance}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  With Balance Due
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.error + '10',
                  borderWidth: 1,
                  borderColor: colors.error + '30',
                }}>
                <MaterialCommunityIcons name="cash-clock" size={24} color={colors.error} />
                <Text className="mt-2 text-xl font-bold" style={{ color: colors.error }}>
                  {formatPrice(customerStats.totalOutstanding)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Outstanding
                </Text>
              </View>
            </View>

            {/* Top Debtors */}
            {customerStats.topDebtors.length > 0 && (
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  TOP OUTSTANDING BALANCES
                </Text>
                {customerStats.topDebtors.map((customer, idx) => (
                  <View
                    key={customer.id}
                    className={`flex-row items-center py-3 ${idx > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.error + '15' }}>
                      <Text className="text-sm font-bold" style={{ color: colors.error }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        {customer.businessName}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {customer.contactPerson} • {customer.phone}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold" style={{ color: colors.error }}>
                      {formatPrice(customer.currentBalance)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && productStats && (
          <View className="px-4 py-4">
            {/* Product Overview Cards */}
            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Ionicons name="cube" size={24} color={colors.primary} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.text }}>
                  {productStats.totalProducts}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Products
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <MaterialIcons name="trending-up" size={24} color={colors.success} />
                <Text className="mt-2 text-2xl font-bold" style={{ color: colors.success }}>
                  {productStats.uniqueProductsSold}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Products Sold
                </Text>
              </View>
            </View>

            <View className="mb-4 flex-row gap-3">
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.success + '10',
                  borderWidth: 1,
                  borderColor: colors.success + '30',
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.success }}>
                  {formatPrice(productStats.totalRevenue)}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Total Revenue
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl p-4"
                style={{
                  backgroundColor: colors.primary + '10',
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                }}>
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                  {productStats.totalQuantitySold}
                </Text>
                <Text className="text-xs" style={{ color: colors.muted }}>
                  Units Sold
                </Text>
              </View>
            </View>

            {/* Best Sellers */}
            {productStats.bestSellers.length > 0 && (
              <View
                className="mb-4 rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  BEST SELLERS
                </Text>
                {productStats.bestSellers.map((product, idx) => (
                  <View
                    key={product.id}
                    className={`flex-row items-center py-2 ${idx > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: colors.border }}>
                    <View
                      className="mr-3 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.success + '20' }}>
                      <Text className="text-xs font-bold" style={{ color: colors.success }}>
                        #{idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.text }}>
                        {product.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {product.quantity} {product.unit} • {formatPrice(product.revenue)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Slow Movers */}
            {productStats.slowMovers.length > 0 && (
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text className="mb-3 text-sm font-semibold" style={{ color: colors.muted }}>
                  NOT SOLD RECENTLY
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {productStats.slowMovers.map((product) => (
                    <View
                      key={product.id}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: colors.background }}>
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>
                        {product.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {formatPrice(product.sellingPrice)}/{product.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
