// components/AllCustomersList.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";
import CustomerDetailModal from "./CustomerDetailModal";
import CustomerFormModal from "./CustomerFormModal";
import { fetchAllCustomers } from "api/actions/customerActions";

interface Address {
  id: number;
  customerId: number;
  type: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: number;
  vendorId: number;
  businessName: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string | null;
  email: string;
  creditLimit: string;
  currentBalance: string;
  paymentTerms: string;
  businessType: string;
  status: string;
  notes: string | null;
  deliveryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  address?: Address[];
}

interface ApiResponse {
  success: boolean;
  data: Customer[];
  pagination?: any;
}

interface AllCustomersListProps {
  searchQuery: string;
  formModalVisible: boolean;
  setFormModalVisible: (visible: boolean) => void;
}

export default function AllCustomersList({
  searchQuery,
  formModalVisible,
  setFormModalVisible
}: AllCustomersListProps) {
  const { colors } = useThemeContext();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["Customers", "allCustomers"],
    queryFn: fetchAllCustomers,
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

  const isNewCustomer = (dateString: string) => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const diff = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  };

  const filteredCustomers = useMemo(() => {
    if (!data?.data) return [];
    let filtered = data.data;

    if (searchQuery) {
      filtered = filtered.filter((customer) => {
        const businessName = customer.businessName.toLowerCase();
        const contactPerson = customer.contactPerson.toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = customer.phone.toLowerCase();
        const query = searchQuery.toLowerCase();

        return (
          businessName.includes(query) ||
          contactPerson.includes(query) ||
          email.includes(query) ||
          phone.includes(query)
        );
      });
    }

    return filtered;
  }, [data, searchQuery]);

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      restaurant: "Restaurant",
      retailer: "Retailer",
      wholesaler: "Wholesaler",
      hotel: "Hotel",
      cafe: "Café",
      other: "Other",
    };
    return types[type] || type;
  };

  const getPaymentTermsLabel = (terms: string) => {
    const termLabels: Record<string, string> = {
      cash: "Cash",
      net_7: "Net 7",
      net_15: "Net 15",
      net_30: "Net 30",
      net_60: "Net 60",
      net_90: "Net 90",
    };
    return termLabels[terms] || terms;
  };

  const handleCustomerPress = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCustomerId(null);
  };

  const handleEditCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setFormModalVisible(true);
  };

  const handleCloseFormModal = () => {
    setSelectedCustomerId(null);
    setFormModalVisible(false);
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
        <Ionicons name="alert-circle" size={64} color={colors.primary} />
        <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
          Failed to load Customers
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          All Customers ({filteredCustomers.length})
        </Text>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="people-outline" size={64} color={colors.muted} />
            <Text className="text-center mt-4 text-base font-medium" style={{ color: colors.text }}>
              No Customers found
            </Text>
            <Text className="text-center mt-2 text-sm" style={{ color: colors.muted }}>
              {searchQuery ? "Try a different search term" : "Add your first customer to get started"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleCustomerPress(item.id)}
            className="relative p-4 mb-3 rounded-2xl"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-start justify-between">
              {/* Left Section - Avatar and Info */}
              <View className="flex-row items-start flex-1">
                {/* Avatar */}
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary + "20" }}
                >
                  <Text className="text-base font-bold" style={{ color: colors.primary }}>
                    {getInitials(item.contactPerson)}
                  </Text>
                </View>

                {/* Info */}
                <View className="flex-1">
                  {/* Business Name & Status Badge */}
                  <View className="flex-row items-center flex-wrap mb-1">
                    <Text className="font-bold text-base mr-2" style={{ color: colors.text }}>
                      {item.businessName}
                    </Text>
                    {isNewCustomer(item.createdAt) && (
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.success + "20" }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                          New
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Contact Person */}
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="person-outline" size={14} color={colors.muted} />
                    <Text className="text-sm ml-1" style={{ color: colors.text }}>
                      {item.contactPerson}
                    </Text>
                  </View>

                  {/* Phone */}
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="call-outline" size={14} color={colors.muted} />
                    <Text className="text-sm ml-1" style={{ color: colors.muted }}>
                      {item.phone}
                    </Text>
                  </View>

                  {/* Email */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail-outline" size={14} color={colors.muted} />
                    <Text className="text-sm ml-1" style={{ color: colors.muted }} numberOfLines={1}>
                      {item.email}
                    </Text>
                  </View>

                  {/* Business Type & Payment Terms */}
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <View
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: colors.background }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.text }}>
                        {getBusinessTypeLabel(item.businessType)}
                      </Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded-lg"
                      style={{ backgroundColor: colors.background }}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.text }}>
                        {getPaymentTermsLabel(item.paymentTerms)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right Section - Actions and Status */}
              <View className="items-end gap-2 ml-2">
                {/* Edit Button */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditCustomer(item.id);
                  }}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                >
                  <MaterialIcons name="edit" size={18} color={colors.primary} />
                </TouchableOpacity>

                {/* Status Indicator */}
                <View className="flex-row items-center">
                  {item.status === "active" ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : (
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  )}
                </View>

                {/* Credit Limit */}
                <View className="items-end mt-1">
                  <Text className="text-xs" style={{ color: colors.muted }}>
                    Credit Limit
                  </Text>
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {parseFloat(item.creditLimit).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Balance Footer (if balance exists) */}
            {parseFloat(item.currentBalance) > 0 && (
              <View
                className="flex-row items-center justify-between mt-3 pt-3"
                style={{ borderTopWidth: 1, borderTopColor: colors.border }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.muted }}>
                  Current Balance
                </Text>
                <Text className="text-sm font-bold" style={{ color: colors.error }}>
                  {parseFloat(item.currentBalance).toLocaleString()}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        visible={modalVisible}
        userId={selectedCustomerId}
        onClose={handleCloseModal}
      />

      {/* Customer Form Modal */}
      <CustomerFormModal
        visible={formModalVisible}
        onClose={handleCloseFormModal}
        customerId={selectedCustomerId}
      />

    </>
  );
}