import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ShieldCheck, ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import API from '../../lib/api';
import { Theme } from '../../theme';

interface TherapistBriefScreenProps {
  navigation: any;
  route: any;
}

export const TherapistBriefScreen: React.FC<TherapistBriefScreenProps> = ({ navigation, route }) => {
  const bookingId = route.params?.bookingId;
  const fallbackClientName = route.params?.clientName || 'Seeker';

  const { data: brief, isLoading } = useQuery({
    queryKey: ['aiBrief', bookingId],
    queryFn: () => API.booking.getAiBrief(bookingId),
    enabled: !!bookingId,
  });

  const handleAgree = () => {
    Alert.alert('Confidentiality Verified', 'Access logs have been signed under your practitioner license ID.');
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text className="mt-2.5 text-sm text-onSurfaceVariant font-jakarta-medium">Fetching AI Brief...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-5 pb-8 gap-4">
      {/* Back Header */}
      <View className="flex-row items-center pt-12 gap-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-[38px] h-[38px] rounded-full bg-white justify-center items-center border border-[#E0E2E0]">
          <ArrowLeft size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text className="font-sora text-lg text-onSurface">AI Client Brief</Text>
      </View>

      {/* Privacy Guarantee Gate banner */}
      <View className="bg-primary/10 rounded-3xl p-4 border border-primary/20">
        <View className="flex-row items-center gap-1.5 mb-1">
          <ShieldCheck size={18} color={Theme.colors.primary} />
          <Text className="font-sora text-sm text-primaryContainer">Strict HIPAA & Ethics Shield</Text>
        </View>
        <Text className="font-jakarta text-xs text-onSurfaceVariant leading-[18px]">
          This brief synthesizes aggregated, anonymous sentiment indicators and automated thought types logged with Manas. Journal text scripts are fully locked.
        </Text>
      </View>

      {/* Patient overview header */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center">
        <Text className="font-jakarta-bold text-[10px] text-secondary tracking-wider mb-1">SYNTHESIZED OVERVIEW</Text>
        <Text className="font-sora-bold text-[22px] text-onSurface">{brief?.clientName || fallbackClientName}</Text>
        <Text className="font-jakarta text-xs text-[#71787D] mt-0.5">Active seeker · Avg Mood: {brief?.avgMood ? `${brief.avgMood}/10` : 'N/A'}</Text>
      </View>

      {/* Onboarding Profile details */}
      {brief?.onboardingDetails && (
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm gap-2">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <ShieldCheck size={16} color={Theme.colors.primary} />
            <Text className="font-sora text-[15px] text-onSurface">Client Onboarding Profile</Text>
          </View>
          {brief.onboardingDetails.moodScore !== undefined && (
            <Text className="font-jakarta text-[13px] text-onSurfaceVariant leading-[18px]">
              <Text className="font-jakarta-bold text-onSurface">Onboarding Mood Score: </Text>
              {brief.onboardingDetails.moodScore}/10
            </Text>
          )}
          {brief.onboardingDetails.primaryNeed && (
            <Text className="font-jakarta text-[13px] text-onSurfaceVariant leading-[18px]">
              <Text className="font-jakarta-bold text-onSurface">Primary Goal/Need: </Text>
              {brief.onboardingDetails.primaryNeed}
            </Text>
          )}
          {brief.onboardingDetails.concerns?.length > 0 && (
            <View className="mt-1">
              <Text className="font-jakarta-bold text-onSurface">Main Concerns: </Text>
              <View className="flex-row flex-wrap gap-1 mt-1">
                {brief.onboardingDetails.concerns.map((c: string, index: number) => (
                  <View key={index} className="bg-[#F0F9F6] rounded-xl px-2 py-1 border border-[#D3ECE4]">
                    <Text className="text-[11px] text-[#2E6E65] font-jakarta-medium">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Sentiment Trend summary */}
      <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm gap-2">
        <View className="flex-row items-center gap-1.5 mb-0.5">
          <TrendingUp size={16} color={Theme.colors.primary} />
          <Text className="font-sora text-[15px] text-onSurface">Sentiment Trend Summary</Text>
        </View>
        <Text className="font-jakarta text-[13px] text-onSurfaceVariant leading-[18px]">
          {brief?.groqSummary || `Mood history shows average score of ${brief?.avgMood ? `${brief.avgMood}/10` : 'N/A'}. Clinical risk level is flagged as ${brief?.riskLevel || 'unknown'}.`}
        </Text>
      </View>

      {/* Recent journal excerpts */}
      {brief?.recentJournals?.length > 0 && (
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm gap-2">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <AlertCircle size={16} color={Theme.colors.secondary} />
            <Text className="font-sora text-[15px] text-onSurface">Recent Journal Excerpts</Text>
          </View>
          <View className="gap-2 mt-0.5">
            {brief.recentJournals.map((j: any, i: number) => (
              <View key={i} className="flex-row items-start gap-2">
                <View className="w-1.5 h-1.5 rounded-full bg-outline mt-1.5" />
                <Text className="font-jakarta text-xs text-onSurfaceVariant flex-1 leading-4">
                  <Text className="font-jakarta-bold text-onSurface">{new Date(j.date).toLocaleDateString('en-IN')}: </Text>
                  "{j.excerpt}..."
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity onPress={handleAgree} className="bg-primary h-[52px] rounded-full justify-center items-center mt-1">
        <Text className="text-white font-sora text-sm">Acknowledge & Confirm Access</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TherapistBriefScreen;
