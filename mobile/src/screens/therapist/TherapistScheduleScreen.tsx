import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Lock, Briefcase, Award } from 'lucide-react-native';
import { useWorkspaceStore } from '../../lib/workspaceStore';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

const ALL_24H_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const convertTo24Hour = (slotStr: string) => {
  if (!slotStr) return '';
  if (!slotStr.includes('AM') && !slotStr.includes('PM')) {
    return slotStr;
  }
  const [time, modifier] = slotStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12);
  }
  return `${hours.padStart(2, '0')}:${minutes}`;
};

const formatSlotDisplay = (slot: string) => {
  if (!slot) return '';
  if (slot.includes('AM') || slot.includes('PM')) {
    return slot;
  }
  const [hourStr, minStr] = slot.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(displayHour).padStart(2, '0')}:${minStr} ${ampm}`;
};

interface TherapistScheduleScreenProps {
  navigation: any;
}

export const TherapistScheduleScreen: React.FC<TherapistScheduleScreenProps> = ({ navigation }) => {
  const [availability, setAvailability] = useState<string[]>([]);

  // Fetch profiles and subscription
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me(),
    retry: false,
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  const isSubscribed = 
    !!(userProfile?.orgId) || 
    !!(userProfile?.tier && userProfile.tier !== 'free') || 
    !!(subData && subData.subscription?.status === 'active');

  const { data: bookingsData } = useQuery({
    queryKey: ['therapistBookings'],
    queryFn: () => API.therapist.meBookings(),
    retry: false,
    enabled: isSubscribed,
  });

  React.useEffect(() => {
    if (userProfile?.therapistProfile?.availability) {
      const todayNum = new Date().getDay();
      const todayConfig = userProfile.therapistProfile.availability.find((a: any) => a.day === todayNum);
      if (todayConfig?.slots) {
        setAvailability(todayConfig.slots.map(convertTo24Hour));
      }
    }
  }, [userProfile]);

  const handleToggleSlot = async (slot: string) => {
    if (!isSubscribed) return;
    try {
      let updatedSlots = [];
      if (availability.includes(slot)) {
        updatedSlots = availability.filter(s => s !== slot);
        setAvailability(updatedSlots);
        Alert.alert('Slot Removed', `Removed ${formatSlotDisplay(slot)} from availability.`);
      } else {
        updatedSlots = [...availability, slot];
        setAvailability(updatedSlots);
        Alert.alert('Slot Added', `Added ${formatSlotDisplay(slot)} to availability.`);
      }
      await API.therapist.updateAvailability({
        availability: [{ day: new Date().getDay(), slots: updatedSlots }]
      }).catch(() => null);
    } catch (err) {
      console.warn("Could not save availability:", err);
    }
  };

  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();

  const activeBookings = (bookingsData?.bookings || []).filter((b: any) => {
    if (!userProfile?.orgId) return true;
    if (activeWorkspace === 'corporate') {
      return b.clientOrgId === userProfile.orgId;
    } else {
      return b.clientOrgId !== userProfile.orgId;
    }
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const todaySessions = activeBookings.filter((b: any) => {
    const d = new Date(b.slot);
    return d >= todayStart && d <= todayEnd;
  });

  const monthSessions = activeBookings.filter((b: any) => {
    const d = new Date(b.slot);
    return d >= currentMonthStart;
  });

  const todaySessionsCount = isSubscribed ? todaySessions.length : 0;
  const monthSessionsCount = isSubscribed ? monthSessions.length : 0;
  const totalSessionsCount = isSubscribed ? activeBookings.length : 0;
  const therapistName = userProfile?.fullName || 'Therapist';

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName={therapistName.split(' ')[0]}
        role="therapist"
        navigation={navigation}
        onUpgradePress={userProfile?.orgId ? undefined : () => navigation.navigate('Plans')}
      />

      <ScrollView contentContainerClassName="p-5 pb-20 gap-4">
        {/* Profile Card */}
        <View className="flex-row items-center bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm gap-4">
          <View className="w-[66px] h-[66px] rounded-full border-2 border-primary/30 justify-center items-center">
            <View className="w-[54px] h-[54px] rounded-full bg-primary/10 justify-center items-center">
              <Text className="font-sora-bold text-2xl text-primary">T</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-sora text-lg text-onSurface">{therapistName}</Text>
            <Text className="font-jakarta-medium text-[13px] text-primary mt-0.5">Therapist</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5">– · {totalSessionsCount} sessions</Text>
          </View>
        </View>

        {/* Dynamic Workspace Switcher (Only if affiliated with an organization) */}
        {userProfile?.orgId && (
          <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-4 gap-2">
            <Text className="font-jakarta-bold text-[12.5px] text-onSurfaceVariant">Practice Workspace</Text>
            <View className="flex-row bg-[#F0F2F1] rounded-full p-1 gap-0.5">
              <TouchableOpacity
                onPress={() => setActiveWorkspace('individual')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-full ${
                  activeWorkspace === 'individual' ? 'bg-primary shadow-sm' : ''
                }`}
              >
                <Briefcase size={14} color={activeWorkspace === 'individual' ? '#FFF' : Theme.colors.primary} />
                <Text className={`font-sora text-[11.5px] ${
                  activeWorkspace === 'individual' ? 'text-white' : 'text-primary'
                }`}>
                  Individual Practice
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveWorkspace('corporate')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-full ${
                  activeWorkspace === 'corporate' ? 'bg-primary shadow-sm' : ''
                }`}
              >
                <Award size={14} color={activeWorkspace === 'corporate' ? '#FFF' : Theme.colors.primary} />
                <Text className={`font-sora text-[11.5px] ${
                  activeWorkspace === 'corporate' ? 'text-white' : 'text-primary'
                }`}>
                  Corporate Affiliation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2 Stats Cards */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
            <Text className="font-sora-bold text-2xl text-onSurface">{todaySessionsCount}</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">Today's sessions</Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
            <Text className="font-sora-bold text-2xl text-onSurface">{monthSessionsCount}</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">This month</Text>
          </View>
        </View>

        {isSubscribed ? (
          <View className="gap-4">
            {/* Set Weekly Availability */}
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
              <View className="flex-row items-center gap-2 mb-1">
                <Clock size={18} color={Theme.colors.primary} />
                <Text className="font-sora text-[15px] text-onSurface">Availability Calendar</Text>
              </View>
              <Text className="font-jakarta text-xs text-[#71787D] mb-1.5">Tap slots to open/close them for seeker booking:</Text>
              <View className="flex-row flex-wrap gap-2">
                {ALL_24H_SLOTS.map((slot) => {
                  const isSelected = availability.includes(slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => handleToggleSlot(slot)}
                      className={`border rounded-full px-3 py-1.5 ${
                        isSelected ? 'bg-primary border-primary' : 'bg-[#F0F2F1] border-[#E0E2E0]'
                      }`}
                    >
                      <Text className={`font-jakarta-medium text-xs ${isSelected ? 'text-white' : 'text-onSurfaceVariant'}`}>{formatSlotDisplay(slot)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bookings Schedule */}
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
              <View className="flex-row items-center gap-2 mb-1">
                <Calendar size={18} color={Theme.colors.primary} />
                <Text className="font-sora text-[15px] text-onSurface">Upcoming Bookings</Text>
              </View>
              {activeBookings && activeBookings.length > 0 ? (
                activeBookings.map((booking: any) => (
                  <View key={booking._id || booking.id} className="flex-row justify-between items-center py-2 border-b border-[#F0F2F1]">
                    <View className="flex-1">
                      <Text className="font-sora text-[13px] text-onSurface">{booking.clientName || 'Seeker'}</Text>
                      <Text className="font-jakarta text-[11.5px] text-[#71787D] mt-0.5">{new Date(booking.slot).toLocaleString()}</Text>
                    </View>
                    <View className="flex-row gap-1.5">
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('TherapistBrief', { bookingId: booking.id, clientId: booking.clientId, clientName: booking.clientName })}
                        className="bg-primaryContainer px-2.5 py-1.5 rounded-full"
                      >
                        <Text className="font-jakarta-bold text-[11px] text-white">AI Brief</Text>
                      </TouchableOpacity>
                      {(() => {
                        const slotTime = new Date(booking.slot).getTime();
                        const now = Date.now();
                        const isUpcoming = !isNaN(slotTime) && now < (slotTime - 5 * 60 * 1000);
                        const isExpired = !isNaN(slotTime) && now > (slotTime + 60 * 60 * 1000);

                        if (isExpired) {
                          return (
                            <View className="bg-[#E0E2E0] px-2.5 py-1.5 rounded-full">
                              <Text className="font-jakarta-bold text-[11px] text-[#71787D]">Completed</Text>
                            </View>
                          );
                        }

                        if (isUpcoming) {
                          return (
                            <TouchableOpacity 
                              onPress={() => Alert.alert('Session Scheduled', `Meeting window opens at scheduled time (${new Date(booking.slot).toLocaleString()}) and stays open for 1 hour.`)}
                              className="bg-secondary/40 px-2.5 py-1.5 rounded-full"
                            >
                              <Text className="font-jakarta-bold text-[11px] text-onSurface">Scheduled</Text>
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TouchableOpacity 
                            onPress={() => navigation.navigate('Session', { bookingId: booking.id || booking._id, role: 'therapist' })}
                            className="bg-primary px-2.5 py-1.5 rounded-full"
                          >
                            <Text className="font-jakarta-bold text-[11px] text-white">Join Session</Text>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  </View>
                ))
              ) : (
                <Text className="font-jakarta text-[12.5px] text-[#71787D] py-2">No bookings scheduled today.</Text>
              )}
            </View>
          </View>
        ) : (
          /* Subscription Required Barrier Overlay */
          <View className="bg-primary/5 border-[1.5px] border-primary/25 border-dashed rounded-3xl p-6 items-center shadow-sm">
            <View className="w-11 h-11 rounded-full bg-primary/15 justify-center items-center mb-2">
              <Lock size={22} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora-bold text-lg text-primary text-center">Subscription Required</Text>
            <Text className="font-jakarta text-[13px] text-onSurfaceVariant text-center leading-[18px] mt-1.5 px-2">
              As an independent therapist, you need an active subscription to access your schedule, bookings, and profile.
            </Text>

            <View className="w-full gap-2 mt-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('Plans')}
                className="bg-primary py-3 rounded-full items-center w-full"
              >
                <Text className="font-sora text-[13px] text-white">View Subscription Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TherapistScheduleScreen;
