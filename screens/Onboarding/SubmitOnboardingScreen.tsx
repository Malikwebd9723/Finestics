import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ToastAndroid } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "api/clients";
import { useThemeContext } from "context/ThemeProvider";
import { useNavigation } from "@react-navigation/native";

const SubmitOnboardingScreen = () => {
    const { colors } = useThemeContext();
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleSubmitProfile = async () => {
        try {
            setLoading(true);

            const response = await apiRequest("/onboarding/submit", "POST");
            if (!response.success) {
                ToastAndroid.show("Something went wrong. Please try again!", ToastAndroid.SHORT)
            }
            ToastAndroid.show("Profile submitted!", ToastAndroid.SHORT)
            navigation.navigate("PendingVerificationScreen" as never)

        } catch (error) {
            console.log("Error submitting profile:", error);
            alert("Something went wrong. Please try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            className="flex-1 justify-between px-6 pb-10"
            style={{ backgroundColor: colors.background }}
        >
            {/* TOP SECTION */}
            <View className="mt-20 items-center">
                <View
                    className="h-28 w-28 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primary + "20" }}
                >
                    <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
                </View>

                <Text
                    className="mt-6 text-center text-3xl font-bold"
                    style={{ color: colors.text }}
                >
                    You're Almost Done!
                </Text>

                <Text
                    className="mt-3 text-center text-base px-6"
                    style={{ color: colors.text }}
                >
                    We have collected all the required information. Please review and
                    submit your profile for approval. Our team will verify your details.
                </Text>
            </View>

            {/* INFO BOX */}
            <View
                className="mt-10 rounded-2xl p-5"
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
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                    <Text
                        className="ml-2 text-lg font-semibold"
                        style={{ color: colors.text }}
                    >
                        What happens next?
                    </Text>
                </View>

                <View className="mt-3">
                    <Text className="text-base" style={{ color: colors.text }}>
                        • Our team will review your submitted information.
                    </Text>
                    <Text className="text-base mt-1" style={{ color: colors.text }}>
                        • Approval usually takes 12–24 hours.
                    </Text>
                    <Text className="text-base mt-1" style={{ color: colors.text }}>
                        • You will be notified once your account is verified.
                    </Text>
                </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
                onPress={handleSubmitProfile}
                disabled={loading}
                className="mt-12 w-full items-center rounded-xl py-4"
                style={{
                    backgroundColor: colors.primary,
                    opacity: loading ? 0.5 : 1,
                }}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                ) : (
                    <Text className="text-lg font-semibold" style={{ color: colors.white }}>
                        Submit Profile for Approval
                    </Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default SubmitOnboardingScreen;
