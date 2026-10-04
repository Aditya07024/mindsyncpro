import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  ShieldAlert,
  Volume2,
  UserX,
  AlertTriangle,
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';

// Safely lazy load Audio from expo-av to prevent ExponentAV crashes in Expo Go 57
let ExpoAudio: any = null;
try {
  ExpoAudio = require('expo-av')?.Audio;
} catch (e) {
  // ExponentAV module not present in Expo Go 57
}

interface GroupAudioRoomScreenProps {
  navigation: any;
  route: any;
}

export const GroupAudioRoomScreen: React.FC<GroupAudioRoomScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const sessionId = route.params?.sessionId;

  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const webStreamRef = useRef<any>(null);

  // Fetch token & room information
  const { data: audioData, isLoading, error } = useQuery({
    queryKey: ['group-audio-token', sessionId],
    queryFn: () => API.groupSessions.getAudioToken(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  // Fetch session details
  const { data: sessionsData } = useQuery({
    queryKey: ['group-sessions'],
    queryFn: () => API.groupSessions.list(),
    refetchInterval: 5000,
  });

  const session = (sessionsData?.sessions || []).find((s: any) => (s._id || s.id) === sessionId);
  const admittedUsers = session?.admittedUsers || [];
  const waitingQueue = session?.waitingQueue || [];

  const isCounselor = audioData?.isCounselor || false;
  const participantName = audioData?.participantName || 'Anonymous Participant';
  const sessionTitle = audioData?.sessionTitle || session?.title || 'Group Audio Session';

  // Microphone permission & Audio Initialization Effect
  useEffect(() => {
    let isMounted = true;

    async function initMicrophone() {
      try {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isMounted) return;
            webStreamRef.current = stream;
            setHasMicPermission(true);
            setPermissionError(null);
          } else {
            setHasMicPermission(true);
          }
        } else if (ExpoAudio) {
          // Request permissions via expo-av
          const { status } = await ExpoAudio.requestPermissionsAsync();
          if (!isMounted) return;

          if (status !== 'granted') {
            setHasMicPermission(false);
            setPermissionError('Microphone permission was denied. Please grant microphone permissions in device settings.');
            Alert.alert(
              'Microphone Permission Required',
              'MyMindTherapyFriend needs access to your microphone so you can participate in live group audio sessions. Please enable microphone permission in system settings.',
              [{ text: 'OK' }]
            );
            return;
          }

          setHasMicPermission(true);
          setPermissionError(null);

          // Configure audio mode for voice call / live communication
          if (ExpoAudio.setAudioModeAsync) {
            await ExpoAudio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });
          }

          // Prepare & start local recording stream for live audio mic feedback
          if (ExpoAudio.Recording?.createAsync) {
            const { recording } = await ExpoAudio.Recording.createAsync(
              ExpoAudio.RecordingOptionsPresets.HIGH_QUALITY
            );
            if (!isMounted) {
              await recording.stopAndUnloadAsync();
              return;
            }
            recordingRef.current = recording;
          }
        } else {
          // Fallback when ExpoAudio native module is not present in runtime (e.g. Expo Go 57)
          setHasMicPermission(true);
          setPermissionError(null);
        }
      } catch (err: any) {
        console.warn('Error setting up microphone:', err);
        if (isMounted) {
          setHasMicPermission(false);
          setPermissionError(err?.message || 'Could not access microphone hardware.');
        }
      }
    }

    initMicrophone();

    return () => {
      isMounted = false;
      // Cleanup audio hardware on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (webStreamRef.current && webStreamRef.current.getTracks) {
        webStreamRef.current.getTracks().forEach((track: any) => track.stop());
        webStreamRef.current = null;
      }
    };
  }, []);

  const approveUserMutation = useMutation({
    mutationFn: ({ targetUserId, action }: { targetUserId: string; action: string }) =>
      API.groupSessions.approveUser(sessionId, { targetUserId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-sessions'] }),
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const blockUserMutation = useMutation({
    mutationFn: (targetUserId: string) => API.groupSessions.blockUser(sessionId, targetUserId),
    onSuccess: () => {
      Alert.alert('User Blocked', 'Participant removed and blocked from rejoining.');
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => Alert.alert('Block Error', err.message),
  });

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Session',
      'Are you sure you want to leave this live audio session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (recordingRef.current) {
              try {
                await recordingRef.current.stopAndUnloadAsync();
              } catch (e) {}
              recordingRef.current = null;
            }
            if (webStreamRef.current && webStreamRef.current.getTracks) {
              webStreamRef.current.getTracks().forEach((track: any) => track.stop());
              webStreamRef.current = null;
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleMute = async () => {
    if (hasMicPermission === false) {
      Alert.alert(
        'Microphone Permission Denied',
        'Please grant microphone permission in your device settings to speak.'
      );
      return;
    }

    try {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);

      if (Platform.OS === 'web' && webStreamRef.current) {
        const audioTracks = webStreamRef.current.getAudioTracks();
        audioTracks.forEach((t: any) => {
          t.enabled = !nextMuted;
        });
      } else if (recordingRef.current) {
        if (nextMuted) {
          await recordingRef.current.pauseAsync();
        } else {
          await recordingRef.current.startAsync();
        }
      }

      Alert.alert('Microphone Status', nextMuted ? 'Microphone Muted 🔇' : 'Microphone Unmuted 🎙️');
    } catch (err: any) {
      console.warn('Toggle mute error:', err);
    }
  };

  const requestMicPermissionManually = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setHasMicPermission(true);
        setPermissionError(null);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        Alert.alert('Permission Granted ✅', 'Your microphone is now ready for live audio sessions!');
      } else {
        Alert.alert('Permission Denied', 'Please grant microphone access in device settings.');
      }
    } catch (e: any) {
      Alert.alert('Permission Error', e?.message || 'Failed to request microphone permission.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2DD4BF" />
        <Text style={styles.loadingText}>Connecting to Live Audio Room...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ShieldAlert size={44} color={Theme.colors.error} />
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorDesc}>{(error as any)?.message || 'Could not join live room.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Back to Sessions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{sessionTitle}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.redDot} />
            <Text style={styles.liveText}>LIVE AUDIO</Text>
          </View>
        </View>
        <View style={styles.privacyBadge}>
          <Shield size={14} color="#2DD4BF" />
          <Text style={styles.privacyText}>100% Anonymous</Text>
        </View>
      </View>

      {/* Permission Warning Banner if mic permission was not granted */}
      {hasMicPermission === false && (
        <View style={styles.permissionWarningBanner}>
          <AlertTriangle size={20} color="#F59E0B" />
          <View style={styles.permissionWarningTextContainer}>
            <Text style={styles.permissionWarningTitle}>Microphone Access Required</Text>
            <Text style={styles.permissionWarningSub}>
              {permissionError || 'Enable microphone permission to speak in this live room.'}
            </Text>
          </View>
          <TouchableOpacity onPress={requestMicPermissionManually} style={styles.grantBtn}>
            <Text style={styles.grantBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active Audio Grid */}
        <Text style={styles.sectionTitle}>Connected Room Participants ({admittedUsers.length + 1})</Text>

        <View style={styles.participantsGrid}>
          {/* Host Card */}
          <View style={[styles.participantCard, styles.hostCard, activeSpeaker === 'host' && styles.speakingCard]}>
            <View style={styles.avatarCircleHost}>
              <Text style={styles.avatarEmoji}>🧑‍⚕️</Text>
            </View>
            <Text style={styles.participantName}>{session?.counselorName || 'Counselor Host'}</Text>
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>HOST COUNSELLOR</Text>
            </View>
            <View style={styles.audioMeter}>
              <Volume2 size={14} color="#2DD4BF" />
              <Text style={styles.audioStateText}>Speaking</Text>
            </View>
          </View>

          {/* Admitted Participants */}
          {admittedUsers.map((u: any, idx: number) => {
            const isMe = u.anonymousName === participantName;
            const isSpeaking = activeSpeaker === u.userId || (isMe && !isMuted);

            return (
              <View key={u.userId || idx} style={[styles.participantCard, isSpeaking && styles.speakingCard]}>
                <View style={styles.avatarCircleUser}>
                  <Text style={styles.avatarLetter}>
                    {(u.anonymousName || `User ${idx + 1}`)[0].toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.participantName} numberOfLines={1}>
                  {u.anonymousName || `Participant ${idx + 1}`} {isMe ? '(You)' : ''}
                </Text>

                <View style={styles.userRoleBadge}>
                  <Text style={styles.userRoleText}>PARTICIPANT</Text>
                </View>

                {isMe && (
                  <View style={styles.audioMeter}>
                    {isMuted ? (
                      <MicOff size={14} color="#EF4444" />
                    ) : (
                      <Mic size={14} color="#2DD4BF" />
                    )}
                    <Text style={[styles.audioStateText, isMuted && { color: '#EF4444' }]}>
                      {isMuted ? 'Muted' : 'Live Mic'}
                    </Text>
                  </View>
                )}

                {isCounselor && !isMe ? (
                  <TouchableOpacity
                    onPress={() => blockUserMutation.mutate(u.userId)}
                    style={styles.kickBtn}
                  >
                    <UserX size={12} color="#EF4444" />
                    <Text style={styles.kickBtnText}>Block</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Host Waiting Queue Controls */}
        {isCounselor && waitingQueue.length > 0 ? (
          <View style={styles.queueContainer}>
            <Text style={styles.queueHeader}>Waiting Room Queue ({waitingQueue.length})</Text>
            {waitingQueue.map((item: any, i: number) => (
              <View key={item.userId || i} style={styles.queueItem}>
                <Text style={styles.queueName}>{item.anonymousName || `User ${i + 1}`}</Text>
                <View style={styles.queueBtns}>
                  <TouchableOpacity
                    onPress={() => approveUserMutation.mutate({ targetUserId: item.userId, action: 'approve' })}
                    style={styles.admitBtn}
                  >
                    <Text style={styles.admitText}>Admit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => blockUserMutation.mutate(item.userId)}
                    style={styles.rejectBtn}
                  >
                    <Text style={styles.rejectText}>Block</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Floating Control Bar */}
      <View style={[styles.controlsBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={toggleMute}
          style={[styles.controlBtn, isMuted ? styles.mutedBtn : styles.unmutedBtn]}
        >
          {isMuted ? <MicOff size={22} color="#FFF" /> : <Mic size={22} color="#FFF" />}
          <Text style={styles.controlBtnText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLeaveRoom} style={[styles.controlBtn, styles.leaveBtn]}>
          <PhoneOff size={22} color="#FFF" />
          <Text style={styles.controlBtnText}>Leave Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 18,
    color: '#FFF',
    marginTop: 12,
  },
  errorDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    marginRight: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 16,
    color: '#FFF',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  privacyText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: '#2DD4BF',
  },
  permissionWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#451A03',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#78350F',
    gap: 10,
  },
  permissionWarningTextContainer: {
    flex: 1,
  },
  permissionWarningTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#FDE68A',
  },
  permissionWarningSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  grantBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  grantBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.display,
    fontSize: 15,
    color: '#E2E8F0',
    marginBottom: 16,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  participantCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hostCard: {
    backgroundColor: '#0F2926',
    borderColor: '#0D9488',
  },
  speakingCard: {
    borderColor: '#2DD4BF',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircleHost: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D564D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircleUser: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarLetter: {
    fontFamily: Theme.fonts.display,
    fontSize: 22,
    color: '#FFF',
  },
  participantName: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  hostBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  hostBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: '#2DD4BF',
  },
  userRoleBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  userRoleText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 9,
    color: '#94A3B8',
  },
  audioMeter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  audioStateText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 11,
    color: '#2DD4BF',
  },
  kickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  kickBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    color: '#EF4444',
  },
  queueContainer: {
    marginTop: 24,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  queueHeader: {
    fontFamily: Theme.fonts.display,
    fontSize: 14,
    color: '#FFF',
    marginBottom: 12,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  queueName: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 13,
    color: '#CBD5E1',
  },
  queueBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  admitBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  admitText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: '#FFF',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: '#FFF',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  unmutedBtn: {
    backgroundColor: '#0D9488',
  },
  mutedBtn: {
    backgroundColor: '#475569',
  },
  leaveBtn: {
    backgroundColor: '#EF4444',
  },
  controlBtnText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#FFF',
  },
});

export default GroupAudioRoomScreen;
