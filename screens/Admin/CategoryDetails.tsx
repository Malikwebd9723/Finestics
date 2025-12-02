import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSelector from "react-native-modal-selector";
import { useThemeContext } from "context/ThemeProvider";

// React Hook Form
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { categorySchema } from "../../validations/formValidationSchemas";
import { pickImageFromGallery } from "utils/imagePicker";
import SearchBar from "components/SearchBar";
import { searchbarStyles } from "constants/inputStyles";

interface Vegetable {
  id: string;
  name: string;
  purchase: string;
  selling: string;
  unit: string;
  image: any;
  status: "instock" | "outofstock";
}

// Sample Data
const vegetablesData: Vegetable[] = [
  {
    id: "1",
    name: "Aloe Vera",
    purchase: "10.00",
    selling: "12.00",
    unit: "Bag",
    image: require("../../assets/aloe.jpg"),
    status: "instock",
  },
  {
    id: "2",
    name: "Carrot",
    purchase: "5.00",
    selling: "6.50",
    unit: "Kg",
    image: require("../../assets/carrot.jpg"),
    status: "instock",
  },
  {
    id: "3",
    name: "Potatoes",
    purchase: "3.00",
    selling: "4.00",
    unit: "Kg",
    image: require("../../assets/potato.jpg"),
    status: "instock",
  },
  {
    id: "7",
    name: "Papaya",
    purchase: "14.00",
    selling: "17.00",
    unit: "Piece",
    image: require("../../assets/papaya.jpg"),
    status: "outofstock",
  },
];

export default function CategoryDetails() {
  const { colors } = useThemeContext();

  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState<Vegetable[]>(vegetablesData);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagePreview, setImagePreview] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Handler
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: "",
      purchase: "",
      selling: "",
      unit: "",
      status: "",
    },
  });

  // Search Filter
  const handleSearch = (text: string) => {
    setSearchText(text);

    if (text.trim() === "") {
      setFilteredData(vegetablesData);
    } else {
      setFilteredData(
        vegetablesData.filter((item) =>
          item.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  // Open modal to UPDATE item
  const openEditModal = (item: Vegetable) => {
    setEditingId(item.id);

    reset({
      name: item.name,
      purchase: item.purchase,
      selling: item.selling,
      unit: item.unit,
      status: item.status,
    });

    setImagePreview(item.image);
    setModalVisible(true);
  };

  // Open modal to ADD item
  const openAddModal = () => {
    setEditingId(null);
    reset({
      name: "",
      purchase: "",
      selling: "",
      unit: "",
      status: "",
    });
    setImagePreview(null);
    setModalVisible(true);
  };

  // Image Picker
  const pickImage = async () => {
    const uri = await pickImageFromGallery();
    if (uri) setImagePreview({ uri });
  };

  // Submit Handler
  const submitForm = (data: any) => {
    const finalData = {
      ...data,
      id: editingId || Date.now().toString(),
      image: imagePreview,
    };

    console.log("FORM SUBMITTED:", finalData);

    ToastAndroid.show(
      editingId ? "Item updated!" : "New item added!",
      ToastAndroid.SHORT
    );

    setModalVisible(false);
  };

  // Row UI
  const renderItem = ({ item }: { item: Vegetable }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      className="flex-row items-center rounded-2xl p-3 mb-3"
      style={{ backgroundColor: colors.card }}
    >
      <Image source={item.image} className="w-12 h-12 rounded-full mr-3" />
      <View className="flex-1">
        <Text className="font-semibold text-base" style={{ color: colors.text }}>
          {item.name}
        </Text>
      </View>

      <View
        className="px-3 py-1 rounded-full"
        style={{
          backgroundColor:
            item.status === "instock" ? colors.success : colors.error,
        }}
      >
        <Text className="text-xs" style={{ color: colors.white }}>
          {item.status === "instock" ? "In Stock" : "Out of Stock"}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={{ color: colors.muted }}>
            {filteredData.length} Items
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChange={handleSearch}
        onAddPress={openAddModal}
      />

      {/* LIST */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View
            className="w-[90%] rounded-2xl p-5"
            style={{ backgroundColor: colors.card }}
          >
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={imagePreview || require("../../assets/others.jpg")}
                className="w-24 h-24 rounded-full mb-3 self-center"
              />
            </TouchableOpacity>

            <Text className="text-center mb-4" style={{ color: colors.text }}>
              {editingId ? "Update Item" : "Add New Item"}
            </Text>

            {/* NAME */}
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    style={[searchbarStyles.base, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Name"
                    placeholderTextColor={colors.placeholder}
                  />
                  {errors.name && (
                    <Text style={{ color: colors.error }}>
                      {errors.name.message}
                    </Text>
                  )}
                </>
              )}
            />

            {/* PURCHASE */}
            <Controller
              control={control}
              name="purchase"
              render={({ field }) => (
                <>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    style={[searchbarStyles.base, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Purchase Price"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                  />
                  {errors.purchase && (
                    <Text style={{ color: colors.error }}>
                      {errors.purchase.message}
                    </Text>
                  )}
                </>
              )}
            />

            {/* SELLING */}
            <Controller
              control={control}
              name="selling"
              render={({ field }) => (
                <>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    style={[searchbarStyles.base, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Selling Price"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                  />
                  {errors.selling && (
                    <Text style={{ color: colors.error }}>
                      {errors.selling.message}
                    </Text>
                  )}
                </>
              )}
            />

            {/* UNIT */}
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    style={[searchbarStyles.base, { backgroundColor: colors.card, color: colors.text }]}
                    placeholder="Unit (e.g., Kg, Bag)"
                    placeholderTextColor={colors.placeholder}
                  />
                  {errors.unit && (
                    <Text style={{ color: colors.error }}>
                      {errors.unit.message}
                    </Text>
                  )}
                </>
              )}
            />

            {/* STATUS SELECTOR */}
            <Controller
              control={control}
              name="status"
              render={({ field }) => {
                const selectedLabel =
                  field.value === "instock"
                    ? "In Stock"
                    : field.value === "outofstock"
                      ? "Out of Stock"
                      : "Select Status";

                return (
                  <>
                    <ModalSelector
                      data={[
                        { key: "instock", label: "In Stock" },
                        { key: "outofstock", label: "Out of Stock" },
                      ]}
                      initValue={selectedLabel}
                      onChange={(option) => field.onChange(option.key)}
                      selectedKey={field.value}
                      selectStyle={{
                        borderRadius: 12,
                        borderColor: "#ddd",
                        borderWidth: 1,
                        padding: 12,
                        marginTop: 8,
                        backgroundColor: colors.primary,
                      }}
                      selectTextStyle={{ color: colors.text }}
                      optionTextStyle={{ color: colors.text }}
                    />
                    {errors.status && (
                      <Text style={{ color: colors.error }}>{errors.status.message}</Text>
                    )}
                  </>
                );
              }}
            />


            {/* BUTTONS */}
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 mr-2 rounded-xl p-3 bg-gray-300 items-center"
              >
                <Text className="text-black">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit(submitForm)}
                className="flex-1 rounded-xl p-3"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-center text-white">
                  {editingId ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
