import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    ToastAndroid,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, FieldErrors, Control, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { businessAddressSchema } from 'validations/formValidationSchemas';
import { useThemeContext } from '../../context/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import { apiRequest } from 'api/clients';
import { errorHandler } from 'utils/errorHandler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
interface BusinessFormValues {
    type: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isPrimary: boolean;
}

export default function BusinessAddressScreen() {
    const { colors } = useThemeContext();
    const [showTypePicker, setShowTypePicker] = useState(false);
    const ADDRESS_TYPES = ['Business', 'Billing', 'Delivery'];
    const LABEL_TYPES = ['Branch', 'Office', 'Store', 'Warehouse', 'Other'];
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const navigation = useNavigation();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<BusinessFormValues>({
        resolver: yupResolver(businessAddressSchema),
        defaultValues: {
            type: '',
            label: '',
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            isPrimary: false,
        },
    });

    const onSubmit = async (formData: any) => {

        try {
            const response = await apiRequest('/onboarding/address', 'POST', formData);
            if (!response.success) {
                errorHandler(response.data);
                return;
            }
            ToastAndroid.show('Address info Submitted!', ToastAndroid.SHORT);
            navigation.navigate("SubscriptionScreen" as never)
            reset();
        } catch (error) {
            ToastAndroid.show('Something went wrong, try again!', ToastAndroid.SHORT);
        }
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior="padding"
                className="flex-1"
                style={{ backgroundColor: colors.background }}>

                <ScrollView className="mt-4 px-2 pb-10">
                    <Text className="mt-6 text-center text-2xl font-semibold" style={{ color: colors.text }}>
                        Address information
                    </Text>

                    <View className="mt-5 gap-4">

                        {/* Address Type Modal Picker */}
                        <View>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        {/* Trigger Button */}
                                        <TouchableOpacity
                                            onPress={() => setShowTypePicker(true)}
                                            className="w-full rounded-xl px-4 py-3"
                                            style={{ backgroundColor: colors.card }}
                                        >
                                            <Text style={{ color: value ? colors.text : colors.placeholder }}>
                                                {value || "Select address type"}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Modal Picker */}
                                        <Modal
                                            visible={showTypePicker}
                                            animationType="slide"
                                            transparent
                                        >
                                            {/* Overlay */}
                                            <TouchableOpacity
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: "rgba(0,0,0,0.4)",
                                                }}
                                                activeOpacity={1}
                                                onPress={() => setShowTypePicker(false)}
                                            />

                                            {/* Bottom Sheet */}
                                            <View
                                                style={{
                                                    backgroundColor: colors.card,
                                                    padding: 20,
                                                    borderTopLeftRadius: 20,
                                                    borderTopRightRadius: 20,
                                                    position: "absolute",
                                                    bottom: 0,
                                                    width: "100%",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 18,
                                                        fontWeight: "600",
                                                        color: colors.text,
                                                        marginBottom: 15,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Select Address Type
                                                </Text>
                                                {ADDRESS_TYPES.map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        onPress={() => {
                                                            onChange(type.toLowerCase());
                                                            setShowTypePicker(false);
                                                        }}
                                                        style={{
                                                            paddingVertical: 14,
                                                            borderBottomWidth: 1,
                                                            borderColor: colors.border || "#ddd",
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                color: colors.text,
                                                                textAlign: "center",
                                                            }}
                                                        >
                                                            {type}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}

                                                {/* Cancel Button */}
                                                <TouchableOpacity
                                                    onPress={() => setShowTypePicker(false)}
                                                    style={{
                                                        marginTop: 15,
                                                        paddingVertical: 12,
                                                        backgroundColor: colors.primary,
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: "center",
                                                            color: colors.white,
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        Close
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </Modal>
                                    </>
                                )}
                            />

                            {errors.type && (
                                <Text className="mt-1 text-sm text-red-500">
                                    {errors.type.message}
                                </Text>
                            )}
                        </View>

                        {/* Address label Modal Picker */}
                        <View>
                            <Controller
                                control={control}
                                name="label"
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        {/* Trigger Button */}
                                        <TouchableOpacity
                                            onPress={() => setShowLabelPicker(true)}
                                            className="w-full rounded-xl px-4 py-3"
                                            style={{ backgroundColor: colors.card }}
                                        >
                                            <Text style={{ color: value ? colors.text : colors.placeholder }}>
                                                {value || "Select address label"}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Modal Picker */}
                                        <Modal
                                            visible={showLabelPicker}
                                            animationType="slide"
                                            transparent
                                        >
                                            {/* Overlay */}
                                            <TouchableOpacity
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: "rgba(0,0,0,0.4)",
                                                }}
                                                activeOpacity={1}
                                                onPress={() => setShowLabelPicker(false)}
                                            />

                                            {/* Bottom Sheet */}
                                            <View
                                                style={{
                                                    backgroundColor: colors.card,
                                                    padding: 20,
                                                    borderTopLeftRadius: 20,
                                                    borderTopRightRadius: 20,
                                                    position: "absolute",
                                                    bottom: 0,
                                                    width: "100%",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 18,
                                                        fontWeight: "600",
                                                        color: colors.text,
                                                        marginBottom: 15,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Select Address Label
                                                </Text>
                                                {LABEL_TYPES.map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        onPress={() => {
                                                            onChange(type.toLowerCase());
                                                            setShowLabelPicker(false);
                                                        }}
                                                        style={{
                                                            paddingVertical: 14,
                                                            borderBottomWidth: 1,
                                                            borderColor: colors.border || "#ddd",
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                color: colors.text,
                                                                textAlign: "center",
                                                            }}
                                                        >
                                                            {type}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}

                                                {/* Cancel Button */}
                                                <TouchableOpacity
                                                    onPress={() => setShowLabelPicker(false)}
                                                    style={{
                                                        marginTop: 15,
                                                        paddingVertical: 12,
                                                        backgroundColor: colors.primary,
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: "center",
                                                            color: colors.white,
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        Close
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </Modal>
                                    </>
                                )}
                            />

                            {errors.label && (
                                <Text className="mt-1 text-sm text-red-500">
                                    {errors.label.message}
                                </Text>
                            )}
                        </View>

                        {/* Business street code */}
                        <View>
                            <Controller
                                control={control}
                                name="street"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Street"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType='default'
                                        className="w-full rounded-xl px-4 py-3"
                                        style={{ backgroundColor: colors.card, color: colors.text }}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {errors.street && (
                                <Text className="mt-1 text-sm text-red-500">{errors.street.message}</Text>
                            )}
                        </View>

                        {/* Business city code */}
                        <View>
                            <Controller
                                control={control}
                                name="city"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="City"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType='default'
                                        className="w-full rounded-xl px-4 py-3"
                                        style={{ backgroundColor: colors.card, color: colors.text }}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {errors.city && (
                                <Text className="mt-1 text-sm text-red-500">{errors.city.message}</Text>
                            )}
                        </View>

                        {/* Business state code */}
                        <View>
                            <Controller
                                control={control}
                                name="state"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="State"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType='default'
                                        className="w-full rounded-xl px-4 py-3"
                                        style={{ backgroundColor: colors.card, color: colors.text }}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {errors.state && (
                                <Text className="mt-1 text-sm text-red-500">{errors.state.message}</Text>
                            )}
                        </View>

                        {/* Business postal code */}
                        <View>
                            <Controller
                                control={control}
                                name="postalCode"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Postal Code"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType='numeric'
                                        className="w-full rounded-xl px-4 py-3"
                                        style={{ backgroundColor: colors.card, color: colors.text }}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {errors.postalCode && (
                                <Text className="mt-1 text-sm text-red-500">{errors.postalCode.message}</Text>
                            )}
                        </View>

                        {/* Business country */}
                        <View>
                            <Controller
                                control={control}
                                name="country"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Country"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType='default'
                                        className="w-full rounded-xl px-4 py-3"
                                        style={{ backgroundColor: colors.card, color: colors.text }}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {errors.country && (
                                <Text className="mt-1 text-sm text-red-500">{errors.country.message}</Text>
                            )}
                        </View>

                        {/* Primary Checkbox */}
                        <View className="flex-row items-center mt-2">
                            <Controller
                                control={control}
                                name="isPrimary"
                                render={({ field: { value, onChange } }) => (
                                    <TouchableOpacity
                                        onPress={() => onChange(!value)}
                                        className="h-6 w-6 mr-2 items-center justify-center rounded border"
                                        style={{
                                            borderColor: colors.text,
                                            backgroundColor: value ? colors.primary : 'transparent',
                                        }}
                                    >
                                        {value && <Ionicons name="checkmark" size={16} color="white" />}
                                    </TouchableOpacity>
                                )}
                            />

                            <Text style={{ color: colors.text }}>Is Primary Address?</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="mt-8 flex-row justify-between">
                        <TouchableOpacity
                            onPress={() => { "" }}
                            className="mr-3 flex-1 items-center rounded-xl py-3"
                            style={{ backgroundColor: colors.primary }}>
                            <Text style={{ color: colors.white, fontWeight: '600' }}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSubmit(onSubmit)}
                            className="ml-3 flex-1 items-center rounded-xl py-3"
                            style={{ backgroundColor: colors.primary }}>
                            <Text style={{ color: colors.white, fontWeight: '600' }}>Next</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};