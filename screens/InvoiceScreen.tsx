import React, { useRef } from "react";
import {
    View,
    Text,
    Pressable,
    ScrollView,
    ToastAndroid,
    Alert,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";

export default function InvoiceScreen() {
    const { colors } = useThemeContext();
    const invoiceRef = useRef<View>(null); // ✅ Reference to the container you want to capture

    const handleDownload = async () => {
        try {
            // Ask for media library permissions
            try {
                const res = await MediaLibrary.requestPermissionsAsync();
                if (res.status !== "granted") {
                    Alert.alert("Permission Denied", "Cannot save without gallery access.");
                    return;
                }
            } catch (err) {
                console.log("Media permission error:", err);
                Alert.alert("Permission Error", "This feature requires a custom build (not Expo Go).");
            }

            // Capture the invoice container only
            const uri = await captureRef(invoiceRef, {
                format: "jpg",
                quality: 1,
            });

            // Save to device gallery
            const fileName = `Invoice_${Date.now()}.png`;
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
            await FileSystem.copyAsync({ from: uri, to: fileUri });

            const asset = await MediaLibrary.createAssetAsync(fileUri);
            await MediaLibrary.createAlbumAsync("Invoices", asset, false);

            showToast("Invoice saved to gallery!");
            console.log("Invoice saved:", asset.uri);
        } catch (error) {
            console.error("Error saving invoice:", error);
            showToast("Failed to save invoice!");
        }
    };

    function showToast(msg: string) {
        if (Platform.OS === "android") {
            ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
            Alert.alert(msg);
        }
    }

    return (
        <ScrollView
            className="flex-1 p-5"
            style={{ backgroundColor: colors.background }}
            showsVerticalScrollIndicator={false}
        >
            {/* ✅ This is OUTSIDE the captured view */}
            <View className="mb-3">
                <Text
                    className="text-lg font-semibold text-center"
                    style={{ color: colors.text }}
                >
                    Invoice Preview
                </Text>
            </View>

            {/* ✅ Only this container will be captured */}
            <View ref={invoiceRef} collapsable={false} className="px-3">
                {/* Success Icon */}
                <View className="my-4 items-center">
                    <View
                        className="mb-3 h-20 w-20 items-center justify-center rounded-full"
                        style={{ backgroundColor: "#E7F9EF" }}
                    >
                        <Ionicons name="checkmark" size={48} color="#1DB954" />
                    </View>
                    <Text
                        className="mb-1 text-xl font-semibold"
                        style={{ color: colors.text }}
                    >
                        Order #3445456845
                    </Text>
                    <Text className="text-sm" style={{ color: colors.subtext }}>
                        Delivered on 12 July 2025
                    </Text>
                </View>

                {/* Address Section */}
                <View className="mb-5 flex-row items-start">
                    <Ionicons
                        name="location-outline"
                        size={20}
                        color={colors.text}
                        style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <View>
                        <Text
                            className="text-sm font-semibold"
                            style={{ color: colors.text }}
                        >
                            Delivered to
                        </Text>
                        <Text className="text-sm" style={{ color: colors.subtext }}>
                            Complete address of customer
                        </Text>
                    </View>
                </View>

                {/* Items List */}
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        className="mb-2 flex-row justify-between pb-1"
                    >
                        <Text style={{ color: colors.text }}>
                            2 bags Mangoes
                        </Text>
                        <Text
                            style={{ color: colors.text }}
                        >
                            $24.00
                        </Text>
                    </View>
                ))}

                {/* Divider */}
                <View
                    className="my-3 border-t"
                    style={{ borderColor: colors.border }}
                />

                {/* Price Summary */}
                <View className="mb-5 space-y-2">
                    <View className="flex-row justify-between">
                        <Text className="text-md" style={{ color: colors.text }}>
                            Subtotal
                        </Text>
                        <Text
                            className="text-sm font-medium"
                            style={{ color: colors.text }}
                        >
                            $824.00
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-md" style={{ color: colors.text }}>
                            Delivery Fee
                        </Text>
                        <Text
                            className="text-md font-medium"
                            style={{ color: colors.text }}
                        >
                            $10.00
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-md" style={{ color: colors.text }}>
                            Discount
                        </Text>
                        <Text
                            className="text-sm font-medium"
                            style={{ color: colors.text }}
                        >
                            $2.00
                        </Text>
                    </View>
                    <View
                        className="mt-2 flex-row justify-between border-t pt-2"
                        style={{ borderColor: colors.border }}
                    >
                        <Text
                            className="text-lg font-semibold"
                            style={{ color: colors.text }}
                        >
                            Total (incl. GST)
                        </Text>
                        <Text
                            className="text-lg font-semibold"
                            style={{ color: colors.text }}
                        >
                            $832.00
                        </Text>
                    </View>
                </View>

                {/* Payment Section */}
                <View
                    className="mb-4 flex-row items-center justify-between rounded-xl p-3"
                    style={{ backgroundColor: colors.card }}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="cash-outline" size={20} color={colors.text} />
                        <Text className="ml-2 text-sm" style={{ color: colors.text }}>
                            Cash on delivery COD
                        </Text>
                    </View>
                    <Text className="font-medium" style={{ color: colors.text }}>
                        $832.00
                    </Text>
                </View>
            </View>

            {/* ✅ Download Invoice Button (NOT captured) */}
            <Pressable
                onPress={handleDownload}
                className="flex-row items-center justify-between rounded-xl p-3 mt-4"
                style={{ backgroundColor: colors.primary }}
            >
                <View className="flex-row items-center">
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text className="ml-2 text-sm font-medium text-white">
                        Download Invoice Image
                    </Text>
                </View>
            </Pressable>
        </ScrollView>
    );
};