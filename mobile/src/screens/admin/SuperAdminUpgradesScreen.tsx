import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building, Search, Zap } from 'lucide-react-native';
import API from '../../lib/api';
import { AppHeader } from '../../components/AppHeader';

export const SuperAdminUpgradesScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [targetType, setTargetType] = useState<'user' | 'organization'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [planId, setPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [duration, setDuration] = useState<'1m' | '6m' | '1y' | 'lifetime'>('1m');

  // Custom configuration toggles
  const [customConfig, setCustomConfig] = useState({
    dailyChatLimit: 300 as number | null,
    hasPriorityBooking: false,
    therapistDiscount: 0,
    hasUnlimitedJournal: false,
    enableChat: true,
    enableTherapistAccess: true,
    enableJournaling: true,
    enableMoodCheck: true,
    enableBreathe: true,
    enableScheduling: false,
    enableBookings: false,
    enableEarnings: false,
    enableProfileControl: false,
    enableRosterManagement: false,
    enableTherapistAffiliation: false,
    enableAnalytics: false
  });

  // Fetch upgrade targets
  const { data: targets, isLoading: targetsLoading } = useQuery({
    queryKey: ['upgradeTargets'],
    queryFn: () => API.admin.listUsersAndOrgs(),
    retry: false,
  });

  // Fetch plans list
  const { data: plansRes } = useQuery({
    queryKey: ['plansList'],
    queryFn: () => API.plan.getAll(),
    retry: false,
  });

  const plans = Array.isArray(plansRes)
    ? plansRes
    : (plansRes?.plans && Array.isArray(plansRes.plans) ? plansRes.plans : []);

  // Filter list of users / orgs based on query
  const filteredUsers = (targets?.users || []).filter((u: any) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  const filteredOrgs = (targets?.organizations || []).filter((o: any) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.email && o.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: (payload: any) => API.admin.manualUpgrade(payload),
    onSuccess: () => {
      Alert.alert('Upgrade Applied', 'The user/organization has been upgraded successfully.');
      setSelectedTargetId('');
      setPlanId('');
      setPlanName('');
      queryClient.invalidateQueries({ queryKey: ['upgradeTargets'] });
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to apply manual upgrade.');
    }
  });

  const handleApplyUpgrade = () => {
    if (!selectedTargetId) {
      Alert.alert('Selection Required', 'Please select a user or organization to upgrade.');
      return;
    }
    if (!planId) {
      Alert.alert('Plan Required', 'Please select a standard plan or customize configuration.');
      return;
    }

    let computedEndDate = new Date();
    if (duration === '1m') computedEndDate.setMonth(computedEndDate.getMonth() + 1);
    else if (duration === '6m') computedEndDate.setMonth(computedEndDate.getMonth() + 6);
    else if (duration === '1y') computedEndDate.setFullYear(computedEndDate.getFullYear() + 1);
    else if (duration === 'lifetime') computedEndDate.setFullYear(computedEndDate.getFullYear() + 10);

    const payload = {
      targetType,
      targetId: selectedTargetId,
      planId,
      customConfig: planId === 'custom' ? customConfig : undefined,
      customPlanName: planId === 'custom' ? planName : undefined,
      endDate: computedEndDate.toISOString(),
    };

    Alert.alert(
      'Confirm Plan Upgrade',
      `Upgrade ${
        targetType === 'user'
          ? (targets?.users?.find((u: any) => u.id === selectedTargetId)?.name || 'Selected User')
          : (targets?.organizations?.find((o: any) => o.id === selectedTargetId)?.name || 'Selected Organization')
      } to ${planId === 'custom' ? planName || 'Custom config' : plans.find((p: any) => p._id === planId)?.name || planId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', style: 'default', onPress: () => upgradeMutation.mutate(payload) }
      ]
    );
  };

  const getSelectedTargetName = () => {
    if (!selectedTargetId) return 'None';
    if (targetType === 'user') {
      return targets?.users?.find((u: any) => u.id === selectedTargetId)?.name || 'Selected User';
    }
    return targets?.organizations?.find((o: any) => o.id === selectedTargetId)?.name || 'Selected Org';
  };

  const selectPlanPreset = (val: string) => {
    setPlanId(val);
    if (val === 'custom') {
      setPlanName('Custom Admin Plan');
    } else {
      const matchedPlan = plans.find((p: any) => p._id === val);
      if (matchedPlan) {
        setPlanName(matchedPlan.name);
        setCustomConfig(matchedPlan.config || customConfig);
      } else if (val === 'mann_shanti') {
        setPlanName('Mann Shanti');
        setCustomConfig({
          dailyChatLimit: 100,
          hasPriorityBooking: false,
          therapistDiscount: 0,
          hasUnlimitedJournal: false,
          enableChat: true,
          enableTherapistAccess: true,
          enableJournaling: true,
          enableMoodCheck: true,
          enableBreathe: true,
          enableScheduling: false,
          enableBookings: false,
          enableEarnings: false,
          enableProfileControl: false,
          enableRosterManagement: false,
          enableTherapistAffiliation: false,
          enableAnalytics: false
        });
      } else if (val === 'apna_therapist') {
        setPlanName('Apna Therapist');
        setCustomConfig({
          dailyChatLimit: null,
          hasPriorityBooking: true,
          therapistDiscount: 15,
          hasUnlimitedJournal: true,
          enableChat: true,
          enableTherapistAccess: true,
          enableJournaling: true,
          enableMoodCheck: true,
          enableBreathe: true,
          enableScheduling: false,
          enableBookings: false,
          enableEarnings: false,
          enableProfileControl: false,
          enableRosterManagement: false,
          enableTherapistAffiliation: false,
          enableAnalytics: false
        });
      }
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="Super Admin"
        role="super_admin"
        navigation={navigation}
      />

      <ScrollView contentContainerClassName="p-4 pb-20 gap-4" keyboardShouldPersistTaps="handled">
        {/* Header section */}
        <View className="gap-1">
          <Text className="font-sora-bold text-base text-stone-900">Manual Subscription Upgrades</Text>
          <Text className="font-jakarta text-xs text-stone-500 leading-4">Directly override platform tiers or customize precise parameters for any user or organization.</Text>
        </View>

        {/* 1. Target Type Toggle */}
        <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
          <Text className="font-sora-bold text-[13px] text-stone-900 mb-1">Select Recipient Category</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => { setTargetType('user'); setSelectedTargetId(''); }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 border rounded-xl py-2.5 ${
                targetType === 'user' ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <User size={16} color={targetType === 'user' ? '#FFF' : '#0D564D'} />
              <Text className={`font-jakarta-bold text-[11px] ${
                targetType === 'user' ? 'text-white' : 'text-primary'
              }`}>Seeker / Therapist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setTargetType('organization'); setSelectedTargetId(''); }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 border rounded-xl py-2.5 ${
                targetType === 'organization' ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Building size={16} color={targetType === 'organization' ? '#FFF' : '#0D564D'} />
              <Text className={`font-jakarta-bold text-[11px] ${
                targetType === 'organization' ? 'text-white' : 'text-primary'
              }`}>Organization</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Choose Target List */}
        <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
          <Text className="font-sora-bold text-[13px] text-stone-900 mb-1">Find Target Account</Text>
          <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-xl px-3 h-11 gap-2">
            <Search size={16} color="#78716C" />
            <TextInput
              placeholder={`Search by name, email or mobile...`}
              placeholderTextColor="#78716C"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-[13px] text-stone-900 font-jakarta"
            />
          </View>

          {targetsLoading ? (
            <ActivityIndicator size="small" color="#0D564D" className="my-3" />
          ) : (
            <View className="gap-2 mt-1">
              {targetType === 'user' ? (
                filteredUsers.slice(0, 10).map((u: any) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setSelectedTargetId(u.id)}
                    className={`flex-row items-center border rounded-xl p-2.5 ${
                      selectedTargetId === u.id ? 'bg-primary/10 border-primary' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <View className="flex-1">
                      <Text className={`font-sora-bold text-[13px] ${
                        selectedTargetId === u.id ? 'text-primary' : 'text-stone-900'
                      }`}>{u.name}</Text>
                      <Text className="font-jakarta text-[10.5px] text-stone-500 mt-0.5">{u.phone || 'No phone'} · Role: {u.role}</Text>
                    </View>
                    <Text className="font-jakarta-bold text-[9px] px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-500 overflow-hidden">
                      {(u.tier || 'free').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                filteredOrgs.slice(0, 10).map((o: any) => (
                  <TouchableOpacity
                    key={o.id}
                    onPress={() => setSelectedTargetId(o.id)}
                    className={`flex-row items-center border rounded-xl p-2.5 ${
                      selectedTargetId === o.id ? 'bg-primary/10 border-primary' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <View className="flex-1">
                      <Text className={`font-sora-bold text-[13px] ${
                        selectedTargetId === o.id ? 'text-primary' : 'text-stone-900'
                      }`}>{o.name}</Text>
                      <Text className="font-jakarta text-[10.5px] text-stone-500 mt-0.5">{o.email || 'No email'}</Text>
                    </View>
                    <Text className="font-jakarta-bold text-[9px] px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-500 overflow-hidden">
                      {(o.status || 'pending').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              {((targetType === 'user' ? filteredUsers : filteredOrgs).length === 0) && (
                <Text className="font-jakarta text-xs text-stone-500 text-center py-3">No matching accounts found.</Text>
              )}
            </View>
          )}
        </View>

        {/* 3. Choose Plan */}
        <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
          <Text className="font-sora-bold text-[13px] text-stone-900 mb-1">Select Subscription Plan Preset</Text>
          <View className="flex-row flex-wrap gap-1.5">
            <TouchableOpacity
              onPress={() => selectPlanPreset('mann_shanti')}
              className={`border rounded-full px-3 py-1.5 ${
                planId === 'mann_shanti' ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Text className={`font-jakarta-bold text-[10.5px] ${
                planId === 'mann_shanti' ? 'text-white' : 'text-primary'
              }`}>Mann Shanti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => selectPlanPreset('apna_therapist')}
              className={`border rounded-full px-3 py-1.5 ${
                planId === 'apna_therapist' ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Text className={`font-jakarta-bold text-[10.5px] ${
                planId === 'apna_therapist' ? 'text-white' : 'text-primary'
              }`}>Apna Therapist</Text>
            </TouchableOpacity>

            {plans.map((p: any) => (
              <TouchableOpacity
                key={p._id}
                onPress={() => selectPlanPreset(p._id)}
                className={`border rounded-full px-3 py-1.5 ${
                  planId === p._id ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <Text className={`font-jakarta-bold text-[10.5px] ${
                  planId === p._id ? 'text-white' : 'text-primary'
                }`}>{p.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => selectPlanPreset('custom')}
              className={`border rounded-full px-3 py-1.5 ${
                planId === 'custom' ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Text className={`font-jakarta-bold text-[10.5px] ${
                planId === 'custom' ? 'text-white' : 'text-primary'
              }`}>🛠 Custom Config</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Custom Configuration Feature Gates */}
        {planId === 'custom' && (
          <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
            <Text className="font-sora-bold text-[13px] text-stone-900 mb-1">Customize Config Parameters</Text>
            <View className="gap-2">
              <View className="gap-1 mb-1">
                <Text className="font-jakarta-bold text-[11.5px] text-stone-900">Custom Plan Title</Text>
                <TextInput
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="e.g. Special VIP Plan"
                  className="h-10 border border-stone-200 rounded-xl px-2.5 text-[13px] text-stone-900 bg-stone-50 font-jakarta"
                />
              </View>

              <View className="flex-row justify-between items-center bg-stone-50 p-2 rounded-xl">
                <Text className="font-jakarta text-xs text-stone-700 flex-1 mr-2">Unlimited daily message limit (Manas AI)</Text>
                <Switch
                  value={customConfig.dailyChatLimit === null}
                  onValueChange={(val) => setCustomConfig(prev => ({ ...prev, dailyChatLimit: val ? null : 300 }))}
                  trackColor={{ true: '#0D564D' }}
                />
              </View>

              <View className="flex-row justify-between items-center bg-stone-50 p-2 rounded-xl">
                <Text className="font-jakarta text-xs text-stone-700 flex-1 mr-2">Priority therapist booking access</Text>
                <Switch
                  value={customConfig.hasPriorityBooking}
                  onValueChange={(val) => setCustomConfig(prev => ({ ...prev, hasPriorityBooking: val }))}
                  trackColor={{ true: '#0D564D' }}
                />
              </View>

              <View className="flex-row justify-between items-center bg-stone-50 p-2 rounded-xl">
                <Text className="font-jakarta text-xs text-stone-700 flex-1 mr-2">Unlimited CBT journaling logs</Text>
                <Switch
                  value={customConfig.hasUnlimitedJournal}
                  onValueChange={(val) => setCustomConfig(prev => ({ ...prev, hasUnlimitedJournal: val }))}
                  trackColor={{ true: '#0D564D' }}
                />
              </View>

              <View className="flex-row justify-between items-center bg-stone-50 p-2 rounded-xl">
                <Text className="font-jakarta text-xs text-stone-700 flex-1 mr-2">Enable Corporate Analytics module</Text>
                <Switch
                  value={customConfig.enableAnalytics}
                  onValueChange={(val) => setCustomConfig(prev => ({ ...prev, enableAnalytics: val }))}
                  trackColor={{ true: '#0D564D' }}
                />
              </View>

              <View className="flex-row justify-between items-center bg-stone-50 p-2 rounded-xl">
                <Text className="font-jakarta text-xs text-stone-700 flex-1 mr-2">Enable Organization Roster controls</Text>
                <Switch
                  value={customConfig.enableRosterManagement}
                  onValueChange={(val) => setCustomConfig(prev => ({ ...prev, enableRosterManagement: val }))}
                  trackColor={{ true: '#0D564D' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* 5. Upgrade Duration */}
        <View className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-2">
          <Text className="font-sora-bold text-[13px] text-stone-900 mb-1">Set Duration Period</Text>
          <View className="flex-row gap-1.5">
            {(['1m', '6m', '1y', 'lifetime'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                className={`flex-1 border rounded-xl py-2 items-center ${
                  duration === d ? 'bg-primary border-primary' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <Text className={`font-jakarta-bold text-[11px] ${
                  duration === d ? 'text-white' : 'text-primary'
                }`}>
                  {d === '1m' ? '1 Month' : d === '6m' ? '6 Mon' : d === '1y' ? '1 Year' : 'Lifetime'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 6. Preview & Save */}
        <View className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 gap-3 mt-1.5">
          <Text className="font-sora-bold text-[13px] text-primary uppercase tracking-wide">Upgrade Summary</Text>
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="font-jakarta-bold text-[9.5px] text-stone-500">RECIPIENT</Text>
              <Text className="font-jakarta-bold text-xs text-stone-900">{getSelectedTargetName()}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="font-jakarta-bold text-[9.5px] text-stone-500">ASSIGNED PLAN</Text>
              <Text className="font-jakarta-bold text-xs text-stone-900">{planId ? (planId === 'custom' ? planName : planId.toUpperCase()) : 'Not Selected'}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="font-jakarta-bold text-[9.5px] text-stone-500">DURATION</Text>
              <Text className="font-jakarta-bold text-xs text-stone-900">
                {duration === '1m' && '30 Days'}
                {duration === '6m' && '180 Days'}
                {duration === '1y' && '365 Days'}
                {duration === 'lifetime' && 'Lifetime Access (10 Yrs)'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleApplyUpgrade}
            disabled={upgradeMutation.isPending}
            className="bg-primary rounded-xl py-3 items-center justify-center shadow-md mt-1"
          >
            {upgradeMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View className="flex-row items-center justify-center gap-1.5">
                <Zap size={16} color="#FFF" />
                <Text className="font-jakarta-bold text-xs text-white tracking-wide">APPLY MANUAL OVERRIDE</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SuperAdminUpgradesScreen;
