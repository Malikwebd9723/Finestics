import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "context/AuthContext";

const PendingVerificationScreen = () => {
  const { colors } = useThemeContext();
  const navigation = useNavigation()
  const { logout } = useAuth();
  return (
    <SafeAreaView
      className="flex-1 justify-center items-center px-6"
      style={{ backgroundColor: colors.background }}
    >
      {/* ICON CIRCLE */}
      <View
        className="h-32 w-32 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.primary + "25" }}
      >
        <Ionicons
          name="hourglass-outline"
          size={80}
          color={colors.primary}
        />
      </View>

      {/* TITLE */}
      <Text
        className="mt-8 text-3xl font-bold text-center"
        style={{ color: colors.text }}
      >
        Profile Under Review
      </Text>

      {/* DESCRIPTION */}
      <Text
        className="mt-4 text-center text-base leading-6"
        style={{ color: colors.text }}
      >
        Thank you! Your profile has been submitted successfully.
        {"\n"}Our team is now reviewing your information.
      </Text>

      <Text
        className="mt-2 text-center text-base leading-6"
        style={{ color: colors.text + "AA" }}
      >
        Verification typically takes between{" "}
        <Text style={{ fontWeight: "bold", color: colors.text }}>
          12–24 hours
        </Text>.
        {"\n"}You will be notified once your account is approved.
      </Text>

      {/* FOOTER MESSAGE BOX */}
      <View
        className="mt-10 w-full rounded-2xl p-5"
        style={{
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <View className="flex-row items-center">
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text
            className="ml-2 text-lg font-semibold"
            style={{ color: colors.text }}
          >
            What you can do meanwhile
          </Text>
        </View>

        <Text
          className="mt-3 text-base"
          style={{ color: colors.text }}
        >
          • Explore the app features
        </Text>

        <Text
          className="mt-1 text-base"
          style={{ color: colors.text }}
        >
          • Prepare your product or service details
        </Text>

        <Text
          className="mt-1 text-base"
          style={{ color: colors.text }}
        >
          • You will gain full access once approval is complete
        </Text>
      </View>
      <TouchableOpacity
        onPress={logout}
        className="w-full items-center rounded-xl py-3 mt-8"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="font-medium" style={{ color: colors.white }}>
          Go Home?
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default PendingVerificationScreen;
