import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, DollarSign, Users, Activity, Heart } from 'lucide-react-native';
import API from '../../lib/api';
import { AppHeader } from '../../components/AppHeader';
import { StatCard } from '../../components/StatCard';

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

export const SuperAdminOverviewScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [crisisFlags, setCrisisFlags] = useState<CrisisFlag[]>([]);

  // Fetch admin stats from dynamic database
  const { data: adminStats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => API.admin.stats(),
    retry: false,
  });

  useEffect(() => {
    if (adminStats?.crisisFlags) {
      setCrisisFlags(adminStats.crisisFlags);
    }
  }, [adminStats]);

  const mrr = adminStats?.mrr || 0;
  const userCount = adminStats?.users || adminStats?.totalUsers || 0;
  const activeOrgsCount = adminStats?.totalOrgs || 0;
  const activeTherapistsCount = adminStats?.totalTherapists || 0;

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

      {isLoading ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text className="font-jakarta text-[13px] text-stone-500">Analyzing platform stats...</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-4 pb-20 gap-4">
          {/* Header Description */}
          <View className="gap-1">
            <Text className="font-sora-bold text-base text-stone-900">Supercontrol Overview</Text>
            <Text className="font-jakarta text-xs text-stone-500 leading-4">Real-time system health metrics, MRR statistics, and safety alerts.</Text>
          </View>

          {/* 2x2 Stats Bento Grid */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard
                title="Monthly Recurring Revenue"
                value={`₹${mrr}`}
                trend={14}
                trendLabel="vs last month"
                icon={<DollarSign size={18} color="#0D564D" />}
                color="#0D564D"
              />
              <StatCard
                title="Total Seekers"
                value={userCount.toString()}
                trend={8}
                trendLabel="active accounts"
                icon={<Users size={18} color="#9D4223" />}
                color="#9D4223"
              />
            </View>
            <View className="flex-row gap-3">
              <StatCard
                title="Verified Organizations"
                value={activeOrgsCount.toString()}
                trend={2}
                trendLabel="wellness sponsors"
                icon={<Activity size={18} color="#D32F2F" />}
                color="#D32F2F"
              />
              <StatCard
                title="Clinical Practitioners"
                value={activeTherapistsCount.toString()}
                trend={5}
                trendLabel="linked specialists"
                icon={<Heart size={18} color="#7B1FA2" />}
                color="#7B1FA2"
              />
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
      )}
    </View>
  );
};

export default SuperAdminOverviewScreen;
