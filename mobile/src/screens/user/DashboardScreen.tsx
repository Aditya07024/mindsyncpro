import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Flame,
  Star,
  Compass,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Wallet,
  FileText,
  MessageCircle,
  ChevronRight,
  Users,
  Clock,
  Gift,
  Smile,
  ShieldCheck,
  Heart,
  ArrowRight,
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { useStore } from '../../lib/store';
import { AppHeader } from '../../components/AppHeader';
import { SOSButton } from '../../components/SOSButton';
import { CrisisOverlay } from '../../components/CrisisOverlay';
import { getNotificationsPreference } from '../../lib/pushNotifications';
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
  const tier =
    tierRaw === 'apna_therapist'
      ? 'Apna Therapist'
      : tierRaw === 'mann_shanti'
      ? 'Mann Shanti'
      : 'Free Tier';

  const dbUser = profileData?.user;
  const isStudentUnverified =
    (dbUser?.userType === 'school_student' || dbUser?.userType === 'college_student') &&
    dbUser?.studentIdVerificationStatus !== 'approved';

  const dailyPrompt =
    promptData?.prompt ||
    'What is one thought you had today that felt absolute, but might actually have nuance?';

  // Find closest upcoming session
  const bookings = bookingsData?.bookings || [];
  const upcomingBooking = bookings
    .filter(
      (b: any) =>
        (b.status === 'confirmed' || b.status === 'pending') && new Date(b.slot) > new Date()
    )
    .sort((a: any, b: any) => new Date(a.slot).getTime() - new Date(b.slot).getTime())[0];

  const requestedBookings = bookings.filter(
    (b: any) =>
      b.status === 'confirmed' &&
      b.journalShareState === 'requested' &&
      new Date(b.slot) > new Date()
  );

  const handleRespondJournal = async (bookingId: string, approve: boolean) => {
    try {
      await API.booking.respondToJournal(bookingId, approve);
      Alert.alert(
        'Response Saved',
        approve ? 'Journal entries shared with counsellor.' : 'Share request declined.'
      );
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
      Alert.alert('Mood Saved ✨', 'Thank you for checking in! Your daily log has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save mood log.');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        userFirstName={firstName}
        userImageUrl={user?.imageUrl || dbUser?.profilePicture}
        role={dbUser?.role || 'user'}
        onUpgradePress={() => navigation.navigate('Plans')}
        onProfilePress={() => navigation.navigate('Profile')}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Earlier White Card Stats Banner */}
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
          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Profile')}>
            <Gift size={20} color="#0D9488" />
            <Text style={styles.statVal}>{freeSessionCredits}</Text>
            <Text style={styles.statLabel}>Free Credits</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Mood Selector */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Smile size={18} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>How are you feeling right now?</Text>
          </View>
          <View style={styles.moodEmojiRow}>
            {[
              { val: 1, emoji: '😞' },
              { val: 2, emoji: '😟' },
              { val: 3, emoji: '😕' },
              { val: 4, emoji: '😐' },
              { val: 5, emoji: '🙂' },
              { val: 6, emoji: '😊' },
              { val: 7, emoji: '🥰' },
            ].map((item) => (
              <TouchableOpacity
                key={item.val}
                onPress={() => handleMoodSelect(item.val)}
                style={[
                  styles.moodEmojiBtn,
                  selectedMood === item.val && styles.moodEmojiActive,
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

        {/* Main Services Grid */}
        <Text style={styles.sectionHeaderTitle}>Wellness & Therapy Services</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
            onPress={() => navigation.navigate('Therapists')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#CCFBF1' }]}>
              <Compass size={22} color={Theme.colors.primary} />
            </View>
            <Text style={styles.gridCardTitle}>1-on-1 Therapy</Text>
            <Text style={styles.gridCardSub}>Book sessions with verified psychologists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}
            onPress={() => navigation.navigate('GroupSessions')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Users size={22} color="#16A34A" />
            </View>
            <Text style={styles.gridCardTitle}>Live Audio Rooms</Text>
            <Text style={styles.gridCardSub}>100% Anonymous group peer audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}
            onPress={() => navigation.navigate('Journal')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <FileText size={22} color="#EA580C" />
            </View>
            <Text style={styles.gridCardTitle}>CBT Journal</Text>
            <Text style={styles.gridCardSub}>Record reflections & reframe thoughts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' }]}
            onPress={() => navigation.navigate('Breathe')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <BookOpen size={22} color="#4F46E5" />
            </View>
            <Text style={styles.gridCardTitle}>Guided Breathing</Text>
            <Text style={styles.gridCardSub}>Anxiety relief & mood regulation</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Account Navigation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Tools & Reports</Text>

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

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('MoodDiary')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#FFF7ED' }]}>
                <Smile size={18} color="#EA580C" />
              </View>
              <Text style={styles.menuText}>Mood Tracker & Pattern Reflections</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* WhatsApp Community Card */}
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

      {/* Floating SOS Crisis Button & Overlay (Floats above floating tab bar) */}
      <SOSButton onPress={() => setCrisisOpen(true)} bottomOffset={90} />
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  welcomeContainer: {
    marginBottom: 12,
    marginTop: 2,
  },
  welcomeGreeting: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: '#0F172A',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: Theme.radius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    color: '#0F172A',
    marginTop: 4,
  },
  statLabel: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.sm,
  },
  cardTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  moodEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
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
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Theme.spacing.margin,
  },
  gridCard: {
    width: '48%',
    maxWidth: '48%',
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    minHeight: 130,
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
