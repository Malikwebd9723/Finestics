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
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { businessInfoSchema } from 'validations/formValidationSchemas';
import { useThemeContext } from '../../context/ThemeProvider';
import * as ImagePicker from 'expo-image-picker';
import { apiRequest } from 'api/clients';
import { errorHandler } from 'utils/errorHandler';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BusinessFormValues {
    businessName: string;
    businessType: string;
    businessLicense: string;
    website: string;
    description: string;
    businessPhone?: string;
    businessEmail?: string;
    preferredDeliveryTime?: string;
    specialInstructions?: string;
}

export default function BusinessInfoScreen() {
    const { colors } = useThemeContext();
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const navigation = useNavigation();
    const BUSINESS_TYPES = ['Cafe', 'Restaurant', 'Hotel', 'Shop', 'Catering', 'Other'];
    const [showTypePicker, setShowTypePicker] = useState(false);
    const DELIVERY_TIME = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
    const [showDeliveryTime, setShowDeliveryTime] = useState(false);

    const pickImage = async (setImage: (uri: string) => void) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const onPickCover = () => pickImage((uri) => setCoverImage(uri));
    const onPickLogo = () => pickImage((uri) => setLogoImage(uri));

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<BusinessFormValues>({
        resolver: yupResolver(businessInfoSchema),
        defaultValues: {
            businessName: '',
            businessType: '',
            businessLicense: '',
            website: '',
            description: '',
            businessPhone: '',
            businessEmail: '',
            preferredDeliveryTime: '',
            specialInstructions: '',
        },
    });

    const onSubmit = async (formData: any) => {
        const dataToSubmit = {
            ...formData,
            coverImage,
            logoImage,
        };

        try {
            const response = await apiRequest('/onboarding/business-info', 'POST', dataToSubmit);
            if (!response.success) {
                errorHandler(response.data);
                return;
            }
            ToastAndroid.show('Business info Submitted!', ToastAndroid.SHORT);
            navigation.navigate("BusinessAddressScreen" as never);
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
        <Modal visible={visible} animationType="slide" transparent>
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
                        {options.map((option) => (
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
                    {/* Cover Image Section */}
                    <TouchableOpacity
                        onPress={onPickCover}
                        style={{
                            height: 200,
                            width: '100%',
                            backgroundColor: colors.card,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {coverImage ? (
                            <Image 
                                source={{ uri: coverImage }} 
                                style={{ height: '100%', width: '100%' }}
                                resizeMode="cover" 
                            />
                        ) : (
                            <View style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primary + '10',
                            }}>
                                <View style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: colors.card,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12,
                                }}>
                                    <Ionicons name="image-outline" size={32} color={colors.primary} />
                                </View>
                                <Text style={{ 
                                    fontSize: 14,
                                    color: colors.text,
                                    fontWeight: '500',
                                }}>
                                    Add Cover Photo
                                </Text>
                                <Text style={{ 
                                    fontSize: 12,
                                    color: colors.placeholder,
                                    marginTop: 4,
                                }}>
                                    Tap to upload
                                </Text>
                            </View>
                        )}
                        
                        {/* Edit overlay for cover */}
                        {coverImage && (
                            <View style={{
                                position: 'absolute',
                                bottom: 12,
                                right: 12,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: 20,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <Ionicons name="camera" size={16} color="#fff" />
                                <Text style={{ color: '#fff', marginLeft: 6, fontSize: 12 }}>Edit</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Logo Image */}
                    <View style={{ alignItems: 'center', marginTop: -60 }}>
                        <TouchableOpacity
                            onPress={onPickLogo}
                            style={{
                                position: 'relative',
                            }}
                        >
                            <View style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                borderWidth: 4,
                                borderColor: colors.background,
                                backgroundColor: colors.card,
                                overflow: 'hidden',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 8,
                            }}>
                                <Image
                                    source={logoImage ? { uri: logoImage } : require('../../assets/dummy-profile.png')}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </View>
                            
                            {/* Camera icon overlay */}
                            <View style={{
                                position: 'absolute',
                                bottom: 4,
                                right: 4,
                                backgroundColor: colors.primary,
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 3,
                                borderColor: colors.background,
                            }}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <Text style={{ 
                            marginTop: 12,
                            fontSize: 14,
                            color: colors.text,
                            fontWeight: '600',
                        }}>
                            Business Logo
                        </Text>
                        <Text style={{ 
                            fontSize: 12,
                            color: colors.placeholder,
                            marginTop: 2,
                        }}>
                            Tap to change
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                        <Text style={{ 
                            fontSize: 24, 
                            fontWeight: "700", 
                            color: colors.text,
                            marginBottom: 8,
                        }}>
                            Business Information
                        </Text>
                        <Text style={{ 
                            fontSize: 14, 
                            color: colors.placeholder,
                            marginBottom: 24,
                        }}>
                            Tell us about your business
                        </Text>

                        <View style={{ gap: 16 }}>
                            {/* Business Name */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Business Name *
                                </Text>
                                <Controller
                                    control={control}
                                    name="businessName"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="Enter your business name"
                                            placeholderTextColor={colors.placeholder}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.businessName ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.businessName && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.businessName.message}
                                    </Text>
                                )}
                            </View>

                            {/* Business Type Picker */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Business Type *
                                </Text>
                                <Controller
                                    control={control}
                                    name="businessType"
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
                                                    borderColor: errors.businessType ? '#EF4444' : colors.border || '#eee',
                                                }}
                                            >
                                                <Text style={{ 
                                                    color: value ? colors.text : colors.placeholder,
                                                    fontSize: 16,
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {value || "Select business type"}
                                                </Text>
                                                <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                                            </TouchableOpacity>

                                            <ModalPicker
                                                visible={showTypePicker}
                                                onClose={() => setShowTypePicker(false)}
                                                options={BUSINESS_TYPES}
                                                title="Select Business Type"
                                                onSelect={onChange}
                                            />
                                        </>
                                    )}
                                />
                                {errors.businessType && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.businessType.message}
                                    </Text>
                                )}
                            </View>

                            {/* Phone and Email Row */}
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ 
                                        fontSize: 14, 
                                        fontWeight: '600', 
                                        color: colors.text, 
                                        marginBottom: 8,
                                        marginLeft: 4,
                                    }}>
                                        Phone Number
                                    </Text>
                                    <Controller
                                        control={control}
                                        name="businessPhone"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput
                                                placeholder="Phone"
                                                placeholderTextColor={colors.placeholder}
                                                keyboardType='phone-pad'
                                                style={{
                                                    backgroundColor: colors.card,
                                                    color: colors.text,
                                                    borderRadius: 14,
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 16,
                                                    fontSize: 16,
                                                    borderWidth: 1,
                                                    borderColor: errors.businessPhone ? '#EF4444' : colors.border || '#eee',
                                                }}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                            />
                                        )}
                                    />
                                    {errors.businessPhone && (
                                        <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                            {errors.businessPhone.message}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Email */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Email Address
                                </Text>
                                <Controller
                                    control={control}
                                    name="businessEmail"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="business@example.com"
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType='email-address'
                                            autoCapitalize='none'
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.businessEmail ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.businessEmail && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.businessEmail.message}
                                    </Text>
                                )}
                            </View>

                            {/* License Number */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    License Number
                                </Text>
                                <Controller
                                    control={control}
                                    name="businessLicense"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="Enter license number"
                                            placeholderTextColor={colors.placeholder}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.businessLicense ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.businessLicense && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.businessLicense.message}
                                    </Text>
                                )}
                            </View>

                            {/* Website */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Website (Optional)
                                </Text>
                                <Controller
                                    control={control}
                                    name="website"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="https://www.example.com"
                                            placeholderTextColor={colors.placeholder}
                                            keyboardType="url"
                                            autoCapitalize="none"
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                borderWidth: 1,
                                                borderColor: errors.website ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.website && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.website.message}
                                    </Text>
                                )}
                            </View>

                            {/* Delivery Time Picker */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Preferred Delivery Time
                                </Text>
                                <Controller
                                    control={control}
                                    name="preferredDeliveryTime"
                                    render={({ field: { onChange, value } }) => (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => setShowDeliveryTime(true)}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: colors.card,
                                                    borderRadius: 14,
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 16,
                                                    borderWidth: 1,
                                                    borderColor: colors.border || '#eee',
                                                }}
                                            >
                                                <Text style={{ 
                                                    color: value ? colors.text : colors.placeholder,
                                                    fontSize: 16,
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {value || "Select delivery time"}
                                                </Text>
                                                <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                                            </TouchableOpacity>

                                            <ModalPicker
                                                visible={showDeliveryTime}
                                                onClose={() => setShowDeliveryTime(false)}
                                                options={DELIVERY_TIME}
                                                title="Select Delivery Time"
                                                onSelect={onChange}
                                            />
                                        </>
                                    )}
                                />
                            </View>

                            {/* Description */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Description *
                                </Text>
                                <Controller
                                    control={control}
                                    name="description"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="Tell us about your business..."
                                            placeholderTextColor={colors.placeholder}
                                            multiline
                                            numberOfLines={4}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                height: 120,
                                                textAlignVertical: 'top',
                                                borderWidth: 1,
                                                borderColor: errors.description ? '#EF4444' : colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                                {errors.description && (
                                    <Text style={{ marginTop: 6, fontSize: 13, color: '#EF4444', marginLeft: 4 }}>
                                        {errors.description.message}
                                    </Text>
                                )}
                            </View>

                            {/* Special Instructions */}
                            <View>
                                <Text style={{ 
                                    fontSize: 14, 
                                    fontWeight: '600', 
                                    color: colors.text, 
                                    marginBottom: 8,
                                    marginLeft: 4,
                                }}>
                                    Special Instructions (Optional)
                                </Text>
                                <Controller
                                    control={control}
                                    name="specialInstructions"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            placeholder="Any special requirements or instructions..."
                                            placeholderTextColor={colors.placeholder}
                                            multiline
                                            numberOfLines={4}
                                            style={{
                                                backgroundColor: colors.card,
                                                color: colors.text,
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                paddingVertical: 16,
                                                fontSize: 16,
                                                height: 120,
                                                textAlignVertical: 'top',
                                                borderWidth: 1,
                                                borderColor: colors.border || '#eee',
                                            }}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        {/* Footer Buttons */}
                        <View style={{ 
                            flexDirection: 'row', 
                            gap: 12, 
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
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}