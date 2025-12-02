import React, { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chip } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "context/ThemeProvider";

const ordersData = [
  {
    id: "1",
    orderId: "3450238475083",
    amount: "$125.43",
    customer: "Organization 1",
    items: 12,
    date: "13 July, 2025",
    status: "Processed",
  },
  {
    id: "2",
    orderId: "3450238475094",
    amount: "$89.20",
    customer: "Customer 2",
    items: 8,
    date: "13 July, 2025",
    status: "Processed",
  },
  {
    id: "3",
    orderId: "3450238475105",
    amount: "$230.00",
    customer: "Customer 3",
    items: 22,
    date: "13 July, 2025",
    status: "Processed",
  },
];

export default function OrdersScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] = useState<"today" | "all">("today");

  const filteredOrders =
    selectedFilter === "today"
      ? ordersData
      : [
          ...ordersData,
          ...ordersData.map((o, i) => ({
            ...o,
            id: `${o.id}-${i}`, // ensure unique keys
          })),
        ];

  const renderItem = ({ item }: any) => (
    <Pressable
      onPress={() => navigation.navigate("CreateOrderScreen")}
      className="mb-3 rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-md font-semibold" style={{ color: colors.text }}>
            ID:
          </Text>
          <Text className="text-sm" style={{ color: colors.muted }}>
            {item.orderId}
          </Text>
        </View>
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          {item.amount}
        </Text>
      </View>

      <View className="mb-1 flex-row justify-between">
        <Text className="text-md" style={{ color: colors.text }}>
          Customer
        </Text>
        <Text className="text-sm" style={{ color: colors.muted }}>
          {item.customer}
        </Text>
      </View>

      <View className="mb-1 flex-row justify-between">
        <Text className="text-md" style={{ color: colors.text }}>
          Items
        </Text>
        <Text className="text-sm" style={{ color: colors.muted }}>
          {item.items}
        </Text>
      </View>

      <View className="mb-1 flex-row justify-between">
        <Text className="text-md" style={{ color: colors.text }}>
          Order Date
        </Text>
        <Text className="text-sm" style={{ color: colors.muted }}>
          {item.date}
        </Text>
      </View>

      <View className="flex-row justify-between">
        <Text className="text-sm" style={{ color: colors.text }}>
          Status
        </Text>
        <Text className="text-sm font-semibold text-green-500">{item.status}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 p-4" style={{ backgroundColor: colors.background }}>
      {/* Filter Chips */}
      <View className="mb-4 flex-row items-center justify-start gap-3">
        <Chip
          mode="outlined"
          selected={selectedFilter === "today"}
          onPress={() => setSelectedFilter("today")}
          selectedColor={colors.white}
          style={{
            backgroundColor:
              selectedFilter === "today" ? colors.primary : colors.card,
            borderColor:
              selectedFilter === "today" ? colors.primary : colors.border,
          }}
          textStyle={{
            color:
              selectedFilter === "today" ? colors.white : colors.text,
            fontWeight: "500",
          }}
        >
          Today’s Orders
        </Chip>

        <Chip
          mode="outlined"
          selected={selectedFilter === "all"}
          onPress={() => setSelectedFilter("all")}
          selectedColor={colors.white}
          style={{
            backgroundColor:
              selectedFilter === "all" ? colors.primary : colors.card,
            borderColor:
              selectedFilter === "all" ? colors.primary : colors.border,
          }}
          textStyle={{
            color:
              selectedFilter === "all" ? colors.white : colors.text,
            fontWeight: "500",
          }}
        >
          All Orders
        </Chip>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Add Button */}
      <Pressable
        onPress={() => navigation.navigate("CreateOrderScreen")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-md"
        style={{ backgroundColor: colors.primary }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
