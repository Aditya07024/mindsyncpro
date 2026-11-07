import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Theme } from '../theme';

interface ManasAvatarProps {
  size?: number;
}

export const ManasAvatar: React.FC<ManasAvatarProps> = ({ size = 60 }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: withTiming(0.9 + (pulse.value - 1) * 0.5),
    };
  });

  const innerSize = size * 0.7;

  return (
    <View
      className="justify-center items-center relative"
      style={{ width: size + 16, height: size + 16 }}
    >
      {/* Halo pulse container */}
      <Animated.View
        className="absolute bg-primary/10"
        style={[
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
          },
          animatedStyle,
        ]}
      />
      
      {/* Main Gradient Ball */}
      <LinearGradient
        colors={[Theme.colors.primaryContainer, Theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="justify-center items-center shadow-md"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: Theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <Sparkles size={innerSize / 2} color="#FFF" />
      </LinearGradient>
    </View>
  );
};

export default ManasAvatar;
