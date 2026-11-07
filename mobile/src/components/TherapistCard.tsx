import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Star, ShieldCheck, Clock, MessageCircle, MapPin } from 'lucide-react-native';
import { IntroVideoPlayer } from './IntroVideoPlayer';

export interface TherapistData {
  _id: string;
  id?: string;
  userId?: string;
  name: string;
  specialties?: string[];
  specializations?: string[];
  experience?: number;
  experienceYears?: number;
  hourlyRate?: number;
  sessionFee?: number;
  rating?: number;
  verified?: boolean;
  avatarUrl?: string;
  bio?: string;
  introVideoUrl?: string;
  languages?: string[];
  specialty?: string;
  gender?: string;
  city?: string;
  state?: string;
  location?: string;
  sessionCount?: number;
  pricingInfo?: any;
}

interface TherapistCardProps {
  therapist: TherapistData;
  onPress: () => void;
  onVideoPress?: () => void;
  onBookPress?: () => void;
  isOrgCovered?: boolean;
  orgName?: string;
}

export const TherapistCard: React.FC<TherapistCardProps> = ({
  therapist,
  onPress,
  onVideoPress,
  onBookPress,
  isOrgCovered = false,
  orgName,
}) => {
  const specsList = therapist.specializations || therapist.specialties || (therapist.specialty ? [therapist.specialty] : ['Counseling', 'Mental Wellness']);
  const languagesList = therapist.languages && therapist.languages.length > 0 ? therapist.languages : ['English', 'Hindi'];
  const ratingVal = therapist.rating ? therapist.rating.toFixed(1) : '4.9';
  const feeVal = therapist.sessionFee || therapist.hourlyRate || 1500;
  const locationText = therapist.location || (therapist.city ? `${therapist.city}${therapist.state ? `, ${therapist.state}` : ''}` : 'Online');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      className="bg-white rounded-2xl border border-slate-200 mb-4 overflow-hidden shadow-sm"
    >
      {/* Top Video Header */}
      <View className="w-full h-[180px] bg-slate-900 relative">
        <IntroVideoPlayer
          url={therapist.introVideoUrl}
          mode="card"
          fallbackName={therapist.name}
          avatarUrl={therapist.avatarUrl}
          onVideoPress={onVideoPress}
        />
        {/* Rating Floating Badge */}
        <View className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-1 rounded-full flex-row items-center gap-1 shadow-sm" pointerEvents="none">
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-xs font-bold text-slate-900">{ratingVal}</Text>
        </View>
      </View>

      {/* Card Content Body */}
      <View className="p-3.5">
        {/* Name & Verification */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1">
            <Text className="text-lg font-sora-bold text-slate-900" numberOfLines={1}>
              {therapist.name}
            </Text>
            {therapist.verified && (
              <View className="flex-row items-center gap-1 mt-0.5 bg-sky-100 self-start px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} color="#0284C7" />
                <Text className="text-[10px] font-semibold text-sky-700">Counsellor Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Snippet */}
        {therapist.bio ? (
          <Text className="text-[13px] text-slate-600 leading-[18px] my-1.5" numberOfLines={2}>
            {therapist.bio}
          </Text>
        ) : (
          <Text className="text-[13px] text-slate-600 leading-[18px] my-1.5" numberOfLines={2}>
            Experienced compassionate counselor offering evidence-based therapy and guidance.
          </Text>
        )}

        {/* Specialization Chips */}
        <View className="flex-row flex-wrap gap-1.5 my-1.5">
          {specsList.slice(0, 3).map((spec, idx) => (
            <View key={idx} className="bg-slate-100 px-2.5 py-1 rounded-full">
              <Text className="text-[11px] font-medium text-slate-700">{spec}</Text>
            </View>
          ))}
        </View>

        {/* Meta Info Row: Experience/Sessions, Language, Location */}
        <View className="flex-row items-center justify-between py-2 my-1 border-t border-b border-slate-100">
          <View className="flex-row items-center gap-1">
            <Clock size={13} color="#64748B" />
            <Text className="text-xs text-slate-500">
              {therapist.sessionCount ? `${therapist.sessionCount} sessions` : `${therapist.experience || 3}+ yrs exp`}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <MessageCircle size={13} color="#64748B" />
            <Text className="text-xs text-slate-500">{languagesList[0]}</Text>
          </View>

          <View className="flex-row items-center gap-1">
            <MapPin size={13} color="#64748B" />
            <Text className="text-xs text-slate-500" numberOfLines={1}>{locationText}</Text>
          </View>
        </View>

        {/* Footer: Fee / Coverage & CTA Button */}
        <View className="flex-row items-center justify-between mt-2">
          <View className="justify-center">
            {isOrgCovered ? (
              <View>
                <Text className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  FREE (Org Covered)
                </Text>
                {orgName && <Text className="text-[10px] text-slate-500 mt-0.5">{orgName}</Text>}
              </View>
            ) : (
              <View>
                <Text className="text-lg font-sora-bold text-slate-900">₹{feeVal}</Text>
                <Text className="text-[10px] text-slate-500 -mt-0.5">per 45 min session</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={onBookPress || onPress}
            className="bg-primary px-4 py-2.5 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white text-[13px] font-sora-bold">Book Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
