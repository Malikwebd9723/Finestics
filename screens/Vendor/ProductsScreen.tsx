import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Modal,
    ToastAndroid,
    ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeContext } from "context/ThemeProvider";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { categorySchema } from "../../validations/formValidationSchemas";
import SearchBar from "components/SearchBar";

interface Vegetable {
    id: string;
    name: string;
    purchase: string;
    selling: string;
    unit: string;
    category: string;
    status: "instock" | "outofstock";
}

// Dummy API Functions
const fetchVegetables = async (): Promise<Vegetable[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return [
        {
            id: "1",
            name: "Tomato",
            purchase: "10.00",
            selling: "12.00",
            unit: "Kg",
            category: "Vegetables",
            status: "instock",
        },
        {
            id: "2",
            name: "Carrot",
            purchase: "5.00",
            selling: "6.50",
            unit: "Kg",
            category: "Vegetables",
            status: "instock",
        },
        {
            id: "3",
            name: "Potato",
            purchase: "3.00",
            selling: "4.00",
            unit: "Kg",
            category: "Vegetables",
            status: "instock",
        },
        {
            id: "4",
            name: "Onion",
            purchase: "4.00",
            selling: "5.50",
            unit: "Kg",
            category: "Vegetables",
            status: "instock",
        },
        {
            id: "5",
            name: "Spinach",
            purchase: "8.00",
            selling: "10.00",
            unit: "Bundle",
            category: "Vegetables",
            status: "outofstock",
        },
        {
            id: "6",
            name: "Cucumber",
            purchase: "6.00",
            selling: "7.50",
            unit: "Kg",
            category: "Vegetables",
            status: "instock",
        },
        {
            id: "7",
            name: "Bell Pepper",
            purchase: "15.00",
            selling: "18.00",
            unit: "Kg",
            category: "Vegetables",
            status: "instock",
        },
        {
            id: "8",
            name: "Cabbage",
            purchase: "7.00",
            selling: "9.00",
            unit: "Piece",
            category: "Vegetables",
            status: "outofstock",
        },
    ];
};

const addVegetable = async (data: Partial<Vegetable>): Promise<Vegetable> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ...data, id: Date.now().toString() } as Vegetable;
};

const updateVegetable = async (id: string, data: Partial<Vegetable>): Promise<Vegetable> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ...data, id } as Vegetable;
};

const deleteVegetable = async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
};

