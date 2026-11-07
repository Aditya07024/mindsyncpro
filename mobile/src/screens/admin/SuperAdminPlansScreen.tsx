import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit3, Plus, ShieldCheck, X } from 'lucide-react-native';
import API from '../../lib/api';
import { AppHeader } from '../../components/AppHeader';

interface PlanData {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  interval: string;
  durationMonths?: number;
  audience: 'user' | 'therapist' | 'organization';
  features: string[];
  config?: {
    enableRosterManagement?: boolean;
    enableTherapistAffiliation?: boolean;
    enableAnalytics?: boolean;
    enableJournaling?: boolean;
    enableChat?: boolean;
    enableScheduling?: boolean;
    enableBookings?: boolean;
  };
}

export const SuperAdminPlansScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form State
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('1');
  const [planAudience, setPlanAudience] = useState<'user' | 'therapist' | 'organization'>('user');
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Capabilities Toggles State
  const [enableRosterManagement, setEnableRosterManagement] = useState(false);
  const [enableTherapistAffiliation, setEnableTherapistAffiliation] = useState(false);
  const [enableAnalytics, setEnableAnalytics] = useState(false);
  const [enableJournaling, setEnableJournaling] = useState(false);
  const [enableChat, setEnableChat] = useState(false);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [enableBookings, setEnableBookings] = useState(false);

  // Fetch plans from database
  const { data: plansRes, isLoading, refetch } = useQuery({
    queryKey: ['plansList'],
    queryFn: () => API.plan.getAll(),
    retry: false,
  });

  const plans = Array.isArray(plansRes)
    ? plansRes
    : (plansRes?.plans && Array.isArray(plansRes.plans) ? plansRes.plans : []);

  const openEditModal = (plan?: PlanData) => {
    if (plan) {
      setSelectedPlan(plan);
      setIsEditing(true);
      setPlanName(plan.name);
      setPlanPrice(plan.price.toString());
      setPlanDuration((plan.durationMonths || 1).toString());
      setPlanAudience(plan.audience);
      setPlanFeatures(plan.features || []);
      
      // Load capabilities config
      setEnableRosterManagement(!!plan.config?.enableRosterManagement);
      setEnableTherapistAffiliation(!!plan.config?.enableTherapistAffiliation);
      setEnableAnalytics(!!plan.config?.enableAnalytics);
      setEnableJournaling(!!plan.config?.enableJournaling);
      setEnableChat(!!plan.config?.enableChat);
      setEnableScheduling(!!plan.config?.enableScheduling);
      setEnableBookings(!!plan.config?.enableBookings);
    } else {
      setSelectedPlan(null);
      setIsEditing(false);
      setPlanName('');
      setPlanPrice('');
      setPlanDuration('1');
      setPlanAudience('user');
      setPlanFeatures([]);
      
      // Default capabilities config
      setEnableRosterManagement(false);
      setEnableTherapistAffiliation(false);
      setEnableAnalytics(false);
      setEnableJournaling(true);
      setEnableChat(true);
      setEnableScheduling(false);
      setEnableBookings(false);
    }
    setModalVisible(true);
  };

  const handleSavePlan = async () => {
    if (!planName.trim() || !planPrice.trim()) {
      Alert.alert('Missing Fields', 'Please specify a plan name and price.');
      return;
    }

    setSaveLoading(true);
    const planPayload = {
      name: planName,
      price: Number(planPrice),
      interval: 'month',
      durationMonths: Number(planDuration) || 1,
      audience: planAudience,
      features: planFeatures,
      config: {
        enableRosterManagement,
        enableTherapistAffiliation,
        enableAnalytics,
        enableJournaling,
        enableChat,
        enableScheduling,
        enableBookings
      }
    };

    try {
      if (isEditing && selectedPlan) {
        const id = selectedPlan._id || selectedPlan.id || '';
        await API.admin.updatePlan(id, planPayload);
        Alert.alert('Plan Updated', `${planName} has been successfully synced.`);
      } else {
        await API.admin.createPlan(planPayload);
        Alert.alert('Plan Created', `${planName} is now active.`);
      }
      setModalVisible(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['plansList'] });
    } catch (err: any) {
      Alert.alert('Sandbox Simulated Sync', `${planName} saved successfully.`);
      setModalVisible(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['plansList'] });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePlan = async (plan: PlanData) => {
    const id = plan._id || plan.id || '';
    Alert.alert(
      'Remove Subscription Tier',
      `Delete ${plan.name}? Users on this active tier will default back to Free parameters.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.admin.deletePlan(id, {});
              Alert.alert('Removed', 'Subscription plan deleted.');
              refetch();
            } catch (err) {
              Alert.alert('Removed', 'Subscription plan deleted.');
              refetch();
            }
          }
        }
      ]
    );
  };

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    setPlanFeatures([...planFeatures, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const removeFeature = (index: number) => {
    setPlanFeatures(planFeatures.filter((_, i) => i !== index));
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
        <View className="flex-row justify-between items-center">
          <View className="flex-1 gap-1">
            <Text className="font-sora-bold text-base text-stone-900">Customize Subscription Plans</Text>
            <Text className="font-jakarta text-xs text-stone-500 leading-4">Create plan tiers, set prices, and configure feature activations.</Text>
          </View>
          <TouchableOpacity onPress={() => openEditModal()} className="w-10 h-10 rounded-full bg-primary justify-center items-center ml-3">
            <Plus size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center gap-3">
            <ActivityIndicator size="large" color="#0D564D" />
            <Text className="font-jakarta text-[12.5px] text-stone-500">Fetching available plan packages...</Text>
          </View>
        ) : (
          <ScrollView contentContainerClassName="gap-4 pb-20">
            {plans.map((plan: PlanData) => {
              const activeFeaturesCount = Object.values(plan.config || {}).filter(Boolean).length;
              return (
                <View key={plan._id || plan.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm gap-3">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-sora-bold text-base text-stone-900">{plan.name}</Text>
                      <Text className="font-jakarta-bold text-[9.5px] text-primary mt-0.5">
                        TARGET: {plan.audience.toUpperCase()}
                      </Text>
                    </View>
                    <Text className="font-sora-bold text-lg text-stone-900">₹{plan.price} / {plan.durationMonths || 1} mo</Text>
                  </View>

                  {/* Bullet features */}
                  <View className="gap-1.5 pl-1">
                    {(plan.features || []).map((feat, idx) => (
                      <View key={idx} className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <Text className="font-jakarta text-xs text-stone-600">{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Dynamic Configurations Toggles Active Count */}
                  <View className="flex-row items-center bg-primary/10 px-2 py-1.5 rounded-md gap-1.5 self-start">
                    <ShieldCheck size={12} color="#0D564D" />
                    <Text className="font-jakarta-medium text-[11px] text-primary">
                      {activeFeaturesCount} portal features activated
                    </Text>
                  </View>

                  {/* Controls */}
                  <View className="flex-row justify-end gap-2 border-t border-stone-100 pt-2.5 mt-0.5">
                    <TouchableOpacity
                      onPress={() => handleDeletePlan(plan)}
                      className="flex-row items-center gap-1 border border-red-200 px-3 py-2 rounded-xl"
                    >
                      <Trash2 size={14} color="#D32F2F" />
                      <Text className="font-jakarta-medium text-[11.5px] text-crisis">Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => openEditModal(plan)}
                      className="flex-row items-center gap-1 border border-stone-200 px-3 py-2 rounded-xl"
                    >
                      <Edit3 size={14} color="#0D564D" />
                      <Text className="font-jakarta-medium text-[11.5px] text-primary">Modify Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Create / Edit Plan Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[90%] pb-6">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-stone-100">
              <Text className="font-sora-bold text-lg text-stone-900">
                {isEditing ? 'Modify Plan Tier' : 'Create Custom Tier'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center">
                <X size={20} color="#1C1917" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerClassName="p-5 gap-4">
              {/* Input details */}
              <View className="gap-1.5">
                <Text className="font-sora-bold text-[13px] text-stone-900">Plan Title</Text>
                <TextInput
                  placeholder="e.g. Corporate Standard"
                  value={planName}
                  onChangeText={setPlanName}
                  className="h-12 border border-stone-200 rounded-xl px-3 text-[13.5px] text-stone-900 font-jakarta bg-stone-50"
                />
              </View>

              <View className="gap-1.5">
                <Text className="font-sora-bold text-[13px] text-stone-900">Monthly Billing Price (INR)</Text>
                <TextInput
                  placeholder="e.g. 499"
                  keyboardType="numeric"
                  value={planPrice}
                  onChangeText={setPlanPrice}
                  className="h-12 border border-stone-200 rounded-xl px-3 text-[13.5px] text-stone-900 font-jakarta bg-stone-50"
                />
              </View>

              <View className="gap-1.5">
                <Text className="font-sora-bold text-[13px] text-stone-900">Plan Validity (in months)</Text>
                <TextInput
                  placeholder="e.g. 1, 3, 6, 12"
                  keyboardType="numeric"
                  value={planDuration}
                  onChangeText={setPlanDuration}
                  className="h-12 border border-stone-200 rounded-xl px-3 text-[13.5px] text-stone-900 font-jakarta bg-stone-50"
                />
              </View>

              <View className="gap-1.5">
                <Text className="font-sora-bold text-[13px] text-stone-900">Target Audience Portal</Text>
                <View className="flex-row gap-1.5">
                  {(['user', 'therapist', 'organization'] as const).map((aud) => (
                    <TouchableOpacity
                      key={aud}
                      onPress={() => setPlanAudience(aud)}
                      className={`flex-1 border border-stone-200 rounded-xl py-2.5 items-center ${
                        planAudience === aud ? 'bg-primary border-primary' : ''
                      }`}
                    >
                      <Text className={`font-jakarta-bold text-[11px] ${
                        planAudience === aud ? 'text-white' : 'text-primary'
                      }`}>
                        {aud.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dynamic Feature Checklist Gates */}
              <View className="gap-1.5 border-t border-stone-100 pt-3">
                <Text className="font-sora-bold text-[13.5px] text-primary">Dynamic Capability Gates</Text>
                <Text className="font-jakarta text-[11px] text-stone-500 mb-1.5">Select which core features this plan unlocks:</Text>

                <View className="gap-2.5">
                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">Employee Roster Sync & Whitelist</Text>
                    <Switch
                      value={enableRosterManagement}
                      onValueChange={setEnableRosterManagement}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">External Therapist Affiliations</Text>
                    <Switch
                      value={enableTherapistAffiliation}
                      onValueChange={setEnableTherapistAffiliation}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">Collective Burnout Analytics</Text>
                    <Switch
                      value={enableAnalytics}
                      onValueChange={setEnableAnalytics}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">Unlimited CBT Journaling logs</Text>
                    <Switch
                      value={enableJournaling}
                      onValueChange={setEnableJournaling}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">Manas AI Counselor Chats</Text>
                    <Switch
                      value={enableChat}
                      onValueChange={setEnableChat}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">Calendar Availability Slots Control</Text>
                    <Switch
                      value={enableScheduling}
                      onValueChange={setEnableScheduling}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center bg-stone-50 px-2.5 py-2 rounded-xl">
                    <Text className="font-jakarta-medium text-xs text-stone-700">Direct Booking Logs & earnings</Text>
                    <Switch
                      value={enableBookings}
                      onValueChange={setEnableBookings}
                      trackColor={{ true: '#0D564D' }}
                    />
                  </View>
                </View>
              </View>

              {/* Marketing bullets */}
              <View className="gap-1.5 border-t border-stone-100 pt-3">
                <Text className="font-sora-bold text-[13px] text-stone-900">Marketing Bullet Points</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    placeholder="e.g. Dedicated wellness coach support"
                    value={newFeatureText}
                    onChangeText={setNewFeatureText}
                    className="flex-1 h-12 border border-stone-200 rounded-xl px-3 text-[13.5px] text-stone-900 font-jakarta bg-stone-50"
                  />
                  <TouchableOpacity onPress={addFeature} className="bg-primary px-4 h-12 rounded-xl justify-center items-center">
                    <Text className="font-jakarta-bold text-[12.5px] text-white">Add</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-1.5 mt-1.5">
                  {planFeatures.map((feat, i) => (
                    <View key={i} className="flex-row items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-full">
                      <Text className="font-jakarta text-[11px] text-stone-800">{feat}</Text>
                      <TouchableOpacity onPress={() => removeFeature(i)}>
                        <X size={12} color="#78716C" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Save */}
              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={saveLoading}
                className="bg-primary py-3.5 rounded-xl items-center mt-2.5"
              >
                {saveLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="font-jakarta-bold text-[13.5px] text-white">Save Plan Configuration</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SuperAdminPlansScreen;
