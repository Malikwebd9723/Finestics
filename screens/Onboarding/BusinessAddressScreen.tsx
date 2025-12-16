import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    ToastAndroid,
    Modal,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { businessAddressSchema } from 'validations/formValidationSchemas';
import { useThemeContext } from '../../context/ThemeProvider';
import { apiRequest } from 'api/clients';
import { errorHandler } from 'utils/errorHandler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const navigation = useNavigation();

    const ADDRESS_TYPES = ['Business', 'Billing', 'Delivery'];
    const LABEL_TYPES = ['Branch', 'Office', 'Store', 'Warehouse', 'Other'];

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
            navigation.navigate("SubscriptionScreen" as never);
            reset();
        } catch (error) {
            ToastAndroid.show('Something went wrong, try again!', ToastAndroid.SHORT);
        }
    };

    const ModalPicker = ({ 
        visible, 
        onClose, 
        options, 
        title, 
        onSelect 
    }: { 
        visible: boolean; 
        onClose: () => void; 
        options: string[]; 
        title: string; 
        onSelect: (value: string) => void;
    }) => (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end",
                }}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={{
                        backgroundColor: colors.card,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingTop: 8,
                        maxHeight: '70%',
                    }}
                >
                    {/* Handle Bar */}
                    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                        <View style={{
                            width: 40,
                            height: 4,
                            backgroundColor: colors.border || '#ddd',
                            borderRadius: 2,
                        }} />
                    </View>

                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: colors.text,
                            marginBottom: 8,
                            textAlign: "center",
                            paddingHorizontal: 20,
                        }}
                    >
                        {title}
                    </Text>

                    <ScrollView style={{ maxHeight: 400 }}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={option}
                                onPress={() => {
                                    onSelect(option.toLowerCase());
                                    onClose();
                                }}
                                style={{
                                    paddingVertical: 16,
                                    paddingHorizontal: 20,
                                    marginHorizontal: 16,
                                    marginVertical: 4,
                                    borderRadius: 12,
                                    backgroundColor: colors.background,
                                    borderWidth: 1,
                                    borderColor: colors.border || '#eee',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: colors.text,
                                        fontWeight: '500',
                                    }}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            margin: 20,
                            paddingVertical: 14,
                            backgroundColor: colors.primary,
                            borderRadius: 12,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                color: colors.white || '#fff',
                                fontWeight: "600",
                                fontSize: 16,
                            }}
                        >
                            Close
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Header Section */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}>
                        <View style={{ 
                            alignItems: 'center', 
                            marginBottom: 16,
                            padding: 16,
                            backgroundColor: colors.card,
                            borderRadius: 20,
                        }}>
                            <View style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: colors.primary + '20',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12,
                            }}>
                                <Ionicons name="location" size={32} color={colors.primary} />
                            </View>
                            <Text style={{ 
                                fontSize: 28, 
                                fontWeight: "700", 
                                color: colors.text,
                                marginBottom: 6,
                            }}>
                                Business Address
                            </Text>
                            <Text style={{ 
                                fontSize: 14, 
                                color: colors.placeholder,
                                textAlign: 'center',
                                lineHeight: 20,
                            }}>
                                Please provide your business location details
                            </Text>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 20, gap: 16 }}>
                        {/* Address Type Picker */}
                        <View>
                            <Text style={{ 
                                fontSize: 14, 
                                fontWeight: '600', 
                                color: colors.text, 
                                marginBottom: 8,
                                marginLeft: 4,
                            }}>
                                Address Type
                            </Text>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => setShowTypePicker(true)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: colors.card,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                borderWidth: 1,
                                                borderColor: errors.type ? '#EF4444' : colors.border || '#eee',
                                            }}
                                        >
                                            <Text style={{ 
                                                color: value ? colors.text : colors.placeholder,
                                                fontSize: 16,
                                                textTransform: 'capitalize',
                                            }}>
                                                {value || "Select address type"}
                                            </Text>
                                            <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                                        </TouchableOpacity>

                                        <ModalPicker
                                            visible={showTypePicker}
                                            onClose={() => setShowTypePicker(false)}
                                            options={ADDRESS_TYPES}
                                            title="Select Address Type"
                                            onSelect={onChange}
                                        />
                                    </>
                                )}
                            />
                            {errors.type && (
                                <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                    {errors.type.message}
                                </Text>
                            )}
                        </View>

                        {/* Address Label Picker */}
                        <View>
                            <Text style={{ 
                                fontSize: 14, 
                                fontWeight: '600', 
                                color: colors.text, 
                                marginBottom: 8,
                                marginLeft: 4,
                            }}>
                                Address Label
                            </Text>
                            <Controller
                                control={control}
                                name="label"
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => setShowLabelPicker(true)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: colors.card,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                borderWidth: 1,
                                                borderColor: errors.label ? '#EF4444' : colors.border || '#eee',
                                            }}
                                        >
                                            <Text style={{ 
                                                color: value ? colors.text : colors.placeholder,
                                                fontSize: 16,
                                                textTransform: 'capitalize',
                                            }}>
                                                {value || "Select address label"}
                                            </Text>
                                            <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                                        </TouchableOpacity>

                                        <ModalPicker
                                            visible={showLabelPicker}
                                            onClose={() => setShowLabelPicker(false)}
                                            options={LABEL_TYPES}
                                            title="Select Address Label"
                                            onSelect={onChange}
                                        />
                                    </>
                                )}
                            />
                            {errors.label && (
                                <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                    {errors.label.message}
                                </Text>
                            )}
                        </View>

                        {/* Street Input */}
                        <View>
                            <Text style={{ 
                                fontSize: 14, 
                                fontWeight: '600', 
                                color: colors.text, 
                                marginBottom: 8,
                                marginLeft: 4,
                            }}>
                                Street Address
                            </Text>
                            <Controller
                                control={control}
                                name="street"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="123 Main Street"
                                        placeholderTextColor={colors.placeholder}
                                        style={{
                                            backgroundColor: colors.card,
                                            color: colors.text,
                                            borderRadius: 14,
                                            paddingHorizontal: 16,
                                            paddingVertical: 16,
                                            fontSize: 16,
                                            borderWidth: 1,
                                            borderColor: errors.street ? '#EF4444' : colors.border || '#eee',
                                        }}
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                    />
                                )}
                            />
                            {errors.street && (
                                <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                    {errors.street.message}
                                </Text>
                            )}
                        </View>

                        {/* City and State Row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    City
                                </Text>
                                <Controller
                                    control={control}
                                    name="city"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="City"
                                            placeholderTextColor={colors.placeholder}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.city ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.city && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.city.message}
                                    </Text>
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    State
                                </Text>
                                <Controller
                                    control={control}
                                    name="state"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="State"
                                            placeholderTextColor={colors.placeholder}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.state ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.state && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.state.message}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Postal Code and Country Row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Postal Code
                                </Text>
                                <Controller
                                    control={control}
                                    name="postalCode"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="12345"
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType='numeric'
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.postalCode ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.postalCode && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.postalCode.message}
                                    </Text>
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Country
                                </Text>
                                <Controller
                                    control={control}
                                    name="country"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="Country"
                                            placeholderTextColor={colors.placeholder}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.country ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.country && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.country.message}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Primary Address Checkbox */}
                        <View style={{
                            backgroundColor: colors.card,
                            borderRadius: 14,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: colors.border || '#eee',
                            marginTop: 8,
                        }}>
                            <Controller
                                control={control}
                                name="isPrimary"
                                render={({ field: { value, onChange } }) => (
                                    <TouchableOpacity
                                        onPress={() => onChange(!value)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 8,
                                                marginRight: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: value ? colors.primary : 'transparent',
                                                borderWidth: 2,
                                                borderColor: value ? colors.primary : colors.border || '#ddd',
                                            }}
                                        >
                                            {value && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ 
                                                color: colors.text, 
                                                fontSize: 16,
                                                fontWeight: '600',
                                                marginBottom: 2,
                                            }}>
                                                Set as Primary Address
                                            </Text>
                                            <Text style={{ 
                                                color: colors.placeholder, 
                                                fontSize: 13,
                                            }}>
                                                This will be your default business location
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>

                    {/* Footer Buttons */}
                    <View style={{ 
                        flexDirection: 'row', 
                        gap: 12, 
                        paddingHorizontal: 20, 
                        marginTop: 32,
                    }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                borderRadius: 14,
                                paddingVertical: 16,
                                backgroundColor: colors.card,
                                borderWidth: 2,
                                borderColor: colors.primary,
                            }}
                        >
                            <Text style={{ 
                                color: colors.primary, 
                                fontWeight: '600',
                                fontSize: 16,
                            }}>
                                Back
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSubmit(onSubmit)}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                borderRadius: 14,
                                paddingVertical: 16,
                                backgroundColor: colors.primary,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 5,
                            }}
                        >
                            <Text style={{ 
                                color: colors.white || '#fff', 
                                fontWeight: '600',
                                fontSize: 16,
                            }}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}