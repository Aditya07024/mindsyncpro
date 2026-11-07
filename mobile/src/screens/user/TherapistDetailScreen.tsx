import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Star, ShieldCheck, Heart, Award, ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import API from '../../lib/api';
import { TherapistData } from '../../components/TherapistCard';
import { IntroVideoPlayer } from '../../components/IntroVideoPlayer';

interface TherapistDetailScreenProps {
  navigation: any;
  route: any;
}

export const TherapistDetailScreen: React.FC<TherapistDetailScreenProps> = ({ navigation, route }) => {
  const therapist: TherapistData = route.params?.therapist;

  if (!therapist) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <Text className="font-jakarta text-sm text-[#717875]">No practitioner selected.</Text>
      </View>
    );
  }

  const specs = therapist.specialties && therapist.specialties.length > 0
    ? therapist.specialties.join(', ')
    : therapist.specializations && therapist.specializations.length > 0
      ? therapist.specializations.join(', ')
      : 'Clinical Psychology';

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.user.profile(),
    retry: false,
  });
  const dbUser = profileData?.user;

  const rawHourlyRate = therapist.sessionFee || therapist.hourlyRate || 1500;
  const hasFreeCredit =
    (dbUser?.freeSessionCredits || 0) > 0 ||
    therapist?.pricingInfo?.hasFreeSessionCredit ||
    therapist?.pricingInfo?.isOrgCovered ||
    therapist?.sessionFee === 0;

  const hourlyRate = hasFreeCredit ? 0 : rawHourlyRate;
  const experience = therapist.experience || therapist.experienceYears || 3;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
      {/* Header back button */}
      <View className="flex-row items-center pt-10 gap-2.5">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#DFEBE7]"
        >
          <ArrowLeft size={20} color="#191C1B" />
        </TouchableOpacity>
        <Text className="font-sora-semibold text-lg text-[#191C1B]">Profile Overview</Text>
      </View>

      {/* Hero Video / Avatar Section */}
      <View className="w-full h-[320px] rounded-3xl overflow-hidden relative bg-black">
        <IntroVideoPlayer
          url={therapist.introVideoUrl}
          mode="modal"
          fallbackName={therapist.name}
          avatarUrl={therapist.avatarUrl}
        />
      </View>

      {/* Practitioner details card */}
      <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7]">
        <View className="flex-row justify-between items-start gap-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-sora-bold text-[22px] text-[#191C1B]">{therapist.name}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text className="font-jakarta-medium text-sm text-primary mt-0.5">{specs}</Text>
              {therapist.verified && <ShieldCheck size={20} color="#0D564D" />}
            </View>
          </View>
          <View className="flex-row items-center gap-1 bg-[#EEF2F1] px-2 py-1 rounded-md">
            <Star size={14} color="#D97706" fill="#D97706" />
            <Text className="font-jakarta-bold text-xs text-[#191C1B]">{therapist.rating?.toFixed(1) || '5.0'}</Text>
          </View>
        </View>

        {/* Experience & stats */}
        <View className="flex-row justify-around items-center my-4 border-t border-b border-slate-100 py-2.5">
          <View className="items-center gap-0.5">
            <Award size={18} color="#0D564D" />
            <Text className="font-jakarta-bold text-[9px] text-[#717875] tracking-wider">EXPERIENCE</Text>
            <Text className="font-sora-bold text-base text-[#191C1B] mt-0.5">{experience}+ Years</Text>
          </View>
          <View className="w-[1px] h-9 bg-slate-200" />
          <View className="items-center gap-0.5">
            <Heart size={18} color={hasFreeCredit ? '#059669' : '#9D4223'} />
            <Text className="font-jakarta-bold text-[9px] text-[#717875] tracking-wider">HOURLY RATE</Text>
            <Text className={`font-sora-bold text-base mt-0.5 ${hasFreeCredit ? 'text-emerald-600 text-[13px]' : 'text-[#191C1B]'}`}>
              {hasFreeCredit ? '₹0 (Free Credit)' : `₹${hourlyRate}`}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View className="mt-1">
          <Text className="font-sora-semibold text-base text-[#191C1B] mb-1.5">About Me</Text>
          <Text className="font-jakarta text-[13px] text-[#4E615D] leading-[18px]">
            {therapist.bio || 'No bio provided'}
          </Text>
        </View>
      </View>

      {/* Booking button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Booking', { therapist })}
        className={`h-[52px] rounded-full justify-center items-center mt-1 ${hasFreeCredit ? 'bg-emerald-600' : 'bg-primary'}`}
      >
        <Text className="text-white font-sora-semibold text-sm">
          {hasFreeCredit ? '🎁 Book Free Session (1 Credit Available)' : `Book Secure Session (₹${hourlyRate})`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TherapistDetailScreen;