export default function ProductsScreen() {
    const { colors } = useThemeContext();
    const queryClient = useQueryClient();

    const [searchText, setSearchText] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Vegetable | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Fetch vegetables
    const { data: vegetables = [], isLoading } = useQuery({
        queryKey: ["vegetables"],
        queryFn: fetchVegetables,
    });

    // Add mutation
    const addMutation = useMutation({
        mutationFn: addVegetable,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vegetables"] });
            ToastAndroid.show("Item added successfully!", ToastAndroid.SHORT);
            setModalVisible(false);
            reset();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Vegetable> }) =>
            updateVegetable(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vegetables"] });
            ToastAndroid.show("Item updated successfully!", ToastAndroid.SHORT);
            setModalVisible(false);
            reset();
            setEditingItem(null);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteVegetable,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vegetables"] });
            ToastAndroid.show("Item deleted successfully!", ToastAndroid.SHORT);
            setDeleteModalVisible(false);
            setItemToDelete(null);
        },
    });

    // Form
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
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

    // Filter vegetables
    const filteredData = vegetables.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // Open Add Modal
    const openAddModal = () => {
        setEditingItem(null);
        reset({
            name: "",
            purchase: "",
            selling: "",
            unit: "",
            status: "",
        });
        setModalVisible(true);
    };

    // Open Edit Modal
    const openEditModal = (item: Vegetable) => {
        setEditingItem(item);
        reset({
            name: item.name,
            purchase: item.purchase,
            selling: item.selling,
            unit: item.unit,
            status: item.status,
        });
        setModalVisible(true);
    };

    // Open Delete Confirmation
    const openDeleteModal = (id: string) => {
        setItemToDelete(id);
        setDeleteModalVisible(true);
    };

    // Submit Form
    const submitForm = (data: any) => {
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
        } else {
            addMutation.mutate(data);
        }
    };

    // Confirm Delete
    const confirmDelete = () => {
        if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
        }
    };

    // Calculate profit
    const calculateProfit = (purchase: string, selling: string): string => {
        const profit = parseFloat(selling) - parseFloat(purchase);
        return profit.toFixed(2);
    };

    // Render Item
    const renderItem = ({ item, index }: { item: Vegetable; index: number }) => {
        const profit = calculateProfit(item.purchase, item.selling);

        return (
            <TouchableOpacity
                onPress={() => openEditModal(item)}
                onLongPress={() => openDeleteModal(item.id)}
                className="rounded-3xl p-4 mb-3 shadow-sm"
                style={{ backgroundColor: colors.card, elevation: 2 }}
            >
                <View className="flex-row items-center">

                    {/* Details */}
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text className="font-bold text-base" style={{ color: colors.text }}>
                                {item.name}
                            </Text>
                            <View
                                className="px-3 py-1 rounded-full"
                                style={{
                                    backgroundColor: item.status === "instock" ? "#10b98120" : "#ef444420",
                                }}
                            >
                                <Text
                                    className="text-xs font-semibold"
                                    style={{ color: item.status === "instock" ? "#10b981" : "#ef4444" }}
                                >
                                    {item.status === "instock" ? "In Stock" : "Out of Stock"}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="mr-4">
                                    <Text className="text-xs text-gray-500">Purchase</Text>
                                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                        ${item.purchase}
                                    </Text>
                                </View>
                                <View className="mr-4">
                                    <Text className="text-xs text-gray-500">Selling</Text>
                                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                        ${item.selling}
                                    </Text>
                                </View>
                                <View>
                                    <Text className="text-xs text-gray-500">Profit</Text>
                                    <Text className="text-sm font-semibold" style={{ color: "#10b981" }}>
                                        +${profit}
                                    </Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-xs text-gray-500">Unit</Text>
                                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                    {item.unit}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <View className="py-2" style={{ backgroundColor: colors.background }}>
                {/* Search Bar */}
                <SearchBar
                    searchQuery={searchText}
                    setSearchQuery={setSearchText}
                    onAddPress={openAddModal}
                />
            </View>

            <View className="flex-1 px-4" style={{ backgroundColor: colors.background }}>
                {/* List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text className="mt-4" style={{ color: colors.text }}>Loading vegetables...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-16">
                                <MaterialIcons name="search-off" size={64} color="#d1d5db" />
                                <Text className="text-center mt-4 text-base" style={{ color: colors.text }}>
                                    No vegetables found
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Add/Edit Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View className="flex-1 bg-black/50 justify-end">
                        <View
                            className="rounded-t-3xl p-6"
                            style={{ backgroundColor: colors.card, maxHeight: "80%" }}
                        >
                            {/* Modal Header */}
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                    {editingItem ? "Update Item" : "Add New Item"}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false);
                                        setEditingItem(null);
                                        reset();
                                    }}
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <MaterialIcons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Form Fields */}
                            <View className="mb-4">
                                {/* Name */}
                                <Controller
                                    control={control}
                                    name="name"
                                    render={({ field }) => (
                                        <>
                                            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                Item Name
                                            </Text>
                                            <TextInput
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                className="rounded-xl p-4 mb-2"
                                                style={{
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    borderWidth: 1,
                                                    borderColor: errors.name ? "#ef4444" : colors.muted,
                                                }}
                                                placeholder="Enter item name"
                                                placeholderTextColor={colors.placeholder}
                                            />
                                            {errors.name && (
                                                <Text className="text-xs mb-2" style={{ color: "#ef4444" }}>
                                                    {errors.name.message}
                                                </Text>
                                            )}
                                        </>
                                    )}
                                />

                                {/* Purchase & Selling Price */}
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Controller
                                            control={control}
                                            name="purchase"
                                            render={({ field }) => (
                                                <>
                                                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                        Purchase Price
                                                    </Text>
                                                    <TextInput
                                                        value={field.value}
                                                        onChangeText={field.onChange}
                                                        onBlur={field.onBlur}
                                                        className="rounded-xl p-4 mb-2"
                                                        style={{
                                                            backgroundColor: colors.background,
                                                            color: colors.text,
                                                            borderWidth: 1,
                                                            borderColor: errors.purchase ? "#ef4444" : colors.muted,
                                                        }}
                                                        placeholder="0.00"
                                                        placeholderTextColor={colors.placeholder}
                                                        keyboardType="decimal-pad"
                                                    />
                                                    {errors.purchase && (
                                                        <Text className="text-xs" style={{ color: "#ef4444" }}>
                                                            {errors.purchase.message}
                                                        </Text>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </View>

                                    <View className="flex-1">
                                        <Controller
                                            control={control}
                                            name="selling"
                                            render={({ field }) => (
                                                <>
                                                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                        Selling Price
                                                    </Text>
                                                    <TextInput
                                                        value={field.value}
                                                        onChangeText={field.onChange}
                                                        onBlur={field.onBlur}
                                                        className="rounded-xl p-4 mb-2"
                                                        style={{
                                                            backgroundColor: colors.background,
                                                            color: colors.text,
                                                            borderWidth: 1,
                                                            borderColor: errors.selling ? "#ef4444" : colors.muted,
                                                        }}
                                                        placeholder="0.00"
                                                        placeholderTextColor={colors.placeholder}
                                                        keyboardType="decimal-pad"
                                                    />
                                                    {errors.selling && (
                                                        <Text className="text-xs" style={{ color: "#ef4444" }}>
                                                            {errors.selling.message}
                                                        </Text>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </View>
                                </View>

                                {/* Unit */}
                                <Controller
                                    control={control}
                                    name="unit"
                                    render={({ field }) => (
                                        <>
                                            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                Unit
                                            </Text>
                                            <TextInput
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                className="rounded-xl p-4 mb-2"
                                                style={{
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    borderWidth: 1,
                                                    borderColor: errors.unit ? "#ef4444" : colors.muted,
                                                }}
                                                placeholder="e.g., Kg, Piece, Bundle"
                                                placeholderTextColor={colors.placeholder}
                                            />
                                            {errors.unit && (
                                                <Text className="text-xs mb-2" style={{ color: "#ef4444" }}>
                                                    {errors.unit.message}
                                                </Text>
                                            )}
                                        </>
                                    )}
                                />

                                {/* Status */}
                                <Controller
                                    control={control}
                                    name="status"
                                    render={({ field }) => (
                                        <>
                                            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                Status
                                            </Text>
                                            <View className="flex-row gap-3">
                                                <TouchableOpacity
                                                    onPress={() => field.onChange("instock")}
                                                    className="flex-1 p-4 rounded-xl flex-row items-center justify-center"
                                                    style={{
                                                        backgroundColor: field.value === "instock" ? "#10b981" : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: field.value === "instock" ? "#10b981" : colors.muted,
                                                    }}
                                                >
                                                    <MaterialIcons
                                                        name="check-circle"
                                                        size={20}
                                                        color={field.value === "instock" ? "#fff" : colors.text}
                                                    />
                                                    <Text
                                                        className="ml-2 font-semibold"
                                                        style={{ color: field.value === "instock" ? "#fff" : colors.text }}
                                                    >
                                                        In Stock
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => field.onChange("outofstock")}
                                                    className="flex-1 p-4 rounded-xl flex-row items-center justify-center"
                                                    style={{
                                                        backgroundColor: field.value === "outofstock" ? "#ef4444" : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: field.value === "outofstock" ? "#ef4444" : colors.muted,
                                                    }}
                                                >
                                                    <MaterialIcons
                                                        name="cancel"
                                                        size={20}
                                                        color={field.value === "outofstock" ? "#fff" : colors.text}
                                                    />
                                                    <Text
                                                        className="ml-2 font-semibold"
                                                        style={{ color: field.value === "outofstock" ? "#fff" : colors.text }}
                                                    >
                                                        Out of Stock
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                            {errors.status && (
                                                <Text className="text-xs mt-2" style={{ color: "#ef4444" }}>
                                                    {errors.status.message}
                                                </Text>
                                            )}
                                        </>
                                    )}
                                />
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3 mt-4">
                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false);
                                        setEditingItem(null);
                                        reset();
                                    }}
                                    className="flex-1 py-4 rounded-xl items-center"
                                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted }}
                                >
                                    <Text className="font-bold" style={{ color: colors.text }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit(submitForm)}
                                    disabled={addMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-4 rounded-xl items-center"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    {addMutation.isPending || updateMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="font-bold text-white">
                                            {editingItem ? "Update" : "Add Item"}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal visible={deleteModalVisible} transparent animationType="fade">
                    <View className="flex-1 bg-black/70 items-center justify-center px-6">
                        <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.card, maxWidth: 400 }}>
                            <View className="items-center mb-4">
                                <View
                                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                                    style={{ backgroundColor: "#ef444420" }}
                                >
                                    <MaterialIcons name="warning" size={32} color="#ef4444" />
                                </View>
                                <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                                    Delete Item?
                                </Text>
                                <Text className="text-center text-gray-500">
                                    Are you sure you want to delete this item? This action cannot be undone.
                                </Text>
                            </View>

                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        setDeleteModalVisible(false);
                                        setItemToDelete(null);
                                    }}
                                    className="flex-1 py-3 rounded-xl items-center"
                                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted }}
                                >
                                    <Text className="font-bold" style={{ color: colors.text }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={confirmDelete}
                                    disabled={deleteMutation.isPending}
                                    className="flex-1 py-3 rounded-xl items-center"
                                    style={{ backgroundColor: "#ef4444" }}
                                >
                                    {deleteMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="font-bold text-white">Delete</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </>
    );
}