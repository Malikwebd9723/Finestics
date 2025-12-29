// components/CustomerDetailModal.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    Pressable,
    ScrollView,
    Animated,
    Dimensions,
    ActivityIndicator,
    Alert,
    ToastAndroid,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeContext } from "context/ThemeProvider";
import { deleteCustomer, fetchCustomersDetails } from "api/actions/customerActions";
import ConfirmDeleteModal from "components/DeleteConfirmationModal";

const { height } = Dimensions.get("window");

interface Address {
    id: number;
    customerId: number;
    type: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    instructions: string | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Customer {
    id: number;
    vendorId: number;
    businessName: string;
    contactPerson: string;
    phone: string;
    alternatePhone: string | null;
    email: string;
    creditLimit: string;
    currentBalance: string;
    paymentTerms: string;
    businessType: string;
    status: string;
    notes: string | null;
    deliveryInstructions: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    address?: Address[];
}

interface CustomerDetailResponse {
    success: boolean;
    data: Customer;
}

interface CustomerDetailModalProps {
    visible: boolean;
    userId: number | null;
    onClose: () => void;
}

export default function CustomerDetailModal({
    visible,
    userId,
    onClose,
}: CustomerDetailModalProps) {
    const { colors } = useThemeContext();
    const queryClient = useQueryClient();
    const [slideAnim] = useState(new Animated.Value(height));
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    // Fetch customer details
    const { data, isLoading, error } = useQuery<CustomerDetailResponse>({
        queryKey: ["customerDetail", userId],
        queryFn: () => fetchCustomersDetails(userId!),
        enabled: !!userId && visible,
    });

    // Delete customer mutation
    const deleteCustomerMutation = useMutation({
        mutationFn: (customerId: number) => deleteCustomer(customerId),
        onSuccess: () => {
            ToastAndroid.show("Customer deleted successfully!", ToastAndroid.SHORT);
            queryClient.invalidateQueries({ queryKey: ["Customers"] });
            queryClient.invalidateQueries({ queryKey: ["Customers", "allCustomers"] });
            setDeleteModalVisible(false);
            onClose();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to delete customer";
            ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
        },
    });

    // Slide animation
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleDeleteCustomer = () => {
        if (userId) {
            deleteCustomerMutation.mutate(userId);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return colors.success;
            case "inactive":
                return colors.error;
            case "pending":
                return "#f59e0b";
            default:
                return colors.muted;
        }
    };

    const getBusinessTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            restaurant: "Restaurant",
            retailer: "Retailer",
            wholesaler: "Wholesaler",
            hotel: "Hotel",
            cafe: "Café",
            other: "Other",
        };
        return types[type] || type;
    };

    const getPaymentTermsLabel = (terms: string) => {
        const termLabels: Record<string, string> = {
            cash: "Cash",
            net_7: "Net 7 Days",
            net_15: "Net 15 Days",
            net_30: "Net 30 Days",
            net_60: "Net 60 Days",
            net_90: "Net 90 Days",
        };
        return termLabels[terms] || terms;
    };

    const getInitials = (name: string) => {
        const words = name.trim().split(" ");
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50">
                <Pressable className="flex-1" onPress={onClose} />

                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                        backgroundColor: colors.card,
                        height: height * 0.85,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 20,
                    }}
                >
                    {/* Header */}
                    <View
                        className="flex-row items-center justify-between p-5 border-b"
                        style={{ borderColor: colors.border }}
                    >
                        <Text className="text-xl font-bold" style={{ color: colors.text }}>
                            Customer Details
                        </Text>
                        <Pressable
                            onPress={onClose}
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.background }}
                        >
                            <MaterialIcons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    {/* Content */}
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text className="mt-4 text-base" style={{ color: colors.text }}>
                                Loading customer details...
                            </Text>
                        </View>
                    ) : error ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <MaterialIcons name="error-outline" size={64} color={colors.error} />
                            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                                Failed to load details
                            </Text>
                            <Text className="text-sm mt-2" style={{ color: colors.muted }}>
                                Please try again later
                            </Text>
                        </View>
                    ) : data?.data ? (
                        <>
                            <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
                                {/* Business Info Card */}
                                <View
                                    className="p-5 rounded-3xl mb-4"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <View className="flex-row items-center mb-4">
                                        <View
                                            className="w-16 h-16 rounded-full items-center justify-center"
                                            style={{ backgroundColor: colors.primary + "20" }}
                                        >
                                            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                                                {getInitials(data.data.businessName)}
                                            </Text>
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                                {data.data.businessName}
                                            </Text>
                                            <View
                                                className="px-3 py-1 rounded-full self-start mt-1"
                                                style={{ backgroundColor: getStatusColor(data.data.status) + "20" }}
                                            >
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: getStatusColor(data.data.status) }}
                                                >
                                                    {data.data.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="space-y-2">
                                        <InfoRow
                                            icon="person"
                                            label="Contact Person"
                                            value={data.data.contactPerson}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="phone"
                                            label="Phone"
                                            value={data.data.phone}
                                            colors={colors}
                                        />
                                        {data.data.alternatePhone && (
                                            <InfoRow
                                                icon="phone"
                                                label="Alternate Phone"
                                                value={data.data.alternatePhone}
                                                colors={colors}
                                            />
                                        )}
                                        <InfoRow
                                            icon="email"
                                            label="Email"
                                            value={data.data.email}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="business"
                                            label="Business Type"
                                            value={getBusinessTypeLabel(data.data.businessType)}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="event"
                                            label="Joined"
                                            value={formatDate(data.data.createdAt)}
                                            colors={colors}
                                        />
                                    </View>
                                </View>

                                {/* Financial Information */}
                                <View
                                    className="p-5 rounded-3xl mb-4"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <View className="flex-row items-center mb-3">
                                        <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
                                        <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                                            Financial Information
                                        </Text>
                                    </View>

                                    <InfoRow
                                        icon="credit-card"
                                        label="Payment Terms"
                                        value={getPaymentTermsLabel(data.data.paymentTerms)}
                                        colors={colors}
                                    />
                                    <InfoRow
                                        icon="trending-up"
                                        label="Credit Limit"
                                        value={`${parseFloat(data.data.creditLimit).toLocaleString()}`}
                                        colors={colors}
                                    />
                                    <InfoRow
                                        icon="account-balance"
                                        label="Current Balance"
                                        value={`${parseFloat(data.data.currentBalance).toLocaleString()}`}
                                        colors={colors}
                                        badge
                                        badgeColor={parseFloat(data.data.currentBalance) > 0 ? colors.error : colors.success}
                                    />
                                </View>

                                {/* Address Information */}
                                {data.data.address && (
                                    <View
                                        className="p-5 rounded-3xl mb-4"
                                        style={{ backgroundColor: colors.background }}
                                    >
                                        <View className="flex-row items-center mb-3">
                                            <MaterialIcons name="location-on" size={24} color={colors.primary} />
                                            <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                                                Address Information
                                            </Text>
                                        </View>

                                        <View className="mb-3">
                                            <View className="flex-row items-center mb-2">
                                                <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
                                                    Label:
                                                </Text>
                                                <View
                                                    className="px-3 py-1 rounded-lg ml-2"
                                                    style={{ backgroundColor: colors.primary + "20" }}
                                                >
                                                    <Text
                                                        className="text-xs font-bold"
                                                        style={{ color: colors.primary }}
                                                    >
                                                        {data.data.address.label}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Text className="text-sm font-semibold" style={{ color: colors.muted }}>
                                                    Type:
                                                </Text>
                                                <View
                                                    className="px-3 py-1 rounded-lg ml-2"
                                                    style={{ backgroundColor: colors.primary + "20" }}
                                                >
                                                    <Text
                                                        className="text-xs font-semibold capitalize"
                                                        style={{ color: colors.primary }}
                                                    >
                                                        {data.data.address.type}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                            Street:
                                        </Text>
                                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                                            {data.data.address.street}
                                        </Text>

                                        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                            City/State/Postal:
                                        </Text>
                                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                                            {data.data.address.city}, {data.data.address.state} {data.data.address.postalCode}
                                        </Text>

                                        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                                            Country:
                                        </Text>
                                        <Text className="text-sm mb-3" style={{ color: colors.muted }}>
                                            {data.data.address.country}
                                        </Text>

                                        {data.data.address.instructions && data.data.address.instructions !== "None" && (
                                            <View
                                                className="mt-2 p-3 rounded-lg"
                                                style={{ backgroundColor: colors.card }}
                                            >
                                                <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
                                                    Instructions:
                                                </Text>
                                                <Text className="text-xs" style={{ color: colors.muted }}>
                                                    {data.data.address.instructions}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </ScrollView>

                            {/* Action Buttons */}
                            <View className="p-5 border-t" style={{ borderColor: colors.border }}>
                                <Pressable
                                    onPress={() => setDeleteModalVisible(true)}
                                    className="py-3 rounded-xl items-center justify-center flex-row"
                                    style={{ backgroundColor: colors.error + "20", borderWidth: 1, borderColor: colors.error }}
                                >
                                    <MaterialIcons name="delete" size={20} color={colors.error} />
                                    <Text className="text-sm font-bold ml-2" style={{ color: colors.error }}>
                                        Delete Customer
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Delete Confirmation Modal */}
                            <ConfirmDeleteModal
                                visible={deleteModalVisible}
                                loading={deleteCustomerMutation.isPending}
                                onCancel={() => {
                                    setDeleteModalVisible(false);
                                }}
                                onConfirm={handleDeleteCustomer}
                            />
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center px-6">
                            <MaterialIcons name="error-outline" size={64} color={colors.muted} />
                            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                                No customer data available
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

// Helper Component
const InfoRow = ({
    icon,
    label,
    value,
    colors,
    badge,
    badgeColor,
}: {
    icon: string;
    label: string;
    value: string;
    colors: any;
    badge?: boolean;
    badgeColor?: string;
}) => (
    <View className="flex-row items-center py-2">
        <MaterialIcons name={icon as any} size={18} color={colors.muted} />
        <Text className="text-sm ml-2 w-32" style={{ color: colors.muted }}>
            {label}:
        </Text>
        {badge ? (
            <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: (badgeColor || colors.primary) + "20" }}
            >
                <Text
                    className="text-xs font-semibold"
                    style={{ color: badgeColor || colors.primary }}
                >
                    {value}
                </Text>
            </View>
        ) : (
            <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>
                {value}
            </Text>
        )}
    </View>
);