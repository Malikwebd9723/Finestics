import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeProvider';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeContext();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSignUp = () => {
    const { name, email, password, organization, address } = form;

    if (!name || !email || !password || !organization || !address) {
      Alert.alert('Missing Fields', 'Please fill out all fields before continuing.');
      return;
    }

    Alert.alert('Success', 'Account created successfully!');
    navigation.replace('Login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text className="mb-6 text-center text-3xl font-bold" style={{ color: colors.text }}>
          Sign Up
        </Text>

        {/* Full Name */}
        <View
          className="mb-4 flex-row items-center rounded-xl px-3 py-3"
          style={{ backgroundColor: colors.card }}>
          <MaterialCommunityIcons name="account-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={colors.placeholder}
            value={form.name}
            onChangeText={(t) => handleChange('name', t)}
            className="ml-2 flex-1 text-base"
            style={{ color: colors.text }}
          />
        </View>

        {/* Email */}
        <View
          className="mb-4 flex-row items-center rounded-xl px-3 py-3"
          style={{ backgroundColor: colors.card }}>
          <MaterialCommunityIcons name="email-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(t) => handleChange('email', t)}
            className="ml-2 flex-1 text-base"
            style={{ color: colors.text }}
          />
        </View>

        {/* Organization */}
        <View
          className="mb-4 flex-row items-center rounded-xl px-3 py-3"
          style={{ backgroundColor: colors.card }}>
          <Ionicons name="business-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Organization"
            placeholderTextColor={colors.placeholder}
            value={form.organization}
            onChangeText={(t) => handleChange('organization', t)}
            className="ml-2 flex-1 text-base"
            style={{ color: colors.text }}
          />
        </View>

        {/* Address */}
        <View
          className="mb-4 flex-row items-center rounded-xl px-3 py-3"
          style={{ backgroundColor: colors.card }}>
          <Ionicons name="location-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Address"
            placeholderTextColor={colors.placeholder}
            value={form.address}
            onChangeText={(t) => handleChange('address', t)}
            className="ml-2 flex-1 text-base"
            style={{ color: colors.text }}
          />
        </View>

        {/* Password */}
        <View
          className="mb-4 flex-row items-center rounded-xl px-3 py-3"
          style={{ backgroundColor: colors.card }}>
          <Ionicons name="key-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(t) => handleChange('password', t)}
            className="ml-2 flex-1 text-base"
            style={{ color: colors.text }}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.placeholder}
            />
          </Pressable>
        </View>

        {/* Sign Up Button */}
        <Pressable
          onPress={handleSignUp}
          className="mt-2 rounded-xl py-3"
          style={{
            backgroundColor: colors.primary,
            alignItems: 'center',
          }}>
          <Text className="text-base font-semibold text-white">Sign Up</Text>
        </Pressable>

        {/* Login Link */}
        <View className="mt-4 flex-row justify-end">
          <Text className="mr-1 text-sm" style={{ color: colors.text }}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Login?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
