// components/UserDetailModal.tsx
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
    TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeContext } from "context/ThemeProvider";
import { deleteUserAccount, fetchUserDetail, updateAccountStatus, updateUserRole } from "api/actions/userActions";
import Snackbar, { useSnackbar } from "components/Snackbar";

const { height } = Dimensions.get("window");

interface UserDetailModalProps {
    visible: boolean;
    userId: number | null;
    onClose: () => void;
}

export default function UserDetailModal({
    visible,
    userId,
    onClose,
}: UserDetailModalProps) {
    const { colors } = useThemeContext();
    const queryClient = useQueryClient();
    const [slideAnim] = useState(new Animated.Value(height));
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const snackbar = useSnackbar();

    const handleSuccess = (message: string, closeModal = false) => {
        queryClient.invalidateQueries({ queryKey: ["users"], refetchType: "all" });
        queryClient.invalidateQueries({ queryKey: ["userDetail", userId] });
        snackbar.showSuccess(message);
        if (closeModal) {
            setTimeout(() => onClose(), 500);
        }
    };

    const handleError = (response: any, defaultMessage: string) => {
        const errorMessage = response?.data?.error?.message || response?.data?.message || response?.message || defaultMessage;
        snackbar.showError(errorMessage);
    };

    // Fetch user details
    const { data: apiResponse, isLoading, error } = useQuery({
        queryKey: ["userDetail", userId],
        queryFn: () => fetchUserDetail(userId!),
        enabled: !!userId && visible,
    });

    // Extract user data from response (API returns { success, data: { user object } })
    const user = apiResponse?.data;

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: number; role: string }) =>
            updateUserRole(userId, role),
        onSuccess: (response) => {
            if (response.success) {
                setShowRoleDialog(false);
                handleSuccess(response.data?.message || "User role updated!");
            } else {
                handleError(response, "Failed to update role");
            }
        },
        onError: (error: any) => {
            handleError(error, "Failed to update role");
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: number; status: string }) =>
            updateAccountStatus(userId, status),
        onSuccess: (response) => {
            if (response.success) {
                setShowStatusDialog(false);
                handleSuccess(response.data?.message || "Account status updated!");
            } else {
                handleError(response, "Failed to update status");
            }
        },
        onError: (error: any) => {
            handleError(error, "Failed to update status");
        },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: ({ userId }: { userId: number }) => deleteUserAccount(userId),
        onSuccess: (response) => {
            if (response.success) {
                setShowDeleteDialog(false);
                handleSuccess(response.data?.message || "User account deleted!", true);
            } else {
                handleError(response, "Failed to delete user");
            }
        },
        onError: (error: any) => {
            handleError(error, "Failed to delete user");
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

    const handleRoleChange = (newRole: string) => {
        updateRoleMutation.mutate({ userId: userId!, role: newRole });
    };

    const handleStatusChange = (newStatus: string) => {
        updateStatusMutation.mutate({ userId: userId!, status: newStatus });
    };

    const handleDeleteUser = () => {
        deleteUserMutation.mutate({ userId: userId! });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return colors.success;
            case "pending":
                return "#f59e0b";
            case "suspended":
                return colors.error;
            case "deleted":
                return "#6b7280";
            default:
                return "#6b7280";
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin":
                return "#8b5cf6";
            case "vendor":
                return "#3b82f6";
            case "customer":
                return "#10b981";
            default:
                return colors.muted;
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Pressable style={{ height: height * 0.15 }} onPress={onClose} />

                <Animated.View
                    style={{
                        flex: 1,
                        transform: [{ translateY: slideAnim }],
                        backgroundColor: colors.card,
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
                            User Details
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
                            <Text className="mt-4 text-base" style={{ color: colors.muted }}>
                                Loading user details...
                            </Text>
                        </View>
                    ) : error ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <MaterialIcons name="error-outline" size={64} color={colors.error} />
                            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                                Failed to load details
                            </Text>
                        </View>
                    ) : user ? (
                        <>
                            <ScrollView className="flex-1 px-5 py-4">
                                {/* User Info Card */}
                                <View
                                    className="p-4 rounded-3xl mb-4"
                                    style={{ backgroundColor: colors.background }}
                                >
                                    <View className="flex-row items-center mb-3">
                                        <View
                                            className="w-16 h-16 rounded-full items-center justify-center"
                                            style={{ backgroundColor: getRoleColor(user.role) + "20" }}
                                        >
                                            <Text className="text-2xl font-bold" style={{ color: getRoleColor(user.role) }}>
                                                {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                                            </Text>
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                                {user.firstName} {user.lastName}
                                            </Text>
                                            <View
                                                className="px-3 py-1 rounded-full self-start mt-1"
                                                style={{ backgroundColor: getRoleColor(user.role) + "30" }}
                                            >
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: getRoleColor(user.role) }}
                                                >
                                                    {user.role?.toUpperCase() || 'N/A'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="space-y-2">
                                        <InfoRow icon="email" label="Email" value={user.email || 'N/A'} colors={colors} />
                                        <InfoRow icon="phone" label="Phone" value={user.phone || "Not provided"} colors={colors} />
                                        <InfoRow
                                            icon="verified-user"
                                            label="Account Status"
                                            value={user.accountStatus || 'N/A'}
                                            colors={colors}
                                            badge
                                            badgeColor={getStatusColor(user.accountStatus)}
                                        />
                                        <InfoRow
                                            icon="check-circle"
                                            label="Email Verified"
                                            value={user.isEmailVerified ? "Yes" : "No"}
                                            colors={colors}
                                            badge
                                            badgeColor={user.isEmailVerified ? colors.success : colors.error}
                                        />
                                        <InfoRow icon="access-time" label="Last Login" value={formatDate(user.lastLoginAt)} colors={colors} />
                                        <InfoRow icon="event" label="Joined" value={formatDate(user.createdAt)} colors={colors} />
                                    </View>
                                </View>

                                {/* Customer Profile */}
                                {user.customerProfile && (
                                    <View
                                        className="p-4 rounded-3xl mb-4"
                                        style={{ backgroundColor: colors.background }}
                                    >
                                        <View className="flex-row items-center mb-3">
                                            <MaterialIcons name="person" size={24} color={colors.primary} />
                                            <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                                                Customer Profile
                                            </Text>
                                        </View>
                                        <Text className="text-sm" style={{ color: colors.muted }}>
                                            Profile ID: {user.customerProfile.id}
                                        </Text>
                                    </View>
                                )}

                                {/* Addresses */}
                                {user.addresses && user.addresses.length > 0 && (
                                    <View
                                        className="p-4 rounded-3xl mb-4"
                                        style={{ backgroundColor: colors.background }}
                                    >
                                        <View className="flex-row items-center mb-3">
                                            <MaterialIcons name="location-on" size={24} color={colors.primary} />
                                            <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                                                Addresses
                                            </Text>
                                        </View>
                                        {user.addresses.map((address: any, index: number) => (
                                            <View key={address.id || index} className="mb-2">
                                                <Text className="text-sm" style={{ color: colors.text }}>
                                                    {address.street}, {address.city}
                                                </Text>
                                                <Text className="text-xs" style={{ color: colors.muted }}>
                                                    {address.state}, {address.postalCode}, {address.country}
                                                </Text>
                                                {address.isDefault && (
                                                    <View className="mt-1 self-start px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '20' }}>
                                                        <Text className="text-xs" style={{ color: colors.primary }}>Default</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Bottom spacer */}
                                <View className="h-4" />
                            </ScrollView>

                            {/* Action Buttons */}
                            <View className="p-5 border-t" style={{ borderColor: colors.border }}>
                                <View className="flex-row gap-2">
                                    {/* Change Role Button */}
                                    <Pressable
                                        onPress={() => setShowRoleDialog(true)}
                                        className="flex-1 py-3 rounded-xl items-center justify-center flex-row"
                                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary }}
                                    >
                                        <MaterialIcons name="swap-horiz" size={18} color={colors.primary} />
                                        <Text className="text-sm font-bold ml-1" style={{ color: colors.primary }}>
                                            Role
                                        </Text>
                                    </Pressable>

                                    {/* Update Status Button */}
                                    <Pressable
                                        onPress={() => setShowStatusDialog(true)}
                                        className="flex-1 py-3 rounded-xl items-center justify-center flex-row"
                                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary }}
                                    >
                                        <MaterialIcons name="toggle-on" size={18} color={colors.primary} />
                                        <Text className="text-sm font-bold ml-1" style={{ color: colors.primary }}>
                                            Status
                                        </Text>
                                    </Pressable>

                                    {/* Delete Account Button */}
                                    <Pressable
                                        onPress={() => setShowDeleteDialog(true)}
                                        className="flex-1 py-3 rounded-xl items-center justify-center flex-row"
                                        style={{ backgroundColor: "#ef444420", borderWidth: 1, borderColor: colors.error }}
                                    >
                                        <MaterialIcons name="delete" size={18} color={colors.error} />
                                        <Text className="text-sm font-bold ml-1" style={{ color: colors.error }}>
                                            Delete
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Role Change Dialog */}
                            <Modal visible={showRoleDialog} transparent animationType="fade" onRequestClose={() => setShowRoleDialog(false)}>
                                <View className="flex-1 bg-black/70 items-center justify-center px-6">
                                    <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.card, maxWidth: 400 }}>
                                        <View className="flex-row items-center mb-4">
                                            <MaterialIcons name="swap-horiz" size={28} color={colors.primary} />
                                            <Text className="text-xl font-bold ml-3" style={{ color: colors.text }}>
                                                Change User Role
                                            </Text>
                                        </View>

                                        <Text className="text-sm mb-4" style={{ color: colors.muted }}>
                                            Select a new role for {user?.firstName} {user?.lastName}
                                        </Text>

                                        <View className="gap-3 mb-4">
                                            {["customer", "vendor", "admin"].map((role) => (
                                                <Pressable
                                                    key={role}
                                                    onPress={() => handleRoleChange(role)}
                                                    disabled={user?.role === role || updateRoleMutation.isPending}
                                                    className="p-4 rounded-2xl flex-row items-center justify-between"
                                                    style={{
                                                        backgroundColor: user?.role === role ? getRoleColor(role) + "20" : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: user?.role === role ? getRoleColor(role) : colors.border,
                                                        opacity: user?.role === role ? 0.5 : 1,
                                                    }}
                                                >
                                                    <View className="flex-row items-center">
                                                        <MaterialIcons
                                                            name={role === "admin" ? "admin-panel-settings" : role === "vendor" ? "store" : "person"}
                                                            size={24}
                                                            color={user?.role === role ? getRoleColor(role) : colors.text}
                                                        />
                                                        <Text className="text-base font-semibold ml-3" style={{ color: colors.text }}>
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </Text>
                                                    </View>
                                                    {user?.role === role && (
                                                        <MaterialIcons name="check-circle" size={20} color={getRoleColor(role)} />
                                                    )}
                                                </Pressable>
                                            ))}
                                        </View>

                                        <Pressable
                                            onPress={() => setShowRoleDialog(false)}
                                            className="py-3 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                                        >
                                            <Text className="text-base font-bold" style={{ color: colors.text }}>
                                                Cancel
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </Modal>

                            {/* Status Change Dialog */}
                            <Modal visible={showStatusDialog} transparent animationType="fade" onRequestClose={() => setShowStatusDialog(false)}>
                                <View className="flex-1 bg-black/70 items-center justify-center px-6">
                                    <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.card, maxWidth: 400 }}>
                                        <View className="flex-row items-center mb-4">
                                            <MaterialIcons name="toggle-on" size={28} color={colors.primary} />
                                            <Text className="text-xl font-bold ml-3" style={{ color: colors.text }}>
                                                Update Account Status
                                            </Text>
                                        </View>

                                        <Text className="text-sm mb-4" style={{ color: colors.muted }}>
                                            Select a new status for this account
                                        </Text>

                                        <View className="gap-3 mb-4">
                                            {["active", "suspended", "deleted"].map((status) => (
                                                <Pressable
                                                    key={status}
                                                    onPress={() => handleStatusChange(status)}
                                                    disabled={user?.accountStatus === status || updateStatusMutation.isPending}
                                                    className="p-4 rounded-2xl flex-row items-center justify-between"
                                                    style={{
                                                        backgroundColor: user?.accountStatus === status ? getStatusColor(status) + "20" : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: user?.accountStatus === status ? getStatusColor(status) : colors.border,
                                                        opacity: user?.accountStatus === status ? 0.5 : 1,
                                                    }}
                                                >
                                                    <View className="flex-row items-center">
                                                        <MaterialIcons
                                                            name={status === "active" ? "check-circle" : status === "suspended" ? "block" : "cancel"}
                                                            size={24}
                                                            color={user?.accountStatus === status ? getStatusColor(status) : colors.text}
                                                        />
                                                        <Text className="text-base font-semibold ml-3" style={{ color: colors.text }}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </Text>
                                                    </View>
                                                    {user?.accountStatus === status && (
                                                        <MaterialIcons name="check-circle" size={20} color={getStatusColor(status)} />
                                                    )}
                                                </Pressable>
                                            ))}
                                        </View>

                                        <Pressable
                                            onPress={() => setShowStatusDialog(false)}
                                            className="py-3 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                                        >
                                            <Text className="text-base font-bold" style={{ color: colors.text }}>
                                                Cancel
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </Modal>

                            {/* Delete Confirmation Dialog */}
                            <Modal visible={showDeleteDialog} transparent animationType="fade" onRequestClose={() => setShowDeleteDialog(false)}>
                                <View className="flex-1 bg-black/70 items-center justify-center px-6">
                                    <View className="w-full rounded-3xl p-6" style={{ backgroundColor: colors.card, maxWidth: 400 }}>
                                        <View className="flex-row items-center mb-4">
                                            <MaterialIcons name="warning" size={28} color={colors.error} />
                                            <Text className="text-xl font-bold ml-3" style={{ color: colors.text }}>
                                                Delete Account
                                            </Text>
                                        </View>

                                        <Text className="text-sm mb-2" style={{ color: colors.muted }}>
                                            Are you sure you want to delete this account?
                                        </Text>
                                        <Text className="text-sm font-bold mb-4" style={{ color: colors.text }}>
                                            {user?.firstName} {user?.lastName} ({user?.email})
                                        </Text>
                                        <Text className="text-sm mb-6" style={{ color: colors.error }}>
                                            This action cannot be undone.
                                        </Text>

                                        <View className="flex-row gap-3">
                                            <Pressable
                                                onPress={() => setShowDeleteDialog(false)}
                                                className="flex-1 py-3 rounded-2xl items-center justify-center"
                                                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                                            >
                                                <Text className="text-base font-bold" style={{ color: colors.text }}>
                                                    Cancel
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                onPress={handleDeleteUser}
                                                disabled={deleteUserMutation.isPending}
                                                className="flex-1 py-3 rounded-2xl items-center justify-center"
                                                style={{ backgroundColor: colors.error }}
                                            >
                                                {deleteUserMutation.isPending ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text className="text-base font-bold text-white">
                                                        Delete
                                                    </Text>
                                                )}
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </Modal>
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center px-6">
                            <MaterialIcons name="person-off" size={64} color={colors.muted} />
                            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                                No user data available
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Snackbar for feedback */}
                <Snackbar
                    visible={snackbar.visible}
                    message={snackbar.message}
                    type={snackbar.type}
                    onDismiss={snackbar.hideSnackbar}
                />
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
        <Text className="text-sm ml-2 w-28" style={{ color: colors.muted }}>{label}:</Text>
        {badge ? (
            <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: (badgeColor || colors.primary) + "20" }}
            >
                <Text
                    className="text-xs font-semibold"
                    style={{ color: badgeColor || colors.primary }}
                >
                    {value?.toUpperCase() || 'N/A'}
                </Text>
            </View>
        ) : (
            <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>
                {value || 'N/A'}
            </Text>
        )}
    </View>
);
