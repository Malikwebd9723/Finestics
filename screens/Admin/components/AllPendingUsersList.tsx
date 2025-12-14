import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Animated,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";
import { apiRequest } from "api/clients";
import { ApiResponse, UserDataType } from "constants/types";
import UserDetailModal from "./UserDetailmodal";


// API function for verified users
export const fetchAllPendingUsers = async (): Promise<ApiResponse> => {
  const res = await apiRequest("/admin/approvals/pending", "GET");
  return res.data;
};

interface AllPendingUserListProps {
  searchQuery: string;
}

export default function AllPendingUserList({ searchQuery }: AllPendingUserListProps) {
  const { colors } = useThemeContext();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["allUsers", "pending"],
    queryFn: fetchAllPendingUsers,
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
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedUserId(null);
  };

  const renderSkeleton = () => (
    <View className="px-2">
      {[...Array(6)].map((_, i) => (
        <Animated.View
          key={i}
          className="flex-row items-center justify-between p-4 mb-3 rounded-3xl shadow-sm"
          style={{ backgroundColor: colors.card, opacity: shimmerOpacity }}
        >
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
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
          Failed to load verified users
        </Text>
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
          <Ionicons name="checkmark-circle-outline" size={64} color="#10b981" />
          <Text className="text-center mt-4 text-base font-medium" style={{ color: colors.text }}>
            No users found
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          className="relative flex-row items-center justify-between p-4 mb-3 rounded-3xl shadow-sm"
          onPress={() => {
            setSelectedUserId(item.id);
            setModalVisible(true);
          }}
          style={{
            backgroundColor: colors.card,
            elevation: 2,
            borderColor: "red",
            borderLeftWidth: 2,
          }}
        >
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
                style={{ backgroundColor: colors.primary + "20" }}
              >
                <Text className="text-lg font-bold" style={{ color: colors.muted }}>
                  {getInitials(item.firstName, item.lastName)}
                </Text>
              </View>
            )}

            <View className="ml-4 flex-1">
              <View className="flex-row items-center flex-wrap">
                <Text className="font-bold text-base mr-2" style={{ color: colors.text }}>
                  {item.firstName} {item.lastName}
                </Text>
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.muted }}>
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </View>
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