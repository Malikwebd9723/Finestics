import React, { useState } from 'react';
import { ToastAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { useThemeContext } from 'context/ThemeProvider';
import { businessSchema } from 'validations/formValidationSchemas';
import { apiRequest } from 'api/clients';

import RoleStep from './RoleStep';
import BusinessInfoStep from './BusinessInfoStep';
import PackagesStep from './PackagesStep';
import OutroStep from './OutroStep';

type Screen = 'role' | 'information' | 'packages' | 'outro';
type Role = 'customer' | 'vendor' | null;
type PackageType = 'basic' | 'premium' | null;

interface BusinessFormValues {
  businessName: string;
  businessType: string;
  licenseNumber: string;
  website: string;
  description: string;
}

export default function SetupProfileScreen() {
  const { colors } = useThemeContext();
  const navigation = useNavigation();

  const [screen, setScreen] = useState<Screen>('role');
  const [role, setRole] = useState<Role>(null);
  const [formData, setFormData] = useState<BusinessFormValues | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(null);
  const [loading, setLoading] = useState(false);

  // react-hook-form only lives here
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: yupResolver(businessSchema),
    defaultValues: {
      businessName: '',
      businessType: '',
      licenseNumber: '',
      website: '',
      description: '',
    },
  });

  // shared image picker
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

  // when user presses NEXT on Business Info
  const handleBusinessInfoNext = (data: BusinessFormValues) => {
    setFormData(data);
    setScreen('packages');
  };

  const submitInformation = async () => {
    if (!role || !formData) {
      ToastAndroid.show('Missing role or business information', ToastAndroid.SHORT);
      return;
    }

    const dataToSubmit = {
      role,
      ...formData,
      coverImage,
      logoImage,
      selectedPackage,
    };

    try {
      setLoading(true);
      const response = await apiRequest('/auth/logins', 'POST', { dataToSubmit });

      if (!response.success) {
        ToastAndroid.show(
          response.data?.error?.message || 'Error while submitting!',
          ToastAndroid.SHORT
        );
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setLoading(false);
        return;
      }

      ToastAndroid.show('Profile Submitted Successfully!', ToastAndroid.SHORT);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      ToastAndroid.show('Something went wrong, try again!', ToastAndroid.SHORT);
    }
  };

  // --------- RENDER STEP BY SCREEN VALUE ---------

  if (screen === 'role') {
    return (
      <RoleStep
        colors={colors}
        onSelectRole={(selectedRole) => {
          setRole(selectedRole);
          setScreen('information');
        }}
      />
    );
  }

  if (screen === 'information') {
    return (
      <BusinessInfoStep
        colors={colors}
        control={control}
        errors={errors}
        coverImage={coverImage}
        logoImage={logoImage}
        onPickCover={() => pickImage((uri) => setCoverImage(uri))}
        onPickLogo={() => pickImage((uri) => setLogoImage(uri))}
        onBack={() => setScreen('role')}
        onNext={handleSubmit(handleBusinessInfoNext)}
      />
    );
  }

  if (screen === 'packages') {
    return (
      <PackagesStep
        colors={colors}
        selected={selectedPackage}
        onSelect={setSelectedPackage}
        onSkip={() => setScreen('outro')}
        onBack={() => setScreen('information')}
        onNext={() => setScreen('outro')}
      />
    );
  }

  // outro
  return (
    <OutroStep
      colors={colors}
      loading={loading}
      onSubmit={submitInformation}
      onBackToPackages={() => setScreen('packages')}
    />
  );
}
