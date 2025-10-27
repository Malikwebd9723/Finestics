import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      ToastAndroid.show("Please enter your email and password", ToastAndroid.SHORT);
      return;
    }
    ToastAndroid.show("Login Successful!", ToastAndroid.SHORT);
    navigation.replace("Main");
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 px-6">
      <View className="flex-1 justify-center">
        {/* Title */}
        <Text className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">
          Login
        </Text>

        {/* Email Input */}
        <View className="flex-row items-center px-3 rounded-xl mb-4 bg-gray-100 dark:bg-gray-800">
          <Ionicons name="mail-outline" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            className="flex-1 px-3 py-3 text-base text-gray-900 dark:text-gray-100"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View className="flex-row items-center px-3 rounded-xl mb-2 bg-gray-100 dark:bg-gray-800">
          <Ionicons name="key-outline" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            className="flex-1 px-3 py-3 text-base text-gray-900 dark:text-gray-100"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text className="text-sm text-right mb-5 text-gray-700 dark:text-gray-300">
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          className="py-3 rounded-xl items-center mb-4 bg-blue-600 active:bg-blue-700"
        >
          <Text className="text-white font-semibold text-base">Login</Text>
        </Pressable>

        {/* Signup Link */}
        <View className="flex-row justify-end">
          <Text className="text-sm mr-1 text-gray-700 dark:text-gray-300">
            Don’t have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.replace("Signup")}>
            <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Signup
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
