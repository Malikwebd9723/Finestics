// screens/Vendor/ExpensesScreen.tsx
import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'utils/Toast';
import Dialog from 'utils/Dialog';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkDeleteExpenses } from 'api/actions/expensesActions';
import SearchBar from 'components/SearchBar';
import ExpensesList from './components/ExpensesList';
import ExpenseFormModal from './components/ExpenseFormModal';

export default function ExpensesScreen() {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Modal states
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (expenseIds: number[]) => bulkDeleteExpenses({ expenseIds }),
    onSuccess: (response) => {
      if (!response.success) {
        Toast.error(response.error?.message || 'Failed to delete');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Toast.success(response.message || 'Expenses deleted');
      exitSelectionMode();
    },
    onError: (error: any) => {
      Dialog.alert('Error', error?.message || 'Failed to delete expenses');
    },
  });

  // Handlers
  const handleViewExpense = (expenseId: number) => {
    if (isSelectionMode) {
      toggleExpenseSelection(expenseId);
    } else {
      setSelectedExpenseId(expenseId);
      setFormModalVisible(true);
    }
  };

  const handleLongPressExpense = (expenseId: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedExpenses(new Set([expenseId]));
    }
  };

  const toggleExpenseSelection = (expenseId: number) => {
    setSelectedExpenses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  };

  const handleSelectAll = (expenseIds: number[]) => {
    if (selectedExpenses.size === expenseIds.length) {
      setSelectedExpenses(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedExpenses(new Set(expenseIds));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedExpenses(new Set());
  };

  const handleBulkDelete = () => {
    Dialog.confirm(
      'Delete Expenses',
      `Are you sure you want to delete ${selectedExpenses.size} expense(s)? This action cannot be undone.`,
      {
        confirmText: 'Delete',
        destructive: true,
        onConfirm: () => bulkDeleteMutation.mutate(Array.from(selectedExpenses)),
      }
    );
  };

  const handleAddExpense = () => {
    setSelectedExpenseId(null);
    setFormModalVisible(true);
  };

  const handleCloseModal = () => {
    setFormModalVisible(false);
    setSelectedExpenseId(null);
  };

  const handleDateRangeChange = (from: Date | null, to: Date | null) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddPress={handleAddExpense}
        placeholder="Search expenses..."
      />

      {/* Expenses List */}
      <ExpensesList
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onCategoryFilterChange={setCategoryFilter}
        onDateRangeChange={handleDateRangeChange}
        onViewExpense={handleViewExpense}
        onLongPressExpense={handleLongPressExpense}
        isSelectionMode={isSelectionMode}
        selectedExpenses={selectedExpenses}
        onSelectAll={handleSelectAll}
      />

      {/* Bulk Actions Bar */}
      {isSelectionMode && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-around border-t px-4 py-3"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          }}>
          {/* Selected Count */}
          <View className="flex-row items-center">
            <Text className="text-sm font-medium" style={{ color: colors.text }}>
              {selectedExpenses.size} selected
            </Text>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="flex-row items-center rounded-xl px-4 py-2"
            style={{ backgroundColor: colors.error }}>
            {bulkDeleteMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="delete" size={20} color="#fff" />
                <Text className="ml-2 font-semibold text-white">Delete</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Selection */}
          <TouchableOpacity
            onPress={exitSelectionMode}
            disabled={bulkDeleteMutation.isPending}
            className="items-center px-4 py-2">
            <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
            <Text className="mt-1 text-xs font-medium" style={{ color: colors.muted }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Modal */}
      <ExpenseFormModal
        visible={formModalVisible}
        onClose={handleCloseModal}
        expenseId={selectedExpenseId}
      />
    </View>
  );
}
