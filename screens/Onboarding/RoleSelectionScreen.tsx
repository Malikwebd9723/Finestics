import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ToastAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { useThemeContext } from '../../context/ThemeProvider';
import { apiRequest } from 'api/clients';
import { errorHandler } from 'utils/errorHandler';
import { useNavigation } from '@react-navigation/native';

export default function RoleStep() {
    const { colors } = useThemeContext();
    const navigation = useNavigation();
    const { handleSubmit, setValue, watch, formState } = useForm({
        defaultValues: { role: '' as 'customer' | 'vendor' },
    });

    const selectedRole = watch('role');

    const onSubmit = async (values: { role: 'customer' | 'vendor' }) => {
        try {
            const role = values.role;
            const response = await apiRequest('/onboarding/role', 'POST', { role });

            if (!response.success) {
                errorHandler(response.data);
            }
            ToastAndroid.show("Role Selected", ToastAndroid.SHORT);
            navigation.navigate("BusinessInfoScreen" as never);
        } catch (error) {
            console.log('Request Failed:', error);
        }
    };

    return (
        <View
            className="flex-1 items-center justify-center gap-5 px-6"
            style={{ backgroundColor: colors.background }}
        >
            {/* Logo */}
            <View
                className="h-100 w-100 items-center justify-center"
                style={{ backgroundColor: colors.primary, borderRadius: 999 }}
            >
                <Image
                    source={require('../../assets/splash.png')}
                    className="h-100 w-100"
                    resizeMode="contain"
                />
            </View>

            <View>
                <Text className="text-center text-3xl font-bold" style={{ color: colors.text }}>
                    Let’s setup your profile
                </Text>
                <Text className="mt-2 text-center text-base" style={{ color: colors.text }}>
                    Select how you want to continue
                </Text>
            </View>

            {/* Role Buttons */}
            <View className="mt-8 w-full flex-row justify-center gap-4">
                <TouchableOpacity
                    onPress={() => setValue('role', 'customer')}
                    className="flex-1 flex-row items-center justify-center rounded-xl px-5 py-3"
                    style={{
                        backgroundColor:
                            selectedRole === 'customer' ? colors.primary : colors.card,
                        borderWidth: selectedRole === 'customer' ? 0 : 1,
                        borderColor: colors.primary,
                    }}
                >
                    <Ionicons
                        name="person-outline"
                        size={20}
                        color={selectedRole === 'customer' ? colors.white : colors.primary}
                    />
                    <Text
                        className="ml-2 text-lg font-medium"
                        style={{
                            color: selectedRole === 'customer' ? colors.white : colors.primary,
                        }}
                    >
                        Customer
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setValue('role', 'vendor')}
                    className="flex-1 flex-row items-center justify-center rounded-xl px-5 py-3"
                    style={{
                        backgroundColor:
                            selectedRole === 'vendor' ? colors.primary : colors.card,
                        borderWidth: selectedRole === 'vendor' ? 0 : 1,
                        borderColor: colors.primary,
                    }}
                >
                    <Ionicons
                        name="storefront-outline"
                        size={20}
                        color={selectedRole === 'vendor' ? colors.white : colors.primary}
                    />
                    <Text
                        className="ml-2 text-lg font-medium"
                        style={{
                            color: selectedRole === 'vendor' ? colors.white : colors.primary,
                        }}
                    >
                        Vendor
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
                disabled={formState.isSubmitting || !selectedRole}
                onPress={handleSubmit(onSubmit)}
                className="mt-10 w-full items-center rounded-xl py-3"
                style={{
                    backgroundColor: selectedRole ? colors.primary : colors.disabled,
                    opacity: formState.isSubmitting ? 0.6 : 1,
                }}
            >
                {formState.isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text className="text-lg font-semibold" style={{ color: colors.white }}>
                        Continue
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
