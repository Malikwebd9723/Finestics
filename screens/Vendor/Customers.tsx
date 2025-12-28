import React, { useState } from "react";
import {
  View,
  Alert,
} from "react-native";
import { useThemeContext } from "context/ThemeProvider";

// Import the separate components
import SearchBar from "components/SearchBar";
import AllCustomersList from "./components/AllCustomersList";

export default function Customers() {
  const { colors } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [formModalVisible, setFormModalVisible] = useState(false);

  // Add user handler
  const handleAddUser = () => {
    Alert.alert("Add User", "Add user button clicked!");
  };

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search & Add Button */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onAddPress={()=>setFormModalVisible(true)}/>

      {/* Dynamic Content */}
      <AllCustomersList searchQuery={searchQuery} formModalVisible={formModalVisible} setFormModalVisible={setFormModalVisible} />
    </View>
  );
}
