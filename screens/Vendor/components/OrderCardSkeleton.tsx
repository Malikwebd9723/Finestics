// screens/Vendor/components/OrderCardSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';

interface OrderCardSkeletonProps {
  count?: number;
}

export default function OrderCardSkeleton({ count = 5 }: OrderCardSkeletonProps) {
  const { colors } = useThemeContext();
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <View className="flex-1">
      {/* Filter & Stats Skeleton */}
      <View className="px-4 py-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Animated.View
            className="h-6 w-20 rounded-lg"
            style={{ backgroundColor: colors.border, opacity: fadeAnim }}
          />
          <Animated.View
            className="h-8 w-20 rounded-full"
            style={{ backgroundColor: colors.border, opacity: fadeAnim }}
          />
        </View>
        <View className="flex-row gap-2">
          <Animated.View
            className="h-16 flex-1 rounded-xl"
            style={{ backgroundColor: colors.border, opacity: fadeAnim }}
          />
          <Animated.View
            className="h-16 flex-1 rounded-xl"
            style={{ backgroundColor: colors.border, opacity: fadeAnim }}
          />
        </View>
      </View>

      {/* Card Skeletons */}
      <View className="px-4">
        {[...Array(count)].map((_, index) => (
          <Animated.View
            key={index}
            className="mb-3 rounded-2xl p-4"
            style={{
              backgroundColor: colors.card,
              opacity: fadeAnim,
            }}>
            {/* Header */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="h-5 w-28 rounded-lg" style={{ backgroundColor: colors.border }} />
              <View className="h-6 w-20 rounded-full" style={{ backgroundColor: colors.border }} />
            </View>

            {/* Customer Info */}
            <View className="mb-3 flex-row items-center">
              <View
                className="mr-2.5 h-9 w-9 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
              <View className="flex-1">
                <View
                  className="mb-1 h-4 w-36 rounded"
                  style={{ backgroundColor: colors.border }}
                />
                <View className="h-3 w-24 rounded" style={{ backgroundColor: colors.border }} />
              </View>
            </View>

            {/* Details Row */}
            <View className="mb-3 flex-row items-center gap-4">
              <View className="h-4 w-16 rounded" style={{ backgroundColor: colors.border }} />
              <View className="h-4 w-14 rounded" style={{ backgroundColor: colors.border }} />
              <View className="h-4 w-12 rounded" style={{ backgroundColor: colors.border }} />
            </View>

            {/* Footer */}
            <View
              className="flex-row items-center justify-between border-t pt-3"
              style={{ borderColor: colors.border }}>
              <View className="h-6 w-16 rounded-md" style={{ backgroundColor: colors.border }} />
              <View className="h-6 w-20 rounded" style={{ backgroundColor: colors.border }} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
