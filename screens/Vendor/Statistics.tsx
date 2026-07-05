// screens/Vendor/Statistics.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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
import SegmentedDateFilter from 'components/shared/SegmentedDateFilter';
import { DateRange, defaultRange } from 'components/shared/DatePresetSelector';
import { typo, radius } from 'constants/design';
import { Section, StatCell, ListRow, BarChart, LineChart, DonutChart, RankBars } from 'components/ui';

type Tab = 'overview' | 'customers' | 'products';

const TABS: { key: Tab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'chart-box-outline' },
  { key: 'customers', label: 'Customers', icon: 'account-group-outline' },
  { key: 'products', label: 'Products', icon: 'package-variant-closed' },
];

const STATUSES: { key: string; label: string; short: string }[] = [
  { key: 'pending', label: 'Pending', short: 'Pend' },
  { key: 'confirmed', label: 'Confirmed', short: 'Conf' },
  { key: 'collected', label: 'Collected', short: 'Coll' },
  { key: 'delivered', label: 'Delivered', short: 'Deliv' },
  { key: 'completed', label: 'Completed', short: 'Comp' },
  { key: 'cancelled', label: 'Cancelled', short: 'Canc' },
];

const fmtLabel = (date: string) =>
  new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const shiftDate = (s: string, days: number) => {
  const d = new Date(s + 'T12:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};
// Equal-length window ending the day before the current range.
const previousRange = (from: string, span: number) => ({
  from: shiftDate(from, -span),
  to: shiftDate(from, -1),
});

export default function Statistics() {
  const { colors } = useThemeContext();
  const [range, setRange] = useState<DateRange>(() => defaultRange('thisMonth'));
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const cardStyle = {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  } as const;

  const rangeSpanDays = React.useMemo(() => {
    const start = new Date(range.from);
    const end = new Date(range.to);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  }, [range]);
  const trendInterval: 'day' | 'week' | 'month' =
    rangeSpanDays <= 31 ? 'day' : rangeSpanDays <= 120 ? 'week' : 'month';

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching: statsRefetching,
  } = useQuery({
    queryKey: ['detailedStats', range.from, range.to],
    queryFn: () => fetchDetailedStats({ from: range.from, to: range.to }),
  });

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customerStats'],
    queryFn: fetchCustomerStats,
    enabled: activeTab === 'customers',
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['productStats', range.from, range.to],
    queryFn: () => fetchProductStats(rangeSpanDays),
    enabled: activeTab === 'products',
  });

  const { data: trendData } = useQuery({
    queryKey: ['salesTrend', range.from, range.to, trendInterval],
    queryFn: () => fetchSalesTrend({ from: range.from, to: range.to, interval: trendInterval }),
    enabled: activeTab === 'overview',
  });

  const prev = React.useMemo(
    () => previousRange(range.from, rangeSpanDays),
    [range.from, rangeSpanDays]
  );
  const { data: prevStatsData } = useQuery({
    queryKey: ['detailedStatsPrev', prev.from, prev.to],
    queryFn: () => fetchDetailedStats({ from: prev.from, to: prev.to }),
    enabled: activeTab === 'overview',
  });

  const stats: DetailedStats | null = statsData?.data || null;
  const customerStats: CustomerStats | null = customerData?.data || null;
  const productStats: ProductStats | null = productData?.data || null;
  const salesTrend: SalesTrendItem[] = trendData?.data || [];

  const trendLabels = salesTrend.map((d) => fmtLabel(d.date));
  const salesByDay = salesTrend.map((d) => ({ label: fmtLabel(d.date), value: d.sales }));
  const salesSeries = salesTrend.map((d) => d.sales);
  const collectedSeries = salesTrend.map((d) => d.collected);
  const aovSeries = salesTrend.map((d) => (d.orders > 0 ? Math.round(d.sales / d.orders) : 0));

  const prevSummary = prevStatsData?.data?.summary;
  const salesPeriodDelta =
    (prevSummary?.totalSales ?? 0) > 0
      ? {
          pct:
            (((stats?.summary.totalSales ?? 0) - prevSummary!.totalSales) /
              prevSummary!.totalSales) *
            100,
        }
      : null;
  const netPeriodDelta =
    (prevSummary?.netProfit ?? 0) > 0
      ? {
          pct:
            (((stats?.summary.netProfit ?? 0) - prevSummary!.netProfit) / prevSummary!.netProfit) *
            100,
        }
      : null;

  const isLoading =
    (activeTab === 'overview' && statsLoading && !stats) ||
    (activeTab === 'customers' && customerLoading && !customerStats) ||
    (activeTab === 'products' && productLoading && !productStats);

  // --- small local pieces ---
  const Divider = () => <View className="my-1 h-px" style={{ backgroundColor: colors.border }} />;

  const Stmt = ({
    label,
    value,
    negative,
    strong,
    big,
    tone,
  }: {
    label: string;
    value: string;
    negative?: boolean;
    strong?: boolean;
    big?: boolean;
    tone?: 'default' | 'success' | 'error';
  }) => {
    const color =
      tone === 'success' ? colors.success : tone === 'error' ? colors.error : colors.text;
    const emph = strong || big;
    return (
      <View className="flex-row items-center justify-between" style={{ paddingVertical: 7 }}>
        <Text
          style={{
            color: emph ? colors.text : colors.muted,
            fontSize: emph ? 15 : 14,
            fontWeight: emph ? '700' : '500',
          }}>
          {label}
        </Text>
        <Text style={[typo.num, { color, fontSize: big ? 22 : strong ? 18 : 15 }]}>
          {negative ? '− ' : ''}
          {value}
        </Text>
      </View>
    );
  };

  const DeltaChip = ({ pct }: { pct: number }) => {
    const up = pct >= 0;
    const c = up ? colors.success : colors.error;
    return (
      <View
        className="flex-row items-center rounded-full px-2 py-1"
        style={{ backgroundColor: c + '14' }}>
        <Text style={{ color: c, fontSize: 12, fontVariant: ['tabular-nums'] }}>
          {up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Date range */}
      <View className="pt-3">
        <SegmentedDateFilter value={range} onChange={setRange} />
      </View>

      {/* Tabs — equal-width, centered */}
      <View className="mt-3 flex-row border-b" style={{ borderColor: colors.border }}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              className="flex-1 flex-row items-center justify-center pb-3 pt-1"
              style={{ borderBottomWidth: 2, borderBottomColor: active ? colors.primary : 'transparent' }}>
              <MaterialCommunityIcons
                name={t.icon}
                size={16}
                color={active ? colors.primary : colors.muted}
              />
              <Text
                className="ml-1.5 text-sm font-semibold"
                style={{ color: active ? colors.text : colors.muted }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.muted }}>
            Loading statistics…
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={statsRefetching}
              onRefresh={refetchStats}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          {/* ==================== OVERVIEW ==================== */}
          {activeTab === 'overview' && stats && (
            <>
              <Section first title="Sales">
                <View className="p-4" style={cardStyle}>
                  <View className="mb-3 flex-row items-end justify-between">
                    <Text style={[typo.stat, { color: colors.text, fontSize: 22 }]}>
                      {formatPrice(stats.summary.totalSales)}
                    </Text>
                    {salesPeriodDelta ? <DeltaChip pct={salesPeriodDelta.pct} /> : null}
                  </View>
                  <BarChart data={salesByDay} showValues={false} labelMode="sparse" />
                  {salesPeriodDelta ? (
                    <Text className="mt-2 text-xs" style={{ color: colors.muted }}>
                      vs previous period
                    </Text>
                  ) : null}
                </View>
              </Section>

              <Section title="Collection trend">
                <View className="p-4" style={cardStyle}>
                  <LineChart
                    series={[
                      { label: 'Sales', data: salesSeries, color: colors.primary },
                      { label: 'Collected', data: collectedSeries, color: colors.success },
                    ]}
                    labels={trendLabels}
                  />
                </View>
              </Section>

              <Section title="Avg order value">
                <View className="p-4" style={cardStyle}>
                  <LineChart
                    series={[{ label: 'AOV', data: aovSeries, color: colors.primary }]}
                    labels={trendLabels}
                    showLegend={false}
                  />
                </View>
              </Section>

              <Section title="Profit & loss">
                <View className="p-4" style={cardStyle}>
                  <Stmt label="Sales" value={formatPrice(stats.summary.totalSales)} />
                  <Stmt
                    label="Cost of goods"
                    value={formatPrice(stats.summary.totalCost || 0)}
                    negative
                    tone="error"
                  />
                  <Divider />
                  <Stmt
                    label={`Gross profit · ${stats.summary.grossMargin ?? 0}%`}
                    value={formatPrice(stats.summary.grossProfit || 0)}
                    strong
                  />
                  <Stmt
                    label="Expenses"
                    value={formatPrice(stats.summary.totalExpenses || 0)}
                    negative
                    tone="error"
                  />
                  {(stats.summary.returnsValue ?? 0) > 0 && (
                    <Stmt
                      label="Returns / refunds"
                      value={formatPrice(stats.summary.returnsValue || 0)}
                      negative
                      tone="error"
                    />
                  )}
                  <Divider />
                  <Stmt
                    label={`Net profit · ${stats.summary.netMargin ?? 0}%`}
                    value={formatPrice(stats.summary.netProfit || 0)}
                    big
                    tone={(stats.summary.netProfit ?? 0) >= 0 ? 'success' : 'error'}
                  />
                  {netPeriodDelta ? (
                    <Text
                      className="mt-1 text-right text-xs"
                      style={{
                        color: netPeriodDelta.pct >= 0 ? colors.success : colors.error,
                        fontWeight: '600',
                      }}>
                      {netPeriodDelta.pct >= 0 ? '▲' : '▼'} {Math.abs(netPeriodDelta.pct).toFixed(0)}%
                      vs previous period
                    </Text>
                  ) : null}
                </View>
              </Section>

              <Section title="Orders">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <StatCell boxed icon="receipt" label="Orders" value={String(stats.summary.totalOrders)} />
                  </View>
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="chart-line"
                      label="Avg order"
                      value={formatPrice(stats.summary.avgOrderValue || 0)}
                    />
                  </View>
                </View>
              </Section>

              <Section title="Order status">
                <View className="p-4" style={cardStyle}>
                  <BarChart
                    data={STATUSES.map((s) => ({
                      label: s.short,
                      value: stats.ordersByStatus[s.key] || 0,
                    }))}
                  />
                </View>
              </Section>

              <Section title="Payments">
                <View className="flex-row items-center p-4" style={cardStyle}>
                  <DonutChart
                    size={132}
                    segments={[
                      { label: 'Paid', value: stats.ordersByPayment.paid || 0, color: colors.success },
                      { label: 'Partial', value: stats.ordersByPayment.partial || 0, color: colors.muted },
                      { label: 'Unpaid', value: stats.ordersByPayment.unpaid || 0, color: colors.error },
                    ]}
                    centerTop={String(
                      (stats.ordersByPayment.paid || 0) +
                        (stats.ordersByPayment.partial || 0) +
                        (stats.ordersByPayment.unpaid || 0)
                    )}
                    centerBottom="orders"
                  />
                  <View className="ml-5 flex-1">
                    {[
                      { label: 'Paid', value: stats.ordersByPayment.paid || 0, color: colors.success },
                      { label: 'Partial', value: stats.ordersByPayment.partial || 0, color: colors.muted },
                      { label: 'Unpaid', value: stats.ordersByPayment.unpaid || 0, color: colors.error },
                    ].map((seg) => (
                      <View
                        key={seg.label}
                        className="flex-row items-center"
                        style={{ paddingVertical: 5 }}>
                        <View
                          className="mr-2 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: seg.color }}
                        />
                        <Text className="flex-1 text-sm" style={{ color: colors.text }}>
                          {seg.label}
                        </Text>
                        <Text style={[typo.num, { color: colors.text, fontSize: 15 }]}>
                          {seg.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Section>

              {stats.topCustomers.length > 0 && (
                <Section title="Top customers">
                  <View className="px-4" style={cardStyle}>
                    {stats.topCustomers.slice(0, 5).map((c, i) => (
                      <ListRow
                        key={c.id}
                        leading={String(i + 1)}
                        title={c.businessName}
                        subtitle={`${c.orderCount} orders`}
                        amount={formatPrice(c.totalSpent)}
                        divider={i > 0}
                      />
                    ))}
                  </View>
                </Section>
              )}

              {stats.topProducts.length > 0 && (
                <Section title="Top products by revenue">
                  <View className="p-4" style={cardStyle}>
                    <RankBars
                      items={stats.topProducts.slice(0, 5).map((p) => ({
                        id: p.id,
                        label: p.name,
                        value: p.totalRevenue,
                      }))}
                      formatValue={formatPrice}
                    />
                  </View>
                </Section>
              )}

              {stats.vanPerformance.length > 0 && (
                <Section title="Vans">
                  <View className="px-4" style={cardStyle}>
                    {stats.vanPerformance.map((v, i) => (
                      <ListRow
                        key={v.vanName}
                        icon="truck-outline"
                        title={v.vanName}
                        subtitle={`${v.orders} orders`}
                        amount={formatPrice(v.sales)}
                        divider={i > 0}
                      />
                    ))}
                  </View>
                </Section>
              )}

              {stats.paymentMethods.length > 0 && (
                <Section title="Payment methods">
                  <View className="px-4" style={cardStyle}>
                    {stats.paymentMethods.map((pm, i) => (
                      <ListRow
                        key={pm.method}
                        icon="cash"
                        title={(pm.method || '').replace('_', ' ')}
                        subtitle={`${pm.count} payments`}
                        amount={formatPrice(pm.amount)}
                        divider={i > 0}
                      />
                    ))}
                  </View>
                </Section>
              )}
            </>
          )}

          {/* ==================== CUSTOMERS ==================== */}
          {activeTab === 'customers' && customerStats && (
            <>
              <Section first title="Customers">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="account-group"
                      label="Total"
                      value={String(customerStats.total)}
                    />
                  </View>
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="account-plus"
                      label="New this month"
                      value={String(customerStats.newThisMonth)}
                      tone="success"
                    />
                  </View>
                </View>
                <View className="mt-3 flex-row gap-3">
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="account-alert"
                      label="With balance"
                      value={String(customerStats.withBalance)}
                      tone="error"
                    />
                  </View>
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="cash-clock"
                      label="Outstanding"
                      value={formatPrice(customerStats.totalOutstanding || 0)}
                      tone="error"
                    />
                  </View>
                </View>
              </Section>

              {customerStats.topDebtors.length > 0 && (
                <Section title="Top outstanding balances">
                  <View className="px-4" style={cardStyle}>
                    {customerStats.topDebtors.map((c, i) => (
                      <ListRow
                        key={c.id}
                        leading={String(i + 1)}
                        title={c.businessName}
                        subtitle={`${c.contactPerson} · ${c.phone}`}
                        amount={formatPrice(Number(c.currentBalance) || 0)}
                        amountTone="error"
                        divider={i > 0}
                      />
                    ))}
                  </View>
                </Section>
              )}
            </>
          )}

          {/* ==================== PRODUCTS ==================== */}
          {activeTab === 'products' && productStats && (
            <>
              <Section first title="Products">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="package-variant"
                      label="Total products"
                      value={String(productStats.totalProducts)}
                    />
                  </View>
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="trending-up"
                      label="Products sold"
                      value={String(productStats.uniqueProductsSold)}
                      tone="success"
                    />
                  </View>
                </View>
                <View className="mt-3 flex-row gap-3">
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="cash"
                      label="Revenue"
                      value={formatPrice(productStats.totalRevenue || 0)}
                      tone="success"
                    />
                  </View>
                  <View className="flex-1">
                    <StatCell
                      boxed
                      icon="counter"
                      label="Units sold"
                      value={String(productStats.totalQuantitySold)}
                    />
                  </View>
                </View>
              </Section>

              {productStats.bestSellers.length > 0 && (
                <Section title="Best sellers by revenue">
                  <View className="p-4" style={cardStyle}>
                    <RankBars
                      items={productStats.bestSellers.slice(0, 6).map((p) => ({
                        id: p.id,
                        label: p.name,
                        value: p.revenue,
                      }))}
                      formatValue={formatPrice}
                    />
                  </View>
                </Section>
              )}

              {productStats.slowMovers.length > 0 && (
                <Section title="Not sold recently">
                  <View className="px-4" style={cardStyle}>
                    {productStats.slowMovers.map((p, i) => (
                      <ListRow
                        key={p.id}
                        icon="package-variant-closed"
                        title={p.name}
                        subtitle={`${formatPrice(p.sellingPrice)} / ${p.unit}`}
                        divider={i > 0}
                      />
                    ))}
                  </View>
                </Section>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
