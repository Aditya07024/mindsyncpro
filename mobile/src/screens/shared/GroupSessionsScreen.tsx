import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Plus, Users, Trash2, UserX, ArrowLeft } from 'lucide-react-native';
import API from '../../lib/api';

interface GroupSessionsScreenProps {
  navigation: any;
  route: any;
}

export const GroupSessionsScreen: React.FC<GroupSessionsScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isCounselor = route.params?.isCounselor || false;

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [scheduledWindowMinutes, setScheduledWindowMinutes] = useState('60');

  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => API.auth.me(),
  });

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['group-sessions'],
    queryFn: () => API.groupSessions.list(),
    refetchInterval: 10000,
  });

  const sessions = sessionsData?.sessions || [];

  const createMutation = useMutation({
    mutationFn: () =>
      API.groupSessions.create({
        title: sessionTitle,
        scheduledWindowMinutes: Number(scheduledWindowMinutes) || 60,
        maxCapacity: 11,
      }),
    onSuccess: () => {
      Alert.alert('Session Created ✓', 'Live audio session created successfully.');
      setCreateModalVisible(false);
      setSessionTitle('');
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => Alert.alert('Create Error', err.message || 'Failed to create audio session'),
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => API.groupSessions.claimSlot(id),
    onSuccess: (res: any) => {
      Alert.alert('Slot Claimed ✓', res.message || 'You are assigned as host for this session.');
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => Alert.alert('Claim Error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.groupSessions.delete(id),
    onSuccess: () => {
      Alert.alert('Session Deleted', 'Audio session removed.');
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => Alert.alert('Delete Error', err.message),
  });

  const handleJoinOrEnter = (s: any) => {
    const isAdmitted = (s.admittedUsers || []).some((u: any) => u.userId === meData?._id);
    if (isAdmitted || s.counselorId === meData?._id) {
      navigation.navigate('GroupAudioRoom', { sessionId: s._id || s.id });
    } else {
      joinMutation.mutate(s._id || s.id);
    }
  };

  const joinMutation = useMutation({
    mutationFn: (id: string) => API.groupSessions.joinRequest(id),
    onSuccess: (res: any, variables: string) => {
      if (res.status === 'admitted') {
        Alert.alert('Admitted ✓', 'Navigating to live audio room...');
        navigation.navigate('GroupAudioRoom', { sessionId: variables });
      } else {
        Alert.alert('Request Sent', 'You are in the waiting queue. The host will admit you shortly.');
      }
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => Alert.alert('Join Error', err.message || 'Cannot join audio session.'),
  });

  const approveUserMutation = useMutation({
    mutationFn: ({ sessionId, targetUserId, action }: { sessionId: string; targetUserId: string; action: string }) =>
      API.groupSessions.approveUser(sessionId, { targetUserId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-sessions'] }),
    onError: (err: any) => Alert.alert('Approval Error', err.message),
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ sessionId, targetUserId }: { sessionId: string; targetUserId: string }) =>
      API.groupSessions.blockUser(sessionId, targetUserId),
    onSuccess: () => {
      Alert.alert('User Blocked', 'Participant kicked and blocked from session.');
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => Alert.alert('Block Error', err.message),
  });

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: Math.max(insets.top, 16) }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-3.5 border-b border-stone-200 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1.5 mr-2">
          <ArrowLeft size={20} color="#1A1C1C" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-sora-bold text-lg text-stone-900">🎙️ Group Audio Sessions</Text>
          <Text className="font-jakarta-medium text-[11px] text-stone-500">Live Group Therapy (Max 11 Participants)</Text>
        </View>
        {isCounselor ? (
          <TouchableOpacity onPress={() => setCreateModalVisible(true)} className="w-9 h-9 rounded-full bg-primary justify-center items-center">
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerClassName="p-5 gap-4">
        {isLoading ? (
          <ActivityIndicator color="#0D564D" className="my-7" />
        ) : sessions.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center border border-stone-200 mt-5">
            <Mic size={36} color="#94A3B8" />
            <Text className="font-sora-bold text-base text-stone-900 mt-3">No Live Audio Sessions</Text>
            <Text className="font-jakarta text-xs text-stone-500 text-center mt-1.5 leading-[18px]">
              {isCounselor
                ? 'Tap the + button to host a new group audio session.'
                : 'There are no active group audio sessions available right now. Check back soon!'}
            </Text>
          </View>
        ) : (
          sessions.map((s: any) => {
            const isAssigned = !!s.counselorId;
            const isMySession = s.counselorId === meData?._id;
            const isAdmitted = (s.admittedUsers || []).some((u: any) => u.userId === meData?._id);
            const price = s.price || 0;
            const admittedCount = s.admittedUsers?.length || 0;

            return (
              <View key={s._id || s.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-sora-bold text-base text-stone-900 mb-1.5">{s.title}</Text>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-2 py-0.5 rounded-md ${isAssigned ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <Text className={`font-sora-bold text-[10px] ${isAssigned ? 'text-red-800' : 'text-emerald-800'}`}>
                          {isAssigned ? '🔴 Host Occupied' : '🟢 Open for Counselor'}
                        </Text>
                      </View>
                      <View className="flex-row items-center bg-slate-100 px-2 py-0.5 rounded-md">
                        <Users size={12} color="#6F7977" className="mr-1" />
                        <Text className="font-jakarta-bold text-[10px] text-slate-600">{admittedCount} / 11 Max</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between my-3 pt-2.5 border-t border-slate-100">
                  <Text className="font-jakarta text-xs text-slate-500">
                    Host: <Text className="font-sora-bold text-slate-800">{s.counselorName || 'Unassigned'}</Text>
                  </Text>
                  <Text className="font-jakarta text-xs text-slate-500">
                    Fee: <Text className="font-sora-bold text-primary">{price > 0 ? `₹${price}` : 'FREE'}</Text>
                  </Text>
                </View>

                {/* Counselor Controls */}
                {isCounselor ? (
                  <View className="mt-1.5">
                    {!isAssigned ? (
                      <TouchableOpacity
                        onPress={() => claimMutation.mutate(s._id || s.id)}
                        disabled={claimMutation.isPending}
                        className="bg-primary rounded-xl py-2.5 items-center"
                      >
                        <Text className="font-sora-bold text-[13px] text-white">Claim as Host</Text>
                      </TouchableOpacity>
                    ) : isMySession ? (
                      <View className="gap-2">
                        <View className="flex-row justify-between items-center bg-primary/10 p-2.5 rounded-xl">
                          <Text className="font-sora-bold text-xs text-primary">You are hosting this session ✓</Text>
                          <TouchableOpacity
                            onPress={() => deleteMutation.mutate(s._id || s.id)}
                            className="p-1.5"
                          >
                            <Trash2 size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('GroupAudioRoom', { sessionId: s._id || s.id })}
                          className="bg-primary rounded-xl py-3 items-center"
                        >
                          <Text className="font-sora-bold text-sm text-white">Enter Audio Room 🎙️</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {/* Waiting Room Queue for Host */}
                    {isMySession && s.waitingQueue?.length > 0 ? (
                      <View className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                        <Text className="font-sora-bold text-[11px] text-slate-600 mb-1.5">Waiting Queue ({s.waitingQueue.length})</Text>
                        {s.waitingQueue.map((item: any, i: number) => (
                          <View key={item.userId || i} className="flex-row justify-between items-center py-1.5 border-b border-slate-200">
                            <Text className="font-jakarta-bold text-xs text-slate-900">{item.anonymousName || `User ${i + 1}`}</Text>
                            <View className="flex-row gap-1.5">
                              <TouchableOpacity
                                onPress={() => approveUserMutation.mutate({ sessionId: s._id || s.id, targetUserId: item.userId, action: 'approve' })}
                                className="bg-emerald-600 px-2.5 py-1 rounded-lg"
                              >
                                <Text className="font-sora-bold text-[11px] text-white">Admit ✓</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => blockUserMutation.mutate({ sessionId: s._id || s.id, targetUserId: item.userId })}
                                className="bg-red-100 px-2 py-1 rounded-lg"
                              >
                                <UserX size={14} color="#DC2626" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : (
                  /* Seeker Actions */
                  <TouchableOpacity
                    onPress={() => handleJoinOrEnter(s)}
                    disabled={joinMutation.isPending}
                    className="bg-primary rounded-xl py-3 items-center"
                  >
                    <Text className="font-sora-bold text-sm text-white">
                      {isAdmitted
                        ? 'Enter Audio Room 🎙️'
                        : price > 0
                        ? `Pay ₹${price} & Join`
                        : 'Register & Join'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Session Modal for Counselors */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-6">
            <Text className="font-sora-bold text-lg text-stone-900">Create Audio Session</Text>
            <Text className="font-jakarta text-xs text-stone-500 mt-1 mb-4">Host a live group audio therapy session (Max capacity fixed at 11 users).</Text>

            <Text className="font-sora-bold text-[11px] text-stone-500 uppercase mb-1.5 mt-2.5">Session Title *</Text>
            <TextInput
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder="e.g. Evening Stress & Anxiety Group Support"
              className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-jakarta text-[13px] text-stone-900"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-bold text-[11px] text-stone-500 uppercase mb-1.5 mt-2.5">Scheduled Window (Minutes)</Text>
            <TextInput
              value={scheduledWindowMinutes}
              onChangeText={setScheduledWindowMinutes}
              placeholder="60"
              keyboardType="number-pad"
              className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-jakarta text-[13px] text-stone-900"
              placeholderTextColor="#A1A1AA"
            />

            <View className="flex-row gap-2.5 mt-5">
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} className="flex-1 bg-stone-50 rounded-xl py-3 items-center border border-stone-200">
                <Text className="font-sora-bold text-[13px] text-stone-900">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!sessionTitle.trim() || createMutation.isPending}
                onPress={() => createMutation.mutate()}
                className={`flex-1 bg-primary rounded-xl py-3 items-center ${!sessionTitle.trim() ? 'opacity-50' : ''}`}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="font-sora-bold text-[13px] text-white">Create Session</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GroupSessionsScreen;
