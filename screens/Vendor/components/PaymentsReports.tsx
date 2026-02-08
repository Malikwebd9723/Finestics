// screens/Vendor/components/PaymentsReports.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import {
  fetchSalesReport,
  fetchProfitLossReport,
  SalesReportData,
  ProfitLossData,
} from 'api/actions/paymentActions';
import { formatPrice, formatShortDate } from 'types/order.types';

type ReportType = 'sales' | 'pnl';
type GroupBy = 'day' | 'week' | 'month';

interface Props {
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export default function PaymentsReportsTab({ startDate, endDate, isActive }: Props) {
  const { colors } = useThemeContext();
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['payments', 'reports', 'sales', startDate, endDate, groupBy],
    queryFn: () => fetchSalesReport({ startDate, endDate, includeExpenses: true, groupBy }),
    enabled: isActive && reportType === 'sales',
  });

  const { data: pnlData, isLoading: pnlLoading } = useQuery({
    queryKey: ['payments', 'reports', 'pnl', startDate, endDate],
    queryFn: () => fetchProfitLossReport({ startDate, endDate, compareWithPrevious: true }),
    enabled: isActive && reportType === 'pnl',
  });

  const salesReport: SalesReportData | null = salesData?.data || null;
  const pnlReport: ProfitLossData | null = pnlData?.data || null;
  const isLoading = reportType === 'sales' ? salesLoading : pnlLoading;

  const pnlCurrent = pnlReport?.current || pnlReport;
  const pnlPrevious = pnlReport?.previous;
  const pnlComparison = pnlReport?.comparison;

  if (isLoading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 px-4 pt-4">
      {/* Report type toggle - compact pill */}
      <View
        className="mb-4 flex-row overflow-hidden rounded-full"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        {([
          { key: 'sales' as const, label: 'Sales Report' },
          { key: 'pnl' as const, label: 'Profit & Loss' },
        ]).map((opt) => {
          const active = reportType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setReportType(opt.key)}
              className="flex-1 items-center justify-center py-2"
              style={{ backgroundColor: active ? colors.primary : 'transparent' }}>
              <Text
                className="text-xs font-semibold"
                style={{ color: active ? '#fff' : colors.muted }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ---- SALES REPORT ---- */}
      {reportType === 'sales' && (
        <>
          {/* GroupBy chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            className="mb-3">
            <View className="flex-row gap-1.5">
              {GROUP_OPTIONS.map((opt) => {
                const active = groupBy === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setGroupBy(opt.key)}
                    className="items-center justify-center rounded-full px-3.5"
                    style={{
                      height: 28,
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

          {salesReport ? (
            <>
              {/* Hero cards */}
              <View className="mb-3 flex-row gap-3">
                <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-2xl font-bold text-white">
                    {formatPrice(salesReport.summary.totalSales)}
                  </Text>
                  <Text className="mt-1 text-xs text-white/70">Total Sales</Text>
                </View>
                <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: colors.success }}>
                  <Text className="text-2xl font-bold text-white">
                    {formatPrice(salesReport.summary.grossProfit)}
                  </Text>
                  <Text className="mt-1 text-xs text-white/70">Gross Profit</Text>
                </View>
              </View>

              {/* Secondary stats */}
              <View className="mb-4 flex-row gap-2">
                <View
                  className="flex-1 items-center rounded-xl py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    {salesReport.summary.orderCount}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>Orders</Text>
                </View>
                <View
                  className="flex-1 items-center rounded-xl py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    {salesReport.summary.grossMargin}%
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>Margin</Text>
                </View>
                <View
                  className="flex-1 items-center rounded-xl py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="text-base font-bold" style={{ color: colors.success }}>
                    {formatPrice(salesReport.summary.totalCollected)}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.muted }}>Collected</Text>
                </View>
              </View>

              {/* Net Profit */}
              {salesReport.summary.netProfit !== undefined && (
                <View
                  className="mb-4 flex-row items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      Net Profit
                    </Text>
                    <Text
                      className="text-lg font-bold"
                      style={{
                        color: salesReport.summary.netProfit >= 0 ? colors.success : colors.error,
                      }}>
                      {formatPrice(salesReport.summary.netProfit)}
                    </Text>
                  </View>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{
                      backgroundColor:
                        (salesReport.summary.netMargin || 0) >= 0
                          ? colors.success + '15'
                          : colors.error + '15',
                    }}>
                    <Text
                      className="text-sm font-bold"
                      style={{
                        color:
                          (salesReport.summary.netMargin || 0) >= 0 ? colors.success : colors.error,
                      }}>
                      {salesReport.summary.netMargin}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Period Breakdown */}
              {salesReport.data.map((item, idx) => (
                <View
                  key={idx}
                  className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View>
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {formatShortDate(item.period)}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      {item.orderCount} orders
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold" style={{ color: colors.text }}>
                      {formatPrice(item.totalSales)}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.success }}>
                      {formatPrice(item.totalCollected)} collected
                    </Text>
                  </View>
                </View>
              ))}

              {/* Expenses */}
              {salesReport.expenses && (
                <View
                  className="mt-2 rounded-xl p-4"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>
                      Expenses
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: colors.error }}>
                      {formatPrice(salesReport.expenses.total)}
                    </Text>
                  </View>
                  {salesReport.expenses.byCategory.map((cat, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-center justify-between py-1.5"
                      style={idx > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                      <View className="flex-row items-center">
                        <View
                          className="mr-2 h-2 w-2 rounded-full"
                          style={{ backgroundColor: colors.error }}
                        />
                        <Text className="text-xs capitalize" style={{ color: colors.text }}>
                          {cat.category}
                        </Text>
                      </View>
                      <Text className="text-xs font-bold" style={{ color: colors.error }}>
                        {formatPrice(cat.totalAmount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="items-center py-12">
              <MaterialCommunityIcons name="file-chart" size={40} color={colors.muted} />
              <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
                No sales data available
              </Text>
            </View>
          )}
        </>
      )}

      {/* ---- PROFIT & LOSS ---- */}
      {reportType === 'pnl' && (
        <>
          {pnlCurrent ? (
            <>
              {/* P&L line items */}
              <View
                className="mb-4 rounded-xl p-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                {/* Revenue */}
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.text }}>Revenue</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>
                      {formatPrice(pnlCurrent.revenue?.total || 0)}
                    </Text>
                    <ChangeChip value={pnlComparison?.revenueChange} colors={colors} />
                  </View>
                </View>

                {/* COGS */}
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.muted }}>Cost of Goods</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.error }}>
                    -{formatPrice(pnlCurrent.cogs || 0)}
                  </Text>
                </View>

                {/* Gross Profit */}
                <View
                  className="mb-2 flex-row items-center justify-between border-t pt-2"
                  style={{ borderColor: colors.border }}>
                  <View>
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      Gross Profit
                    </Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      {pnlCurrent.grossMargin || 0}% margin
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-sm font-bold"
                      style={{
                        color: (pnlCurrent.grossProfit || 0) >= 0 ? colors.success : colors.error,
                      }}>
                      {formatPrice(pnlCurrent.grossProfit || 0)}
                    </Text>
                    <ChangeChip value={pnlComparison?.grossProfitChange} colors={colors} />
                  </View>
                </View>

                {/* Expenses */}
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.muted }}>Expenses</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-medium" style={{ color: colors.error }}>
                      -{formatPrice(pnlCurrent.expenses?.total || 0)}
                    </Text>
                    <ChangeChip value={pnlComparison?.expenseChange} colors={colors} />
                  </View>
                </View>

                {/* Net Profit */}
                <View
                  className="flex-row items-center justify-between border-t pt-2"
                  style={{ borderColor: colors.border }}>
                  <View>
                    <Text className="text-base font-bold" style={{ color: colors.text }}>
                      Net Profit
                    </Text>
                    <Text className="text-xs" style={{ color: colors.muted }}>
                      {pnlCurrent.netMargin || 0}% margin
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-xl font-bold"
                      style={{
                        color: (pnlCurrent.netProfit || 0) >= 0 ? colors.success : colors.error,
                      }}>
                      {formatPrice(pnlCurrent.netProfit || 0)}
                    </Text>
                    <ChangeChip value={pnlComparison?.netProfitChange} colors={colors} />
                  </View>
                </View>
              </View>

              {/* Expense Breakdown */}
              {pnlCurrent.expenses && Object.keys(pnlCurrent.expenses.byCategory).length > 0 && (
                <View
                  className="mb-4 rounded-xl p-4"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="mb-2 text-sm font-medium" style={{ color: colors.text }}>
                    Expense Breakdown
                  </Text>
                  {Object.entries(pnlCurrent.expenses.byCategory).map(([category, amount], idx) => {
                    const total = pnlCurrent.expenses?.total || 1;
                    const pct = Math.round(((amount as number) / total) * 100);
                    return (
                      <View
                        key={category}
                        className="py-1.5"
                        style={idx > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs capitalize" style={{ color: colors.text }}>
                            {category}
                          </Text>
                          <Text className="text-xs font-bold" style={{ color: colors.error }}>
                            {formatPrice(amount as number)}
                          </Text>
                        </View>
                        <View
                          className="mt-1 h-1 overflow-hidden rounded-full"
                          style={{ backgroundColor: colors.border }}>
                          <View
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: colors.error }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Previous Period Comparison */}
              {pnlPrevious && (
                <View
                  className="rounded-xl p-4"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <Text className="mb-2 text-sm font-medium" style={{ color: colors.text }}>
                    vs Previous Period
                  </Text>
                  {[
                    { label: 'Revenue', current: pnlCurrent.revenue?.total || 0, previous: pnlPrevious.revenue?.total || 0, change: pnlComparison?.revenueChange },
                    { label: 'Gross Profit', current: pnlCurrent.grossProfit || 0, previous: pnlPrevious.grossProfit || 0, change: pnlComparison?.grossProfitChange },
                    { label: 'Expenses', current: pnlCurrent.expenses?.total || 0, previous: pnlPrevious.expenses?.total || 0, change: pnlComparison?.expenseChange },
                    { label: 'Net Profit', current: pnlCurrent.netProfit || 0, previous: pnlPrevious.netProfit || 0, change: pnlComparison?.netProfitChange },
                  ].map((row, idx) => (
                    <View
                      key={row.label}
                      className="flex-row items-center justify-between py-2"
                      style={idx > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                      <Text className="text-xs" style={{ color: colors.text }}>{row.label}</Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs" style={{ color: colors.muted }}>
                          {formatPrice(row.previous)}
                        </Text>
                        <Ionicons name="arrow-forward" size={10} color={colors.muted} />
                        <Text className="text-xs font-bold" style={{ color: colors.text }}>
                          {formatPrice(row.current)}
                        </Text>
                        <ChangeChip value={row.change} colors={colors} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="items-center py-12">
              <MaterialCommunityIcons name="file-chart" size={40} color={colors.muted} />
              <Text className="mt-3 text-sm" style={{ color: colors.muted }}>
                No P&L data available
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function ChangeChip({ value, colors }: { value: number | undefined; colors: any }) {
  if (value === undefined || value === null) return null;
  const isPositive = value >= 0;
  return (
    <View className="flex-row items-center">
      <Ionicons
        name={isPositive ? 'arrow-up' : 'arrow-down'}
        size={10}
        color={isPositive ? colors.success : colors.error}
      />
      <Text
        className="text-xs font-medium"
        style={{ color: isPositive ? colors.success : colors.error }}>
        {Math.abs(value)}%
      </Text>
    </View>
  );
}
