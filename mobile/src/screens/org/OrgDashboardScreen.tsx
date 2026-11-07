import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlus,
  Activity,
  Users,
  Building,
  ShieldAlert,
  Heart,
  HelpCircle,
  Lock,
  Bell,
  BellOff,
  Clock
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { StatCard } from '../../components/StatCard';
import { getNotificationsPreference, handleNotificationToggle } from '../../lib/pushNotifications';

const LockedFeatureOverlay: React.FC<{ title: string; description: string; navigation: any }> = ({ title, description, navigation }) => (
  <View className="absolute inset-0 bg-white/95 rounded-3xl justify-center items-center p-4 border border-[#E0E2E0] z-10">
    <View className="w-10 h-10 rounded-full bg-[#FFF2F2] justify-center items-center mb-2 border border-[#FFCDD2]">
      <Lock size={18} color={Theme.colors.primary} />
    </View>
    <Text className="font-sora text-sm text-onSurface text-center mb-1">
      {title}
    </Text>
    <Text className="font-jakarta text-[11px] text-[#71787D] text-center leading-3.5 px-3 mb-3">
      {description}
    </Text>
    <TouchableOpacity
      onPress={() => navigation.navigate('Plans', { role: 'org_admin' })}
      className="bg-primary px-3.5 py-2 rounded-2xl"
    >
      <Text className="font-jakarta-bold text-[11px] text-white">
        Upgrade to Activate
      </Text>
    </TouchableOpacity>
  </View>
);

