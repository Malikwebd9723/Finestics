import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "context/ThemeProvider";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "context/AuthContext";

const PendingVerificationScreen = () => {
  const { colors } = useThemeContext();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleEmail = () => {
    Linking.openURL("mailto:support@finestics.com");
  };

  const handleWhatsApp = () => {
    // Replace with your WhatsApp number (include country code, no + or spaces)
    const phoneNumber = "+923139800205"; // Example: Pakistan number
    const message = "Hello, I need assistance with my pending verification.";
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`);
  };

  const handleGoHome = () => {
    logout();
  };

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{ backgroundColor: colors.background }}
    >
      {/* GO HOME BUTTON - Top Right */}
      <View className="mt-4 flex-row justify-end">
        <TouchableOpacity
          onPress={handleGoHome}
          className="flex-row items-center px-3 py-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="home-outline" size={18} color={colors.white} />
          <Text className="ml-1 text-sm font-medium" style={{ color: colors.white }}>
            Go Back?
          </Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT - Centered */}
      <View className="flex-1 justify-center items-center">
        {/* ICON CIRCLE */}
        <View
          className="h-32 w-32 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary + "25" }}
        >
          <Ionicons name="hourglass-outline" size={80} color={colors.primary} />
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
          </Text>
          .{"\n"}You will be notified once your account is approved.
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

          <Text className="mt-3 text-base" style={{ color: colors.text }}>
            • Pay for payment plans in order to get verified
          </Text>

          <Text className="mt-1 text-base" style={{ color: colors.text }}>
            • Contact the admin team for further assistance
          </Text>

          <Text className="mt-1 text-base" style={{ color: colors.text }}>
            • Prepare your product or service details
          </Text>

          <Text className="mt-1 text-base" style={{ color: colors.text }}>
            • You will gain full access once approval is complete
          </Text>
        </View>
      </View>

      {/* CONTACT BUTTONS - Bottom */}
      <View className="pb-6">
        <Text
          className="text-center text-sm mb-3"
          style={{ color: colors.text + "AA" }}
        >
          For assistance, Contact us:
        </Text>
        <View className="flex-row justify-center space-x-4 gap-5">
          {/* Gmail Button */}
          <TouchableOpacity
            onPress={handleEmail}
            className="flex-row items-center px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.card }}
          >
            <Ionicons name="mail-outline" size={24} color="#EA4335" />
            <Text className="ml-2 font-medium" style={{ color: colors.text }}>
              Email
            </Text>
          </TouchableOpacity>

          {/* WhatsApp Button */}
          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-row items-center px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.card }}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text className="ml-2 font-medium" style={{ color: colors.text }}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PendingVerificationScreen;