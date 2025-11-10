import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ToastAndroid,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Divider } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import ModalSelector from "react-native-modal-selector";
import { useThemeContext } from "context/ThemeProvider";

export default function CreateOrderScreen() {
    const { colors } = useThemeContext();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [customer, setCustomer] = useState("");
    const [category, setCategory] = useState("");
    const [items, setItems] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);

    const [subtotal, setSubtotal] = useState(0);
    const deliveryFee = 10.0;
    const discount = 2.0;
    const orderId = route.params?.id || null;

    // Dummy customers & categories
    const customerList = Array.from({ length: 20 }, (_, i) => ({
        key: i + 1,
        label: `Customer ${i + 1}`,
    }));

    const categoryList = [
        { key: 1, label: "Fruits" },
        { key: 2, label: "Vegetables" },
        { key: 3, label: "Seafood" },
        { key: 4, label: "Dairy" },
        { key: 5, label: "Bakery" },
    ];

    // Load order if editing
    useEffect(() => {
        if (orderId) {
            const fetched = {
                customer: "Customer 3",
                category: "Fruits",
                cart: [{ id: 2, name: "Papaya", qty: 3, unit: "Bag", price: 24 }],
            };
            setCustomer(fetched.customer);
            setCategory(fetched.category);
            setCart(fetched.cart);
        }
    }, [orderId]);

    // Load mock items
    useEffect(() => {
        if (category) {
            setItems([
                { id: 1, name: "Carrot", price: 45, unit: "Bag" },
                { id: 2, name: "Papaya", price: 24, unit: "Bag" },
                { id: 3, name: "Fish", price: 15, unit: "Bag" },
                { id: 4, name: "Tomato", price: 12, unit: "Kg" },
                { id: 5, name: "Apple", price: 30, unit: "Kg" },
                { id: 6, name: "Banana", price: 10, unit: "Dozen" },
                { id: 7, name: "Mango", price: 50, unit: "Kg" },
                { id: 8, name: "Onion", price: 20, unit: "Kg" },
                { id: 9, name: "Pineapple", price: 25, unit: "Piece" },
            ]);
        } else {
            setItems([]);
        }
    }, [category]);

    // Recalculate subtotal
    useEffect(() => {
        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        setSubtotal(total);
    }, [cart]);

    const addToCart = (item: any) => {
        setCart((prev) => {
            const existing = prev.find((x) => x.id === item.id);
            if (existing) {
                return prev.map((x) =>
                    x.id === item.id ? { ...x, qty: x.qty + 1 } : x
                );
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const removeFromCart = (item: any) => {
        setCart((prev) => {
            const existing = prev.find((x) => x.id === item.id);
            if (!existing) return prev;
            if (existing.qty === 1) {
                return prev.filter((x) => x.id !== item.id);
            }
            return prev.map((x) =>
                x.id === item.id ? { ...x, qty: x.qty - 1 } : x
            );
        });
    };

    const handleSave = () => {
        if (!customer) {
            ToastAndroid.show("Please select customer", ToastAndroid.SHORT);
            return;
        }
        else if (!category) {
            ToastAndroid.show("Please select category", ToastAndroid.SHORT);
            return;
        }
        else if (cart.length === 0) {
            ToastAndroid.show("Cart is empty", ToastAndroid.SHORT);
            return;
        }

        const orderPayload = {
            id: orderId || Date.now(),
            customer,
            category,
            cart,
            subtotal,
            deliveryFee,
            discount,
            total: subtotal + deliveryFee - discount,
        };

        ToastAndroid.show(
            orderId ? "Order updated successfully!" : "Order created successfully!",
            ToastAndroid.SHORT
        );

        console.log("🧾 Order Data:", orderPayload);
    };

    const renderItem = useMemo(
        () =>
            ({ item }: any) => {
                const inCart = cart.find((x) => x.id === item.id);
                const quantity = inCart ? inCart.qty : 0;

                return (
                    <View
                        className="mb-2 flex-row items-center justify-between rounded-2xl p-4"
                        style={{
                            backgroundColor: colors.card,
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowOffset: { width: 0, height: 1 },
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <View>
                            <Text className="font-semibold text-base" style={{ color: colors.text }}>
                                {item.name}
                            </Text>
                            <Text className="text-sm opacity-70" style={{ color: colors.muted }}>
                                ${item.price}/{item.unit}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            {quantity > 0 && (
                                <TouchableOpacity onPress={() => removeFromCart(item)}>
                                    <Ionicons
                                        name="remove-circle-outline"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            )}
                            <Text className="mx-2 font-medium" style={{ color: colors.text }}>
                                {quantity || 0}
                            </Text>
                            <TouchableOpacity onPress={() => addToCart(item)}>
                                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            },
        [cart]
    );

    const headerComponent = (
        <View className="p-5">
            {/* Customer Selector */}
            <Text className="mb-2 text-md font-semibold" style={{ color: colors.text }}>
                Select Customer
            </Text>
            <ModalSelector
                data={customerList}
                initValue="Select Customer"
                onChange={(option) => setCustomer(option.label)}
                style={{
                    backgroundColor: colors.card,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.grey,
                }}
                selectStyle={{
                    borderColor: colors.grey,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 10,
                }}
                selectTextStyle={{ color: colors.text }}
                optionTextStyle={{ color: colors.text }}
                cancelStyle={{ backgroundColor: colors.card }}
                cancelTextStyle={{ color: colors.text, fontWeight: "600" }}
            >
                <Text style={{ color: colors.text, padding: 10 }}>
                    {customer || "Select Customer"}
                </Text>
            </ModalSelector>

            {/* Category Selector */}
            <Text className="mt-5 mb-2 text-md font-semibold" style={{ color: colors.text }}>
                Select Category
            </Text>
            <ModalSelector
                data={categoryList}
                initValue="Select Category"
                onChange={(option) => setCategory(option.label)}
                style={{
                    backgroundColor: colors.card,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.grey,
                }}
                selectStyle={{
                    borderColor: colors.grey,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 10,
                }}
                selectTextStyle={{ color: colors.text }}
                optionTextStyle={{ color: colors.text }}
                cancelStyle={{ backgroundColor: colors.card }}
                cancelTextStyle={{ color: colors.text, fontWeight: "600" }}
            >
                <Text style={{ color: colors.text, padding: 10 }}>
                    {category || "Select Category"}
                </Text>
            </ModalSelector>

            <Divider style={{ marginTop: 20, borderColor: colors.grey }} />
        </View>
    );

    const footerComponent = (
        <View className="p-5">
            <Text className="mb-2 text-base font-semibold" style={{ color: colors.text }}>
                Order Summary Preview
            </Text>

            {cart.map((item) => (
                <View key={item.id} className="mb-2 flex-row justify-between">
                    <Text className="text-sm" style={{ color: colors.text }}>
                        {item.qty} × {item.name}
                    </Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>
                        ${(item.price * item.qty).toFixed(2)}
                    </Text>
                </View>
            ))}

            <View className="my-3 border-t" style={{ borderColor: colors.grey }} />

            <View className="gap-3 mb-5">
                <View className="flex-row justify-between">
                    <Text className="text-md" style={{ color: colors.text }}>Subtotal</Text>
                    <Text className="text-md font-medium" style={{ color: colors.text }}>
                        ${subtotal.toFixed(2)}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-md" style={{ color: colors.text }}>Delivery Fee</Text>
                    <Text className="text-md font-medium" style={{ color: colors.text }}>
                        ${deliveryFee.toFixed(2)}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-md" style={{ color: colors.text }}>Discount</Text>
                    <Text className="text-md font-medium" style={{ color: colors.text }}>
                        ${discount.toFixed(2)}
                    </Text>
                </View>
                <View className="flex-row justify-between border-t pt-2" style={{ borderColor: colors.grey }}>
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        Total (incl. GST)
                    </Text>
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        ${(subtotal + deliveryFee - discount).toFixed(2)}
                    </Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-3 flex-row gap-3">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: colors.card }}
                >
                    <Text className="font-medium" style={{ color: colors.text }}>
                        Cancel
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSave}
                    className="flex-1 items-center rounded-xl py-3"
                    style={{ backgroundColor: colors.primary }}
                >
                    <Text className="font-medium text-white">
                        {orderId ? "Update" : "Create"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={headerComponent}
            ListFooterComponent={footerComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ backgroundColor: colors.background, flexGrow: 1 }}
        />
    );
}
