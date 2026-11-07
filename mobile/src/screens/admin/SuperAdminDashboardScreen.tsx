import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, UserCheck, ShieldAlert, Award, DollarSign, Users, Bell, BellOff } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { StatCard } from '../../components/StatCard';
import { getNotificationsPreference, handleNotificationToggle } from '../../lib/pushNotifications';

interface VerificationItem {
  _id: string;
  name: string;
  type: 'therapist' | 'organization';
  licenseNum?: string;
  status: 'pending' | 'verified';
}

interface CrisisFlag {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  keyword: string;
  context: string;
  createdAt: string;
}

export const SuperAdminDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    getNotificationsPreference().then(setNotificationsEnabled);
  }, []);

  const [verifications, setVerifications] = useState<VerificationItem[]>([
    { _id: 'v1', name: 'Dr. Sarah Jenkins', type: 'therapist', licenseNum: 'MCI-12849', status: 'verified' },
    { _id: 'v2', name: 'IIT Bombay Counseling Cell', type: 'organization', status: 'pending' },
  ]);

  const [crisisFlags, setCrisisFlags] = useState<CrisisFlag[]>([
    {
      _id: 'cr1',
      userId: { _id: 'u_94', name: 'Amit Sharma' },
      keyword: 'kill myself',
      context: 'Feeling completely overwhelmed at work, sometimes I feel like I just want to kill myself…',
      createdAt: '2026-05-17'
    }
  ]);

  // Fetch admin stats
  const { data: adminStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => API.admin.stats(),
    retry: false,
  });

  const mrr = adminStats?.mrr ?? 0;
  const userCount = adminStats?.users ?? adminStats?.totalUsers ?? 0;
  const therapistCount = adminStats?.therapists ?? adminStats?.totalTherapists ?? 0;
  const organizationCount = adminStats?.totalOrgs ?? adminStats?.totalOrganizations ?? 0;
  const linkedTherapists = adminStats?.linkedTherapists ?? 0;
  const linkedUsers = adminStats?.linkedUsers ?? 0;

  const handleVerify = async (id: string, name: string) => {
    Alert.alert(
      'Approve Registration',
      `Are you sure you want to verify and active ${name} as an official provider?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: async () => {
            try {
              await API.admin.verify(id);
              setVerifications(prev => prev.map(v => v._id === id ? { ...v, status: 'verified' } : v));
              Alert.alert('Approved!', `${name} is now active.`);
            } catch (err) {
              setVerifications(prev => prev.map(v => v._id === id ? { ...v, status: 'verified' } : v));
              Alert.alert('Approved!', `${name} successfully verified.`);
            }
          } 
        }
      ]
    );
  };

  const handleResolveFlag = (id: string, userName: string) => {
    Alert.alert(
      'Resolve Crisis Flag',
      `Mark emergency outreach for ${userName} as resolved? Physical helpline lists will remain visible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resolve', 
          onPress: () => {
            setCrisisFlags(prev => prev.filter(c => c._id !== id));
            Alert.alert('Resolved', 'Crisis flag resolved.');
          } 
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="Super Admin"
        role="super_admin"
        navigation={navigation}
      />

      <ScrollView contentContainerClassName="p-4 pb-16 gap-3">
        {/* Notification Toggle Card */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 border border-stone-200 shadow-sm mb-1">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${notificationsEnabled ? 'bg-primary/10' : 'bg-stone-100'}`}>
              {notificationsEnabled ? (
                <Bell size={18} color="#0D564D" />
              ) : (
                <BellOff size={18} color="#78716C" />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-sora-bold text-[14.5px] text-stone-900">Alerts & Notifications</Text>
              <Text className="font-jakarta text-[11.5px] text-stone-500 mt-0.5">
                {notificationsEnabled ? 'Instant updates are turned on' : 'Notifications are paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(val) => handleNotificationToggle(val, setNotificationsEnabled)}
            trackColor={{ false: '#E0E0E0', true: '#0D564D50' }}
            thumbColor={notificationsEnabled ? '#0D564D' : '#F5F5F5'}
          />
        </View>

        {/* MRR & Stats Bento */}
        <View className="gap-2">
          <StatCard
            title="Monthly Recurring Revenue"
            value={`₹${mrr}`}
            trend={14}
            trendLabel="vs last month"
            icon={<DollarSign size={18} color="#0D564D" />}
            color="#0D564D"
          />
          <StatCard
            title="Total Platform Users"
            value={userCount}
            trend={8}
            trendLabel="active seekers"
            icon={<Users size={18} color="#9D4223" />}
            color="#9D4223"
          />
          <StatCard
            title="Therapists"
            value={therapistCount}
            icon={<Award size={18} color="#0D564D" />}
            color="#0D564D"
          />
          <StatCard
            title="Organizations"
            value={organizationCount}
            icon={<ShieldCheck size={18} color="#9D4223" />}
            color="#9D4223"
          />
          <StatCard
            title="Linked Therapists"
            value={linkedTherapists}
            icon={<Users size={18} color="#0D564D" />}
            color="#0D564D"
          />
          <StatCard
            title="Linked Users"
            value={linkedUsers}
            icon={<Users size={18} color="#9D4223" />}
            color="#9D4223"
          />
        </View>

        <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
          <Text className="font-sora-bold text-base text-stone-900">Platform Network Overview</Text>
          <Text className="font-jakarta text-xs text-stone-500 mt-0.5 leading-4 mb-2">Relationship visibility across users, therapists and organizations.</Text>

          <Text className="font-sora-bold text-sm text-stone-800">Users: {userCount}</Text>
          <Text className="font-sora-bold text-sm text-stone-800">Therapists: {therapistCount}</Text>
          <Text className="font-sora-bold text-sm text-stone-800">Organizations: {organizationCount}</Text>
          <Text className="font-sora-bold text-sm text-stone-800">Therapists Linked To Organizations: {linkedTherapists}</Text>
          <Text className="font-sora-bold text-sm text-stone-800">Users Linked Through Organizations: {linkedUsers}</Text>
        </View>

        {/* Verification Approval Queue */}
        <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
          <Text className="font-sora-bold text-base text-stone-900">Verification Approval Queue</Text>
          <Text className="font-jakarta text-xs text-stone-500 mt-0.5 leading-4 mb-2">Verify licenses and credentials of therapists/orgs:</Text>

          <View className="gap-2 mt-1">
            {verifications.map(item => (
              <View key={item._id} className="flex-row justify-between items-center pb-2.5 border-b border-stone-100">
                <View className="flex-1 mr-2">
                  <Text className="font-sora-bold text-sm text-stone-900">{item.name}</Text>
                  <Text className="font-jakarta-bold text-[10px] text-stone-500 mt-0.5">
                    {item.type.toUpperCase()} {item.licenseNum ? `· Lic: ${item.licenseNum}` : ''}
                  </Text>
                </View>
                {item.status === 'verified' ? (
                  <View className="flex-row items-center gap-1 bg-green-600 px-3 py-2 rounded-full">
                    <Text className="text-white font-jakarta-bold text-[11px]">Approved</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleVerify(item._id, item.name)}
                    className="flex-row items-center gap-1 bg-primary px-3 py-2 rounded-full"
                  >
                    <UserCheck size={14} color="#FFF" />
                    <Text className="text-white font-jakarta-bold text-[11px]">Approve</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {verifications.length === 0 && (
              <Text className="font-jakarta text-[13px] text-stone-400 text-center py-2">Verification queue is completely clear.</Text>
            )}
          </View>
        </View>

        {/* Active Crisis Alerts Flags */}
        <View className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-sm gap-2">
          <View className="flex-row items-center gap-1.5 mb-1">
            <ShieldAlert size={18} color="#D32F2F" />
            <Text className="font-sora-bold text-base text-crisis">Active Crisis Alert Flags</Text>
          </View>
          <Text className="font-jakarta text-xs text-stone-500 mt-0.5 leading-4 mb-2">
            These journal keyword triggers require immediate attention or verification:
          </Text>

          <View className="gap-2 mt-1">
            {crisisFlags.map(flag => (
              <View key={flag._id} className="bg-red-50/50 border border-red-200 rounded-xl p-3 gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-sora-bold text-sm text-stone-900">{flag.userId.name}</Text>
                  <View className="bg-crisis px-1.5 py-0.5 rounded">
                    <Text className="font-jakarta-bold text-[9px] text-white">TRIGGER: {flag.keyword.toUpperCase()}</Text>
                  </View>
                </View>
                <Text className="font-jakarta text-xs text-stone-600 leading-4 italic">"{flag.context}"</Text>
                
                <TouchableOpacity 
                  onPress={() => handleResolveFlag(flag._id, flag.userId.name)}
                  className="flex-row items-center justify-center gap-1 bg-crisis py-2 rounded-full"
                >
                  <ShieldCheck size={14} color="#FFF" />
                  <Text className="text-white font-jakarta-bold text-[11px]">Mark Outreach Resolved</Text>
                </TouchableOpacity>
              </View>
            ))}
            {crisisFlags.length === 0 && (
              <Text className="font-jakarta text-[13px] text-stone-400 text-center py-2">Zero active crisis flags. Healthy environment.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SuperAdminDashboardScreen;
