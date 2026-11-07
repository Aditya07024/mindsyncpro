import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Theme } from '../theme';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Gathering calm thoughts…' }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View className="flex-1 justify-center items-center bg-background p-6">
      <Animated.View
        className="w-20 h-20 rounded-full justify-center items-center bg-primary/15"
        style={animatedStyle}
      >
        <View className="w-10 h-10 rounded-full bg-primary" />
      </Animated.View>
      {message && (
        <Text className="mt-6 text-base font-jakarta-medium text-on-surface-variant text-center">
          {message}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;
