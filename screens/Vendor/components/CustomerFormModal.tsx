// components/CustomerFormModal.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    ToastAndroid,
} from "react-native";
import { Controller, set, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerSchema } from "validations/formValidationSchemas";
import { addCustomer, deleteCustomer, fetchCustomersDetails, updateCustomer } from "api/actions/customerActions";
import {
    FormInput,
    FormTextArea,
    FormSelect,
    FormRow,
    FormSection
} from "./FormInputFileds";
import ConfirmDeleteModal from "components/DeleteConfirmationModal";

interface CustomerFormData {
    businessName: string;
    contactPerson: string;
    phone: string;
    alternatePhone: string;
    email: string;
    creditLimit: string;
    paymentTerms: string;
    businessType: string;
    notes: string;
    deliveryInstructions: string;
    type: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    instructions: string;
}

interface CustomerFormModalProps {
    visible: boolean;
    onClose: () => void;
    customerId?: number | null;
}

const businessTypes = [
    { label: "Restaurant", value: "restaurant" },
    { label: "Retailer", value: "retailer" },
    { label: "Wholesaler", value: "wholesaler" },
    { label: "Hotel", value: "hotel" },
    { label: "Café", value: "cafe" },
    { label: "Other", value: "other" },
];

const paymentTermsOptions = [
    { label: "Cash", value: "cash" },
    { label: "Net 7 Days", value: "net_7" },
    { label: "Net 15 Days", value: "net_15" },
    { label: "Net 30 Days", value: "net_30" },
    { label: "Net 60 Days", value: "net_60" },
    { label: "Net 90 Days", value: "net_90" },
];

const types = [
    { label: "Business", value: "business" },
    { label: "Residential", value: "residential" },
    { label: "Warehouse", value: "warehouse" },
];

