// screens/Admin/Users.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useThemeContext } from 'context/ThemeProvider';
import { useRoute } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import SearchBar from 'components/SearchBar';
import UsersList from './components/UsersList';
import { StatInline } from 'components/ui';
import { fetchUserStats } from 'api/actions/adminActions';

type StatusFilter = 'all' | 'active' | 'suspended';
type RoleFilter = 'all' | 'admin' | 'vendor' | 'customer';

export default function Users() {
  const { colors } = useThemeContext();
  const route = useRoute<any>();
  const initialFilter = route.params?.filter || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(
    ['admin', 'vendor', 'customer'].includes(initialFilter) ? initialFilter : 'all'
  );

  const { data: summaryData } = useQuery({
    queryKey: ['usersSummary'],
    queryFn: fetchUserStats,
  });
  const summary = summaryData?.data;

  // Filter chip component
  const FilterChip = ({
    label,
    isActive,
    onPress,
  }: {
    label: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-2xl mr-3 shadow-sm ${isActive ? '' : 'border border-gray-300'}`}
      style={{
        backgroundColor: isActive ? colors.cta : colors.card,
        elevation: isActive ? 4 : 0,
      }}>
      <View className="flex-row items-center">
        <Text className="text-sm font-bold" style={{ color: isActive ? colors.onCta : colors.text }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Status Filter Chips */}
      <View className="px-4 mb-2">
        <Text className="text-xs font-semibold mb-2" style={{ color: colors.muted }}>
          STATUS
        </Text>
        <ScrollView className="flex-row" horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All"
            isActive={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
          />
          <FilterChip
            label="Active"
            isActive={statusFilter === 'active'}
            onPress={() => setStatusFilter('active')}
          />
          <FilterChip
            label="Suspended"
            isActive={statusFilter === 'suspended'}
            onPress={() => setStatusFilter('suspended')}
          />
        </ScrollView>
      </View>

      {/* Role Filter Chips */}
      <View className="px-4 mb-4">
        <Text className="text-xs font-semibold mb-2" style={{ color: colors.muted }}>
          ROLE
        </Text>
        <ScrollView className="flex-row" horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All Roles"
            isActive={roleFilter === 'all'}
            onPress={() => setRoleFilter('all')}
          />
          <FilterChip
            label="Admins"
            isActive={roleFilter === 'admin'}
            onPress={() => setRoleFilter('admin')}
          />
          <FilterChip
            label="Vendors"
            isActive={roleFilter === 'vendor'}
            onPress={() => setRoleFilter('vendor')}
          />
          <FilterChip
            label="Customers"
            isActive={roleFilter === 'customer'}
            onPress={() => setRoleFilter('customer')}
          />
        </ScrollView>
      </View>

      {/* Summary Tiles */}
      {summary ? (
        <View className="px-4 pb-3">
          <StatInline
            items={[
              { label: 'Total', value: String(summary.total) },
              { label: 'Verified', value: String(summary.verified) },
              { label: 'New · month', value: String(summary.newThisMonth) },
            ]}
          />
        </View>
      ) : null}

      {/* Users List */}
      <UsersList
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
      />
    </View>
  );
}
