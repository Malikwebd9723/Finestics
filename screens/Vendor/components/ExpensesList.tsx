// screens/Vendor/components/ExpensesList.tsx
import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllExpenses, fetchExpenseSummary } from 'api/actions/expensesActions';
import {
  Expense,
  ExpensesApiResponse,
  ExpenseSummaryResponse,
  EXPENSE_CATEGORIES,
  formatPrice,
  formatDate,
  getCategoryIcon,
  getCategoryColor,
  getCategoryLabel,
} from 'types/expense.types';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ExpensesListProps {
  searchQuery: string;
  categoryFilter: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  onCategoryFilterChange: (category: string | null) => void;
  onDateRangeChange: (from: Date | null, to: Date | null) => void;
  onViewExpense: (expenseId: number) => void;
  onLongPressExpense: (expenseId: number) => void;
  isSelectionMode: boolean;
  selectedExpenses: Set<number>;
  onSelectAll: (expenseIds: number[]) => void;
}

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'ASC' | 'DESC';

export default function ExpensesList({
  searchQuery,
  categoryFilter,
  dateFrom,
  dateTo,
  onCategoryFilterChange,
  onDateRangeChange,
  onViewExpense,
  onLongPressExpense,
  isSelectionMode,
  selectedExpenses,
  onSelectAll,
}: ExpensesListProps) {
  const { colors } = useThemeContext();
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<'category' | 'dateRange' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Format dates for API
  const dateFromStr = dateFrom?.toISOString().split('T')[0];
  const dateToStr = dateTo?.toISOString().split('T')[0];

  // Fetch expenses
  const { data, isLoading, error, refetch, isRefetching } = useQuery<ExpensesApiResponse>({
    queryKey: [
      'expenses',
      {
        category: categoryFilter,
        startDate: dateFromStr,
        endDate: dateToStr,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      fetchAllExpenses({
        category: categoryFilter || undefined,
        startDate: dateFromStr,
        endDate: dateToStr,
        sortBy,
        sortOrder,
        limit: 100,
      }),
  });

  // Fetch summary
  const { data: summaryData } = useQuery<ExpenseSummaryResponse>({
    queryKey: ['expenses', 'summary', { startDate: dateFromStr, endDate: dateToStr }],
    queryFn: () => fetchExpenseSummary(dateFromStr, dateToStr),
  });

  // Client-side search filtering
  const filteredExpenses = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;

    const query = searchQuery.toLowerCase().trim();
    return data.data.filter((expense) => {
      const categoryMatch = expense.category?.toLowerCase().includes(query);
      const descriptionMatch = expense.description?.toLowerCase().includes(query);
      const notesMatch = expense.notes?.toLowerCase().includes(query);
      const amountMatch = expense.amount?.toString().includes(query);
      return categoryMatch || descriptionMatch || notesMatch || amountMatch;
    });
  }, [data, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const expenses = filteredExpenses;
    const total = expenses.reduce((sum, e) => sum + parseFloat(String(e.amount || 0)), 0);
    return {
      count: expenses.length,
      total,
    };
  }, [filteredExpenses]);

  // Filter menu handlers
  const openFilterMenu = (type: 'category' | 'dateRange') => {
    setActiveFilterType(type);
    setFilterMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeFilterMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setFilterMenuVisible(false);
      setActiveFilterType(null);
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      if (showDatePicker === 'from') {
        onDateRangeChange(date, dateTo);
      } else {
        onDateRangeChange(dateFrom, date);
      }
    }
    setShowDatePicker(null);
  };

  const clearDateRange = () => {
    onDateRangeChange(null, null);
    closeFilterMenu();
  };

  // Render expense card
  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const isSelected = selectedExpenses.has(item.id);
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        onPress={() => onViewExpense(item.id)}
        onLongPress={() => onLongPressExpense(item.id)}
        className="mx-4 mb-3 overflow-hidden rounded-xl"
        style={{
          backgroundColor: colors.card,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        }}
        activeOpacity={0.7}>
        <View className="flex-row items-center p-4">
          {/* Selection checkbox */}
          {isSelectionMode && (
            <View
              className="mr-3 h-6 w-6 items-center justify-center rounded-full"
              style={{
                backgroundColor: isSelected ? colors.primary : 'transparent',
                borderWidth: isSelected ? 0 : 2,
                borderColor: colors.border,
              }}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          )}

          {/* Category Icon */}
          <View
            className="mr-3 h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: categoryColor + '20' }}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.category) as any}
              size={24}
              color={categoryColor}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {getCategoryLabel(item.category)}
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.error }}>
                -{formatPrice(item.amount)}
              </Text>
            </View>
            {item.description && (
              <Text
                className="mt-0.5 text-sm"
                style={{ color: colors.muted }}
                numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <Text className="mt-1 text-xs" style={{ color: colors.muted }}>
              {formatDate(item.date)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filter chip
  const renderFilterChip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    onClear?: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      className="mr-2 flex-row items-center rounded-full px-3 py-2"
      style={{
        backgroundColor: isActive ? colors.primary : colors.card,
        borderWidth: 1,
        borderColor: isActive ? colors.primary : colors.border,
      }}>
      <Text
        className="text-sm font-medium"
        style={{ color: isActive ? '#fff' : colors.text }}>
        {label}
      </Text>
      {isActive && onClear && (
        <TouchableOpacity onPress={onClear} className="ml-1.5">
          <Ionicons name="close-circle" size={16} color="#fff" />
        </TouchableOpacity>
      )}
      {!isActive && <Ionicons name="chevron-down" size={14} color={colors.muted} className="ml-1" />}
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4" style={{ color: colors.muted }}>
          Loading expenses...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text className="mt-4 text-center text-base" style={{ color: colors.text }}>
          Failed to load expenses
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 rounded-xl px-6 py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text className="font-semibold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Summary Header */}
      <View className="mx-4 mb-3 flex-row gap-3">
        <View
          className="flex-1 rounded-xl p-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-xs" style={{ color: colors.muted }}>
            Total Expenses
          </Text>
          <Text className="text-xl font-bold" style={{ color: colors.error }}>
            {formatPrice(summaryData?.data?.grandTotal || stats.total)}
          </Text>
        </View>
        <View
          className="flex-1 rounded-xl p-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-xs" style={{ color: colors.muted }}>
            Count
          </Text>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {stats.count}
          </Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View className="mb-3 px-4">
        <View className="flex-row">
          {renderFilterChip(
            categoryFilter ? getCategoryLabel(categoryFilter) : 'Category',
            !!categoryFilter,
            () => openFilterMenu('category'),
            categoryFilter ? () => onCategoryFilterChange(null) : undefined
          )}
          {renderFilterChip(
            dateFrom || dateTo
              ? `${dateFrom ? formatDate(dateFrom.toISOString()) : 'Start'} - ${dateTo ? formatDate(dateTo.toISOString()) : 'End'}`
              : 'Date Range',
            !!(dateFrom || dateTo),
            () => openFilterMenu('dateRange'),
            dateFrom || dateTo ? clearDateRange : undefined
          )}
        </View>
      </View>

      {/* Sort Controls */}
      <View className="mb-2 flex-row items-center justify-between px-4">
        <Text className="text-sm" style={{ color: colors.muted }}>
          {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
        </Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              const fields: SortField[] = ['date', 'amount', 'category'];
              const currentIndex = fields.indexOf(sortBy);
              setSortBy(fields[(currentIndex + 1) % fields.length]);
            }}
            className="mr-2 flex-row items-center rounded-lg px-2 py-1"
            style={{ backgroundColor: colors.card }}>
            <MaterialIcons name="sort" size={16} color={colors.muted} />
            <Text className="ml-1 text-xs capitalize" style={{ color: colors.muted }}>
              {sortBy}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
            className="rounded-lg p-1"
            style={{ backgroundColor: colors.card }}>
            <MaterialIcons
              name={sortOrder === 'DESC' ? 'arrow-downward' : 'arrow-upward'}
              size={16}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View
          className="mx-4 mb-3 flex-row items-center justify-between rounded-xl p-3"
          style={{ backgroundColor: colors.primary + '15' }}>
          <Text className="font-medium" style={{ color: colors.primary }}>
            {selectedExpenses.size} selected
          </Text>
          <TouchableOpacity
            onPress={() => onSelectAll(filteredExpenses.map((e) => e.id))}
            className="rounded-lg px-3 py-1"
            style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-medium text-white">
              {selectedExpenses.size === filteredExpenses.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6 py-12">
            <MaterialCommunityIcons name="cash-remove" size={64} color={colors.muted} />
            <Text className="mt-4 text-center text-lg font-semibold" style={{ color: colors.text }}>
              No expenses found
            </Text>
            <Text className="mt-2 text-center" style={{ color: colors.muted }}>
              {searchQuery || categoryFilter || dateFrom || dateTo
                ? 'Try adjusting your filters'
                : 'Add your first expense to get started'}
            </Text>
          </View>
        }
      />

      {/* Filter Menu Modal */}
      {filterMenuVisible && (
        <Pressable
          onPress={closeFilterMenu}
          className="absolute inset-0 justify-end bg-black/50">
          <Animated.View
            style={{
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            }}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="rounded-t-3xl p-5" style={{ backgroundColor: colors.card }}>
                {/* Category Filter */}
                {activeFilterType === 'category' && (
                  <>
                    <Text className="mb-4 text-lg font-bold" style={{ color: colors.text }}>
                      Select Category
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        onPress={() => {
                          onCategoryFilterChange(null);
                          closeFilterMenu();
                        }}
                        className="rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: !categoryFilter ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor: !categoryFilter ? colors.primary : colors.border,
                        }}>
                        <Text
                          className="font-medium"
                          style={{ color: !categoryFilter ? '#fff' : colors.text }}>
                          All Categories
                        </Text>
                      </TouchableOpacity>
                      {EXPENSE_CATEGORIES.map((cat) => {
                        const isSelected = categoryFilter === cat.value;
                        const catColor = getCategoryColor(cat.value);
                        return (
                          <TouchableOpacity
                            key={cat.value}
                            onPress={() => {
                              onCategoryFilterChange(cat.value);
                              closeFilterMenu();
                            }}
                            className="flex-row items-center rounded-xl px-4 py-3"
                            style={{
                              backgroundColor: isSelected ? catColor : colors.background,
                              borderWidth: 1,
                              borderColor: isSelected ? catColor : colors.border,
                            }}>
                            <MaterialCommunityIcons
                              name={cat.icon as any}
                              size={18}
                              color={isSelected ? '#fff' : colors.text}
                            />
                            <Text
                              className="ml-2 font-medium"
                              style={{ color: isSelected ? '#fff' : colors.text }}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Date Range Filter */}
                {activeFilterType === 'dateRange' && (
                  <>
                    <Text className="mb-4 text-lg font-bold" style={{ color: colors.text }}>
                      Date Range
                    </Text>
                    <View className="gap-3">
                      <TouchableOpacity
                        onPress={() => setShowDatePicker('from')}
                        className="flex-row items-center rounded-xl p-4"
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                        <MaterialCommunityIcons name="calendar-start" size={20} color={colors.muted} />
                        <Text className="ml-3 flex-1" style={{ color: dateFrom ? colors.text : colors.muted }}>
                          {dateFrom ? formatDate(dateFrom.toISOString()) : 'Start Date'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker('to')}
                        className="flex-row items-center rounded-xl p-4"
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                        <MaterialCommunityIcons name="calendar-end" size={20} color={colors.muted} />
                        <Text className="ml-3 flex-1" style={{ color: dateTo ? colors.text : colors.muted }}>
                          {dateTo ? formatDate(dateTo.toISOString()) : 'End Date'}
                        </Text>
                      </TouchableOpacity>
                      {(dateFrom || dateTo) && (
                        <TouchableOpacity
                          onPress={clearDateRange}
                          className="items-center rounded-xl py-3"
                          style={{ backgroundColor: colors.error + '15' }}>
                          <Text className="font-medium" style={{ color: colors.error }}>
                            Clear Date Range
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}

                <View className="h-6" />
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'from' ? (dateFrom || new Date()) : (dateTo || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}
