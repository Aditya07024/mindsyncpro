import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  Star,
  Compass,
  BookOpen,
  Sparkles,
  Wallet,
  FileText,
  MessageCircle,
  ChevronRight,
  Users,
  Gift,
  Smile,
} from 'lucide-react-native';
import API from '../../lib/api';
import { useStore } from '../../lib/store';
import { AppHeader } from '../../components/AppHeader';
import { SOSButton } from '../../components/SOSButton';
import { CrisisOverlay } from '../../components/CrisisOverlay';
import { getNotificationsPreference } from '../../lib/pushNotifications';
import { useAuth, useUser } from '@clerk/clerk-expo';

import Animated from 'react-native-reanimated';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { scrollHandler } = useTabBarVisibility();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    getNotificationsPreference().then(setNotificationsEnabled);
  }, []);

  // Fetch stats from backend API
  const { data: userStats } = useQuery({
    queryKey: ['userDashboardStats'],
    queryFn: () => API.user.stats(),
    retry: false,
  });

  // Fetch user profile from backend API for tier
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.user.profile(),
    retry: false,
  });

  const storeFirstName = useStore((state) => state.firstName);
  const firstName =
    profileData?.user?.fullName?.split(' ')[0] || user?.firstName || storeFirstName || 'Friend';

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['userBookings'],
    queryFn: () => API.booking.getUserBookings(),
    retry: false,
  });

  // Fetch daily journal prompt
  const { data: promptData } = useQuery({
    queryKey: ['dailyCbtPrompt'],
    queryFn: () => API.journal.prompt(),
    retry: false,
  });

  // Fetch mood history so today's selected mood stays synced with Website & Mood Diary
  const { data: moodHistoryData } = useQuery({
    queryKey: ['moodHistory'],
    queryFn: () => API.mood.list(),
    retry: false,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = (moodHistoryData?.moods || []).find((x: any) => {
    const rawDate = x.date || x.createdAt;
    return rawDate && new Date(rawDate).toISOString().slice(0, 10) === todayStr;
  });
  const activeMoodScore = selectedMood ?? todayEntry?.score ?? null;

  const streak = userStats?.streak ?? 0;
  const freeSessionCredits = profileData?.user?.freeSessionCredits ?? userStats?.freeSessionCredits ?? 0;
  const tierRaw = profileData?.user?.tier || 'free';
  const tier =
    tierRaw === 'apna_therapist'
      ? 'Apna Therapist'
      : tierRaw === 'mann_shanti'
      ? 'Mann Shanti'
      : 'Free Tier';

  const dbUser = profileData?.user;

  const dailyPrompt =
    promptData?.prompt ||
    'What is one thought you had today that felt absolute, but might actually have nuance?';

  const handleMoodSelect = async (moodVal: number) => {
    setSelectedMood(moodVal);
    try {
      await API.mood.create({ score: moodVal });
      queryClient.invalidateQueries({ queryKey: ['moodHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userDashboardStats'] });
      Alert.alert('Mood Saved ✨', 'Thank you for checking in! Your daily log has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save mood log.');
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader
        userFirstName={firstName}
        userImageUrl={user?.imageUrl || dbUser?.profilePicture}
        role={dbUser?.role || 'user'}
        onUpgradePress={() => navigation.navigate('Plans')}
        onProfilePress={() => navigation.navigate('Profile')}
        navigation={navigation}
      />

      <Animated.ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 }} 
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Earlier White Card Stats Banner */}
        <View className="flex-row items-center bg-white rounded-3xl p-3.5 mb-3 border border-slate-200 shadow-sm">
          <View className="flex-1 items-center">
            <Flame size={20} color="#0D564D" />
            <Text className="font-sora-semibold text-[15px] text-slate-900 mt-1">{streak} Days</Text>
            <Text className="font-jakarta-medium text-[11px] text-slate-500 mt-0.5">Streak</Text>
          </View>
          <View className="w-[1px] h-9 bg-slate-200" />
          <View className="flex-1 items-center">
            <Star size={20} color="#9D4223" />
            <Text className="font-sora-semibold text-[15px] text-slate-900 mt-1">{tier}</Text>
            <Text className="font-jakarta-medium text-[11px] text-slate-500 mt-0.5">Current Plan</Text>
          </View>
          <View className="w-[1px] h-9 bg-slate-200" />
          <TouchableOpacity className="flex-1 items-center" onPress={() => navigation.navigate('Profile')}>
            <Gift size={20} color="#0D9488" />
            <Text className="font-sora-semibold text-[15px] text-slate-900 mt-1">{freeSessionCredits}</Text>
            <Text className="font-jakarta-medium text-[11px] text-slate-500 mt-0.5">Free Credits</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Mood Selector (10-point emoji scale synced with Website) */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-[#DFEBE7] shadow-sm">
          <View className="flex-row items-center gap-2 mb-2">
            <Smile size={18} color="#0D564D" />
            <Text className="font-sora-bold text-[15px] text-slate-900">How are you feeling right now?</Text>
          </View>
          <View className="flex-row justify-between items-center mt-1.5 w-full">
            {[
              { val: 1, emoji: '😞' },
              { val: 2, emoji: '😟' },
              { val: 3, emoji: '😕' },
              { val: 4, emoji: '😐' },
              { val: 5, emoji: '🙂' },
              { val: 6, emoji: '😊' },
              { val: 7, emoji: '😄' },
              { val: 8, emoji: '😁' },
              { val: 9, emoji: '🤩' },
              { val: 10, emoji: '🥰' },
            ].map((item) => {
              const isActive = activeMoodScore === item.val;
              return (
                <TouchableOpacity
                  key={item.val}
                  onPress={() => handleMoodSelect(item.val)}
                  className={`flex-1 py-1.5 px-0 mx-[1px] rounded-lg items-center justify-center ${isActive ? 'bg-primary/10 scale-105' : ''}`}
                >
                  <Text className={`text-center ${isActive ? 'text-[19px]' : 'text-lg'}`}>
                    {item.emoji}
                  </Text>
                  {isActive && <View className="w-1 h-1 rounded-full bg-primary mt-1" />}
                </TouchableOpacity>
              );
            })}
          </View>
          {activeMoodScore ? (
            <Text className="mt-2 text-center font-jakarta text-[11px] text-slate-500">
              Logged for today ({activeMoodScore}/10).
            </Text>
          ) : null}
        </View>

        {/* Daily CBT Reflective Prompt */}
        <View className="bg-teal-50/70 rounded-3xl p-4 mb-4 border border-teal-100">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Sparkles size={16} color="#0D564D" />
            <Text className="font-jakarta-bold text-[10px] text-primary tracking-widest">DAILY CBT REFLECTION</Text>
          </View>
          <Text className="font-jakarta-medium text-[13.5px] text-[#0F2926] leading-5 mb-3">"{dailyPrompt}"</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Journal')}
            className="self-start bg-primary rounded-xl py-2 px-3.5"
          >
            <Text className="font-jakarta-bold text-xs text-white">Reflect in Journal →</Text>
          </TouchableOpacity>
        </View>

        {/* Main Services Grid */}
        <Text className="font-sora-bold text-base text-slate-900 mb-2">Wellness & Therapy Services</Text>

        <View className="flex-row flex-wrap justify-between gap-3 mb-4">
          <TouchableOpacity
            className="w-[48%] rounded-3xl p-4 border min-h-[130px] bg-teal-50 border-teal-100"
            onPress={() => navigation.navigate('Therapists')}
          >
            <View className="w-10 h-10 rounded-2xl justify-center items-center mb-2.5 bg-teal-100">
              <Compass size={22} color="#0D564D" />
            </View>
            <Text className="font-sora-bold text-sm text-slate-900 mb-1">1-on-1 Therapy</Text>
            <Text className="font-jakarta text-[11px] text-slate-500 leading-[15px]">Book sessions with verified psychologists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[48%] rounded-3xl p-4 border min-h-[130px] bg-emerald-50 border-emerald-100"
            onPress={() => navigation.navigate('GroupSessions')}
          >
            <View className="w-10 h-10 rounded-2xl justify-center items-center mb-2.5 bg-emerald-100">
              <Users size={22} color="#16A34A" />
            </View>
            <Text className="font-sora-bold text-sm text-slate-900 mb-1">Live Audio Rooms</Text>
            <Text className="font-jakarta text-[11px] text-slate-500 leading-[15px]">100% Anonymous group peer audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[48%] rounded-3xl p-4 border min-h-[130px] bg-orange-50 border-orange-100"
            onPress={() => navigation.navigate('Journal')}
          >
            <View className="w-10 h-10 rounded-2xl justify-center items-center mb-2.5 bg-orange-100">
              <FileText size={22} color="#EA580C" />
            </View>
            <Text className="font-sora-bold text-sm text-slate-900 mb-1">CBT Journal</Text>
            <Text className="font-jakarta text-[11px] text-slate-500 leading-[15px]">Record reflections & reframe thoughts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[48%] rounded-3xl p-4 border min-h-[130px] bg-indigo-50 border-indigo-100"
            onPress={() => navigation.navigate('Breathe')}
          >
            <View className="w-10 h-10 rounded-2xl justify-center items-center mb-2.5 bg-indigo-100">
              <BookOpen size={22} color="#4F46E5" />
            </View>
            <Text className="font-sora-bold text-sm text-slate-900 mb-1">Guided Breathing</Text>
            <Text className="font-jakarta text-[11px] text-slate-500 leading-[15px]">Anxiety relief & mood regulation</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Account Navigation */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-[#DFEBE7] shadow-sm">
          <Text className="font-sora-bold text-[15px] text-slate-900 mb-2">Account Tools & Reports</Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-2 border-b border-slate-100"
            onPress={() => navigation.navigate('Wallet')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-indigo-50">
                <Wallet size={18} color="#4F46E5" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-900">My Wallet & Balance</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-2 border-b border-slate-100"
            onPress={() => navigation.navigate('Reports')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-emerald-50">
                <FileText size={18} color="#059669" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-900">Wellness Reports</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            onPress={() => navigation.navigate('MoodDiary')}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl justify-center items-center bg-orange-50">
                <Smile size={18} color="#EA580C" />
              </View>
              <Text className="font-jakarta-medium text-sm text-slate-900">Mood Tracker</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* WhatsApp Community Card */}
        <View className="bg-green-50 rounded-3xl p-4 border border-green-200 gap-3">
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-2xl bg-green-700 justify-center items-center">
              <MessageCircle size={22} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="font-sora-bold text-[15px] text-green-900">Join Wellness Community</Text>
              <Text className="font-jakarta text-xs text-green-800 leading-[17px] mt-0.5">
                Get daily mental health tips, peer support, and therapist event alerts on WhatsApp.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1.5 bg-green-700 rounded-xl py-2.5 px-4"
            onPress={() => Linking.openURL('https://chat.whatsapp.com/demo-community-link').catch(() => {})}
          >
            <Text className="font-sora-bold text-[13.5px] text-white">Join WhatsApp Community →</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Floating SOS Crisis Button & Overlay (Floats above floating tab bar) */}
      <SOSButton onPress={() => setCrisisOpen(true)} bottomOffset={90} />
      <CrisisOverlay open={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </View>
  );
};

export default DashboardScreen;
