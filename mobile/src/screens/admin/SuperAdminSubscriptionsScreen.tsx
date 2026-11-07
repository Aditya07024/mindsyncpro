import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, Building, Award, CheckCircle } from 'lucide-react-native';
import API from '../../lib/api';
import { AppHeader } from '../../components/AppHeader';

export const SuperAdminSubscriptionsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'cancelled'>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'user' | 'therapist' | 'organization'>('all');

  // Fetch all active system-wide subscriptions from database
  const { data: subscriptionRes, isLoading } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: () => API.subscription.admin.all().catch(() => null),
    retry: false
  });

  const subsList = Array.isArray(subscriptionRes)
    ? subscriptionRes
    : (subscriptionRes?.subscriptions && Array.isArray(subscriptionRes.subscriptions) ? subscriptionRes.subscriptions : []);

  // Filter based on search queries and selected pills
  const filteredSubs = subsList.filter((s: any) => {
    const subscriberName = s.userId?.fullName || s.orgId?.name || 'Unnamed Subscriber';
    const email = s.userId?.email || s.orgId?.officialEmail || '';
    const tier = s.planId?.name || s.plan || '';
    const role = s.userId?.role || (s.orgId ? 'org_admin' : 'user');
    const status = s.status || 'active';

    const matchesSearch = subscriberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter;

    let matchesAudience = true;
    if (audienceFilter === 'therapist') {
      matchesAudience = role === 'therapist';
    } else if (audienceFilter === 'organization') {
      matchesAudience = role === 'org_admin' || !!s.orgId;
    } else if (audienceFilter === 'user') {
      matchesAudience = role === 'user';
    }

    return matchesSearch && matchesStatus && matchesAudience;
  });

  // Dynamic billing stats from database
  const activeSubsCount = subsList.filter((s: any) => s.status === 'active').length;
  const pendingSubsCount = subsList.filter((s: any) => s.status === 'pending').length;
  const cancelledSubsCount = subsList.filter((s: any) => s.status === 'cancelled').length;
  const cumulativeMRR = subsList
    .filter((s: any) => s.status === 'active')
    .reduce((sum: number, s: any) => sum + Number(s.planId?.price || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#E8F5E9';
      case 'cancelled':
        return '#FFEBEE';
      default:
        return '#FFF3E0';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#2E7D32';
      case 'cancelled':
        return '#C62828';
      default:
        return '#EF6C00';
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="Super Admin"
        role="super_admin"
        navigation={navigation}
      />

      <View className="flex-1 p-4 gap-4">
        {/* Header Title */}
        <View className="gap-1">
          <Text className="font-sora-bold text-base text-stone-900">Billing & Subscriptions</Text>
          <Text className="font-jakarta text-xs text-stone-500 leading-4">Track subscriber enrollment, recurring revenue, and renew logs.</Text>
        </View>

        {/* Dynamic Billing Overview Cards */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white rounded-xl p-3 border border-stone-200 items-center gap-0.5">
            <Text className="font-sora-bold text-lg text-stone-900">₹{cumulativeMRR}</Text>
            <Text className="font-jakarta text-[10.5px] text-stone-500">Active MRR</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-stone-200 items-center gap-0.5">
            <Text className="font-sora-bold text-lg text-stone-900">{activeSubsCount}</Text>
            <Text className="font-jakarta text-[10.5px] text-stone-500">Active</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-stone-200 items-center gap-0.5">
            <Text className="font-sora-bold text-lg text-stone-900">{pendingSubsCount}</Text>
            <Text className="font-jakarta text-[10.5px] text-stone-500">Pending</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-3 border border-stone-200 items-center gap-0.5">
            <Text className="font-sora-bold text-lg text-stone-900">{cancelledSubsCount}</Text>
            <Text className="font-jakarta text-[10.5px] text-stone-500">Cancelled</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white border border-stone-200 rounded-xl px-3 h-12 gap-2">
          <Search size={16} color="#78716C" />
          <TextInput
            placeholder="Search by subscriber, email, or tier..."
            placeholderTextColor="#78716C"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-[13px] text-stone-900 font-jakarta"
          />
        </View>

        {/* Dynamic Filters Segmented Control */}
        <View className="gap-2 bg-white border border-stone-200 rounded-xl p-2.5">
          <View className="flex-row items-center gap-2">
            <Text className="font-sora-bold text-[11px] text-stone-500 w-12">Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 items-center">
              {(['all', 'active', 'pending', 'cancelled'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  className={`border rounded-full px-3 py-1 ${
                    statusFilter === status ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <Text className={`font-jakarta-bold text-[9.5px] ${
                    statusFilter === status ? 'text-white' : 'text-stone-500'
                  }`}>
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="font-sora-bold text-[11px] text-stone-500 w-12">Role:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 items-center">
              {(['all', 'user', 'therapist', 'organization'] as const).map((aud) => (
                <TouchableOpacity
                  key={aud}
                  onPress={() => setAudienceFilter(aud)}
                  className={`border rounded-full px-3 py-1 ${
                    audienceFilter === aud ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <Text className={`font-jakarta-bold text-[9.5px] ${
                    audienceFilter === aud ? 'text-white' : 'text-stone-500'
                  }`}>
                    {aud === 'user' ? 'SEEKER' : aud.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center gap-3">
            <ActivityIndicator size="large" color="#0D564D" />
            <Text className="font-jakarta text-[12.5px] text-stone-500">Structuring billing registers...</Text>
          </View>
        ) : (
          <ScrollView contentContainerClassName="gap-4 pb-20">
            {filteredSubs.length > 0 ? (
              filteredSubs.map((s: any) => {
                const subName = s.userId?.fullName || s.orgId?.name || 'mymindtherapyfriend User';
                const subEmail = s.userId?.email || s.orgId?.officialEmail || 'Not Provided';
                const price = s.planId?.price || 0;
                const renewDate = s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A';
                const isOrg = s.userId?.role === 'org_admin' || !!s.orgId;
                const isTherapist = s.userId?.role === 'therapist';

                return (
                  <View key={s._id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-3">
                    <View className="flex-row items-center gap-2.5">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        isOrg ? 'bg-primary/10' : isTherapist ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {isOrg ? (
                          <Building size={16} color="#0D564D" />
                        ) : isTherapist ? (
                          <Award size={16} color="#7B1FA2" />
                        ) : (
                          <Sparkles size={16} color="#9D4223" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-sora-bold text-sm text-stone-900">{subName}</Text>
                        <Text className="font-jakarta text-[11.5px] text-stone-500 mt-0.5">{subEmail}</Text>
                      </View>
                      <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(s.status || 'active') }}>
                        <Text className="font-jakarta-bold text-[9px]" style={{ color: getStatusTextColor(s.status || 'active') }}>
                          {(s.status || 'ACTIVE').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Pricing Info Boxes */}
                    <View className="bg-stone-50 rounded-xl p-2.5 gap-1.5">
                      <View className="flex-row justify-between items-center">
                        <Text className="font-jakarta text-[11.5px] text-stone-500">Subscription Tier:</Text>
                        <Text className="font-jakarta-medium text-xs text-stone-900">{(s.planId?.name || s.plan || 'Mann Shanti').toUpperCase()}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="font-jakarta text-[11.5px] text-stone-500">Monthly Price:</Text>
                        <Text className="font-jakarta-medium text-xs text-stone-900">₹{price}</Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="font-jakarta text-[11.5px] text-stone-500">Next Renewal:</Text>
                        <Text className="font-jakarta-medium text-xs text-stone-900">{renewDate}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="items-center justify-center py-10 bg-white rounded-2xl border border-stone-200 gap-2 mt-2">
                <CheckCircle size={36} color="#78716C" />
                <Text className="font-jakarta text-[13px] text-stone-500 text-center px-5">No matching subscription registries found.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default SuperAdminSubscriptionsScreen;
