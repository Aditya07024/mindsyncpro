import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { Theme } from '../theme';
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
    <Animated.View style={[styles.wrapper, { bottom: bottomOffset }, animatedStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.button}>
        <AlertCircle size={28} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: Theme.spacing.margin,
    zIndex: 9999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.crisis,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.crisis,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
