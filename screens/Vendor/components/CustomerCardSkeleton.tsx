// screens/Vendor/components/CustomerCardSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';

interface CustomerCardSkeletonProps {
  count?: number;
}

export default function CustomerCardSkeleton({ count = 6 }: CustomerCardSkeletonProps) {
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
    <View className="px-4 pt-4">
      {/* Header Skeleton */}
      <View className="mb-3 flex-row items-center justify-between">
        <Animated.View
          className="h-5 w-28 rounded-lg"
          style={{ backgroundColor: colors.border, opacity: fadeAnim }}
        />
        <Animated.View
          className="h-6 w-8 rounded-full"
          style={{ backgroundColor: colors.border, opacity: fadeAnim }}
        />
      </View>

      {/* Card Skeletons */}
      {[...Array(count)].map((_, index) => (
        <Animated.View
          key={index}
          className="mb-3 rounded-2xl p-4"
          style={{
            backgroundColor: colors.card,
            opacity: fadeAnim,
          }}>
          <View className="flex-row">
            {/* Avatar */}
            <View className="h-12 w-12 rounded-full" style={{ backgroundColor: colors.border }} />

            {/* Content */}
            <View className="ml-3 flex-1">
              {/* Business Name */}
              <View
                className="mb-2 h-5 w-36 rounded-lg"
                style={{ backgroundColor: colors.border }}
              />

              {/* Contact Person */}
              <View
                className="mb-1 h-4 w-28 rounded-lg"
                style={{ backgroundColor: colors.border }}
              />

              {/* Phone */}
              <View
                className="mb-2 h-4 w-24 rounded-lg"
                style={{ backgroundColor: colors.border }}
              />

              {/* Tags */}
              <View className="flex-row gap-2">
                <View className="h-6 w-16 rounded-lg" style={{ backgroundColor: colors.border }} />
                <View className="h-6 w-14 rounded-lg" style={{ backgroundColor: colors.border }} />
              </View>
            </View>

            {/* Right Side */}
            <View className="items-end">
              <View
                className="mb-2 h-8 w-8 rounded-lg"
                style={{ backgroundColor: colors.border }}
              />
              <View
                className="mb-1 h-3 w-12 rounded-lg"
                style={{ backgroundColor: colors.border }}
              />
              <View className="h-4 w-16 rounded-lg" style={{ backgroundColor: colors.border }} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
