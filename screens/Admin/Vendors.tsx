// screens/Admin/Vendors.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { useRoute } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import SearchBar from 'components/SearchBar';
import VendorsList from './components/VendorsList';
import VendorFormModal from './components/VendorFormModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatInline } from 'components/ui';
import { fetchAllVendorsStats } from 'api/actions/adminActions';

type FilterType = 'all' | 'pending' | 'active' | 'suspended' | 'rejected';

export default function Vendors() {
  const { colors } = useThemeContext();
  const route = useRoute<any>();
  const initialFilter = route.params?.filter || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: summaryData } = useQuery({
    queryKey: ['vendorsSummary'],
    queryFn: fetchAllVendorsStats,
  });
  const summary = summaryData?.data;

  // Filter chip component
  const FilterChip = ({
    label,
    isActive,
    onPress,
    count,
  }: {
    label: string;
    isActive: boolean;
    onPress: () => void;
    count?: number;
  }) => (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-2xl mr-3 shadow-sm ${isActive ? '' : 'border border-gray-300'}`}
      style={{
        backgroundColor: isActive ? colors.primary : colors.card,
        elevation: isActive ? 4 : 0,
      }}>
      <View className="flex-row items-center">
        <Text className="text-sm font-bold" style={{ color: isActive ? colors.white : colors.text }}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View
            className="ml-2 h-5 min-w-5 items-center justify-center rounded-full px-1"
            style={{ backgroundColor: isActive ? colors.white + '4D' : colors.primary + '20' }}>
            <Text
              className="text-xs font-bold"
              style={{ color: isActive ? colors.white : colors.primary }}>
              {count}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search & Add Button */}
      <View className="flex-row items-center px-4 mb-2">
        <View className="flex-1">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </View>
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="ml-2 h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.primary }}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>

      {/* Filter Chips */}
      <View className="px-4 mb-4">
        <ScrollView className="flex-row" horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All"
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <FilterChip
            label="Pending"
            isActive={activeFilter === 'pending'}
            onPress={() => setActiveFilter('pending')}
          />
          <FilterChip
            label="Active"
            isActive={activeFilter === 'active'}
            onPress={() => setActiveFilter('active')}
          />
          <FilterChip
            label="Suspended"
            isActive={activeFilter === 'suspended'}
            onPress={() => setActiveFilter('suspended')}
          />
          <FilterChip
            label="Rejected"
            isActive={activeFilter === 'rejected'}
            onPress={() => setActiveFilter('rejected')}
          />
        </ScrollView>
      </View>

      {/* Summary Tiles */}
      {summary ? (
        <View className="px-4 pb-3">
          <StatInline
            items={[
              { label: 'Total', value: String(summary.total) },
              { label: 'Active', value: String(summary.active) },
              { label: 'New · month', value: String(summary.newThisMonth) },
            ]}
          />
        </View>
      ) : null}

      {/* Vendors List */}
      <VendorsList searchQuery={searchQuery} statusFilter={activeFilter} />

      {/* Add Vendor Modal */}
      <VendorFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="create"
      />
    </View>
  );
}
