import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';

interface SOSButtonProps {
  onPress: () => void;
  bottomOffset?: number;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onPress, bottomOffset = 90 }) => {
  const scale = useSharedValue(1);
  const { translateY: tabBarTranslateY } = useTabBarVisibility();

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: tabBarTranslateY.value * 0.45 }
      ],
    };
  });

  return (
    <Animated.View
      className="absolute right-5 z-[9999]"
      style={[{ bottom: bottomOffset }, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="w-14 h-14 rounded-full bg-crisis justify-center items-center shadow-lg shadow-crisis/40 elevation-6"
      >
        <AlertCircle size={28} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SOSButton;
