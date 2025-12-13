import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";

// Import the separate components
import AllUsersList from "./components/AllUsersList";
import { ScrollView } from "react-native-gesture-handler";
import PendingVendorsList from "./components/PendingVendorsList";
import PendingCustomersList from "./components/PendingCustomersList";
import AllPendingUserList from "./components/AllPendingUsersList";

type FilterType = "all" | "allPending" | "pendingVendors" | "pendingCustomers";

export default function Users() {
  const { colors } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Add user handler
  const handleAddUser = () => {
    Alert.alert("Add User", "Add user button clicked!");
  };

  // Custom chip component
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
      className={`px-5 py-2.5 rounded-2xl mr-3 shadow-sm ${
        isActive ? "" : "border border-gray-300"
      }`}
      style={{
        backgroundColor: isActive ? colors.primary : colors.card,
        elevation: isActive ? 4 : 0,
      }}
    >
      <View className="flex-row items-center">
        <Text
          className="text-sm font-bold"
          style={{ color: isActive ? "#fff" : colors.text }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );

  // Render the appropriate component based on active filter
  const renderContent = () => {
    switch (activeFilter) {
      case "all":
        return <AllUsersList searchQuery={searchQuery} />;
      case "allPending":
        return <AllPendingUserList searchQuery={searchQuery} />;
      case "pendingVendors":
        return <PendingVendorsList searchQuery={searchQuery} />;
      case "pendingCustomers":
        return <PendingCustomersList searchQuery={searchQuery} />;
      default:
        return;
    }
  };

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search & Add Button */}
      <View className="px-4 mb-4">
        <View
          className="flex-row items-center rounded-2xl px-5 py-3 shadow-sm"
          style={{ backgroundColor: colors.card, elevation: 2 }}
        >
          <Ionicons name="search" size={22} color={colors.text} />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-base"
            style={{ color: colors.text }}
          />

          <Pressable
            onPress={handleAddUser}
            className="w-11 h-11 rounded-xl items-center justify-center shadow-md"
            style={{ backgroundColor: colors.primary, elevation: 4 }}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Filter Chips */}
      <View className="px-4 mb-4">
        <ScrollView className="flex-row"  horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All"
            isActive={activeFilter === "all"}
            onPress={() => setActiveFilter("all")}
          />
          <FilterChip
            label="All-Pending"
            isActive={activeFilter === "allPending"}
            onPress={() => setActiveFilter("allPending")}
          />
          <FilterChip
            label="Pending-Vendors"
            isActive={activeFilter === "pendingVendors"}
            onPress={() => setActiveFilter("pendingVendors")}
          />
          <FilterChip
            label="Pending-Customers"
            isActive={activeFilter === "pendingCustomers"}
            onPress={() => setActiveFilter("pendingCustomers")}
          />
        </ScrollView>
      </View>

      {/* Dynamic Content */}
      {renderContent()}
    </View>
  );
}
