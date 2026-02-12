// screens/Admin/components/UsersList.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeContext } from 'context/ThemeProvider';
import { fetchAllUsersAdmin, AdminUser } from 'api/actions/adminActions';
import UserDetailModal from './UserDetailModal';

interface UsersListProps {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'suspended';
  roleFilter: 'all' | 'admin' | 'vendor' | 'customer';
}

interface ApiResponse {
  success: boolean;
  data: AdminUser[];
  pagination: any;
}

export default function UsersList({ searchQuery, statusFilter, roleFilter }: UsersListProps) {
  const { colors } = useThemeContext();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(roleFilter !== 'all' && { role: roleFilter }),
  };

  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ['users', 'allUsers', statusFilter, roleFilter],
    queryFn: () => fetchAllUsersAdmin(1, 100, Object.keys(filters).length > 0 ? filters : undefined),
  });

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading]);

  const shimmerOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const isNewUser = (dateString: string) => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const diff = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  };

  const filteredUsers = useMemo(() => {
    if (!data?.data) return [];
    let filtered = data.data;

    if (searchQuery) {
      filtered = filtered.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return (
          fullName.includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return filtered;
  }, [data, searchQuery]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#8b5cf6';
      case 'vendor':
        return '#3b82f6';
      case 'customer':
        return '#10b981';
      default:
        return colors.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'suspended':
        return colors.error;
      case 'deleted':
        return '#6b7280';
      default:
        return colors.muted;
    }
  };

  const handleUserPress = (userId: number) => {
    setSelectedUserId(userId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedUserId(null);
  };

  const renderSkeleton = () => (
    <View className="px-4">
      {[...Array(6)].map((_, i) => (
        <Animated.View
          key={i}
          className="flex-row items-center justify-between p-4 mb-3 rounded-3xl shadow-sm"
          style={{ backgroundColor: colors.card, opacity: shimmerOpacity }}>
          <View className="flex-row items-center flex-1">
            <Animated.View
              className="w-14 h-14 rounded-full mr-4"
              style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
            />
            <View className="flex-1">
              <Animated.View
                className="w-32 h-5 mb-2 rounded-lg"
                style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
              />
              <Animated.View
                className="w-40 h-3 mb-1 rounded-lg"
                style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
              />
              <Animated.View
                className="w-24 h-3 rounded-lg"
                style={{ backgroundColor: colors.border, opacity: shimmerOpacity }}
              />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  if (isLoading) return renderSkeleton();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
          Failed to load users
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 px-6 py-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}>
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="people-outline" size={64} color={colors.muted} />
            <Text className="text-center mt-4 text-base font-medium" style={{ color: colors.text }}>
              No users found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleUserPress(item.id)}
            className="relative flex-row items-center justify-between p-4 mb-3 rounded-3xl shadow-sm"
            style={{
              backgroundColor: colors.card,
              elevation: 2,
              borderColor: colors.primary,
              borderLeftWidth: isNewUser(item.createdAt) ? 2 : 0,
            }}>
            <View className="flex-row items-center flex-1">
              {item.profileImage ? (
                <Image
                  source={{ uri: item.profileImage }}
                  className="w-14 h-14 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="relative w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: getRoleColor(item.role) + '20' }}>
                  <Text className="text-lg font-bold" style={{ color: getRoleColor(item.role) }}>
                    {getInitials(item.firstName, item.lastName)}
                  </Text>
                </View>
              )}

              <View className="ml-4 flex-1">
                <View className="flex-row items-center flex-wrap">
                  <Text className="font-bold text-base mr-2" style={{ color: colors.text }}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: getRoleColor(item.role) + '20' }}>
                    <Text
                      className="text-xs font-semibold uppercase"
                      style={{ color: getRoleColor(item.role) }}>
                      {item.role || 'User'}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm mt-0.5" style={{ color: colors.muted }} numberOfLines={1}>
                  {item.email}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: getStatusColor(item.accountStatus) }}
                  />
                  <Text className="text-xs capitalize" style={{ color: colors.muted }}>
                    {item.accountStatus}
                  </Text>
                  {!item.isEmailVerified && (
                    <View className="flex-row items-center ml-2">
                      <MaterialIcons name="warning" size={12} color="#f59e0b" />
                      <Text className="text-xs ml-0.5" style={{ color: '#f59e0b' }}>
                        Unverified
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
          </Pressable>
        )}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        visible={modalVisible}
        userId={selectedUserId}
        onClose={handleCloseModal}
      />
    </>
  );
}
