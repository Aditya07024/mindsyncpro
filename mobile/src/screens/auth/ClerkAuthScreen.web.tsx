import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { SignIn } from '@clerk/clerk-expo/web';
import { routeSignedInUser } from '../../lib/roleRouter';

interface ClerkAuthScreenProps {
  navigation: any;
  route: any;
}

export const ClerkAuthScreen: React.FC<ClerkAuthScreenProps> = ({ navigation, route }) => {
  const role = route.params?.role || 'user';
  const upgradePlan = route.params?.upgradePlan;

  const { isSignedIn } = useAuth();

  useEffect(() => {
    // Save role so that when Google OAuth redirects back to the root URL (LandingScreen),
    // the LandingScreen knows where to route the user.
    if (role && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('mymindtherapyfriend_pending_role', role);
    }
  }, [role]);

  useEffect(() => {
    if (isSignedIn) {
      routeSignedInUser(navigation, { role, upgradePlan });
    }
  }, [isSignedIn]);

  if (isSignedIn) {
    return (
      <View className="flex-1 bg-surface justify-center items-center p-4">
        <Text className="font-jakarta text-primary">
          Authenticated! Redirecting to Dashboard...
        </Text>
      </View>
    );
  }

  // The prebuilt Clerk SignIn component handles everything automatically.
  // We use routing="virtual" so it doesn't conflict with React Navigation's pathing.
  return (
    <View className="flex-1 bg-surface justify-center items-center p-4">
      <SignIn routing="virtual" />
    </View>
  );
};

export default ClerkAuthScreen;
