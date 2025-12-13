import React, { useMemo } from "react";
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

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  accountStatus: string;
  profileImage: string | null;
  createdAt: string;
  vendorProfile: any;
  customerProfile: any;
}

interface ApiResponse {
  success: boolean;
  data: User[];
  pagination: any;
}

// API function for unverified users
export const fetchPendingVendors = async (): Promise<ApiResponse> => {
  const res = await apiRequest("/admin/approvals/vendors/pending", "GET");
  return res.data;
};

interface PendingVendorsListProps {
  searchQuery: string;
}

export default function PendingVendorsList({ searchQuery }: PendingVendorsListProps) {
  const { colors } = useThemeContext();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: [,"users", "vendors", "pending"],
    queryFn: fetchPendingVendors,
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
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
          Failed to load users
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredUsers}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      ListEmptyComponent={
        <View className="items-center justify-center py-16">
          <Ionicons name="close-circle-outline" size={64} color="#ef4444" />
          <Text className="text-center mt-4 text-base font-medium" style={{ color: colors.text }}>
            No users found
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          className="relative flex-row items-center justify-between p-4 mb-3 rounded-3xl shadow-sm"
          style={{
            backgroundColor: colors.card,
            elevation: 2,
            borderColor: "#ef4444",
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
              </View>
              <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}