export default function CustomerFormModal({
    visible,
    onClose,
    customerId,
}: CustomerFormModalProps) {
    const { colors } = useThemeContext();
    const queryClient = useQueryClient();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["Customer", customerId],
        queryFn: () => fetchCustomersDetails(customerId!),
        enabled: !!customerId && visible,
    });
    const editingCustomer = customerId ? data?.data : null;

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CustomerFormData>({
        resolver: yupResolver(customerSchema),
        mode: "onChange",
        defaultValues: {
            businessName: "",
            contactPerson: "",
            phone: "",
            alternatePhone: "",
            email: "",
            creditLimit: "",
            paymentTerms: "",
            businessType: "",
            notes: "",
            deliveryInstructions: "",
            type: "",
            label: "",
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            instructions: "",
        },
    });

    useEffect(() => {
        if (customerId && editingCustomer) {
            reset({
                businessName: editingCustomer.businessName || "",
                contactPerson: editingCustomer.contactPerson || "",
                phone: editingCustomer.phone || "",
                alternatePhone: editingCustomer.alternatePhone || "",
                email: editingCustomer.email || "",
                creditLimit: editingCustomer.creditLimit?.toString() || "",
                paymentTerms: editingCustomer.paymentTerms || "",
                businessType: editingCustomer.businessType || "",
                notes: editingCustomer.notes || "",
                deliveryInstructions: editingCustomer.deliveryInstructions || "",
                type: editingCustomer.address?.type || "",
                label: editingCustomer.address?.label || "",
                street: editingCustomer.address?.street || "",
                city: editingCustomer.address?.city || "",
                state: editingCustomer.address?.state || "",
                postalCode: editingCustomer.address?.postalCode || "",
                country: editingCustomer.address?.country || "",
                instructions: editingCustomer.address?.instructions || "",
            });
        } else {
            reset({
                businessName: "",
                contactPerson: "",
                phone: "",
                alternatePhone: "",
                email: "",
                creditLimit: "",
                paymentTerms: "",
                businessType: "",
                notes: "",
                deliveryInstructions: "",
                type: "",
                label: "",
                street: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
                instructions: "",
            });
        }
    }, [editingCustomer, reset, visible, customerId]);

    // Mutations
    const addMutation = useMutation({
        mutationFn: (data: CustomerFormData) => {
            const payload = {
                businessName: data.businessName,
                contactPerson: data.contactPerson,
                phone: data.phone,
                alternatePhone: data.alternatePhone || null,
                email: data.email,
                creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : 0,
                paymentTerms: data.paymentTerms,
                businessType: data.businessType,
                notes: data.notes || null,
                deliveryInstructions: data.deliveryInstructions || null,
                address: {
                    type: data.type,
                    label: data.label,
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    postalCode: data.postalCode,
                    country: data.country,
                    instructions: data.instructions || null,
                },
            };
            return addCustomer(payload);
        },
        onSuccess: (data) => {
            if (!data.success) {
                ToastAndroid.show(data.message || "Something went wrong", ToastAndroid.SHORT);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["Customers"] });
            queryClient.invalidateQueries({ queryKey: ["Customers", "allCustomers"] });
            ToastAndroid.show("Customer added successfully!", ToastAndroid.SHORT);
            handleClose();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to add customer";
            Alert.alert("Error", errorMessage);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: CustomerFormData) => {
            const payload = {
                id: editingCustomer.id,
                businessName: data.businessName,
                contactPerson: data.contactPerson,
                phone: data.phone,
                alternatePhone: data.alternatePhone || null,
                email: data.email,
                creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : 0,
                paymentTerms: data.paymentTerms,
                businessType: data.businessType,
                notes: data.notes || null,
                deliveryInstructions: data.deliveryInstructions || null,
                address: {
                    type: data.type,
                    label: data.label,
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    postalCode: data.postalCode,
                    country: data.country,
                    instructions: data.instructions || null,
                },
            };
            return updateCustomer(payload);
        },
        onSuccess: (data) => {
            if (!data.success) {
                ToastAndroid.show(data.message || "Something went wrong", ToastAndroid.SHORT);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["Customers"] });
            queryClient.invalidateQueries({ queryKey: ["Customers", "allCustomers"] });
            ToastAndroid.show("Customer updated successfully!", ToastAndroid.SHORT);
            handleClose();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to update customer";
            Alert.alert("Error", errorMessage);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (customerId: number) => deleteCustomer(customerId),
        onSuccess: (data) => {
            if (!data.success) {
                ToastAndroid.show(data.message || "Something went wrong", ToastAndroid.SHORT);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["Customers"] });
            queryClient.invalidateQueries({ queryKey: ["Customers", "allCustomers"] });
            ToastAndroid.show("Customer deleted successfully!", ToastAndroid.SHORT);
            handleClose();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Failed to delete customer";
            Alert.alert("Error", errorMessage);
        },
    });

    const submitForm = (data: CustomerFormData) => {
        if (editingCustomer) {
            updateMutation.mutate(data);
        } else {
            addMutation.mutate(data);
        }
    };

    const handleDelete = () => {
        if (!editingCustomer) return;
        setDeleteModalVisible(true);
    };
    const handleConfirmDelete = () => {
        if (!editingCustomer) return;
        deleteMutation.mutate(editingCustomer.id);
        setDeleteModalVisible(false);
        handleClose();
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    if (isLoading) {
        return (
            <Modal visible={visible} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal visible={visible} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: colors.card, maxWidth: "100%" }}
                    >
                        <Text className="text-center" style={{ color: colors.text }}>
                            Failed to load customer data.
                        </Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            className="mt-4 px-4 py-2 rounded-lg items-center"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <Text className="font-bold text-white">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-black/50 justify-end">
                <View
                    className="rounded-t-3xl p-6"
                    style={{ backgroundColor: colors.card, maxHeight: "90%" }}
                >
                    {/* Modal Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold" style={{ color: colors.text }}>
                            {editingCustomer ? "Update Customer" : "Add New Customer"}
                        </Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={isLoading}
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.background }}
                        >
                            <MaterialIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Business Information Section */}
                        <FormSection title="Business Information">
                            <Controller
                                control={control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormInput
                                        label="Business Name"
                                        required
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Enter business name"
                                        error={errors.businessName?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormInput
                                        label="Contact Person"
                                        required
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Enter contact person name"
                                        error={errors.contactPerson?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />

                            <FormRow>
                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormInput
                                                label="Phone"
                                                required
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="03001234567"
                                                keyboardType="phone-pad"
                                                error={errors.phone?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>

                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="alternatePhone"
                                        render={({ field }) => (
                                            <FormInput
                                                label="Alternate Phone"
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="03009876543"
                                                keyboardType="phone-pad"
                                                error={errors.alternatePhone?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>
                            </FormRow>

                            <Controller
                                control={control}
                                name="email"
                                render={({ field }) => (
                                    <FormInput
                                        label="Email"
                                        required
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="email@example.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        error={errors.email?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="businessType"
                                render={({ field }) => (
                                    <FormSelect
                                        label="Business Type"
                                        required
                                        options={businessTypes}
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors.businessType?.message}
                                        disabled={isLoading}
                                    />
                                )}
                            />
                        </FormSection>

                        {/* Payment Information Section */}
                        <FormSection title="Payment Information">
                            <Controller
                                control={control}
                                name="creditLimit"
                                render={({ field }) => (
                                    <FormInput
                                        label="Credit Limit"
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="50000"
                                        keyboardType="decimal-pad"
                                        error={errors.creditLimit?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="paymentTerms"
                                render={({ field }) => (
                                    <FormSelect
                                        label="Payment Terms"
                                        required
                                        options={paymentTermsOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors.paymentTerms?.message}
                                        disabled={isLoading}
                                    />
                                )}
                            />
                        </FormSection>

                        {/* Address Section */}
                        <FormSection title="Address Information">
                            <FormRow>
                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormSelect
                                                label="Type"
                                                required
                                                options={types}
                                                value={field.value}
                                                onChange={field.onChange}
                                                error={errors.type?.message}
                                                disabled={isLoading}
                                            />
                                        )}
                                    />
                                </View>

                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="label"
                                        render={({ field }) => (
                                            <FormInput
                                                label="Label"
                                                required
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="Main Store"
                                                error={errors.label?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>
                            </FormRow>

                            <Controller
                                control={control}
                                name="street"
                                render={({ field }) => (
                                    <FormInput
                                        label="Street Address"
                                        required
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Shop 15, Saddar Bazaar"
                                        error={errors.street?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />

                            <FormRow>
                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormInput
                                                label="City"
                                                required
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="Peshawar"
                                                error={errors.city?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>

                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormInput
                                                label="State"
                                                required
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="KPK"
                                                error={errors.state?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>
                            </FormRow>

                            <FormRow>
                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormInput
                                                label="Postal Code"
                                                required
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="25000"
                                                keyboardType="number-pad"
                                                error={errors.postalCode?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>

                                <View className="flex-1">
                                    <Controller
                                        control={control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormInput
                                                label="Country"
                                                required
                                                value={field.value}
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder=""
                                                error={errors.country?.message}
                                                editable={!isLoading}
                                            />
                                        )}
                                    />
                                </View>
                            </FormRow>

                            <Controller
                                control={control}
                                name="instructions"
                                render={({ field }) => (
                                    <FormTextArea
                                        label="Address Instructions"
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Near old bus stand, blue building"
                                        minHeight={60}
                                        numberOfLines={2}
                                        error={errors.instructions?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />
                        </FormSection>

                        {/* Additional Information Section */}
                        <FormSection title="Additional Information">
                            <Controller
                                control={control}
                                name="notes"
                                render={({ field }) => (
                                    <FormTextArea
                                        label="Notes"
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Regular customer, prefers morning deliveries"
                                        minHeight={80}
                                        numberOfLines={3}
                                        error={errors.notes?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="deliveryInstructions"
                                render={({ field }) => (
                                    <FormTextArea
                                        label="Delivery Instructions"
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Call before delivery"
                                        minHeight={80}
                                        numberOfLines={3}
                                        error={errors.deliveryInstructions?.message}
                                        editable={!isLoading}
                                    />
                                )}
                            />
                        </FormSection>

                        {/* Action Buttons */}
                        <View className="flex-row gap-3 mt-4 mb-6">
                            {editingCustomer && (
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    disabled={isLoading}
                                    className="px-4 py-3 rounded-xl items-center justify-center"
                                    style={{
                                        backgroundColor: colors.error,
                                        opacity: isLoading ? 0.5 : 1,
                                    }}
                                >
                                    <MaterialIcons name="delete" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                onPress={handleClose}
                                disabled={isLoading}
                                className="flex-1 py-4 rounded-xl items-center"
                                style={{
                                    backgroundColor: colors.background,
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
                                onPress={handleSubmit(submitForm)}
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
                                        {editingCustomer ? "Update Customer" : "Add Customer"}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                visible={deleteModalVisible}
                loading={deleteMutation.isPending}
                onCancel={() => {
                    setDeleteModalVisible(false);
                }}
                onConfirm={handleConfirmDelete}
            />
        </Modal>
    );
}