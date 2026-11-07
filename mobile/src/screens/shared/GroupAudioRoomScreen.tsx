import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
  const [activeSpeaker] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recordingRef = useRef<any>(null);
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
      if (!ExpoAudio) {
        Alert.alert('Audio Ready', 'Live audio is active in web mode.');
        setHasMicPermission(true);
        return;
      }
      const { status } = await ExpoAudio.requestPermissionsAsync();
      if (status === 'granted') {
        setHasMicPermission(true);
        setPermissionError(null);
        if (ExpoAudio.setAudioModeAsync) {
          await ExpoAudio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
        if (ExpoAudio.Recording?.createAsync) {
          const { recording } = await ExpoAudio.Recording.createAsync(
            ExpoAudio.RecordingOptionsPresets.HIGH_QUALITY
          );
          recordingRef.current = recording;
        }
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
      <View className="flex-1 bg-slate-900 justify-center items-center p-6" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#2DD4BF" />
        <Text className="font-jakarta-medium text-sm text-slate-400 mt-3">Connecting to Live Audio Room...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center p-6" style={{ paddingTop: insets.top }}>
        <ShieldAlert size={44} color="#D32F2F" />
        <Text className="font-sora-bold text-lg text-white mt-3">Connection Failed</Text>
        <Text className="font-jakarta text-sm text-slate-400 text-center mt-1.5 mb-5">{(error as any)?.message || 'Could not join live room.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-primary px-5 py-2.5 rounded-xl">
          <Text className="font-jakarta-bold text-sm text-white">Back to Sessions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900" style={{ paddingTop: Math.max(insets.top, 16) }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-800">
        <TouchableOpacity onPress={handleLeaveRoom} className="p-2 rounded-lg bg-slate-800 mr-3">
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-sora-bold text-base text-white" numberOfLines={1}>{sessionTitle}</Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
            <Text className="font-jakarta-bold text-[10px] text-red-500 tracking-wider">LIVE AUDIO</Text>
          </View>
        </View>
        <View className="flex-row items-center bg-teal-400/10 px-2.5 py-1 rounded-xl gap-1">
          <Shield size={14} color="#2DD4BF" />
          <Text className="font-jakarta-bold text-[11px] text-teal-400">100% Anonymous</Text>
        </View>
      </View>

      {/* Permission Warning Banner if mic permission was not granted */}
      {hasMicPermission === false && (
        <View className="flex-row items-center bg-amber-950 p-3 mx-4 mt-3 rounded-xl border border-amber-900 gap-2.5">
          <AlertTriangle size={20} color="#F59E0B" />
          <View className="flex-1">
            <Text className="font-jakarta-bold text-[13px] text-amber-200">Microphone Access Required</Text>
            <Text className="font-jakarta text-[11px] text-amber-500 mt-0.5">
              {permissionError || 'Enable microphone permission to speak in this live room.'}
            </Text>
          </View>
          <TouchableOpacity onPress={requestMicPermissionManually} className="bg-amber-500 px-3 py-1.5 rounded-lg">
            <Text className="font-jakarta-bold text-xs text-slate-900">Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerClassName="p-4 pb-28">
        {/* Active Audio Grid */}
        <Text className="font-sora-bold text-[15px] text-slate-200 mb-4">Connected Room Participants ({admittedUsers.length + 1})</Text>

        <View className="flex-row flex-wrap gap-3">
          {/* Host Card */}
          <View className={`w-[48%] bg-[#0F2926] rounded-2xl p-4 items-center border-2 border-teal-600 ${
            activeSpeaker === 'host' ? 'border-teal-400' : ''
          }`}>
            <View className="w-[52px] h-[52px] rounded-full bg-primary justify-center items-center mb-2.5">
              <Text className="text-2xl">🧑‍⚕️</Text>
            </View>
            <Text className="font-jakarta-bold text-[13px] text-white text-center mb-1">{session?.counselorName || 'Counselor Host'}</Text>
            <View className="bg-teal-400/20 px-2 py-0.5 rounded-lg mb-2">
              <Text className="font-jakarta-bold text-[9px] text-teal-400">HOST COUNSELLOR</Text>
            </View>
            <View className="flex-row items-center gap-1 mt-1">
              <Volume2 size={14} color="#2DD4BF" />
              <Text className="font-jakarta-medium text-[11px] text-teal-400">Speaking</Text>
            </View>
          </View>

          {/* Admitted Participants */}
          {admittedUsers.map((u: any, idx: number) => {
            const isMe = u.anonymousName === participantName;
            const isSpeaking = activeSpeaker === u.userId || (isMe && !isMuted);

            return (
              <View key={u.userId || idx} className={`w-[48%] bg-slate-800 rounded-2xl p-4 items-center border-2 border-transparent ${
                isSpeaking ? 'border-teal-400' : ''
              }`}>
                <View className="w-[52px] h-[52px] rounded-full bg-slate-700 justify-center items-center mb-2.5">
                  <Text className="font-sora-bold text-[22px] text-white">
                    {(u.anonymousName || `User ${idx + 1}`)[0].toUpperCase()}
                  </Text>
                </View>

                <Text className="font-jakarta-bold text-[13px] text-white text-center mb-1" numberOfLines={1}>
                  {u.anonymousName || `Participant ${idx + 1}`} {isMe ? '(You)' : ''}
                </Text>

                <View className="bg-slate-700 px-2 py-0.5 rounded-lg mb-2">
                  <Text className="font-jakarta-bold text-[9px] text-slate-400">PARTICIPANT</Text>
                </View>

                {isMe && (
                  <View className="flex-row items-center gap-1 mt-1">
                    {isMuted ? (
                      <MicOff size={14} color="#EF4444" />
                    ) : (
                      <Mic size={14} color="#2DD4BF" />
                    )}
                    <Text className={`font-jakarta-medium text-[11px] ${isMuted ? 'text-red-500' : 'text-teal-400'}`}>
                      {isMuted ? 'Muted' : 'Live Mic'}
                    </Text>
                  </View>
                )}

                {isCounselor && !isMe ? (
                  <TouchableOpacity
                    onPress={() => blockUserMutation.mutate(u.userId)}
                    className="flex-row items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md mt-2"
                  >
                    <UserX size={12} color="#EF4444" />
                    <Text className="font-jakarta-bold text-[10px] text-red-500">Block</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Host Waiting Queue Controls */}
        {isCounselor && waitingQueue.length > 0 ? (
          <View className="mt-6 bg-slate-800 rounded-2xl p-4">
            <Text className="font-sora-bold text-sm text-white mb-3">Waiting Room Queue ({waitingQueue.length})</Text>
            {waitingQueue.map((item: any, i: number) => (
              <View key={item.userId || i} className="flex-row items-center justify-between py-2 border-b border-slate-700">
                <Text className="font-jakarta-medium text-[13px] text-slate-300">{item.anonymousName || `User ${i + 1}`}</Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => approveUserMutation.mutate({ targetUserId: item.userId, action: 'approve' })}
                    className="bg-teal-600 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="font-jakarta-bold text-[11px] text-white">Admit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => blockUserMutation.mutate(item.userId)}
                    className="bg-red-600 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="font-jakarta-bold text-[11px] text-white">Block</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Floating Control Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-slate-800 flex-row justify-evenly items-center pt-3 border-t border-slate-700" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <TouchableOpacity
          onPress={toggleMute}
          className={`flex-row items-center gap-2 px-6 py-3 rounded-full ${
            isMuted ? 'bg-slate-600' : 'bg-teal-600'
          }`}
        >
          {isMuted ? <MicOff size={22} color="#FFF" /> : <Mic size={22} color="#FFF" />}
          <Text className="font-jakarta-bold text-[13px] text-white">{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLeaveRoom} className="flex-row items-center gap-2 px-6 py-3 rounded-full bg-red-500">
          <PhoneOff size={22} color="#FFF" />
          <Text className="font-jakarta-bold text-[13px] text-white">Leave Room</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupAudioRoomScreen;
