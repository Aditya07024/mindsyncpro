import './global.css';
import React, { useEffect, useState } from 'react';
import { View, LogBox, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ServerOff, RefreshCw, Mail } from 'lucide-react-native';
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
  setupNotificationListeners,
} from './src/lib/pushNotifications';

// Complete the browser auth session on redirects
WebBrowser.maybeCompleteAuthSession();

// Brand Fonts Loading
import { 
  useFonts, 
  Sora_400Regular, 
  Sora_600SemiBold, 
  Sora_700Bold 
} from '@expo-google-fonts/sora';
import { 
  PlusJakartaSans_400Regular, 
  PlusJakartaSans_500Medium, 
  PlusJakartaSans_700Bold 
} from '@expo-google-fonts/plus-jakarta-sans';

import { setTokenGetter } from './src/lib/api';
import { API_URL } from './src/lib/store';
import RootNavigator from './src/navigation/RootNavigator';
import LoadingSpinner from './src/components/LoadingSpinner';

// Deep Linking Setup for React Navigation
const prefix = Linking.createURL('/');
const linking = {
  prefixes: [prefix, 'mymindtherapyfriend://'],
  config: {
    screens: {
      Landing: 'landing',
      About: 'about',
      Plans: 'plans',
      Login: 'login',
      ClerkAuth: 'clerk-auth',
      Onboarding: 'onboarding',
      UserTabs: 'user-tabs',
      TherapistTabs: 'therapist-tabs',
      OrgTabs: 'org-tabs',
      AdminTabs: 'admin-tabs',
    },
  },
};

// Ignore non-critical developer warning boxes in simulator view
LogBox.ignoreAllLogs();

// Secure Token Cache for Clerk Auth Sessions using standard AsyncStorage
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        return item;
      }
      return null;
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (err) {
      return;
    }
  },
};

const queryClient = new QueryClient();

// Clerk Publishable Key provided in environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_ZmFtb3VzLWNhaW1hbi02NC5jbGVyay5hY2NvdW50cy5kZXYk';

function AuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  // Inject active Clerk token getter into our API layer synchronously during render
  setTokenGetter(async () => {
    try {
      return await getToken();
    } catch (err) {
      return null;
    }
  });

  // Register push notifications when user signs in
  useEffect(() => {
    if (!isSignedIn) return;

    let cleanupListeners: (() => void) | undefined;

    const initPush = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await sendTokenToBackend(token);
      }

      // Set up foreground + tap listeners
      cleanupListeners = setupNotificationListeners(
        (notification) => {
          // Foreground notification received — could update badge count, etc.
          console.log('[App] Push received:', notification.request.content.title);
        },
        (response) => {
          // User tapped notification — could navigate to relevant screen
          console.log('[App] Push tapped:', response.notification.request.content.data);
        }
      );
    };

    initPush();

    return () => {
      cleanupListeners?.();
    };
  }, [isSignedIn]);

  return <>{children}</>;
}

// Premium Maintenance Screen Component
interface MaintenanceScreenProps {
  onRetry: () => Promise<void>;
}

function MaintenanceScreen({ onRetry }: MaintenanceScreenProps) {
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRetry = async () => {
    setRetrying(true);
    setErrorMsg('');
    try {
      // Simulate brief network buffer for micro-interactive feel
      await new Promise(resolve => setTimeout(resolve, 800));
      await onRetry();
    } catch (err) {
      setErrorMsg('Server is still offline. Please check back later.');
    } finally {
      setRetrying(false);
    }
  };

  const handleMailPress = () => {
    Linking.openURL('mailto:contact@mymindtherapyfriend.com').catch(() => {
      // Fallback
    });
  };

  return (
    <View className="flex-1 bg-surface justify-center items-center p-6">
      <View className="bg-white rounded-[28px] p-8 items-center w-full max-w-[380px] shadow-xl border border-stone-100">
        <View className="bg-orange-100 p-5 rounded-full mb-6">
          <ServerOff size={44} color="#E07A5F" />
        </View>
        
        <Text className="font-sora-bold text-[22px] text-stone-900 text-center mb-3">System Offline</Text>
        
        <Text className="font-jakarta text-sm text-stone-500 text-center leading-[22px] mb-6">
          MyMindTherapyFriend is currently undergoing scheduled fine-tuning to improve backend databases. We will be back online shortly.
        </Text>

        <View className="flex-row items-start bg-stone-100 p-4 rounded-[18px] w-full mb-5">
          <Mail size={20} color="#78716C" className="mr-3" />
          <View className="flex-1">
            <Text className="font-sora-bold text-sm text-stone-900 mb-0.5">App is in maintenance</Text>
            <Text className="font-jakarta text-[13px] text-stone-500 mb-1.5">Please contact support:</Text>
            <TouchableOpacity onPress={handleMailPress} activeOpacity={0.7}>
              <Text className="font-sora-bold text-secondary text-sm underline">contact@mymindtherapyfriend.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {errorMsg ? (
          <Text className="font-jakarta-medium text-red-500 text-[13px] mb-4 text-center">{errorMsg}</Text>
        ) : null}

        <TouchableOpacity 
          className="bg-stone-900 py-[15px] rounded-2xl justify-center items-center w-full"
          onPress={handleRetry}
          disabled={retrying}
          activeOpacity={0.9}
        >
          {retrying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View className="flex-row items-center justify-center">
              <RefreshCw size={15} color="#FFFFFF" className="mr-2" />
              <Text className="font-sora-bold text-white text-sm ml-2">Retry Connection</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold
  });

  const [isServerDown, setIsServerDown] = useState<boolean | null>(null);

  const checkHealth = async () => {
    try {
      // Direct health-check fetch call to the backend
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setIsServerDown(false);
      } else {
        setIsServerDown(true);
      }
    } catch (error) {
      // Network connection errors mean server is offline
      setIsServerDown(true);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (!fontsLoaded || isServerDown === null) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <LoadingSpinner message="Verifying secure connection to MyMindTherapyFriend…" />
      </View>
    );
  }

  if (isServerDown) {
    return <MaintenanceScreen onRetry={checkHealth} />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <AuthBridge>
          <NavigationContainer linking={linking}>
            <View className="flex-1 bg-surface">
              <RootNavigator />
              <StatusBar style="dark" />
            </View>
          </NavigationContainer>
        </AuthBridge>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
