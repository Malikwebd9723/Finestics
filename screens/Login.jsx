import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeProvider';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      ToastAndroid.show('Please enter your email and password', ToastAndroid.SHORT);
      return;
    }
    ToastAndroid.show('Login Successful!', ToastAndroid.SHORT);
    navigation.replace('home');
  };

  return (
    <View className="flex-1 px-6" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-center">
        {/* Title */}
        <Text className="mb-10 text-center text-3xl font-bold" style={{ color: colors.text }}>
          Login
        </Text>

        {/* Email Input */}
        <View
          className="mb-4 flex-row items-center rounded-xl px-3"
          style={{ backgroundColor: colors.card }}>
          <Ionicons name="mail-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            className="flex-1 px-3 py-3 text-base"
            style={{ color: colors.text }}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View
          className="mb-2 flex-row items-center rounded-xl px-3"
          style={{ backgroundColor: colors.card }}>
          <Ionicons name="key-outline" size={20} color={colors.text} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            className="flex-1 px-3 py-3 text-base"
            style={{ color: colors.text }}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.placeholder}
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="mb-5 text-right text-sm" style={{ color: colors.text }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          className="mb-4 items-center rounded-xl py-3"
          style={{ backgroundColor: colors.primary }}>
          <Text className="text-base font-semibold text-white">Login</Text>
        </Pressable>

        {/* Signup Link */}
        <View className="flex-row justify-end">
          <Text className="mr-1 text-sm" style={{ color: colors.text }}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.replace('Signup')}>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Signup?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
