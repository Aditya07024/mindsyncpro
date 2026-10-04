import React, { createContext, useContext, useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSharedValue, SharedValue, withTiming, withSpring, Easing } from 'react-native-reanimated';

interface TabBarVisibilityContextType {
  translateY: SharedValue<number>;
  opacity: SharedValue<number>;
  setTabBarVisible: (visible: boolean) => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | null>(null);

export const TabBarVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const translateY = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(1);
  const isVisibleRef = useRef<boolean>(true);
  const lastScrollY = useRef<number>(0);

  const setTabBarVisible = useCallback((visible: boolean) => {
    if (isVisibleRef.current === visible) return;
    isVisibleRef.current = visible;

    if (visible) {
      // Spring animation from bottom to top when revealing
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 140,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      // Smooth slide down animation when hiding
      translateY.value = withTiming(120, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [translateY, opacity]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    // Near the top of the screen: always show tab bar
    if (currentY <= 15) {
      setTabBarVisible(true);
    } else if (Math.abs(diff) > 5) {
      if (diff > 0) {
        // User scrolling down page (finger dragging up) -> HIDE bottom bar
        setTabBarVisible(false);
      } else if (diff < 0) {
        // User scrolling up page (finger dragging down) -> SHOW bottom bar with bottom-to-top animation
        setTabBarVisible(true);
      }
    }

    lastScrollY.current = currentY;
  }, [setTabBarVisible]);

  return (
    <TabBarVisibilityContext.Provider value={{ translateY, opacity, setTabBarVisible, handleScroll }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    return {
      translateY,
      opacity,
      setTabBarVisible: () => {},
      handleScroll: () => {}
    };
  }
  return context;
};
