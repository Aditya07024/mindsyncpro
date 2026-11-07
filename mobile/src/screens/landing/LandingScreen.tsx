import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image, Linking, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import API from '../../lib/api';
import { routeSignedInUser } from '../../lib/roleRouter';

interface LandingScreenProps {
  navigation: any;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const { width } = Dimensions.get('window');
  const { isSignedIn, isLoaded } = useAuth();
  const insets = useSafeAreaInsets();

  // Track whether auth check is complete to prevent landing page flash
  const [hasChecked, setHasChecked] = useState(false);
  const redirectingRef = useRef(false);

  // Safety timeout: if Clerk takes too long, show landing UI anyway
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasChecked) {
        console.log('[Landing] Safety timeout reached — showing landing UI');
        setHasChecked(true);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [hasChecked]);

  // Handle auto-redirection based on confirmed user profile role from MongoDB
  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to hydrate

    // If user is NOT signed in, immediately show landing UI
    if (!isSignedIn) {
      setHasChecked(true);
      return;
    }

    // User IS signed in — redirect to their dashboard without showing landing UI
    const checkRedirect = async () => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;

      let stashedIntendedRole: string | null = null;
      try {
        // 1. Retrieve any intended signup role saved from OAuth selection stage
        const intendedRole = await AsyncStorage.getItem('intended_role');
        stashedIntendedRole = intendedRole;
        const savedUpgradePlan = await AsyncStorage.getItem('upgrade_plan');

        if (intendedRole) {
          try {
            await API.auth.setRole(intendedRole);
            await AsyncStorage.removeItem('intended_role');
            if (savedUpgradePlan) await AsyncStorage.removeItem('upgrade_plan');
            await routeSignedInUser(navigation, { role: intendedRole, upgradePlan: savedUpgradePlan });
            return;
          } catch (err) {
            console.error("Failed to commit role to backend in autologin:", err);
            await AsyncStorage.removeItem('intended_role');
            if (savedUpgradePlan) await AsyncStorage.removeItem('upgrade_plan');
            await routeSignedInUser(navigation, { role: intendedRole, upgradePlan: savedUpgradePlan });
            return;
          }
        }

        await routeSignedInUser(navigation);
      } catch (err) {
        console.error("Failed to fetch profile on autologin:", err);
        const backupRole = stashedIntendedRole || 'user';
        await AsyncStorage.removeItem('intended_role');
        await AsyncStorage.removeItem('upgrade_plan');
        await routeSignedInUser(navigation, { role: backupRole });
      }
    };

    checkRedirect();
  }, [isLoaded, isSignedIn, navigation]);

  // Show loading spinner while auth is being checked — prevents the landing page flash
  if (!hasChecked) {
    return (
      <View className="flex-1 bg-[#F9F5E9] justify-center items-center">
        <ActivityIndicator size="large" color="#0D564D" />
        <Text className="font-jakarta-medium text-sm text-[#4E615D] mt-3">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-[#F9F5E9]" 
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: Math.max(insets.bottom, 24) }}
    >
      {/* Hero Header Gradient */}
      <LinearGradient
        colors={['#E6F0EE', '#F9F5E9']}
        className="pt-10 pb-6 px-4 items-center"
      >
        <View className="pt-2 items-center text-center">
          <View className="flex-row items-center gap-1.5 bg-secondary/15 px-3 py-1 rounded-full mb-2">
            <Heart size={14} color="#9D4223" fill="#9D4223" />
            <Text className="font-jakarta-bold text-[11px] text-secondary tracking-wider">Reimagined for India</Text>
          </View>
          <Text className="font-sora-bold text-[31px] text-primary tracking-tight text-center">MyMindTherapyFriend</Text>
          <Text className="font-jakarta-medium text-[15px] text-[#4E615D] text-center leading-[22px] mt-1 px-1">
            BetterHelp + Headspace, reimagined for India. Warm. Accessible. Culturally fluent.
          </Text>
        </View>
      </LinearGradient>

      {/* Centered Premium Mindfulness Illustration */}
      <View className="items-center justify-center my-2 px-4">
        <Image 
          source={require('../../../assets/wellness_illustration.png')} 
          style={{ width: width * 0.72, height: width * 0.72 }} 
          resizeMode="contain"
        />
        <Text className="font-jakarta-medium text-sm text-[#4E615D] text-center leading-5 mt-2 px-1">
          Connect with Manas AI for 24/7 empathetic support, or consult with verified therapists matching your language & culture. 🙏
        </Text>
      </View>

      {/* Premium CTA Actions */}
      <View className="px-4 gap-2.5">
        <TouchableOpacity 
          onPress={() => navigation.navigate('ClerkAuth', { role: 'user' })}
          className="flex-row justify-center items-center bg-primary py-4 rounded-2xl gap-2 shadow-sm"
          activeOpacity={0.85}
        >
          <Text className="font-jakarta-bold text-base text-white">For User</Text>
          <ArrowRight size={18} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login', { hideUser: true })}
          className="justify-center items-center bg-white border border-[#DFEBE7] py-4 rounded-2xl shadow-sm"
          activeOpacity={0.85}
        >
          <Text className="font-jakarta-bold text-base text-primary">For Therapist, Organisation</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-2.5 my-3">
        <TouchableOpacity
          onPress={() => navigation.navigate('About')}
          className="self-center py-1"
        >
          <Text className="font-sora-semibold text-sm text-primary underline">
            Learn more about our mission
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openURL('https://mymindtherapyfriend.com/')}
          className="self-center py-1"
        >
          <Text className="font-sora-semibold text-sm text-primary underline">
            Visit Our Website
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LandingScreen;
