import React, { createContext, useContext } from 'react';
import Animated, {
  useSharedValue,
  SharedValue,
  useAnimatedScrollHandler,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface TabBarVisibilityContextType {
  translateY: SharedValue<number>;
  scrollHandler: any;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | null>(null);

export const TabBarVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const translateY = useSharedValue<number>(0);

  // Native UI thread worklet handler for 60fps animations on real mobile devices
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event, ctx: any) => {
      const currentY = event.contentOffset.y;
      const prevY = ctx.prevY ?? 0;
      const diff = currentY - prevY;

      // Near top of screen: always reveal tab bar with spring
      if (currentY <= 20) {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 120,
          mass: 0.8,
        });
      } else if (Math.abs(diff) > 8) {
        if (diff > 0) {
          // Finger swiping UP (scrolling down page) -> HIDE bottom bar
          translateY.value = withTiming(140, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
        } else {
          // Finger swiping DOWN (scrolling up page) -> SHOW bottom bar with spring
          translateY.value = withSpring(0, {
            damping: 20,
            stiffness: 120,
            mass: 0.8,
          });
        }
      }

      ctx.prevY = currentY;
    },
  });

  return (
    <TabBarVisibilityContext.Provider value={{ translateY, scrollHandler }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    const translateY = useSharedValue(0);
    return {
      translateY,
      scrollHandler: undefined,
    };
  }
  return context;
};
