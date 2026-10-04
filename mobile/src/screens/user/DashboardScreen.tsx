import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, Switch, Linking, TextInput, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Star, Compass, BookOpen, Search, Calendar, MessageSquare, AlertCircle, LogOut, Sparkles, Wallet, FileText, Bell, BellOff, MessageCircle, ChevronRight, Users, Clock, Gift } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { useStore } from '../../lib/store';
import { AppHeader } from '../../components/AppHeader';
import { SOSButton } from '../../components/SOSButton';
import { CrisisOverlay } from '../../components/CrisisOverlay';
import { getNotificationsPreference, handleNotificationToggle } from '../../lib/pushNotifications';
import { AdBannerCarousel } from '../../components/AdBannerCarousel';
import { useAuth, useUser } from '@clerk/clerk-expo';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');

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

  const storeFirstName = useStore(state => state.firstName);
  const firstName = profileData?.user?.fullName?.split(" ")[0] || user?.firstName || storeFirstName || 'Friend';

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

  // Mutation for 1-time referral prompt
  const applyRefMutation = useMutation({
    mutationFn: (data: { referralCode?: string; skip?: boolean }) => API.auth.applyReferral(data),
    onSuccess: (res: any) => {
      if (res?.message) {
        Alert.alert('🎁 Referral Updated', res.message);
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userDashboardStats'] });
    },
    onError: (err: any) => {
      Alert.alert('Referral Error', err?.message || 'Could not apply referral code.');
    },
  });

  const streak = userStats?.streak ?? 0;
  const freeSessionCredits = userStats?.freeSessionCredits ?? 0;
  const tierRaw = profileData?.user?.tier || 'free';
  const tier = tierRaw === 'apna_therapist' ? 'Apna Therapist' : tierRaw === 'mann_shanti' ? 'Mann Shanti' : 'Free Tier';

  const dbUser = profileData?.user;
  const isStudentUnverified =
    (dbUser?.userType === 'school_student' || dbUser?.userType === 'college_student') &&
    dbUser?.studentIdVerificationStatus !== 'approved';

  const dailyPrompt = promptData?.prompt || "What is one thought you had today that felt absolute, but might actually have nuance?";

  // Find closest upcoming session
  const bookings = bookingsData?.bookings || [];
  const upcomingBooking = bookings
    .filter((b: any) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.slot) > new Date())
    .sort((a: any, b: any) => new Date(a.slot).getTime() - new Date(b.slot).getTime())[0];

  const requestedBookings = bookings
    .filter((b: any) => b.status === 'confirmed' && b.journalShareState === 'requested' && new Date(b.slot) > new Date());

  const handleRespondJournal = async (bookingId: string, approve: boolean) => {
    try {
      await API.booking.respondToJournal(bookingId, approve);
      Alert.alert('Response Saved', approve ? 'Journal entries shared with counsellor.' : 'Share request declined.');
      refetchBookings();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update journal share request.');
    }
  };

  const formatSlotTime = (slotStr: string) => {
    const d = new Date(slotStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMoodSelect = async (moodVal: number) => {
    setSelectedMood(moodVal);
    try {
      await API.mood.create({ score: moodVal });
      Alert.alert('Mood Saved', 'Thank you for checking in. We have updated your daily pattern logs.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save mood log.');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        userFirstName={firstName}
        role={dbUser?.role || 'user'}
        onUpgradePress={() => navigation.navigate('Plans')}
        onProfilePress={() => navigation.navigate('Profile')}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Student ID Lock Modal / Alert Banner */}
        {isStudentUnverified && (
          <View style={styles.studentLockBanner}>
            <View style={styles.studentLockHeader}>
              <AlertCircle size={20} color="#D97706" />
              <Text style={styles.studentLockTitle}>Student Verification Required</Text>
            </View>
            <Text style={styles.studentLockSub}>
              You registered as a student ({dbUser?.schoolCollegeName || 'Student'}). Please upload your Student ID Card in profile to unlock full platform features.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.studentLockBtn}
            >
              <Text style={styles.studentLockBtnText}>Upload Student ID →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Streak & Plan Hero Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statBox}>
            <Flame size={20} color={Theme.colors.primary} />
            <Text style={styles.statVal}>{streak} Days</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Star size={20} color={Theme.colors.secondary} />
            <Text style={styles.statVal}>{tier}</Text>
            <Text style={styles.statLabel}>Current Plan</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Gift size={20} color="#0D9488" />
            <Text style={styles.statVal}>{freeSessionCredits}</Text>
            <Text style={styles.statLabel}>Free Credits</Text>
          </View>
        </View>

        {/* Journal Share Requests Banner */}
        {requestedBookings.length > 0 && (
          <View style={styles.journalShareBanner}>
            <Text style={styles.journalShareTitle}>🔔 Counsellor Requesting CBT Journal Access</Text>
            {requestedBookings.map((b: any) => (
              <View key={b._id || b.id} style={styles.journalShareItem}>
                <Text style={styles.journalShareText}>
                  {b.therapistName || 'Your Counsellor'} requested access to view your CBT journal for session on {formatSlotTime(b.slot)}.
                </Text>
                <View style={styles.journalShareRow}>
                  <TouchableOpacity
                    style={styles.journalApproveBtn}
                    onPress={() => handleRespondJournal(b._id || b.id, true)}
                  >
                    <Text style={styles.journalApproveText}>Allow Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.journalDeclineBtn}
                    onPress={() => handleRespondJournal(b._id || b.id, false)}
                  >
                    <Text style={styles.journalDeclineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Session Reminder Card */}
        {upcomingBooking && (
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingHeader}>
              <View style={styles.upcomingBadge}>
                <Clock size={12} color="#0D564D" />
                <Text style={styles.upcomingBadgeText}>UPCOMING COUNSELING SESSION</Text>
              </View>
              <Text style={styles.upcomingTime}>{formatSlotTime(upcomingBooking.slot)}</Text>
            </View>
            <Text style={styles.upcomingTherapist}>{upcomingBooking.therapistName || 'Counselor Session'}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Session', { bookingId: upcomingBooking._id || upcomingBooking.id })}
              style={styles.upcomingBtn}
            >
              <Text style={styles.upcomingBtnText}>Join Video Session →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Free Credits Reminder Banner */}
        {freeSessionCredits > 0 && (
          <View style={styles.freeCreditBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Theme.fonts.display, fontSize: 13.5, color: '#92400E' }}>
                  🎁 {freeSessionCredits} Free Counseling Session Credit{freeSessionCredits > 1 ? 's' : ''} Available!
                </Text>
                <Text style={{ fontFamily: Theme.fonts.body, fontSize: 11.5, color: '#B45309', marginTop: 2 }}>
                  Book a session with certified therapists using your earned referral credit.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Therapists')}
              style={{ backgroundColor: '#D97706', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 }}
            >
              <Text style={{ color: '#FFF', fontFamily: Theme.fonts.bodyBold, fontSize: 11 }}>Book Free Session →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Target Ad Banners */}
        <AdBannerCarousel target="user" navigation={navigation} />

        {/* First-time Referral Code Prompt Card (renders ONLY IF not processed yet) */}
        {dbUser && dbUser.referralPromptProcessed === false && !dbUser.referredBy && (
          <View style={styles.referralPromptCard}>
            <View style={styles.referralPromptHeader}>
              <Gift size={20} color="#0D9488" />
              <Text style={styles.referralPromptTitle}>Have a Friend's Referral Code?</Text>
            </View>
            <Text style={styles.referralPromptSub}>
              Enter a friend's referral code to get 1 Free Counseling Session Credit!
            </Text>
            <View style={styles.referralPromptRow}>
              <TextInput
                style={styles.referralInput}
                placeholder="Enter referral code (e.g. MMTP-1A2B)"
                placeholderTextColor="#94A3B8"
                value={referralCodeInput}
                onChangeText={setReferralCodeInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.referralApplyBtn, (!referralCodeInput.trim() || applyRefMutation.isPending) && { opacity: 0.5 }]}
                disabled={!referralCodeInput.trim() || applyRefMutation.isPending}
                onPress={() => applyRefMutation.mutate({ referralCode: referralCodeInput.trim() })}
              >
                {applyRefMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.referralApplyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.referralSkipBtn}
              onPress={() => applyRefMutation.mutate({ skip: true })}
            >
              <Text style={styles.referralSkipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Mood Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How are you feeling today?</Text>
          <View style={styles.moodEmojiRow}>
            {[
              { val: 1, emoji: '😞' },
              { val: 2, emoji: '😟' },
              { val: 3, emoji: '😕' },
              { val: 4, emoji: '😐' },
              { val: 5, emoji: '🙂' },
              { val: 6, emoji: '😊' },
              { val: 7, emoji: '🥰' },
            ].map(item => (
              <TouchableOpacity
                key={item.val}
                onPress={() => handleMoodSelect(item.val)}
                style={[
                  styles.moodEmojiBtn,
                  selectedMood === item.val && styles.moodEmojiActive
                ]}
              >
                <Text style={styles.moodEmojiText}>{item.emoji}</Text>
                {selectedMood === item.val && <View style={styles.activeDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily CBT Reflective Prompt */}
        <View style={styles.cbtCard}>
          <View style={styles.cbtHeader}>
            <Sparkles size={16} color={Theme.colors.primary} />
            <Text style={styles.cbtHeaderTitle}>DAILY CBT REFLECTION</Text>
          </View>
          <Text style={styles.cbtPromptText}>"{dailyPrompt}"</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Journal')}
            style={styles.cbtBtn}
          >
            <Text style={styles.cbtBtnText}>Reflect in Journal →</Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Grid */}
        <Text style={styles.sectionHeaderTitle}>Wellness & Counseling Tools</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
            onPress={() => navigation.navigate('Therapists')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#CCFBF1' }]}>
              <Compass size={22} color={Theme.colors.primary} />
            </View>
            <Text style={styles.gridCardTitle}>Book Therapy</Text>
            <Text style={styles.gridCardSub}>Connect 1-on-1 with expert psychologists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}
            onPress={() => navigation.navigate('GroupSessions')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Users size={22} color="#16A34A" />
            </View>
            <Text style={styles.gridCardTitle}>Live Audio Rooms</Text>
            <Text style={styles.gridCardSub}>100% Anonymous group sessions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <MessageSquare size={22} color="#EA580C" />
            </View>
            <Text style={styles.gridCardTitle}>Manas AI Support</Text>
            <Text style={styles.gridCardSub}>24/7 CBT-guided conversational AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' }]}
            onPress={() => navigation.navigate('Breathe')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <BookOpen size={22} color="#4F46E5" />
            </View>
            <Text style={styles.gridCardTitle}>Guided Breathing</Text>
            <Text style={styles.gridCardSub}>Calm anxiety & regulate mood</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Services Navigation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Services</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#EEF2FF' }]}>
                <Wallet size={18} color="#4F46E5" />
              </View>
              <Text style={styles.menuText}>My Wallet & Balance</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Reports')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#ECFDF5' }]}>
                <FileText size={18} color="#059669" />
              </View>
              <Text style={styles.menuText}>Psychological Assessment Reports</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* WhatsApp Support Community Card */}
        <View style={styles.whatsappCard}>
          <View style={styles.whatsappHeader}>
            <View style={styles.whatsappIconBox}>
              <MessageCircle size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whatsappTitle}>Join Wellness Community</Text>
              <Text style={styles.whatsappSubtitle}>
                Get daily mental health tips, peer support, and therapist event alerts on WhatsApp.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => Linking.openURL('https://chat.whatsapp.com/demo-community-link').catch(() => {})}
          >
            <Text style={styles.whatsappBtnText}>Join WhatsApp Community →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating SOS Crisis Button & Overlay */}
      <SOSButton onPress={() => setCrisisOpen(true)} />
      <CrisisOverlay open={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Theme.spacing.margin,
    paddingBottom: 40,
  },
  studentLockBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  studentLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  studentLockTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 14.5,
    color: '#92400E',
  },
  studentLockSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18,
    marginBottom: 10,
  },
  studentLockBtn: {
    backgroundColor: '#D97706',
    borderRadius: Theme.radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  studentLockBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: '#FFF',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: Theme.colors.onSurface,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Theme.colors.surfaceHigh,
  },
  journalShareBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  journalShareTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 13.5,
    color: '#991B1B',
    marginBottom: 8,
  },
  journalShareItem: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.sm,
    marginTop: 6,
  },
  journalShareText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
  },
  journalShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  journalApproveBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  journalApproveText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: '#FFF',
  },
  journalDeclineBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  journalDeclineText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: '#FFF',
  },
  upcomingCard: {
    backgroundColor: '#0F2926',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: '#2DD4BF',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  upcomingBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: '#0F2926',
    letterSpacing: 0.5,
  },
  upcomingTime: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: '#2DD4BF',
  },
  upcomingTherapist: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 12,
  },
  upcomingBtn: {
    backgroundColor: '#2DD4BF',
    borderRadius: Theme.radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  upcomingBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#0F2926',
  },
  freeCreditBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  referralPromptCard: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  referralPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  referralPromptTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: '#0F172A',
  },
  referralPromptSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  referralPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#0F172A',
  },
  referralApplyBtn: {
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralApplyBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#FFF',
  },
  referralSkipBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  referralSkipBtnText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceHigh,
    shadowColor: '#2E6E65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
  },
  moodEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodEmojiBtn: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  moodEmojiActive: {
    backgroundColor: Theme.colors.primary + '1A',
  },
  moodEmojiText: {
    fontSize: 24,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    marginTop: 4,
  },
  cbtCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.margin,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  cbtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cbtHeaderTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  cbtPromptText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 13.5,
    color: '#0F2926',
    lineHeight: 20,
    marginBottom: 12,
  },
  cbtBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cbtBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: '#FFF',
  },
  sectionHeaderTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.margin,
  },
  gridCard: {
    width: '48%',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
  },
  gridIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 4,
  },
  gridCardSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceHigh,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  whatsappCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 12,
  },
  whatsappHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  whatsappIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: '#1B5E20',
  },
  whatsappSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 17,
    marginTop: 2,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2E7D32',
    borderRadius: Theme.radius.lg,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  whatsappBtnText: {
    fontFamily: Theme.fonts.display,
    fontSize: 13.5,
    color: '#FFF',
  },
});

export default DashboardScreen;
