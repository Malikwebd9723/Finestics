// screens/CreateOrderScreen.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    ToastAndroid,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useThemeContext } from "context/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchProducts,
    fetchOrderById,
    createOrder,
    updateOrder,
    Customer,
    Product,
    CreateOrderPayload,
} from "api/actions/ordersActions";
import { fetchAllCustomers } from "api/actions/customerActions";

interface CartItem extends Product {
    qty: number;
}

export default function CreateOrderScreen() {
    const { colors } = useThemeContext();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const queryClient = useQueryClient();

    const orderId = route.params?.id || null;

    // State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [deliveryFee, setDeliveryFee] = useState("10.00");
    const [discount, setDiscount] = useState("2.00");
    const [notes, setNotes] = useState("");

    // Modal states
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [productSearch, setProductSearch] = useState("");

    // Fetch customers
    const { data: customersData, isLoading: customersLoading } = useQuery({
        queryKey: ["customers"],
        queryFn: fetchAllCustomers,
    });
    console.log(customersData);

    // Fetch products
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
    });


    // Fetch order if editing
    const { data: orderData } = useQuery({
        queryKey: ["order", orderId],
        queryFn: () => fetchOrderById(orderId),
        enabled: !!orderId,
    });

    // Load order data when editing
    useEffect(() => {
        if (orderData?.data) {
            const order = orderData.data;
            setSelectedCustomer(order.customer || null);
            setDeliveryFee(order.deliveryFee.toString());
            setDiscount(order.discount.toString());
            setNotes(order.notes || "");

            // Map order items to cart
            const cartItems = order.items.map((item) => ({
                id: item.productId,
                name: "", // Will be populated from products
                buyingPrice: 0,
                sellingPrice: item.price,
                unit: item.unit,
                status: "instock",
                qty: item.quantity,
            }));
            setCart(cartItems);
        }
    }, [orderData]);

    // Create order mutation
    const createMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (data) => {
            if (!data.success) {
                ToastAndroid.show("Failed to create order", ToastAndroid.LONG);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            navigation.goBack();
        },
        onError: (error: any) => {
            Alert.alert("Error", error?.response?.data?.message || "Failed to create order");
        },
    });

    // Update order mutation
    const updateMutation = useMutation({
        mutationFn: updateOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            Alert.alert("Success", "Order updated successfully!");
            navigation.goBack();
        },
        onError: (error: any) => {
            Alert.alert("Error", error?.response?.data?.message || "Failed to update order");
        },
    });

    // Calculations
    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + Number(item.sellingPrice) * item.qty, 0);
    }, [cart]);

    const total = useMemo(() => {
        return subtotal + parseFloat(deliveryFee || "0") - parseFloat(discount || "0");
    }, [subtotal, deliveryFee, discount]);

    // Cart operations
    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((x) => x.id === product.id);
            if (existing) {
                return prev.map((x) =>
                    x.id === product.id ? { ...x, qty: x.qty + 1 } : x
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => {
            const existing = prev.find((x) => x.id === productId);
            if (!existing) return prev;
            if (existing.qty === 1) {
                return prev.filter((x) => x.id !== productId);
            }
            return prev.map((x) =>
                x.id === productId ? { ...x, qty: x.qty - 1 } : x
            );
        });
    };

    const updateQuantity = (productId: number, qty: number) => {
        if (qty <= 0) {
            setCart((prev) => prev.filter((x) => x.id !== productId));
            return;
        }
        setCart((prev) =>
            prev.map((x) => (x.id === productId ? { ...x, qty } : x))
        );
    };

    // Submit order
    const handleSubmit = () => {
        if (!selectedCustomer) {
            Alert.alert("Validation Error", "Please select a customer");
            return;
        }
        if (cart.length === 0) {
            Alert.alert("Validation Error", "Please add items to cart");
            return;
        }

        const payload: CreateOrderPayload = {
            customerId: selectedCustomer.id,
            items: cart.map((item) => ({
                productId: item.id,
                quantity: item.qty,
                price: item.sellingPrice,
                unit: item.unit,
            })),
            subtotal,
            deliveryFee: parseFloat(deliveryFee || "0"),
            discount: parseFloat(discount || "0"),
            total,
            notes: notes || undefined,
        };

        if (orderId) {
            updateMutation.mutate({ ...payload, orderId });
        } else {
            createMutation.mutate(payload);
        }
    };

    // Filter functions
    const filteredCustomers = useMemo(() => {
        if (!customersData?.data) return [];
        if (!customerSearch) return customersData.data;
        return customersData.data.filter((customer) =>
            customer.businessName.toLowerCase().includes(customerSearch.toLowerCase()) ||
            customer.contactPerson.toLowerCase().includes(customerSearch.toLowerCase()) ||
            customer.email.toLowerCase().includes(customerSearch.toLowerCase())
        );
    }, [customersData, customerSearch]);

    const filteredProducts = useMemo(() => {
        if (!productsData?.data) return [];
        const inStockProducts = productsData.data.filter(p => p.isActive);
        if (!productSearch) return inStockProducts;
        return inStockProducts.filter((product) =>
            product.name.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [productsData, productSearch]);

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold" style={{ color: colors.text }}>
                        {orderId ? "Update Order" : "Create Order"}
                    </Text>
                </View>
            </View>

            <FlatList
                data={cart}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListHeaderComponent={
                    <View className="px-5">
                        {/* Customer Selection */}
                        <View className="mb-4">
                            <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                                Customer <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setCustomerModalVisible(true)}
                                className="rounded-xl p-4 flex-row items-center justify-between"
                                style={{
                                    backgroundColor: colors.card,
                                    borderWidth: 1,
                                    borderColor: selectedCustomer ? colors.primary : colors.muted,
                                }}
                                disabled={isLoading}
                            >
                                {selectedCustomer ? (
                                    <View className="flex-1">
                                        <Text className="font-semibold" style={{ color: colors.text }}>
                                            {selectedCustomer.businessName}
                                        </Text>
                                        <Text className="text-xs" style={{ color: colors.muted }}>
                                            {selectedCustomer.contactPerson} • {selectedCustomer.phone}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={{ color: colors.placeholder }}>Select Customer</Text>
                                )}
                                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Add Items Button */}
                        <TouchableOpacity
                            onPress={() => setProductModalVisible(true)}
                            className="mb-4 rounded-xl p-4 flex-row items-center justify-center"
                            style={{
                                backgroundColor: colors.primary,
                                opacity: isLoading ? 0.5 : 1,
                            }}
                            disabled={isLoading}
                        >
                            <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
                            <Text className="ml-2 font-bold text-white">Add Items to Cart</Text>
                        </TouchableOpacity>

                        {/* Cart Items Header */}
                        {cart.length > 0 && (
                            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
                                Cart Items ({cart.length})
                            </Text>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-16 px-5">
                        <MaterialIcons name="shopping-cart" size={64} color={colors.muted} />
                        <Text className="mt-4 text-center text-base" style={{ color: colors.text }}>
                            No items in cart
                        </Text>
                        <Text className="mt-2 text-center text-sm" style={{ color: colors.muted }}>
                            Tap "Add Items to Cart" to get started
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View
                        className="mx-5 mb-3 rounded-2xl p-4"
                        style={{
                            backgroundColor: colors.card,
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowOffset: { width: 0, height: 1 },
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="font-semibold text-base" style={{ color: colors.text }}>
                                    {item.name}
                                </Text>
                                <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                                    ${Number(item.sellingPrice).toFixed(2)} / {item.unit}
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <TouchableOpacity
                                    onPress={() => removeFromCart(item.id)}
                                    disabled={isLoading}
                                >
                                    <Ionicons
                                        name="remove-circle-outline"
                                        size={28}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                                <TextInput
                                    value={item.qty.toString()}
                                    onChangeText={(text) => {
                                        const qty = parseInt(text) || 0;
                                        updateQuantity(item.id, qty);
                                    }}
                                    keyboardType="numeric"
                                    className="mx-3 w-12 text-center font-semibold rounded-lg p-2"
                                    style={{
                                        color: colors.text,
                                        backgroundColor: colors.background,
                                        borderWidth: 1,
                                        borderColor: colors.muted,
                                    }}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => addToCart(item)}
                                    disabled={isLoading}
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={28}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: colors.muted }}>
                            <Text className="text-sm font-medium" style={{ color: colors.text }}>
                                Subtotal:
                            </Text>
                            <Text className="text-base font-bold" style={{ color: colors.primary }}>
                                ${(Number(item.sellingPrice) * item.qty).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                )}
                ListFooterComponent={
                    cart.length > 0 ? (
                        <View className="px-5 mt-4">
                            {/* Additional Charges */}
                            <View className="mb-4">
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                                            Delivery Fee
                                        </Text>
                                        <TextInput
                                            value={deliveryFee}
                                            onChangeText={setDeliveryFee}
                                            keyboardType="decimal-pad"
                                            className="rounded-xl p-4"
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderWidth: 1,
                                                borderColor: colors.muted,
                                            }}
                                            placeholder="0.00"
                                            placeholderTextColor={colors.placeholder}
                                            editable={!isLoading}
                                        />
                                    </View>

                                    <View className="flex-1">
                                        <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                                            Discount
                                        </Text>
                                        <TextInput
                                            value={discount}
                                            onChangeText={setDiscount}
                                            keyboardType="decimal-pad"
                                            className="rounded-xl p-4"
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderWidth: 1,
                                                borderColor: colors.muted,
                                            }}
                                            placeholder="0.00"
                                            placeholderTextColor={colors.placeholder}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Notes */}
                            <View className="mb-4">
                                <Text className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
                                    Notes (Optional)
                                </Text>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    numberOfLines={3}
                                    className="rounded-xl p-4"
                                    style={{
                                        backgroundColor: colors.card,
                                        color: colors.text,
                                        borderWidth: 1,
                                        borderColor: colors.muted,
                                        minHeight: 80,
                                        textAlignVertical: "top",
                                    }}
                                    placeholder="Add order notes..."
                                    placeholderTextColor={colors.placeholder}
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Order Summary */}
                            <View
                                className="rounded-2xl p-4 mb-4"
                                style={{
                                    backgroundColor: colors.card,
                                    borderWidth: 1,
                                    borderColor: colors.primary,
                                }}
                            >
                                <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>
                                    Order Summary
                                </Text>

                                <View className="gap-2">
                                    <View className="flex-row justify-between">
                                        <Text style={{ color: colors.text }}>Subtotal</Text>
                                        <Text className="font-semibold" style={{ color: colors.text }}>
                                            ${subtotal.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text style={{ color: colors.text }}>Delivery Fee</Text>
                                        <Text className="font-semibold" style={{ color: colors.text }}>
                                            ${parseFloat(deliveryFee || "0").toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text style={{ color: colors.text }}>Discount</Text>
                                        <Text className="font-semibold" style={{ color: colors.text }}>
                                            -${parseFloat(discount || "0").toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between pt-2 mt-2 border-t" style={{ borderColor: colors.muted }}>
                                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                                            Total
                                        </Text>
                                        <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                                            ${total.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3 mb-4">
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    disabled={isLoading}
                                    className="flex-1 py-4 rounded-xl items-center"
                                    style={{
                                        backgroundColor: colors.card,
                                        borderWidth: 1,
                                        borderColor: colors.muted,
                                        opacity: isLoading ? 0.5 : 1,
                                    }}
                                >
                                    <Text className="font-bold" style={{ color: colors.text }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 py-4 rounded-xl items-center"
                                    style={{
                                        backgroundColor: colors.primary,
                                        opacity: isLoading ? 0.7 : 1,
                                    }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="font-bold text-white">
                                            {orderId ? "Update Order" : "Create Order"}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Customer Selection Modal */}
            <Modal
                visible={customerModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCustomerModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View
                        className="rounded-t-3xl p-6"
                        style={{ backgroundColor: colors.card, maxHeight: "80%" }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                Select Customer
                            </Text>
                            <TouchableOpacity
                                onPress={() => setCustomerModalVisible(false)}
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: colors.background }}
                            >
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            value={customerSearch}
                            onChangeText={setCustomerSearch}
                            className="rounded-xl p-4 mb-4"
                            style={{
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderWidth: 1,
                                borderColor: colors.muted,
                            }}
                            placeholder="Search customers..."
                            placeholderTextColor={colors.placeholder}
                        />

                        {customersLoading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : (
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedCustomer(item);
                                            setCustomerModalVisible(false);
                                            setCustomerSearch("");
                                        }}
                                        className="p-4 mb-2 rounded-xl"
                                        style={{
                                            backgroundColor: selectedCustomer?.id === item.id ? colors.primary + "20" : colors.background,
                                            borderWidth: 1,
                                            borderColor: selectedCustomer?.id === item.id ? colors.primary : colors.muted,
                                        }}
                                    >
                                        <Text className="font-semibold" style={{ color: colors.text }}>
                                            {item.businessName}
                                        </Text>
                                        <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                                            {item.contactPerson} • {item.phone}
                                        </Text>
                                        <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                                            {item.email}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text className="text-center py-8" style={{ color: colors.muted }}>
                                        No customers found
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Product Selection Modal */}
            <Modal
                visible={productModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setProductModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View
                        className="rounded-t-3xl p-6"
                        style={{ backgroundColor: colors.card, maxHeight: "80%" }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                Select Products
                            </Text>
                            <TouchableOpacity
                                onPress={() => setProductModalVisible(false)}
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={{ backgroundColor: colors.background }}
                            >
                                <MaterialIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            value={productSearch}
                            onChangeText={setProductSearch}
                            className="rounded-xl p-4 mb-4"
                            style={{
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderWidth: 1,
                                borderColor: colors.muted,
                            }}
                            placeholder="Search products..."
                            placeholderTextColor={colors.placeholder}
                        />

                        {productsLoading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : (
                            <FlatList
                                data={filteredProducts}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => {
                                    const inCart = cart.find((x) => x.id === item.id);
                                    return (
                                        <View
                                            className="flex-row items-center justify-between p-4 mb-2 rounded-xl"
                                            style={{
                                                backgroundColor: colors.background,
                                                borderWidth: 1,
                                                borderColor: inCart ? colors.primary : colors.muted,
                                            }}
                                        >
                                            <View className="flex-1">
                                                <Text className="font-semibold" style={{ color: colors.text }}>
                                                    {item.name}
                                                </Text>
                                                <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                                                    ${Number(item.sellingPrice).toFixed(2)} / {item.unit}
                                                </Text>
                                            </View>

                                            {inCart ? (
                                                <View className="flex-row items-center">
                                                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                                        <Ionicons name="remove-circle" size={24} color={colors.primary} />
                                                    </TouchableOpacity>
                                                    <Text className="mx-3 font-semibold" style={{ color: colors.text }}>
                                                        {inCart.qty}
                                                    </Text>
                                                    <TouchableOpacity onPress={() => addToCart(item)}>
                                                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        addToCart(item);
                                                    }}
                                                    className="px-4 py-2 rounded-lg"
                                                    style={{ backgroundColor: colors.primary }}
                                                >
                                                    <Text className="font-semibold text-white">Add</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                }}
                                ListEmptyComponent={
                                    <Text className="text-center py-8" style={{ color: colors.muted }}>
                                        No products available
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}