import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSelector from "react-native-modal-selector";
import { useThemeContext } from "context/ThemeProvider";

interface Vegetable {
  id: string;
  name: string;
  purchase: string;
  selling: string;
  unit: string;
  image: any;
  status: "green" | "red" | "gray";
}

const vegetablesData: Vegetable[] = [
  { id: "1", name: "Aloe Vera", purchase: "10.00", selling: "12.00", unit: "Bag", image: require("../../assets/aloe.jpg"), status: "green" },
  { id: "2", name: "Carrot", purchase: "5.00", selling: "6.50", unit: "Kg", image: require("../../assets/carrot.jpg"), status: "green" },
  { id: "3", name: "Potatoes", purchase: "3.00", selling: "4.00", unit: "Kg", image: require("../../assets/potato.jpg"), status: "green" },
  { id: "4", name: "Courgette", purchase: "6.00", selling: "7.50", unit: "Kg", image: require("../../assets/courgette.jpg"), status: "green" },
  { id: "5", name: "Ginger", purchase: "12.00", selling: "15.00", unit: "Kg", image: require("../../assets/ginger.jpg"), status: "green" },
  { id: "6", name: "Sugar Cane", purchase: "8.00", selling: "10.00", unit: "Stick", image: require("../../assets/sugarcane.jpg"), status: "green" },
  { id: "7", name: "Papaya", purchase: "14.00", selling: "17.00", unit: "Piece", image: require("../../assets/papaya.jpg"), status: "red" },
  { id: "8", name: "Other", purchase: "0.00", selling: "0.00", unit: "-", image: require("../../assets/others.jpg"), status: "gray" },
];

export default function CategoryDetails() {
  const { colors } = useThemeContext();
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<Vegetable[]>(vegetablesData);
  const [selectedItem, setSelectedItem] = useState<Vegetable | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredData(vegetablesData);
    } else {
      const filtered = vegetablesData.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const openModal = (item: Vegetable) => {
    setSelectedItem({ ...item });
    setModalVisible(true);
  };

  const handleUpdate = () => {
    ToastAndroid.show("Item updated successfully!", ToastAndroid.SHORT);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: Vegetable }) => (
    <TouchableOpacity
      onPress={() => openModal(item)}
      className="flex-row items-center rounded-2xl p-3 mb-3"
      style={{ backgroundColor: colors.card, elevation: 2 }}
    >
      <Image source={item.image} className="w-12 h-12 rounded-full mr-3" />
      <View className="flex-1">
        <Text
          className="font-semibold text-base"
          style={{ color: colors.text }}
        >
          {item.name}
        </Text>
      </View>
      <View
        className="w-3 h-3 rounded-full"
        style={{
          backgroundColor:
            item.status === "green"
              ? colors.success
              : item.status === "red"
              ? colors.error
              : colors.grey,
        }}
      />
    </TouchableOpacity>
  );

  const inputStyle = {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    color: colors.text,
    backgroundColor: colors.card,
  };

  return (
    <View className="flex-1 p-5" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center mb-5">
        <Image
          source={require("../../assets/vegetables.jpg")}
          className="w-14 h-14 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            Vegetables
          </Text>
          <Text style={{ color: colors.subtext }}>
            {filteredData.length} Items
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
      </View>

      {/* Search Bar */}
      <View
        className="flex-row items-center mb-4 rounded-full px-4 py-2"
        style={{ backgroundColor: colors.card }}
      >
        <Ionicons name="search" size={20} color={colors.text} />
        <TextInput
          placeholder="Search"
          placeholderTextColor={colors.text}
          value={searchText}
          onChangeText={handleSearch}
          className="flex-1 ml-2 text-base"
          style={{ color: colors.text }}
        />
        <Pressable
          onPress={() => ToastAndroid.show("Add item clicked", ToastAndroid.SHORT)}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            className="w-[90%] rounded-2xl p-5"
            style={{ backgroundColor: colors.card }}
          >
            {selectedItem && (
              <>
                <TouchableOpacity>
                  <Image
                    source={selectedItem.image}
                    className="w-24 h-24 rounded-full mb-3 self-center"
                  />
                </TouchableOpacity>
                <Text
                  className="text-center mb-4"
                  style={{ color: colors.text }}
                >
                  Update Item
                </Text>

                <TextInput
                  style={inputStyle}
                  value={selectedItem.name}
                  onChangeText={(text) =>
                    setSelectedItem({ ...selectedItem, name: text })
                  }
                  placeholder="Name"
                  placeholderTextColor={colors.text}
                />

                <TextInput
                  style={inputStyle}
                  value={selectedItem.purchase}
                  onChangeText={(text) =>
                    setSelectedItem({ ...selectedItem, purchase: text })
                  }
                  placeholder="Purchase Price"
                  placeholderTextColor={colors.text}
                  keyboardType="numeric"
                />

                <TextInput
                  style={inputStyle}
                  value={selectedItem.selling}
                  onChangeText={(text) =>
                    setSelectedItem({ ...selectedItem, selling: text })
                  }
                  placeholder="Selling Price"
                  placeholderTextColor={colors.text}
                  keyboardType="numeric"
                />

                <TextInput
                  style={inputStyle}
                  value={selectedItem.unit}
                  onChangeText={(text) =>
                    setSelectedItem({ ...selectedItem, unit: text })
                  }
                  placeholder="Unit"
                  placeholderTextColor={colors.text}
                />

                {/* Dropdown using Modal Selector */}
                <View className="w-full mb-5">
                  <ModalSelector
                    data={[
                      { key: "green", label: "In Stock" },
                      { key: "red", label: "Out of Stock" },
                    ]}
                    initValue={
                      selectedItem.status === "green"
                        ? "In Stock"
                        : selectedItem.status === "red"
                        ? "Out of Stock"
                        : "Select Status"
                    }
                    onChange={(option) =>
                      setSelectedItem({
                        ...selectedItem,
                        status: option.key as "green" | "red",
                      })
                    }
                    style={{ width: "100%" }}
                    selectStyle={{
                      borderRadius: 12,
                      borderColor: "#ddd",
                      borderWidth: 1,
                      backgroundColor: colors.background,
                      padding: 12,
                    }}
                    selectTextStyle={{ color: colors.text }}
                    optionTextStyle={{ color: colors.text }}
                    cancelText="Cancel"
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="flex-1 mr-2 rounded-xl p-3 bg-gray-300 items-center"
                  >
                    <Text className="text-black">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleUpdate}
                    className="flex-1 rounded-xl p-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-center text-white">Update</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
