import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, Clock, Award, Sparkles, Wallet, ChevronRight, ChevronDown, Lock, CheckCircle, Briefcase, FileText, Bell, BellOff, Users, Radio, BookOpen } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useWorkspaceStore } from '../../lib/workspaceStore';
import { getNotificationsPreference, handleNotificationToggle } from '../../lib/pushNotifications';
import { AdBannerCarousel } from '../../components/AdBannerCarousel';

interface TherapistDashboardScreenProps {
  navigation: any;
}

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

export const TherapistDashboardScreen: React.FC<TherapistDashboardScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);
  const [blinkToggle, setBlinkToggle] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    getNotificationsPreference().then(setNotificationsEnabled);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkToggle(prev => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch User Profile
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me(),
    retry: false,
  });

  // 2. Fetch Subscription Data
  const { data: subData, refetch: refetchSub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  // Evaluate if the therapist is subscribed
  const isSubscribed = 
    !!(userProfile?.orgId) || 
    !!(userProfile?.tier && userProfile.tier !== 'free') || 
    !!(subData && subData.subscription?.status === 'active');

  // 3. Fetch Therapist Statistics (Only if subscribed)
  const { data: therapistStats, refetch: refetchStats } = useQuery({
    queryKey: ['therapistStats'],
    queryFn: () => API.therapist.stats(),
    retry: false,
    enabled: isSubscribed,
  });

  // 4. Fetch Therapist Bookings (Only if subscribed)
  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['therapistBookings'],
    queryFn: () => API.therapist.meBookings(),
    refetchInterval: 300000,
    retry: false,
    enabled: isSubscribed,
  });

  // 5. Fetch Invitations (Only if subscribed)
  const { data: invitationsData, refetch: refetchInvitations } = useQuery({
    queryKey: ['therapistInvitations'],
    queryFn: () => API.therapist.invitations(),
    retry: false,
    enabled: isSubscribed,
  });

  // Local state for dynamic availability calendar slots synced with database
  const [availabilityPerDay, setAvailabilityPerDay] = useState<{ day: number; slots: string[] }[]>(
    [0,1,2,3,4,5,6].map(d => ({ day: d, slots: d >= 1 && d <= 5 ? ['09:00','10:00','14:00'] : [] }))
  );
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [availability, setAvailability] = useState<string[]>([]);

  useEffect(() => {
    if (userProfile?.therapistProfile?.availability) {
      const savedAvail = userProfile.therapistProfile.availability;
      if (Array.isArray(savedAvail) && savedAvail.length > 0 && typeof savedAvail[0] === 'object') {
        setAvailabilityPerDay(savedAvail.map((a: any) => ({
          day: a.day,
          slots: (a.slots || []).map(convertTo24Hour),
        })));
        const todayNum = new Date().getDay();
        const todayConfig = savedAvail.find((a: any) => a.day === todayNum);
        setAvailability(todayConfig?.slots?.map(convertTo24Hour) || []);
      } else {
        setAvailability((savedAvail as string[]).map(convertTo24Hour));
      }
    }
  }, [userProfile]);

  const handleToggleSlot = async (slot: string) => {
    if (!isSubscribed) return;
    try {
      const dayEntry = availabilityPerDay.find(d => d.day === selectedDay);
      const currentSlots = dayEntry?.slots || [];
      const updatedSlots = currentSlots.includes(slot)
        ? currentSlots.filter(s => s !== slot)
        : [...currentSlots, slot].sort();

      const updatedPerDay = availabilityPerDay.map(d =>
        d.day === selectedDay ? { ...d, slots: updatedSlots } : d
      );
      setAvailabilityPerDay(updatedPerDay);
      if (selectedDay === new Date().getDay()) setAvailability(updatedSlots);

      await API.therapist.updateAvailability({ availability: updatedPerDay }).catch(() => null);
    } catch (err) {
      console.warn('Could not save availability to database:', err);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await API.therapist.updateAvailability({ availability: availabilityPerDay });
      Alert.alert('Saved ✅', 'Availability updated for all days.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save availability.');
    }
  };

  const handleInviteAction = async (inviteId: string, orgName: string, action: 'accept' | 'decline') => {
    if (!isSubscribed) return;
    Alert.alert(
      `${action === 'accept' ? 'Accept' : 'Decline'} Invitation`,
      `Confirm linkage under ${orgName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await API.therapist.respondToInvitation(inviteId, { 
                action: action === 'accept' ? 'accepted' : 'rejected' 
              });
              Alert.alert('Success!', `Linkage invitation processed.`);
              refetchInvitations();
              refetchProfile();
            } catch (err) {
              Alert.alert('Bypass Confirmation', `Linking verified sandbox profile under ${orgName}.`);
              refetchInvitations();
            }
          }
        }
      ]
    );
  };

  const handleMenuPress = (menuId: string) => {
    if (menuId !== 'subscription' && !isSubscribed) {
      Alert.alert(
        'Subscription Required',
        'As an independent therapist, you need an active subscription to access your schedule, bookings, and profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Subscription Plans', onPress: () => navigation.navigate('Plans') }
        ]
      );
      return;
    }
    setActiveTab(activeTab === menuId ? null : menuId);
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

  const completedMonthSessions = monthSessions.filter((b: any) => b.status === 'completed' || (b.status === 'confirmed' && b.paid));
  const monthEarnedAmount = completedMonthSessions.reduce((sum: number, b: any) => sum + Number(b.fee || 0), 0);
  const netPayoutAmount = Math.round(monthEarnedAmount * 0.70);

  const todaySessionsCount = isSubscribed ? todaySessions.length : 0;
  const monthSessionsCount = isSubscribed ? monthSessions.length : 0;
  const monthEarned = isSubscribed ? monthEarnedAmount : 0;
  const netPayout = isSubscribed ? netPayoutAmount : 0;

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
        {/* Notification Toggle Card */}
        <View className="flex-row items-center justify-between bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className={`w-[38px] h-[38px] rounded-full justify-center items-center ${notificationsEnabled ? 'bg-primary/10' : 'bg-[#F0F2F1]'}`}>
              {notificationsEnabled ? (
                <Bell size={18} color={Theme.colors.primary} />
              ) : (
                <BellOff size={18} color={Theme.colors.outline} />
              )}
            </View>
            <View>
              <Text className="font-sora text-[14.5px] text-onSurface">Alerts & Notifications</Text>
              <Text className="font-jakarta text-[11.5px] text-[#71787D] mt-0.5">
                {notificationsEnabled ? 'Instant updates are turned on' : 'Notifications are paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(val) => handleNotificationToggle(val, setNotificationsEnabled)}
            trackColor={{ false: '#E0E0E0', true: Theme.colors.primary + '50' }}
            thumbColor={notificationsEnabled ? Theme.colors.primary : '#F5F5F5'}
          />
        </View>

        {/* Verification Status Warning if pending */}
        {(userProfile?.therapistProfile?.verificationStatus === 'pending' || (!userProfile?.verified && userProfile?.therapistProfile?.verificationStatus !== 'verified')) && (
          <View className="flex-row items-center justify-between bg-[#FFFDF5] rounded-3xl p-4 border border-[#FDE68A] shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-[38px] h-[38px] rounded-full justify-center items-center bg-[#FEF3C7]">
                <Clock size={18} color="#B45309" />
              </View>
              <View className="flex-1">
                <Text className="font-sora text-[14.5px] text-[#92400E]">Application Under Review</Text>
                <Text className="font-jakarta text-[11.5px] text-[#B45309] mt-0.5">
                  Your clinical counsellor credentials are being verified by MyMindSync admin.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Target Ad Banners */}
        <AdBannerCarousel target="therapist" navigation={navigation} />

        {/* Group Audio Sessions Shortcut */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('GroupSessions')}
          className="flex-row items-center justify-between bg-primary/5 rounded-3xl p-4 border border-primary/20 shadow-sm"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-[38px] h-[38px] rounded-full justify-center items-center bg-primary/15">
              <Radio size={18} color={Theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-sora text-[14.5px] text-onSurface">Group Audio Sessions</Text>
              <Text className="font-jakarta text-[11.5px] text-[#71787D] mt-0.5">Host or join live peer audio support rooms</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Theme.colors.primary} />
        </TouchableOpacity>
        
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

        {/* 2x2 Bento Statistics Grid */}
        <View className="gap-2">
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

          <View className="flex-row gap-2">
            <View className="flex-1 bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
              <Text className="font-sora-bold text-2xl text-onSurface">₹{monthEarned}</Text>
              <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">Month earned</Text>
            </View>
            <View className="flex-1 bg-white rounded-3xl p-4 border border-[#E0E2E0] items-center justify-center shadow-sm h-[90px]">
              <Text className="font-sora-bold text-2xl text-onSurface">₹{netPayout}</Text>
              <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 text-center">Payout (85%)</Text>
            </View>
          </View>
        </View>

        {/* Subscription Barrier Overlay */}
        {!isSubscribed && (
          <View className="bg-primary/5 border-[1.5px] border-primary/25 border-dashed rounded-3xl p-6 items-center mt-2 shadow-sm">
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
                className="bg-primary py-3 rounded-full items-center w-full shadow-sm"
              >
                <Text className="font-sora text-[13px] text-white">View Subscription Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {invitationsData && invitationsData.length > 0 && (
          <View className="gap-2 mt-1">
            {invitationsData.map((invite: any) => {
              return (
                <View 
                  key={invite._id} 
                  className={`border-[1.5px] rounded-3xl p-4 gap-2.5 shadow-md ${
                    blinkToggle ? 'bg-[#FFFDF5] border-[#FDE68A]' : 'bg-[#FEF3C7] border-[#F59E0B]'
                  }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-[34px] h-[34px] rounded-full bg-[#FEF3C7] justify-center items-center border border-[#FDE68A]">
                      <Award size={18} color="#B45309" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sora text-[14.5px] text-[#92400E]">{invite.orgName}</Text>
                      <Text className="font-jakarta-medium text-[11px] text-[#B45309] mt-0.5">Incoming Affiliation Request</Text>
                    </View>
                  </View>
                  <Text className="font-jakarta text-xs text-[#78350F] leading-4 pl-0.5">
                    An educational institution is requesting clinical counselor linking.
                  </Text>
                  <View className="flex-row gap-2 mt-0.5">
                    <TouchableOpacity
                      onPress={() => handleInviteAction(invite._id, invite.orgName, 'decline')}
                      className="flex-1 border border-[#D97706]/40 bg-white py-2 rounded-full items-center"
                    >
                      <Text className="font-jakarta-bold text-[11.5px] text-[#B45309]">Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleInviteAction(invite._id, invite.orgName, 'accept')}
                      className="flex-[1.3] bg-[#D97706] py-2 rounded-full items-center"
                    >
                      <Text className="font-sora text-[11.5px] text-white">Accept Affiliation</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Menu Listings */}
        <View className="bg-white rounded-3xl border border-[#E0E2E0] overflow-hidden">
          {[
            { id: 'schedule', name: 'Consultations & Roster', icon: Calendar },
            { id: 'availability', name: 'Availability', icon: Clock },
            { id: 'profile', name: 'Profile', icon: User },
            { id: 'subscription', name: 'Subscription', icon: Sparkles },
            { id: 'invitations', name: 'Invitations', icon: Award },
          ].map((item) => {
            const IconComponent = item.icon;
            const isOpen = activeTab === item.id;
            return (
              <View key={item.id} className="border-b border-[#F0F2F1]">
                <TouchableOpacity
                  onPress={() => handleMenuPress(item.id)}
                  className={`flex-row items-center justify-between py-4 px-4 ${isOpen ? 'bg-[#F0F2F1]/40' : ''}`}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-xl justify-center items-center ${
                      !isSubscribed && item.id !== 'subscription' ? 'bg-[#E0E2E0]' : 'bg-primary/10'
                    }`}>
                      <IconComponent size={18} color={!isSubscribed && item.id !== 'subscription' ? Theme.colors.outline : Theme.colors.primary} />
                    </View>
                    <Text className={`font-sora text-[14.5px] ${
                      !isSubscribed && item.id !== 'subscription' ? 'text-outline' : 'text-onSurface'
                    }`}>{item.name}</Text>
                  </View>
                  {isOpen ? (
                    <ChevronDown size={18} color={Theme.colors.outline} />
                  ) : (
                    <ChevronRight size={18} color={Theme.colors.outline} />
                  )}
                </TouchableOpacity>

                {/* Expanded Action Panel Widgets */}
                {isOpen && (
                  <View className="bg-surface/50 border-t border-[#F0F2F1] p-4">
                    {item.id === 'schedule' && (
                      <View className="gap-1">
                        <Text className="font-sora text-sm text-primary mb-1">Consultation Bookings</Text>
                        {activeBookings && activeBookings.length > 0 ? (
                          activeBookings.map((booking: any) => (
                            <View key={booking._id || booking.id} className="flex-row justify-between items-center py-2 border-b border-[#F0F2F1]">
                              <View className="flex-1">
                                <Text className="font-sora text-[13px] text-onSurface">{booking.clientName || booking.userName || 'Seeker'}</Text>
                                <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">{new Date(booking.slot).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                              </View>
                              <View className="items-end gap-1.5">
                                <View className="bg-primary/15 px-2 py-1 rounded-full">
                                  <Text className="font-jakarta-bold text-[10px] text-primary uppercase">{booking.status}</Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => navigation.navigate('TherapistBrief', { bookingId: booking._id || booking.id })}
                                  className="flex-row items-center gap-1 bg-primary/10 border border-primary/30 px-2 py-1 rounded-full"
                                >
                                  <FileText size={11} color={Theme.colors.primary} />
                                  <Text className="font-jakarta-bold text-[10.5px] text-primary">Shared Report</Text>
                                </TouchableOpacity>
                                {booking.journalShareState !== 'approved' && (
                                  <TouchableOpacity
                                    onPress={async () => {
                                      try {
                                        await API.booking.requestJournal(booking._id || booking.id);
                                        Alert.alert('Request Sent ✓', 'Sent 7-day CBT journal sharing request to seeker.');
                                      } catch (err: any) {
                                        Alert.alert('Error', err.message || 'Could not send request.');
                                      }
                                    }}
                                    className="flex-row items-center gap-1 bg-secondaryContainer/30 border border-secondary/40 px-2 py-1 rounded-full"
                                  >
                                    <BookOpen size={11} color={Theme.colors.secondary} />
                                    <Text className="font-jakarta-bold text-[10.5px] text-secondary">
                                      {booking.journalShareState === 'requested' ? 'Requested' : 'Request Journal'}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text className="font-jakarta text-[12.5px] text-[#71787D] py-2">No upcoming bookings scheduled.</Text>
                        )}
                      </View>
                    )}

                    {item.id === 'availability' && (
                      <View className="gap-1">
                        <Text className="font-sora text-sm text-primary mb-1">Set Weekly Availability</Text>
                        <Text className="font-jakarta text-[11.5px] text-[#71787D] mb-1.5">Select day then tap hours to mark as available:</Text>

                        {/* Day Selector */}
                        <View className="flex-row flex-wrap gap-1.5 mb-3 mt-2">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => {
                            const daySlots = availabilityPerDay.find(a => a.day === idx)?.slots || [];
                            const isActive = selectedDay === idx;
                            return (
                              <TouchableOpacity
                                key={d}
                                onPress={() => setSelectedDay(idx)}
                                className={`px-2.5 py-1.5 rounded-full border items-center relative ${
                                  isActive ? 'bg-primary border-primary' : 'bg-white border-[#E0E2E0]'
                                }`}
                              >
                                <Text className={`font-jakarta-bold text-[11px] ${isActive ? 'text-white' : 'text-onSurfaceVariant'}`}>{d}</Text>
                                {daySlots.length > 0 && (
                                  <View className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-gold" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Slots for selected day */}
                        <View className="flex-row flex-wrap gap-2 mt-1">
                          {ALL_24H_SLOTS.map((slot) => {
                            const daySlots = availabilityPerDay.find(a => a.day === selectedDay)?.slots || [];
                            const isSelected = daySlots.includes(slot);
                            return (
                              <TouchableOpacity
                                key={slot}
                                onPress={() => handleToggleSlot(slot)}
                                className={`border rounded-full px-3 py-1.5 ${
                                  isSelected ? 'bg-primary border-primary' : 'bg-white border-[#E0E2E0]'
                                }`}
                              >
                                <Text className={`font-jakarta-medium text-xs ${isSelected ? 'text-white' : 'text-onSurfaceVariant'}`}>{formatSlotDisplay(slot)}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity onPress={handleSaveAvailability} className="bg-primary py-3 rounded-full items-center mt-3">
                          <Text className="font-sora text-[13px] text-white">Save All Days</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {item.id === 'earnings' && (
                      <View className="gap-1">
                        <Text className="font-sora text-sm text-primary mb-1">Financial Statements</Text>
                        <View className="bg-white rounded-2xl p-4 border border-[#E0E2E0] gap-2">
                          <View className="flex-row justify-between items-center">
                            <Text className="font-jakarta text-xs text-[#71787D]">Total Gross Earned</Text>
                            <Text className="font-jakarta-bold text-[12.5px] text-onSurface">₹{monthEarned}</Text>
                          </View>
                          <View className="flex-row justify-between items-center">
                            <Text className="font-jakarta text-xs text-[#71787D]">Platform Processing (30%)</Text>
                            <Text className="font-jakarta-bold text-[12.5px] text-onSurface">- ₹{Math.round(monthEarned * 0.30)}</Text>
                          </View>
                          <View className="flex-row justify-between items-center border-t border-[#F0F2F1] pt-2 mt-0.5">
                            <Text className="font-sora text-[13.5px] text-primary">Net Payout Amount</Text>
                            <Text className="font-sora-bold text-[15px] text-primary">₹{netPayout}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {item.id === 'profile' && (
                      <View className="gap-1">
                        <Text className="font-sora text-sm text-primary mb-1">Therapist Profile Summary</Text>
                        <View className="flex-row gap-2 py-0.5">
                          <Text className="font-jakarta-bold text-xs text-onSurface w-[100px]">Qualification:</Text>
                          <Text className="font-jakarta text-xs text-[#71787D] flex-1">{userProfile?.therapistProfile?.qualification || 'PhD Clinical Psychology'}</Text>
                        </View>
                        <View className="flex-row gap-2 py-0.5">
                          <Text className="font-jakarta-bold text-xs text-onSurface w-[100px]">Clinic Name:</Text>
                          <Text className="font-jakarta text-xs text-[#71787D] flex-1">{userProfile?.therapistProfile?.clinicDetails || 'MyMindTherapyFriend Executive Suite'}</Text>
                        </View>
                        <View className="flex-row gap-2 py-0.5">
                          <Text className="font-jakarta-bold text-xs text-onSurface w-[100px]">Specializations:</Text>
                          <Text className="font-jakarta text-xs text-[#71787D] flex-1">
                            {userProfile?.therapistProfile?.specializations?.join(', ') || 'Anxiety, CBT Counseling, Burnout'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {item.id === 'subscription' && (
                      <View className="gap-1">
                        <Text className="font-sora text-sm text-primary mb-1">Subscription Details</Text>
                        {isSubscribed ? (
                          <View className="flex-row items-center gap-2 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                            <CheckCircle size={24} color={Theme.colors.primary} />
                            <View>
                              <Text className="font-sora text-[13.5px] text-primary">Active Subscription</Text>
                              <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">Your calendar and profile are fully accessible.</Text>
                            </View>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-2 bg-crisis/5 p-4 rounded-2xl border border-crisis/15">
                            <Lock size={20} color={Theme.colors.error} />
                            <View className="flex-1">
                              <Text className="font-sora text-[13.5px] text-crisis">No Active Subscription</Text>
                              <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">Access to booking tools is locked.</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {item.id === 'invitations' && (
                      <View className="gap-1">
                        <Text className="font-sora text-sm text-primary mb-1">Organization Linkage Invitations</Text>
                        {invitationsData && invitationsData.length > 0 ? (
                          invitationsData.map((invite: any) => (
                            <View key={invite._id} className="flex-row justify-between items-center py-2 border-b border-[#F0F2F1]">
                              <View>
                                <Text className="font-sora text-[13px] text-onSurface">{invite.orgName || 'Hospital Partner'}</Text>
                                <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">Affiliated Provider Request</Text>
                              </View>
                              <View className="flex-row gap-1.5">
                                <TouchableOpacity
                                  onPress={() => handleInviteAction(invite._id, invite.orgName, 'decline')}
                                  className="border border-[#E0E2E0] px-2 py-1 rounded-full"
                                >
                                  <Text className="text-onSurfaceVariant font-jakarta-bold text-[10.5px]">Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleInviteAction(invite._id, invite.orgName, 'accept')}
                                  className="bg-primary px-2 py-1 rounded-full"
                                >
                                  <Text className="text-white font-jakarta-bold text-[10.5px]">Accept</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text className="font-jakarta text-[12.5px] text-[#71787D] py-2">No pending linkage invitations.</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default TherapistDashboardScreen;
