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
    Alert,
    TextInput,
    ToastAndroid,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeContext } from "context/ThemeProvider";
import { approveUser, deleteUserAccount, fetchUserDetail, rejectUser, updateAccountStatus, updateUserRole } from "api/actions/userActions";
import { UserDetailModalProps, UserDetailResponse } from "constants/types";

const { height } = Dimensions.get("window");

export default function UserDetailModal({
    visible,
    userId,
    onClose,
}: UserDetailModalProps) {
    const { colors } = useThemeContext();
    const queryClient = useQueryClient();
    const [slideAnim] = useState(new Animated.Value(height));
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // Fetch user details
    const { data, isLoading, error } = useQuery<UserDetailResponse>({
        queryKey: ["userDetail", userId],
        queryFn: () => fetchUserDetail(userId!),
        enabled: !!userId && visible,
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: ({ userId }: { userId: number }) => approveUser(userId),
        onSuccess: (data) => {
            if (!data?.success) {
                ToastAndroid.show("Profile approval failed!", ToastAndroid.SHORT);
                return;
            }
            ToastAndroid.show("User profile approved!", ToastAndroid.SHORT);
            queryClient.invalidateQueries({ queryKey: ["users"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["userDetail", userId] });
            onClose();
        },
        onError: (error: any) => {
            ToastAndroid.show(
                error?.message || "Failed to approve user",
                ToastAndroid.SHORT
            );
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
            rejectUser(userId, reason),
        onSuccess: (data) => {
            if (!data?.success) {
                ToastAndroid.show("Profile rejection failed!", ToastAndroid.SHORT);
                return;
            }
            ToastAndroid.show("User profile rejected!", ToastAndroid.SHORT);
            queryClient.invalidateQueries({ queryKey: ["users"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["userDetail", userId] });
            setShowRejectionDialog(false);
            setRejectionReason("");
            onClose();
        },
        onError: (error: any) => {
            ToastAndroid.show(
                error?.message || "Failed to reject user",
                ToastAndroid.SHORT
            );
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: number; role: string }) =>
            updateUserRole(userId, role),
        onSuccess: (data) => {
            if (!data?.success) {
                ToastAndroid.show("Can not update this user role!", ToastAndroid.SHORT);
                return;
            }
            ToastAndroid.show("User role updated!", ToastAndroid.SHORT);
            queryClient.invalidateQueries({ queryKey: ["users"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["userDetail", userId] });
            setShowRoleDialog(false);
        },
        onError: (error: any) => {
            ToastAndroid.show(error?.message || "Failed to update role", ToastAndroid.SHORT);
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: number; status: string }) =>
            updateAccountStatus(userId, status),
        onSuccess: (data) => {
            if (!data?.success) {
                ToastAndroid.show("Unable to update account status!", ToastAndroid.SHORT);
                return;
            }
            ToastAndroid.show("Account status updated!", ToastAndroid.SHORT);
            queryClient.invalidateQueries({ queryKey: ["users"], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["userDetail", userId] });
            setShowStatusDialog(false);
        },
        onError: (error: any) => {
            ToastAndroid.show(error?.message || "Failed to update status", ToastAndroid.SHORT);
        },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: ({ userId }: { userId: number }) => deleteUserAccount(userId),
        onSuccess: (data) => {
            if (!data?.success) {
                ToastAndroid.show("Unable to delete user account!", ToastAndroid.SHORT);
                return;
            }
            ToastAndroid.show("User account deleted!", ToastAndroid.SHORT);
            queryClient.invalidateQueries({ queryKey: ["users"], refetchType: "all" });
            setShowDeleteDialog(false);
            onClose();
        },
        onError: (error: any) => {
            ToastAndroid.show(error?.message || "Failed to delete user", ToastAndroid.SHORT);
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

    const handleApprove = () => {
        Alert.alert(
            "Confirm Approval",
            "Are you sure you want to approve this user?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: () => approveMutation.mutate({ userId: userId! }),
                },
            ]
        );
    };

    const handleReject = () => {
        setShowRejectionDialog(true);
    };

    const handleConfirmReject = () => {
        if (!rejectionReason.trim()) {
            Alert.alert("Required", "Please provide a reason for rejection");
            return;
        }
        rejectMutation.mutate({ userId: userId!, reason: rejectionReason.trim() });
    };

    const handleCancelReject = () => {
        setShowRejectionDialog(false);
        setRejectionReason("");
    };

    const handleRoleChange = (newRole: string) => {
        updateRoleMutation.mutate({ userId: userId!, role: newRole });
    };

    const handleStatusChange = (newStatus: string) => {
        updateStatusMutation.mutate({ userId: userId!, status: newStatus });
    };

    const handleDeleteUser = () => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this user? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteUserMutation.mutate({ userId: userId! }),
                },
            ]
        );
    };
    const formatDate = (dateString: string) => {
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
            case "rejected":
            case "suspended":
                return colors.error;
            case "deleted":
                return "#6b7280";
            default:
                return "#6b7280";
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
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
                        style={{ borderColor: colors.muted }}
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
                            <Text className="mt-4 text-base" style={{ color: colors.text }}>
                                Loading user details...
                            </Text>
                        </View>
                    ) : error ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <MaterialIcons name="error-outline" size={64} color={colors.error} />
                            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                                Failed to load details
                            </Text>
                            <Text className="text-sm text-gray-500 mt-2">
                                Please try again later
                            </Text>
                        </View>
                    ) : data?.data ? (
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
                                            style={{ backgroundColor: colors.primary + "20" }}
                                        >
                                            <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                                                {data.data?.user?.firstName.charAt(0)}
                                                {data.data?.user?.lastName.charAt(0)}
                                            </Text>
                                        </View>
                                        <View className="ml-4 flex-1">
                                            <Text className="text-xl font-bold" style={{ color: colors.text }}>
                                                {data.data?.user?.firstName} {data.data?.user?.lastName}
                                            </Text>
                                            <View
                                                className="px-3 py-1 rounded-full self-start mt-1"
                                                style={{ backgroundColor: colors.primary + "30" }}
                                            >
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: colors.primary }}
                                                >
                                                    {data.data?.user?.role.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="space-y-2">
                                        <InfoRow
                                            icon="email"
                                            label="Email"
                                            value={data.data?.user?.email}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="phone"
                                            label="Phone"
                                            value={data.data?.user?.phone || "Not provided"}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="verified-user"
                                            label="Account Status"
                                            value={data.data?.user?.accountStatus}
                                            colors={colors}
                                            badge
                                            badgeColor={getStatusColor(data.data?.user?.accountStatus)}
                                        />
                                        <InfoRow
                                            icon="check-circle"
                                            label="Email Verified"
                                            value={data.data?.user?.isEmailVerified ? "Yes" : "No"}
                                            colors={colors}
                                            badge
                                            badgeColor={data.data?.user?.isEmailVerified ? colors.success : colors.error}
                                        />
                                        <InfoRow
                                            icon="access-time"
                                            label="Last Login"
                                            value={formatDate(data.data?.user?.lastLoginAt)}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="event"
                                            label="Joined"
                                            value={formatDate(data.data?.user?.createdAt)}
                                            colors={colors}
                                        />
                                    </View>
                                </View>

                                {/* Business Profile */}
                                {data.data.profile && (
                                    <View
                                        className="p-4 rounded-3xl mb-4"
                                        style={{ backgroundColor: colors.background }}
                                    >
                                        <View className="flex-row items-center mb-3">
                                            <MaterialIcons name="business" size={24} color={colors.primary} />
                                            <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                                                Business Profile
                                            </Text>
                                            <View
                                                className="ml-auto px-3 py-1 rounded-full"
                                                style={{
                                                    backgroundColor: getStatusColor(data.data.profile.status) + "20",
                                                }}
                                            >
                                                <Text
                                                    className="text-xs font-bold"
                                                    style={{ color: getStatusColor(data.data.profile.status) }}
                                                >
                                                    {data.data.profile.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        <InfoRow
                                            icon="store"
                                            label="Business Name"
                                            value={data.data.profile.businessName}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="category"
                                            label="Business Type"
                                            value={data.data.profile.businessType}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="description"
                                            label="Description"
                                            value={data.data.profile.description}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="badge"
                                            label="Business License"
                                            value={data.data.profile.businessLicense}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="phone"
                                            label="Business Phone"
                                            value={data.data.profile.businessPhone}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="email"
                                            label="Business Email"
                                            value={data.data.profile.businessEmail}
                                            colors={colors}
                                        />
                                        <InfoRow
                                            icon="cloud-circle"
                                            label="Business Website"
                                            value={data.data.profile.website}
                                            colors={colors}
                                        />

                                        {/* Address */}
                                        {data.data.profile.addresses?.length > 0 && (
                                            <View className="mt-3 pt-3 border-t" style={{ borderColor: colors.muted }}>
                                                <View className="flex-row items-center mb-2">
                                                    <MaterialIcons name="location-on" size={18} color={colors.text} />
                                                    <Text className="text-sm font-bold ml-2" style={{ color: colors.text }}>
                                                        Business Address
                                                    </Text>
                                                </View>
                                                {data.data.profile.addresses?.map((address, index) => (
                                                    <View key={address.id} className="mb-2 ml-6">
                                                        <Text className="text-sm" style={{ color: colors.text }}>
                                                            {address.street}, {address.city}
                                                        </Text>
                                                        <Text className="text-xs text-gray-500">
                                                            {address.state}, {address.postalCode}, {address.country}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Payments */}
                                {data.data.payments?.length > 0 && (
                                    <View
                                        className="p-4 rounded-3xl mb-4"
                                        style={{ backgroundColor: colors.background }}
                                    >
                                        <View className="flex-row items-center mb-3">
                                            <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
                                            <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
                                                Payment History
                                            </Text>
                                        </View>

                                        {data.data.payments.map((payment) => (
                                            <View
                                                key={payment.id}
                                                className="p-3 rounded-2xl mb-2"
                                                style={{ backgroundColor: colors.card }}
                                            >
                                                <View className="flex-row items-center justify-between mb-2">
                                                    <Text className="font-semibold" style={{ color: colors.text }}>
                                                        {payment.selectedPlan.name}
                                                    </Text>
                                                    <View
                                                        className="px-2 py-1 rounded-full"
                                                        style={{
                                                            backgroundColor: getStatusColor(payment.status) + "20",
                                                        }}
                                                    >
                                                        <Text
                                                            className="text-xs font-bold"
                                                            style={{ color: getStatusColor(payment.status) }}
                                                        >
                                                            {payment.status.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text className="text-sm text-gray-500">
                                                    Amount: {payment.currency} {payment.amount}
                                                </Text>
                                                <Text className="text-sm text-gray-500">
                                                    Duration: {payment.selectedPlan.duration} months
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>

                            {/* Action Buttons - For Approved/Active Profiles */}
                            {data.data.profile?.status === "active" && (
                                <View className="p-5 border-t" style={{ borderColor: colors.muted }}>
                                    <View className="flex-row gap-2">
                                        {/* Change Role Button */}
                                        <Pressable
                                            onPress={() => setShowRoleDialog(true)}
                                            className="flex-1 py-2 rounded-xl items-center justify-center flex-row"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary }}
                                        >
                                            <MaterialIcons name="swap-horiz" size={16} color={colors.text} />
                                            <Text className="text-xs font-bold ml-1" style={{ color: colors.text }}>
                                                Role
                                            </Text>
                                        </Pressable>

                                        {/* Update Status Button */}
                                        <Pressable
                                            onPress={() => setShowStatusDialog(true)}
                                            className="flex-1 py-2 rounded-xl items-center justify-center flex-row"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary }}
                                        >
                                            <MaterialIcons name="toggle-on" size={16} color={colors.text} />
                                            <Text className="text-xs font-bold ml-1" style={{ color: colors.text }}>
                                                Status
                                            </Text>
                                        </Pressable>

                                        {/* Delete Account Button */}
                                        <Pressable
                                            onPress={() => setShowDeleteDialog(true)}
                                            className="flex-1 py-2 rounded-xl items-center justify-center flex-row"
                                            style={{ backgroundColor: "#ef444420", borderWidth: 1, borderColor: colors.error }}
                                        >
                                            <MaterialIcons name="delete" size={16} color={colors.error} />
                                            <Text className="text-xs font-bold ml-1" style={{ color: colors.error }}>
                                                Delete
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {/* Action Buttons - For Pending Profiles */}
                            {data.data.profile?.status === "pending" && (
                                <View className="p-5 border-t" style={{ borderColor: colors.muted }}>
                                    <View className="flex-row gap-3">
                                        <Pressable
                                            onPress={handleReject}
                                            disabled={rejectMutation.isPending}
                                            className="flex-1 py-4 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary }}
                                        >
                                            {rejectMutation.isPending ? (
                                                <ActivityIndicator size="small" color={colors.text} />
                                            ) : (
                                                <View className="flex-row items-center">
                                                    <MaterialIcons name="cancel" size={20} color={colors.text} />
                                                    <Text className="text-base font-bold ml-2" style={{ color: colors.text }}>
                                                        Reject
                                                    </Text>
                                                </View>
                                            )}
                                        </Pressable>

                                        <Pressable
                                            onPress={handleApprove}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 py-4 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary }}
                                        >
                                            {approveMutation.isPending ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <View className="flex-row items-center">
                                                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                                                    <Text className="text-base font-bold text-white ml-2">
                                                        Approve
                                                    </Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                            {/* Rejection Reason Dialog */}
                            <Modal
                                visible={showRejectionDialog}
                                transparent
                                animationType="fade"
                                onRequestClose={handleCancelReject}
                            >
                                <View className="flex-1 bg-black/70 items-center justify-center px-6">
                                    <View
                                        className="w-full rounded-3xl p-6"
                                        style={{ backgroundColor: colors.card, maxWidth: 400 }}
                                    >
                                        <View className="flex-row items-center mb-4">
                                            <MaterialIcons name="error-outline" size={28} color={colors.error} />
                                            <Text className="text-xl font-bold ml-3" style={{ color: colors.text }}>
                                                Rejection Reason
                                            </Text>
                                        </View>

                                        <Text className="text-sm text-gray-500 mb-4">
                                            Please provide a reason for rejecting this user. This will be sent to the user.
                                        </Text>

                                        <TextInput
                                            value={rejectionReason}
                                            onChangeText={setRejectionReason}
                                            placeholder="Enter rejection reason..."
                                            placeholderTextColor="#999"
                                            multiline
                                            numberOfLines={4}
                                            className="rounded-2xl p-4 mb-4 text-base"
                                            style={{
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                                textAlignVertical: "top",
                                                minHeight: 100,
                                                borderWidth: 1,
                                                borderColor: colors.muted,
                                            }}
                                        />

                                        <View className="flex-row gap-3">
                                            <Pressable
                                                onPress={handleCancelReject}
                                                className="flex-1 py-3 rounded-2xl items-center justify-center"
                                                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted }}
                                            >
                                                <Text className="text-base font-bold" style={{ color: colors.text }}>
                                                    Cancel
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                onPress={handleConfirmReject}
                                                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                                                className="flex-1 py-3 rounded-2xl items-center justify-center"
                                                style={{
                                                    backgroundColor: rejectionReason.trim() ? colors.error : colors.muted,
                                                    opacity: rejectionReason.trim() ? 1 : 0.5,
                                                }}
                                            >
                                                {rejectMutation.isPending ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <Text className="text-base font-bold text-white">
                                                        Confirm Reject
                                                    </Text>
                                                )}
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </Modal>
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

                                        <Text className="text-sm text-gray-500 mb-4">
                                            Select a new role for {data?.data?.user?.firstName} {data?.data.user?.lastName}
                                        </Text>

                                        <View className="gap-3 mb-4">
                                            {["customer", "vendor", "admin"].map((role) => (
                                                <Pressable
                                                    key={role}
                                                    onPress={() => handleRoleChange(role)}
                                                    disabled={data?.data?.user?.role === role || updateRoleMutation.isPending}
                                                    className="p-4 rounded-2xl flex-row items-center justify-between"
                                                    style={{
                                                        backgroundColor: data?.data?.user?.role === role ? colors.primary + "20" : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: data?.data?.user?.role === role ? colors.primary : colors.muted,
                                                        opacity: data?.data?.user?.role === role ? 0.5 : 1,
                                                    }}
                                                >
                                                    <View className="flex-row items-center">
                                                        <MaterialIcons
                                                            name={role === "admin" ? "admin-panel-settings" : role === "vendor" ? "store" : "person"}
                                                            size={24}
                                                            color={data?.data?.user?.role === role ? colors.primary : colors.text}
                                                        />
                                                        <Text className="text-base font-semibold ml-3" style={{ color: colors.text }}>
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </Text>
                                                    </View>
                                                    {data?.data?.user?.role === role && (
                                                        <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                                                    )}
                                                </Pressable>
                                            ))}
                                        </View>

                                        <Pressable
                                            onPress={() => setShowRoleDialog(false)}
                                            className="py-3 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted }}
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

                                        <Text className="text-sm text-gray-500 mb-4">
                                            Select a new status for this account
                                        </Text>

                                        <View className="gap-3 mb-4">
                                            {["active", "suspended", "deleted"].map((status) => (
                                                <Pressable
                                                    key={status}
                                                    onPress={() => handleStatusChange(status)}
                                                    disabled={data?.data?.user?.accountStatus === status || updateStatusMutation.isPending}
                                                    className="p-4 rounded-2xl flex-row items-center justify-between"
                                                    style={{
                                                        backgroundColor: data?.data?.user?.accountStatus === status ? getStatusColor(status) + "20" : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: data?.data?.user?.accountStatus === status ? getStatusColor(status) : colors.muted,
                                                        opacity: data?.data?.user?.accountStatus === status ? 0.5 : 1,
                                                    }}
                                                >
                                                    <View className="flex-row items-center">
                                                        <MaterialIcons
                                                            name={status === "active" ? "check-circle" : status === "suspended" ? "block" : "cancel"}
                                                            size={24}
                                                            color={data?.data?.user?.accountStatus === status ? getStatusColor(status) : colors.text}
                                                        />
                                                        <Text className="text-base font-semibold ml-3" style={{ color: colors.text }}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </Text>
                                                    </View>
                                                    {data?.data?.user?.accountStatus === status && (
                                                        <MaterialIcons name="check-circle" size={20} color={getStatusColor(status)} />
                                                    )}
                                                </Pressable>
                                            ))}
                                        </View>

                                        <Pressable
                                            onPress={() => setShowStatusDialog(false)}
                                            className="py-3 rounded-2xl items-center justify-center"
                                            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted }}
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

                                        <Text className="text-sm text-gray-500 mb-2">
                                            Are you sure you want to delete this account?
                                        </Text>
                                        <Text className="text-sm font-bold mb-4" style={{ color: colors.text }}>
                                            {data?.data?.user?.firstName} {data?.data?.user?.lastName} ({data?.data?.user?.email})
                                        </Text>
                                        <Text className="text-sm text-red-600 mb-6">
                                            This action cannot be undone. All user data will be permanently deleted.
                                        </Text>

                                        <View className="flex-row gap-3">
                                            <Pressable
                                                onPress={() => setShowDeleteDialog(false)}
                                                className="flex-1 py-3 rounded-2xl items-center justify-center"
                                                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted }}
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
                            <MaterialIcons name="error-outline" size={64} color={colors.primary} />
                            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
                                No user data available
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
        <MaterialIcons name={icon as any} size={18} color={colors.text} />
        <Text className="text-sm text-gray-500 ml-2 w-32">{label}:</Text>
        {badge ? (
            <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: (badgeColor || colors.primary) + "20" }}
            >
                <Text
                    className="text-xs font-semibold"
                    style={{ color: badgeColor || colors.primary }}
                >
                    {value.toUpperCase()}
                </Text>
            </View>
        ) : (
            <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>
                {value}
            </Text>
        )}
    </View>
);