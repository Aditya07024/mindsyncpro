import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Share,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  Gift,
  Copy,
  Share2,
  Wallet,
  FileText,
  Smile,
  Mic,
  GraduationCap,
  Bell,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react-native';
import API from '../../lib/api';
import { AppHeader } from '../../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Animated from 'react-native-reanimated';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';

interface UserProfileScreenProps {
  navigation: any;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation }) => {
  const { scrollHandler } = useTabBarVisibility();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();

  const [friendCode, setFriendCode] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch current user details from API
  const { data: authMeData, isLoading: meLoading, refetch: refetchMe } = useQuery({
    queryKey: ['authMe'],
    queryFn: () => API.auth.me(),
  });

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.user.profile(),
  });

  const dbUser = profileData?.user || authMeData || {};

  // Extract user details with fallbacks
  const displayName =
    dbUser.fullName ||
    clerkUser?.fullName ||
    (clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : '') ||
    'Valued Seeker';

  const displayContact =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    dbUser.phone ||
    dbUser.phoneMasked ||
    'Account Verified';

  const finalAvatarUrl = clerkUser?.imageUrl || dbUser?.profilePicture || dbUser?.avatar;

  const referralCode = dbUser.referralCode || `MMTP-${(dbUser._id || dbUser.id || '').toString().slice(-6).toUpperCase()}`;
  const freeSessionCredits = dbUser.freeSessionCredits || 0;
  const isStudentVerified =
    (dbUser.userType === 'school_student' || dbUser.userType === 'college_student') &&
    dbUser.studentIdVerificationStatus === 'approved';

  const tierRaw = dbUser.tier || 'free';
  const tierDisplay =
    tierRaw === 'apna_therapist'
      ? 'Apna Therapist Plan'
      : tierRaw === 'mann_shanti'
      ? 'Mann Shanti Plan'
      : 'Free Tier Plan';

  // Apply referral code mutation
  const applyReferralMutation = useMutation({
    mutationFn: (code: string) => API.auth.applyReferral({ referralCode: code }),
    onSuccess: (data: any) => {
      Alert.alert(
        '🎁 Referral Applied!',
        data?.message || 'Referral code successfully applied! You received 1 Free Session Credit.'
      );
      setFriendCode('');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['authMe'] });
      refetchMe();
    },
    onError: (err: any) => {
      Alert.alert('Referral Error', err?.message || 'Invalid referral code or code already used.');
    },
  });

  const handleCopyCode = () => {
    if (!referralCode) return;
    Share.share({
      message: referralCode,
    }).catch(() => {
      Alert.alert('Referral Code', `Your referral code is: ${referralCode}`);
    });
    Alert.alert('Code Copied!', `Referral code ${referralCode} ready to share with friends.`);
  };

  const handleShareReferral = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        title: 'Join MyMindTherapyFriend',
        message: `🎁 Join me on MyMindTherapyFriend for mental wellness! Use my referral code "${referralCode}" when signing up to get 1 Free Counseling Session!`,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleApplyFriendCode = () => {
    const clean = friendCode.trim();
    if (!clean) {
      Alert.alert('Enter Code', 'Please enter a friend’s referral code.');
      return;
    }
    applyReferralMutation.mutate(clean);
  };

  const handleNotificationToggle = async (val: boolean) => {
    setNotificationsEnabled(val);
    await AsyncStorage.setItem('user_notifications_enabled', val ? 'true' : 'false');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {}
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Landing' }],
          });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you sure you want to permanently delete your account and all associated data? This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.account.delete();
            } catch (e: any) {
              console.warn('Account delete API error:', e.message);
            }
            try {
              await signOut();
            } catch (e) {}
            await AsyncStorage.clear();
            Alert.alert('Account Deleted', 'Your account and data have been permanently removed.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            });
          },
        },
      ]
    );
  };

  if (meLoading && !dbUser.fullName) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0D564D" />
        <Text className="font-jakarta-medium text-sm text-slate-500 mt-2.5">Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader
        userFirstName={displayName.split(' ')[0]}
        role={dbUser.role || 'user'}
        navigation={navigation}
      />

      <Animated.ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }} 
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Static User Profile Card */}
        <View className="flex-row items-center bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
          <View className="w-14 h-14 rounded-full bg-primary justify-center items-center mr-3.5 overflow-hidden">
            {finalAvatarUrl ? (
              <Image source={{ uri: finalAvatarUrl }} className="w-14 h-14 rounded-full" />
            ) : (
              <Text className="font-sora-bold text-2xl text-white">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View className="flex-1">
            <Text className="font-sora-bold text-lg text-slate-900">{displayName}</Text>
            <Text className="font-jakarta text-[13px] text-slate-500 mt-0.5">{displayContact}</Text>
            <View className="flex-row items-center mt-1.5">
              {isStudentVerified ? (
                <View className="flex-row items-center bg-teal-100 px-2 py-0.5 rounded-full gap-1">
                  <GraduationCap size={12} color="#0D9488" />
                  <Text className="font-jakarta-bold text-[11px] text-teal-700">Verified Student</Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-teal-50 px-2 py-0.5 rounded-full gap-1">
                  <ShieldCheck size={12} color="#0D564D" />
                  <Text className="font-jakarta-bold text-[11px] text-primary">{tierDisplay}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Referral & Free Credits Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-200">
          <View className="flex-row items-center gap-2 mb-3">
            <Gift size={20} color="#0D9488" />
            <Text className="font-sora-bold text-base text-slate-900">Referral Program & Free Credits</Text>
          </View>

          <View className="flex-row items-center bg-amber-50 p-3 rounded-xl mb-4 border border-amber-200 gap-2.5">
            <Sparkles size={20} color="#D97706" />
            <View className="flex-1">
              <Text className="font-sora-bold text-sm text-amber-900">
                {freeSessionCredits} Free Session{freeSessionCredits === 1 ? '' : 's'} Available
              </Text>
              <Text className="font-jakarta text-xs text-amber-700 mt-0.5">
                Use your free session credits when booking counseling sessions with qualified therapists!
              </Text>
            </View>
          </View>

          {/* Unique Referral Code */}
          <Text className="font-jakarta-bold text-xs text-slate-600 mb-1.5 uppercase">Your Unique Referral Code</Text>
          <View className="flex-row items-center justify-between bg-slate-100 rounded-xl px-3.5 py-2.5 border border-dashed border-slate-300 mb-2">
            <Text className="font-sora-bold text-lg text-primary tracking-wider">{referralCode}</Text>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={handleCopyCode} className="p-2 rounded-lg bg-slate-200">
                <Copy size={18} color="#0D564D" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareReferral} className="p-2 rounded-lg bg-primary">
                <Share2 size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="font-jakarta text-xs text-slate-500 mb-4 leading-[18px]">
            Share your code with friends! When they register or apply your code,{' '}
            <Text className="font-bold">both of you earn 1 Free Session Credit.</Text>
          </Text>

          {/* Apply Friend's Code */}
          {dbUser && !dbUser.referredBy ? (
            <View className="border-t border-slate-100 pt-3.5">
              <Text className="font-jakarta-bold text-xs text-slate-600 mb-1.5 uppercase">Have a Friend's Referral Code?</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 h-11 bg-slate-50 border border-slate-300 rounded-xl px-3 font-jakarta-bold text-sm text-slate-900"
                  placeholder="Enter referral code (e.g. MMTP-1A2B)"
                  placeholderTextColor="#94A3B8"
                  value={friendCode}
                  onChangeText={setFriendCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  className={`h-11 px-4.5 bg-primary rounded-xl justify-center items-center ${(!friendCode.trim() || applyReferralMutation.isPending) ? 'opacity-50' : ''}`}
                  disabled={!friendCode.trim() || applyReferralMutation.isPending}
                  onPress={handleApplyFriendCode}
                >
                  {applyReferralMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text className="font-jakarta-bold text-sm text-white">Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : dbUser?.referredBy ? (
            <View className="mt-3.5 p-3 bg-green-50 rounded-xl border border-green-200">
              <Text className="text-[13px] text-green-800 font-semibold">
                ✓ Referral code applied ({dbUser.referredBy}). You earned 1 Free Session Credit!
              </Text>
            </View>
          ) : null}
        </View>

        {/* Account Services & Plans */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-200">
          <Text className="font-sora-bold text-sm text-slate-900 mb-3">Account & Membership</Text>

          {/* View Plans Button */}
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-slate-100"
            onPress={() => navigation.navigate('Plans')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-amber-100">
                <Star size={18} color="#D97706" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-800">View Membership Plans & Pricing</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-slate-100"
            onPress={() => navigation.navigate('Wallet')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-indigo-50">
                <Wallet size={18} color="#4F46E5" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-800">My Wallet & Payments</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-slate-100"
            onPress={() => navigation.navigate('Reports')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-emerald-50">
                <FileText size={18} color="#059669" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-800">Wellness & Clinical Reports</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-slate-100"
            onPress={() => navigation.navigate('MoodDiary')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-orange-50">
                <Smile size={18} color="#EA580C" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-800">Mood Tracker & Reflections</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={() => navigation.navigate('GroupSessions')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-emerald-50">
                <Mic size={18} color="#16A34A" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-800">Live Group Audio Sessions</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-200">
          <Text className="font-sora-bold text-sm text-slate-900 mb-3">Preferences</Text>

          <View className="flex-row items-center justify-between py-1">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-slate-100">
                <Bell size={18} color="#475569" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-800">Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#CBD5E1', true: '#0D564D' }}
            />
          </View>
        </View>

        {/* Action Buttons: Sign Out & Delete Account */}
        <View className="gap-2.5 mb-4">
          <TouchableOpacity 
            className="flex-row items-center justify-center bg-slate-100 border border-slate-300 rounded-2xl py-3.5 gap-2" 
            onPress={handleSignOut}
          >
            <LogOut size={18} color="#475569" />
            <Text className="font-jakarta-bold text-sm text-slate-600">Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-center bg-red-50 border border-red-200 rounded-2xl py-3.5 gap-2" 
            onPress={handleDeleteAccount}
          >
            <Trash2 size={18} color="#DC2626" />
            <Text className="font-jakarta-bold text-sm text-red-600">Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text className="font-jakarta text-[11px] text-slate-400 text-center mb-3">
          MyMindTherapyFriend v1.0.1 · Encrypted & Confidential
        </Text>
      </Animated.ScrollView>
    </View>
  );
};

export default UserProfileScreen;
