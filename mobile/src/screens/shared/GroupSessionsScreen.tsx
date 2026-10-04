import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../theme';
import { Mic, Plus, Users, ShieldAlert, CheckCircle, Trash2, UserX, ArrowLeft } from 'lucide-react-native';
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

  const { data: sessionsData, isLoading, refetch } = useQuery({
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1A1C1C" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>🎙️ Group Audio Sessions</Text>
          <Text style={styles.headerSubtitle}>Live Group Therapy (Max 11 Participants)</Text>
        </View>
        {isCounselor ? (
          <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.addBtn}>
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator color="#0D564D" style={{ marginVertical: 30 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Mic size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Live Audio Sessions</Text>
            <Text style={styles.emptyDesc}>
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
              <View key={s._id || s.id} style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <Text style={styles.cardTitle}>{s.title}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.statusBadge, isAssigned ? styles.badgeRed : styles.badgeGreen]}>
                        <Text style={[styles.badgeText, isAssigned ? styles.textRed : styles.textGreen]}>
                          {isAssigned ? '🔴 Host Occupied' : '🟢 Open for Counselor'}
                        </Text>
                      </View>
                      <View style={styles.capacityBadge}>
                        <Users size={12} color="#6F7977" style={{ marginRight: 4 }} />
                        <Text style={styles.capacityText}>{admittedCount} / 11 Max</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.hostRow}>
                  <Text style={styles.hostLabel}>
                    Host: <Text style={styles.hostValue}>{s.counselorName || 'Unassigned'}</Text>
                  </Text>
                  <Text style={styles.feeLabel}>
                    Fee: <Text style={styles.feeValue}>{price > 0 ? `₹${price}` : 'FREE'}</Text>
                  </Text>
                </View>

                {/* Counselor Controls */}
                {isCounselor ? (
                  <View style={styles.counselorControls}>
                    {!isAssigned ? (
                      <TouchableOpacity
                        onPress={() => claimMutation.mutate(s._id || s.id)}
                        disabled={claimMutation.isPending}
                        style={styles.claimBtn}
                      >
                        <Text style={styles.claimBtnText}>Claim as Host</Text>
                      </TouchableOpacity>
                    ) : isMySession ? (
                      <View style={{ gap: 8 }}>
                        <View style={styles.mySessionBox}>
                          <Text style={styles.myHostText}>You are hosting this session ✓</Text>
                          <TouchableOpacity
                            onPress={() => deleteMutation.mutate(s._id || s.id)}
                            style={styles.deleteBtn}
                          >
                            <Trash2 size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('GroupAudioRoom', { sessionId: s._id || s.id })}
                          style={styles.joinBtn}
                        >
                          <Text style={styles.joinBtnText}>Enter Audio Room 🎙️</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {/* Waiting Room Queue for Host */}
                    {isMySession && s.waitingQueue?.length > 0 ? (
                      <View style={styles.queueBox}>
                        <Text style={styles.queueTitle}>Waiting Queue ({s.waitingQueue.length})</Text>
                        {s.waitingQueue.map((item: any, i: number) => (
                          <View key={item.userId || i} style={styles.queueRow}>
                            <Text style={styles.anonName}>{item.anonymousName || `User ${i + 1}`}</Text>
                            <View style={styles.queueActionRow}>
                              <TouchableOpacity
                                onPress={() => approveUserMutation.mutate({ sessionId: s._id || s.id, targetUserId: item.userId, action: 'approve' })}
                                style={styles.approveBtn}
                              >
                                <Text style={styles.approveBtnText}>Admit ✓</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => blockUserMutation.mutate({ sessionId: s._id || s.id, targetUserId: item.userId })}
                                style={styles.blockBtn}
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
                    style={styles.joinBtn}
                  >
                    <Text style={styles.joinBtnText}>
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Audio Session</Text>
            <Text style={styles.modalSub}>Host a live group audio therapy session (Max capacity fixed at 11 users).</Text>

            <Text style={styles.label}>Session Title *</Text>
            <TextInput
              value={sessionTitle}
              onChangeText={setSessionTitle}
              placeholder="e.g. Evening Stress & Anxiety Group Support"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Scheduled Window (Minutes)</Text>
            <TextInput
              value={scheduledWindowMinutes}
              onChangeText={setScheduledWindowMinutes}
              placeholder="60"
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!sessionTitle.trim() || createMutation.isPending}
                onPress={() => createMutation.mutate()}
                style={[styles.modalSubmitBtn, !sessionTitle.trim() && styles.btnDisabled]}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Create Session</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E7',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: '#1A1C1C',
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: '#6F7977',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D564D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#1A1C1C',
    marginTop: 12,
  },
  emptyDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#6F7977',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#1A1C1C',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
  },
  textGreen: {
    color: '#065F46',
  },
  textRed: {
    color: '#991B1B',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capacityText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: '#475569',
  },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  hostLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  hostValue: {
    fontFamily: 'Sora_600SemiBold',
    color: '#1E293B',
  },
  feeLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#64748B',
  },
  feeValue: {
    fontFamily: 'Sora_700Bold',
    color: '#0D564D',
  },
  counselorControls: {
    marginTop: 6,
  },
  claimBtn: {
    backgroundColor: '#0D564D',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  mySessionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    padding: 10,
    borderRadius: 12,
  },
  myHostText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#0D564D',
  },
  deleteBtn: {
    padding: 6,
  },
  queueBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#475569',
    marginBottom: 6,
  },
  queueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  anonName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#0F172A',
  },
  queueActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  approveBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  blockBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinBtn: {
    backgroundColor: '#0D564D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: '#1A1C1C',
  },
  modalSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#6F7977',
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#6F7977',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#1A1C1C',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F9F9F8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E7',
  },
  modalCancelText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#1A1C1C',
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: '#0D564D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});

export default GroupSessionsScreen;
