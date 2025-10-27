import React, { useState } from "react";
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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Signup() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSignUp = () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    Alert.alert("Success", "Account created successfully!");
    navigation.replace("Login"); // Navigate to Login after signup
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text className="text-center text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Sign Up
        </Text>

        {/* Full Name */}
        <View className="flex-row items-center px-3 py-3 mb-4 rounded-xl bg-gray-100 dark:bg-gray-800">
          <MaterialCommunityIcons name="account-outline" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#9ca3af"
            value={form.name}
            onChangeText={(t) => handleChange("name", t)}
            className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
          />
        </View>

        {/* Email */}
        <View className="flex-row items-center px-3 py-3 mb-4 rounded-xl bg-gray-100 dark:bg-gray-800">
          <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(t) => handleChange("email", t)}
            className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center px-3 py-3 mb-4 rounded-xl bg-gray-100 dark:bg-gray-800">
          <Ionicons name="key-outline" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(t) => handleChange("password", t)}
            className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9ca3af"
            />
          </Pressable>
        </View>

        {/* Sign Up Button */}
        <Pressable
          onPress={handleSignUp}
          className="py-3 rounded-xl mt-2 items-center bg-blue-600 active:bg-blue-700"
        >
          <Text className="text-white text-base font-semibold">Sign Up</Text>
        </Pressable>

        {/* Login Link */}
        <View className="flex-row justify-end mt-4">
          <Text className="text-sm mr-1 text-gray-700 dark:text-gray-300">
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.replace("Login")}>
            <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