export const OrgDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [coverMemberFees, setCoverMemberFees] = useState(false);

  useEffect(() => {
    getNotificationsPreference().then(setNotificationsEnabled);
  }, []);

  // 1. Query live database dashboard stats
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['org-stats'],
    queryFn: () => API.org.stats(),
    retry: false
  });

  // 2. Query live organization seat info
  const { data: orgInfoData, isLoading: isOrgLoading } = useQuery({
    queryKey: ['org-info'],
    queryFn: () => API.org.me(),
    retry: false
  });

  useEffect(() => {
    if (orgInfoData?.organization?.coverMemberTherapyFees !== undefined) {
      setCoverMemberFees(orgInfoData.organization.coverMemberTherapyFees);
    }
  }, [orgInfoData]);

  const handleToggleCoverFees = async (val: boolean) => {
    setCoverMemberFees(val);
    try {
      await API.org.updateSettings({ coverMemberTherapyFees: val });
      Alert.alert(
        'Policy Saved',
        val
          ? 'Member therapy fee coverage is ENABLED. Organization members will book linked therapists for free.'
          : 'Member therapy fee coverage is DISABLED. Members will pay standard fees.'
      );
    } catch (err: any) {
      setCoverMemberFees(!val);
      Alert.alert('Error', err.message || 'Failed to update policy setting.');
    }
  };

  // 3. Query active subscription status
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false
  });

  const isSubscribed = subData?.subscription?.status === 'active';

  const handleSendInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid member email address.');
      return;
    }

    setLoading(true);
    try {
      await API.org.invite({ email });
      Alert.alert(
        'Seat Allocated!',
        `We have successfully emailed a MyMindTherapyFriend connection invite link to ${email}.`,
        [{ text: 'Excellent', onPress: () => { setEmail(''); refetchStats(); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invitation failed to dispatch.');
    } finally {
      setLoading(false);
    }
  };

  const metrics = statsData?.metrics;
  const avgTeamMood = metrics?.avgTeamMood ? parseFloat(metrics.avgTeamMood).toFixed(1) : '—';
  const activeMembers = metrics?.activeUsers ?? 0;
  const totalRegistered = metrics?.totalUsers ?? 0;
  const engagementRate = metrics?.engagement ?? 0;

  const seatsUsed = totalRegistered;
  const seatsTotal = orgInfoData?.organization?.seats || 100;
  const fillPercent = seatsTotal > 0 ? Math.round((seatsUsed / seatsTotal) * 100) : 0;

  const departments = statsData?.departments || [];

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="BITS Wellness"
        role="org_admin"
        navigation={navigation}
      />

      {isStatsLoading || isOrgLoading || isSubLoading ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text className="font-jakarta text-[13px] text-[#71787D]">Fetching workplace metrics from database...</Text>
        </View>
      ) : !isSubscribed ? (
        <View className="flex-1 justify-center items-center p-5">
          <View className="bg-white rounded-3xl p-6 border border-[#E0E2E0] items-center shadow-sm mt-5">
            <View className="w-12 h-12 rounded-full bg-[#FFF2F2] justify-center items-center mb-4 border border-[#FFCDD2]">
              <Lock size={22} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora text-lg text-onSurface text-center mb-2">Corporate Plan Required</Text>
            <Text className="font-jakarta text-[13px] text-[#71787D] text-center leading-[18px] px-4 mb-5">
              As an organization or wellness sponsor, you need an active subscription plan to activate employee wellness seats, link network practitioners, and track collective health metrics.
            </Text>

            <View className="w-full items-center">
              <TouchableOpacity
                onPress={() => navigation.navigate('Plans', { role: 'org_admin' })}
                className="bg-primary px-5 py-3 rounded-2xl"
              >
                <Text className="font-jakarta-bold text-[13px] text-white">View Subscription Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-5 pb-16 gap-4">
          {/* Notification Toggle Card */}
          <View className="flex-row items-center justify-between bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-1">
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
          {orgInfoData?.organization?.verificationStatus === 'pending' && (
            <View className="flex-row items-center justify-between bg-[#FFFDF5] rounded-3xl p-4 border border-[#FDE68A] shadow-sm mb-1">
              <View className="flex-row items-center gap-3">
                <View className="w-[38px] h-[38px] rounded-full justify-center items-center bg-[#FEF3C7]">
                  <Clock size={18} color="#B45309" />
                </View>
                <View className="flex-1">
                  <Text className="font-sora text-[14.5px] text-[#92400E]">Application Under Review</Text>
                  <Text className="font-jakarta text-[11.5px] text-[#B45309] mt-0.5">
                    Your organization domain & verification documents are under review by MyMindSync admin.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Member Therapy Fee Policy Toggle Card */}
          <View className="flex-row items-center justify-between bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-1">
            <View className="flex-row items-center gap-3 flex-1">
              <View className={`w-[38px] h-[38px] rounded-full justify-center items-center ${coverMemberFees ? 'bg-primary/10' : 'bg-[#F0F2F1]'}`}>
                <Heart size={18} color={coverMemberFees ? Theme.colors.primary : Theme.colors.outline} />
              </View>
              <View className="flex-1 pr-2">
                <Text className="font-sora text-[14.5px] text-onSurface">Cover Member Therapy Fees</Text>
                <Text className="font-jakarta text-[11.5px] text-[#71787D] mt-0.5">
                  {coverMemberFees ? 'Free appointments for members with linked therapists' : 'Members pay standard fees for therapists'}
                </Text>
              </View>
            </View>
            <Switch
              value={coverMemberFees}
              onValueChange={handleToggleCoverFees}
              trackColor={{ false: '#E0E0E0', true: Theme.colors.primary + '50' }}
              thumbColor={coverMemberFees ? Theme.colors.primary : '#F5F5F5'}
            />
          </View>

          {/* Bento Grid Stats */}
          <View className="relative">
            <View className="flex-row gap-2">
              <StatCard
                title="Team Wellness Index"
                value={`${avgTeamMood} / 10`}
                trend={parseFloat(avgTeamMood) >= 6.0 ? 1 : -1}
                trendLabel={parseFloat(avgTeamMood) >= 6.0 ? 'Optimal Zone' : 'Needs Support'}
                icon={<Activity size={18} color={Theme.colors.primary} />}
                color={Theme.colors.primary}
              />
              <StatCard
                title="Active Members"
                value={activeMembers.toString()}
                trend={engagementRate}
                trendLabel={`${engagementRate}% Monthly Engagement`}
                icon={<Users size={18} color={Theme.colors.secondary} />}
                color={Theme.colors.secondary}
              />
            </View>
            {subData?.config?.enableAnalytics === false && (
              <LockedFeatureOverlay 
                title="Wellness Analytics Locked" 
                description="Your current corporate tier does not include mood analytics or tracking." 
                navigation={navigation}
              />
            )}
          </View>

          {/* Seat Allocation tracker & Invite Form */}
          <View className="relative">
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm">
              <Text className="font-sora text-base text-onSurface">Seat Allocation Tracker</Text>
              <View className="flex-row justify-between items-baseline mt-1 mb-1.5">
                <Text className="font-jakarta text-[13px] text-onSurfaceVariant">
                  <Text className="font-sora text-onSurface">{seatsUsed}</Text> of {seatsTotal} Corporate Seats Filled
                </Text>
                <Text className="font-sora-bold text-sm text-primary">{fillPercent}%</Text>
              </View>
              <View className="h-2 bg-[#F0F2F1] rounded-full overflow-hidden">
                <View className="h-full bg-primary" style={{ width: `${Math.min(fillPercent, 100)}%` }} />
              </View>
            </View>

            {/* Invite Member Form */}
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mt-2">
              <Text className="font-sora text-base text-onSurface">Allocate Seats & Invite Members</Text>
              <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 leading-4 mb-3">Enter an institutional or company email to allocate a subscription seat:</Text>
              
              <View className="flex-row gap-2 mt-1">
                <TextInput
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="e.g. student@bits-pilani.ac.in"
                  placeholderTextColor={Theme.colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  className="flex-1 h-12 border border-[#E0E2E0] rounded-2xl px-3 text-sm font-jakarta text-onSurface bg-[#F0F2F1]"
                />
                <TouchableOpacity 
                  onPress={handleSendInvite} 
                  disabled={loading}
                  className="w-12 h-12 rounded-2xl bg-primary justify-center items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <UserPlus size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {subData?.config?.enableRosterManagement === false && (
              <LockedFeatureOverlay 
                title="Employee Roster Locked" 
                description="Upgrade to allocate institutional seats and invite employees." 
                navigation={navigation}
              />
            )}
          </View>

          {/* Department breakdown Index */}
          <View className="relative">
            <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Building size={18} color={Theme.colors.primary} />
                <Text className="font-sora text-base text-onSurface">Institutional Department Wellness</Text>
              </View>
              <Text className="font-jakarta text-xs text-[#71787D] mt-0.5 leading-4 mb-3">
                Real-time wellness averages aggregated across corporate division registers:
              </Text>

              {departments.length === 0 ? (
                <View className="items-center py-5 gap-1.5">
                  <HelpCircle size={28} color={Theme.colors.outline} />
                  <Text className="font-jakarta text-xs text-[#71787D]">No department logs recorded yet.</Text>
                </View>
              ) : (
                <View className="gap-2.5 mt-1">
                  {departments.map((dept: any) => (
                    <View key={dept.id} className="bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl p-3 gap-1.5">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="font-sora text-sm text-onSurface">{dept.name}</Text>
                          <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">
                            {dept.members} Member(s) · {dept.sessions} Session(s)
                          </Text>
                        </View>
                        <View className="bg-[#E6F4F1] px-2 py-1 rounded-md">
                          <Text className="font-jakarta-bold text-xs text-primary">{dept.avgMood} / 10</Text>
                        </View>
                      </View>

                      {dept.burnoutRisk && (
                        <View className="flex-row items-center bg-[#FFEBEE] border border-[#FFCDD2] px-2 py-1.5 rounded-md gap-1.5 mt-0.5">
                          <ShieldAlert size={12} color="#D32F2F" />
                          <Text className="font-jakarta-bold text-[10px] text-crisis">Warning: Low Mood (Burnout Risk)</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
            {subData?.config?.enableAnalytics === false && (
              <LockedFeatureOverlay 
                title="Department breakdown Locked" 
                description="Your current corporate tier does not include department wellness charts." 
                navigation={navigation}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default OrgDashboardScreen;
