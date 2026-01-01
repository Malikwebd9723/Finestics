import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Animated,
} from "react-native";
import { useThemeContext } from "context/ThemeProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FAB, Divider } from "react-native-paper";

interface ExpenseItem {
    id: string;
    title: string;
    date: string;
    amount: number;
    icon: string;
}

export default function Expense() {
    const { colors } = useThemeContext();
    const [loading, setLoading] = useState(true);
    const shimmer = useState(new Animated.Value(0))[0];

    const expenses: ExpenseItem[] = [
        { id: "1", title: "Food", date: "02 Mar, 2025", amount: 500, icon: "silverware-fork-knife" },
        { id: "2", title: "Logistics", date: "02 Mar, 2025", amount: 1400, icon: "truck-delivery-outline" },
        { id: "3", title: "Salary", date: "02 Mar, 2025", amount: 3290, icon: "cash-multiple" },
    ];

    // shimmer animation loop
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [shimmer]);

    // simulate loading
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const shimmerOpacity = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    const handleAddExpense = () => {
        console.log("Add Expense clicked!");
    };

    // skeleton shimmer loader
    const SkeletonItem = () => (
        <Animated.View
            className="flex-row justify-between items-center p-4 mb-3 rounded-2xl"
            style={{ backgroundColor: colors.card, opacity: shimmerOpacity }}
        >
            <View className="flex-row items-center">
                <Animated.View
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: colors.border }}
                />
                <View className="ml-3">
                    <Animated.View
                        className="w-24 h-4 mb-2 rounded"
                        style={{ backgroundColor: colors.border }}
                    />
                    <Animated.View
                        className="w-16 h-3 rounded"
                        style={{ backgroundColor: colors.border }}
                    />
                </View>
            </View>

            <Animated.View
                className="w-12 h-4 rounded"
                style={{ backgroundColor: colors.border }}
            />
        </Animated.View>
    );

    return (
        <View className="flex-1 p-4" style={{ backgroundColor: colors.background }}>
            {loading ? (
                <>
                    <SkeletonItem />
                    <SkeletonItem />
                    <SkeletonItem />
                </>
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <Divider style={{ backgroundColor: colors.border }} />}
                    renderItem={({ item }) => (
                        <View
                            className="flex-row justify-between items-center p-4 mb-3 rounded-2xl"
                            style={{ backgroundColor: colors.card }}
                        >
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.text} />
                                <View className="ml-3">
                                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                                        {item.title}
                                    </Text>
                                    <Text className="text-sm text-gray-400">{item.date}</Text>
                                </View>
                            </View>

                            <Text className="font-semibold text-base text-red-500">
                                ${item.amount.toFixed(2)}
                            </Text>
                        </View>
                    )}
                />
            )}

            {/* Floating Add Button */}
            <FAB
                icon="plus"
                onPress={handleAddExpense}
                style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                    backgroundColor: colors.primary,
                }}
                color="#fff"
            />
        </View>
    );
}
