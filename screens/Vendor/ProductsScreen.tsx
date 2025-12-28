import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Modal,
    ToastAndroid,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeContext } from "context/ThemeProvider";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { categorySchema } from "../../validations/formValidationSchemas";
import SearchBar from "components/SearchBar";
import { addProducts, deleteProduct, fetchProducts, updateProducts } from "api/actions/productsActions";
import { fetchTags } from "api/actions/productsActions";
import ConfirmDeleteModal from "components/DeleteConfirmationModal";

interface Products {
    id: string;
    name: string;
    buyingPrice: string;
    sellingPrice: string;
    unit: string;
    category: string;
    isActive: boolean;
    tags?: string[];
}

interface Tag {
    id: string;
    name: string;
}

export default function ProductsScreen() {
    const { colors } = useThemeContext();
    const queryClient = useQueryClient();

    const [searchText, setSearchText] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Products | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Tag states
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState("");

    // Fetch products with real-time updates
    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
        refetchInterval: 5000, // Refetch every 5 seconds for real-time data
        refetchOnWindowFocus: true,
    });

    // Fetch tags from API
    const { data: tags = [], isLoading: tagsLoading } = useQuery({
        queryKey: ["tags"],
        queryFn: fetchTags,
    });

    // Add mutation
    const addMutation = useMutation({
        mutationFn: (data: any) => addProducts({ ...data, tags: selectedTags }),
        onSuccess: (data) => {
            if (!data.success) {
                ToastAndroid.show("Failed to add item!", ToastAndroid.SHORT);
            }
            queryClient.invalidateQueries({ queryKey: ["products"] });
            ToastAndroid.show("Item added successfully!", ToastAndroid.SHORT);
            setModalVisible(false);
            setSelectedTags([]);
            reset();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            updateProducts(id, { ...data, tags: selectedTags }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            ToastAndroid.show("Item updated successfully!", ToastAndroid.SHORT);
            setModalVisible(false);
            setSelectedTags([]);
            reset();
            setEditingItem(null);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
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
            buyingPrice: "",
            sellingPrice: "",
            unit: "",
            isActive: true,
        },
    });

    // Filter products by name or tags
    const filteredData = products.data?.filter((item: Products) => {
        const searchLower = searchText.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        return nameMatch || tagsMatch;
    });

    // Open Add Modal
    const openAddModal = () => {
        setEditingItem(null);
        setSelectedTags([]);
        setCustomTagInput("");
        reset({
            name: "",
            buyingPrice: "",
            sellingPrice: "",
            unit: "",
            isActive: true,
        });
        setModalVisible(true);
    };

    // Open Edit Modal
    const openEditModal = (item: Products) => {
        setEditingItem(item);
        setSelectedTags(item.tags || []);
        setCustomTagInput("");
        reset({
            name: item.name,
            buyingPrice: item.buyingPrice,
            sellingPrice: item.sellingPrice,
            unit: item.unit,
            isActive: item.isActive,
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

    // Tag operations
    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            setSelectedTags(selectedTags.filter(t => t !== tagName));
        } else {
            setSelectedTags([...selectedTags, tagName]);
        }
    };

    const removeSelectedTag = (tagName: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tagName));
    };

    const addCustomTag = () => {
        const trimmedTag = customTagInput.trim();
        if (trimmedTag && !selectedTags.includes(trimmedTag)) {
            setSelectedTags([...selectedTags, trimmedTag]);
            setCustomTagInput("");
        } else if (selectedTags.includes(trimmedTag)) {
            ToastAndroid.show("Tag already added", ToastAndroid.SHORT);
        }
    };

    // Calculate profit
    const calculateProfit = (buyingPrice: string, sellingPrice: string): string => {
        const profit = parseFloat(sellingPrice) - parseFloat(buyingPrice);
        return profit.toFixed(2);
    };

    // Render Item
    const renderItem = ({ item, index }: { item: Products; index: number }) => {
        const profit = calculateProfit(item.buyingPrice, item.sellingPrice);

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
                                    backgroundColor: item.isActive ? "#10b98120" : "#ef444420",
                                }}
                            >
                                <Text
                                    className="text-xs font-semibold"
                                    style={{ color: item.isActive ? "#10b981" : "#ef4444" }}
                                >
                                    {item.isActive ? "In Stock" : "Out of Stock"}
                                </Text>
                            </View>
                        </View>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <View className="flex-row flex-wrap gap-1 mb-2">
                                {item.tags.map((tag, idx) => (
                                    <View
                                        key={idx}
                                        className="px-2 py-1 rounded-lg"
                                        style={{ backgroundColor: colors.primary + "20" }}
                                    >
                                        <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                                            {tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="mr-4">
                                    <Text className="text-xs text-gray-500">Price</Text>
                                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                        ${item.buyingPrice}
                                    </Text>
                                </View>
                                <View className="mr-4">
                                    <Text className="text-xs text-gray-500">Selling</Text>
                                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                                        ${item.sellingPrice}
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
                        <Text className="mt-4" style={{ color: colors.text }}>Loading products...</Text>
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
                                    No products found
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
                            style={{ backgroundColor: colors.card, maxHeight: "85%" }}
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
                                        setSelectedTags([]);
                                        setCustomTagInput("");
                                        reset();
                                    }}
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <MaterialIcons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
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

                                    {/* buyingPrice & Selling Price */}
                                    <View className="flex-row gap-3 mb-4">
                                        <View className="flex-1">
                                            <Controller
                                                control={control}
                                                name="buyingPrice"
                                                render={({ field }) => (
                                                    <>
                                                        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                            Price
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
                                                                borderColor: errors.buyingPrice ? "#ef4444" : colors.muted,
                                                            }}
                                                            placeholder="0.00"
                                                            placeholderTextColor={colors.placeholder}
                                                            keyboardType="decimal-pad"
                                                        />
                                                        {errors.buyingPrice && (
                                                            <Text className="text-xs" style={{ color: "#ef4444" }}>
                                                                {errors.buyingPrice.message}
                                                            </Text>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </View>

                                        <View className="flex-1">
                                            <Controller
                                                control={control}
                                                name="sellingPrice"
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
                                                                borderColor: errors.sellingPrice ? "#ef4444" : colors.muted,
                                                            }}
                                                            placeholder="0.00"
                                                            placeholderTextColor={colors.placeholder}
                                                            keyboardType="decimal-pad"
                                                        />
                                                        {errors.sellingPrice && (
                                                            <Text className="text-xs" style={{ color: "#ef4444" }}>
                                                                {errors.sellingPrice.message}
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

                                    {/* Tags Section */}
                                    <View className="mb-4">
                                        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                            Tags (Optional)
                                        </Text>

                                        {/* Custom Tag Input */}
                                        <View className="flex-row gap-2 mb-3">
                                            <TextInput
                                                value={customTagInput}
                                                onChangeText={setCustomTagInput}
                                                onSubmitEditing={addCustomTag}
                                                className="flex-1 rounded-xl p-3"
                                                style={{
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    borderWidth: 1,
                                                    borderColor: colors.muted,
                                                }}
                                                placeholder="Type custom tag and press +"
                                                placeholderTextColor={colors.placeholder}
                                            />
                                            <TouchableOpacity
                                                onPress={addCustomTag}
                                                disabled={!customTagInput.trim()}
                                                className="px-4 rounded-xl items-center justify-center"
                                                style={{
                                                    backgroundColor: colors.primary,
                                                    opacity: !customTagInput.trim() ? 0.5 : 1,
                                                }}
                                            >
                                                <MaterialIcons name="add" size={24} color="#fff" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Selected Tags */}
                                        {selectedTags.length > 0 && (
                                            <View className="mb-3">
                                                <Text className="text-xs mb-2" style={{ color: colors.muted }}>
                                                    Selected Tags ({selectedTags.length}):
                                                </Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {selectedTags.map((tag, idx) => (
                                                        <View
                                                            key={idx}
                                                            className="flex-row items-center px-3 py-2 rounded-lg"
                                                            style={{ backgroundColor: colors.primary }}
                                                        >
                                                            <Text className="text-sm font-semibold text-white mr-2">
                                                                {tag}
                                                            </Text>
                                                            <TouchableOpacity onPress={() => removeSelectedTag(tag)}>
                                                                <MaterialIcons name="close" size={16} color="#fff" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Available Tags from API */}
                                        {tagsLoading ? (
                                            <View className="py-4">
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            </View>
                                        ) : tags.length > 0 ? (
                                            <>
                                                <Text className="text-xs mb-2" style={{ color: colors.muted }}>
                                                    Or select from available tags:
                                                </Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {tags.map((tag) => {
                                                        const isSelected = selectedTags.includes(tag.name);
                                                        return (
                                                            <TouchableOpacity
                                                                key={tag.id}
                                                                onPress={() => toggleTag(tag)}
                                                                className="px-3 py-2 rounded-lg"
                                                                style={{
                                                                    backgroundColor: isSelected
                                                                        ? colors.primary + "30"
                                                                        : colors.background,
                                                                    borderWidth: 1,
                                                                    borderColor: isSelected
                                                                        ? colors.primary
                                                                        : colors.muted,
                                                                }}
                                                            >
                                                                <Text
                                                                    className="text-sm font-semibold"
                                                                    style={{
                                                                        color: isSelected ? colors.primary : colors.text,
                                                                    }}
                                                                >
                                                                    {tag}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </>
                                        ) : (
                                            <Text className="text-sm text-center py-2" style={{ color: colors.muted }}>
                                                No tags available from API
                                            </Text>
                                        )}
                                    </View>

                                    {/* Status */}
                                    <Controller
                                        control={control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <>
                                                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                                    Status
                                                </Text>
                                                <View className="flex-row gap-3">
                                                    <TouchableOpacity
                                                        onPress={() => field.onChange(true)}
                                                        className="flex-1 p-4 rounded-xl flex-row items-center justify-center"
                                                        style={{
                                                            backgroundColor: field.value === true ? "#10b981" : colors.background,
                                                            borderWidth: 1,
                                                            borderColor: field.value === true ? "#10b981" : colors.muted,
                                                        }}
                                                    >
                                                        <MaterialIcons
                                                            name="check-circle"
                                                            size={20}
                                                            color={field.value === true ? "#fff" : colors.text}
                                                        />
                                                        <Text
                                                            className="ml-2 font-semibold"
                                                            style={{ color: field.value === true ? "#fff" : colors.text }}
                                                        >
                                                            In Stock
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => field.onChange(false)}
                                                        className="flex-1 p-4 rounded-xl flex-row items-center justify-center"
                                                        style={{
                                                            backgroundColor: field.value === false ? "#ef4444" : colors.background,
                                                            borderWidth: 1,
                                                            borderColor: field.value === false ? "#ef4444" : colors.muted,
                                                        }}
                                                    >
                                                        <MaterialIcons
                                                            name="cancel"
                                                            size={20}
                                                            color={field.value === false ? "#fff" : colors.text}
                                                        />
                                                        <Text
                                                            className="ml-2 font-semibold"
                                                            style={{ color: field.value === false ? "#fff" : colors.text }}
                                                        >
                                                            Out of Stock
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                                {errors.isActive && (
                                                    <Text className="text-xs mt-2" style={{ color: "#ef4444" }}>
                                                        {errors.isActive.message}
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                    />
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row gap-3 mt-4 mb-4">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setModalVisible(false);
                                            setEditingItem(null);
                                            setSelectedTags([]);
                                            setCustomTagInput("");
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
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteModal
                    visible={deleteModalVisible}
                    loading={deleteMutation.isPending}
                    onCancel={() => {
                        setDeleteModalVisible(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                />

            </View>
        </>
    );
}