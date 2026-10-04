import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Share,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfileScreenProps {
  navigation: any;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [friendCode, setFriendCode] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch current user details
  const { data: userData, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me(),
  });

  const user = userData?.user || userData || {};
  const referralCode = user.referralCode || '';
  const freeSessionCredits = user.freeSessionCredits || 0;
  const isStudentVerified = user.studentVerified || user.userType === 'student';

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
      refetchUser();
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
          await AsyncStorage.removeItem('jwt_token');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Landing' }],
          });
        },
      },
    ]);
  };

  if (userLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader userFirstName={user.name?.split(' ')[0] || 'Seeker'} role="user" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'Mental Health Seeker'}</Text>
            <Text style={styles.userEmail}>{user.email || user.phone || 'No contact specified'}</Text>
            <View style={styles.badgeRow}>
              {isStudentVerified ? (
                <View style={[styles.roleBadge, styles.studentBadge]}>
                  <GraduationCap size={12} color="#0D9488" />
                  <Text style={styles.studentBadgeText}>Verified Student</Text>
                </View>
              ) : (
                <View style={styles.roleBadge}>
                  <ShieldCheck size={12} color={Theme.colors.primary} />
                  <Text style={styles.roleBadgeText}>Active Seeker</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 🎁 Referral & Free Credits Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Gift size={20} color="#0D9488" />
            <Text style={styles.cardTitle}>Referral Program & Free Credits</Text>
          </View>

          <View style={styles.creditsBanner}>
            <Sparkles size={20} color="#D97706" />
            <View style={styles.creditsTextContainer}>
              <Text style={styles.creditsTitle}>
                {freeSessionCredits} Free Session{freeSessionCredits === 1 ? '' : 's'} Available
              </Text>
              <Text style={styles.creditsSub}>
                Use your free session credits when booking counseling sessions with qualified therapists!
              </Text>
            </View>
          </View>

          {/* Unique Referral Code */}
          <Text style={styles.inputLabel}>Your Unique Referral Code</Text>
          <View style={styles.referralCodeBox}>
            <Text style={styles.referralCodeText}>{referralCode || 'MMTP-REF'}</Text>

            <View style={styles.referralActions}>
              <TouchableOpacity onPress={handleCopyCode} style={styles.iconBtn}>
                <Copy size={18} color={Theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareReferral} style={[styles.iconBtn, styles.shareBtn]}>
                <Share2 size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.referralDesc}>
            Share your code with friends! When they register or apply your code,{' '}
            <Text style={{ fontWeight: '700' }}>both of you earn 1 Free Session Credit.</Text>
          </Text>

          {/* Apply Friend's Code */}
          <View style={styles.applySection}>
            <Text style={styles.inputLabel}>Have a Friend's Referral Code?</Text>
            <View style={styles.applyRow}>
              <TextInput
                style={styles.codeTextInput}
                placeholder="Enter referral code (e.g. MMTP-1A2B)"
                placeholderTextColor="#94A3B8"
                value={friendCode}
                onChangeText={setFriendCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  (!friendCode.trim() || applyReferralMutation.isPending) && styles.btnDisabled,
                ]}
                disabled={!friendCode.trim() || applyReferralMutation.isPending}
                onPress={handleApplyFriendCode}
              >
                {applyReferralMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Menu Options */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Account & Services</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#EEF2FF' }]}>
                <Wallet size={18} color="#4F46E5" />
              </View>
              <Text style={styles.menuText}>My Wallet & Payments</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Reports')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#ECFDF5' }]}>
                <FileText size={18} color="#059669" />
              </View>
              <Text style={styles.menuText}>Wellness & Clinical Reports</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MoodDiary')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#FFF7ED' }]}>
                <Smile size={18} color="#EA580C" />
              </View>
              <Text style={styles.menuText}>Mood Tracker & Reflections</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('GroupSessions')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#F0FDF4' }]}>
                <Mic size={18} color="#16A34A" />
              </View>
              <Text style={styles.menuText}>Live Group Audio Sessions</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Settings & App Preferences */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#F1F5F9' }]}>
                <Bell size={18} color="#475569" />
              </View>
              <Text style={styles.menuText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#CBD5E1', true: Theme.colors.primary }}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>MyMindTherapyFriend v1.0.1 · Encrypted & Confidential</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Theme.fonts.display,
    fontSize: 17,
    color: '#0F172A',
  },
  userEmail: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  roleBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: Theme.colors.primary,
  },
  studentBadge: {
    backgroundColor: '#CCFBF1',
  },
  studentBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: '#0D9488',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: '#0F172A',
  },
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  creditsTextContainer: {
    flex: 1,
  },
  creditsTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 14,
    color: '#92400E',
  },
  creditsSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  inputLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  referralCodeText: {
    fontFamily: Theme.fonts.display,
    fontSize: 18,
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  referralActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  shareBtn: {
    backgroundColor: Theme.colors.primary,
  },
  referralDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  applySection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  applyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#0F172A',
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#FFF',
  },
  sectionHeaderTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    color: '#1E293B',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  signOutText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#EF4444',
  },
  footerVersion: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default UserProfileScreen;
