// screens/Vendor/components/ProductCardSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';

interface ProductCardSkeletonProps {
  count?: number;
}

export default function ProductCardSkeleton({ count = 6 }: ProductCardSkeletonProps) {
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
          className="h-5 w-24 rounded-lg"
          style={{ backgroundColor: colors.border, opacity: fadeAnim }}
        />
        <View className="flex-row gap-2">
          <Animated.View
            className="h-6 w-12 rounded-full"
            style={{ backgroundColor: colors.border, opacity: fadeAnim }}
          />
          <Animated.View
            className="h-6 w-12 rounded-full"
            style={{ backgroundColor: colors.border, opacity: fadeAnim }}
          />
        </View>
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
            {/* Icon */}
            <View className="h-12 w-12 rounded-xl" style={{ backgroundColor: colors.border }} />

            {/* Content */}
            <View className="ml-3 flex-1">
              {/* Name + Status */}
              <View className="mb-2 flex-row items-center justify-between">
                <View className="h-5 w-32 rounded-lg" style={{ backgroundColor: colors.border }} />
                <View
                  className="h-5 w-16 rounded-full"
                  style={{ backgroundColor: colors.border }}
                />
              </View>

              {/* Tags */}
              <View className="mb-2 flex-row gap-1">
                <View className="h-4 w-12 rounded-md" style={{ backgroundColor: colors.border }} />
                <View className="h-4 w-14 rounded-md" style={{ backgroundColor: colors.border }} />
              </View>

              {/* Prices */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-4">
                  <View>
                    <View
                      className="mb-1 h-3 w-8 rounded"
                      style={{ backgroundColor: colors.border }}
                    />
                    <View className="h-4 w-12 rounded" style={{ backgroundColor: colors.border }} />
                  </View>
                  <View>
                    <View
                      className="mb-1 h-3 w-8 rounded"
                      style={{ backgroundColor: colors.border }}
                    />
                    <View className="h-4 w-12 rounded" style={{ backgroundColor: colors.border }} />
                  </View>
                  <View>
                    <View
                      className="mb-1 h-3 w-10 rounded"
                      style={{ backgroundColor: colors.border }}
                    />
                    <View className="h-4 w-14 rounded" style={{ backgroundColor: colors.border }} />
                  </View>
                </View>
                <View className="h-6 w-10 rounded-lg" style={{ backgroundColor: colors.border }} />
              </View>
            </View>

            {/* Edit button */}
            <View className="ml-2 h-8 w-8 rounded-lg" style={{ backgroundColor: colors.border }} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
