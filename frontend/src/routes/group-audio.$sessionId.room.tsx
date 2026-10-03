import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  Mic, MicOff, PhoneOff, Users, Shield, UserCheck, CheckCircle2,
  Clock, Volume2, AlertCircle, Loader2, Sparkles, UserPlus, X, Lock,
} from 'lucide-react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function LiveKitMicController({ micMuted }: { micMuted: boolean }) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!micMuted).catch((err) => {
        console.warn('LiveKit microphone mute toggle:', err);
      });
    }
  }, [localParticipant, micMuted]);

  return null;
}

export const Route = createFileRoute('/group-audio/$sessionId/room')({
  component: GroupAudioRoomPage,
});

function GroupAudioRoomPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [micMuted, setMicMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Fetch WebRTC audio token & room config
  const { data: roomConfig, isLoading: configLoading, error: configError } = useQuery({
    queryKey: ['group-audio-token', sessionId],
    queryFn: () => API.groupSessions.getAudioToken(sessionId),
    refetchInterval: 5000,
  });

  // Fetch full group session details
  const { data: sessionData, refetch: refetchSession } = useQuery({
    queryKey: ['group-session-detail', sessionId],
    queryFn: () => API.groupSessions.list(),
    refetchInterval: 3000, // Poll waiting room queue
  });

  const sessionList = sessionData?.sessions || [];
  const currentSession = sessionList.find((s: any) => s._id === sessionId);

  // Approve / Admit user mutation (Counselor host action)
  const approveMutation = useMutation({
    mutationFn: ({ targetUserId, action }: { targetUserId: string; action: 'allow' | 'deny' }) =>
      API.groupSessions.approveUser(sessionId, { targetUserId, action }),
    onSuccess: (data) => {
      toast.success(data.message || 'User updated');
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update user'),
  });

  // Timer interval for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real Microphone Stream & Voice Activity Detection using AudioContext Analyser
  useEffect(() => {
    let animationFrameId: number;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkVolume = () => {
            if (mediaStreamRef.current && mediaStreamRef.current.getAudioTracks().some(t => t.enabled)) {
              analyser.getByteFrequencyData(dataArray);
              const sum = dataArray.reduce((acc, val) => acc + val, 0);
              const avg = sum / dataArray.length;
              setIsSpeaking(avg > 10);
            } else {
              setIsSpeaking(false);
            }
            animationFrameId = requestAnimationFrame(checkVolume);
          };

          checkVolume();
        }
      } catch (err) {
        console.warn('Microphone stream access unavailable:', err);
      }
    }

    initAudio();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Dynamic Microphone Mute / Unmute Control
  useEffect(() => {
    if (micMuted) {
      setIsSpeaking(false);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micMuted;
      });
    }
  }, [micMuted]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="size-10 text-teal-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-display">Connecting to Audio Room...</h2>
        <p className="text-sm text-slate-400 mt-1">Initializing audio-only WebRTC stream</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="size-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-bold font-display">Unable to Join Audio Session</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6 text-center max-w-md">
          {(configError as any)?.message || 'You must be admitted by the counselor to enter this session.'}
        </p>
        <Button
          onClick={() => navigate({ to: '/dashboard' })}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const isCounselor = roomConfig?.isCounselor;
  const participantName = roomConfig?.participantName || (isCounselor ? 'Counselor Host' : 'Participant');
  const admittedUsers = currentSession?.admittedUsers || [];
  const waitingQueue = currentSession?.waitingQueue || [];

  const roomContent = (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* LiveKit Mic Controller & Remote Audio Renderer */}
      {roomConfig?.token && (
        <>
          <RoomAudioRenderer />
          <LiveKitMicController micMuted={micMuted} />
        </>
      )}
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 size-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 size-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold">
            🎙️
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white leading-tight">
              {roomConfig?.sessionTitle || currentSession?.title || 'Group Audio Session'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                WebRTC Audio Room (Video Disabled)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Users className="size-3.5 text-teal-400" />
            <span>{admittedUsers.length + 1} / 11 Users</span>
          </div>

          <Button
            onClick={() => {
              toast.info('Leaving audio session...');
              navigate({ to: isCounselor ? '/therapist/dashboard' : '/dashboard' });
            }}
            variant="destructive"
            size="sm"
            className="rounded-full px-4 gap-2 font-bold bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 transition"
          >
            <PhoneOff className="size-4" /> Leave Session
          </Button>
        </div>
      </header>

      {/* Main Center Audio Participants Grid */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
        {/* Notice Badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <Shield className="size-3.5 text-teal-400" />
            Counselors see participants as <strong className="text-teal-300">User 1, User 2</strong> for privacy.
          </span>
        </div>

        {/* Audio Participant Avatars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {/* Host Counselor Avatar Tile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-6 bg-slate-900/90 border flex flex-col items-center text-center relative overflow-hidden transition ${
              isCounselor && isSpeaking
                ? 'border-teal-500 shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/30'
                : 'border-slate-800'
            }`}
          >
            <div className="relative mb-3">
              <div className="size-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
                👨‍⚕️
              </div>
              <span className="absolute bottom-0 right-0 size-6 rounded-full bg-teal-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-950">
                HOST
              </span>
            </div>
            <h3 className="font-display font-bold text-sm text-white">
              {currentSession?.counselorName || 'Counselor Host'}
            </h3>
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider mt-0.5">
              Certified Counsellor
            </span>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Volume2 className="size-3.5 animate-pulse" /> Speaking
            </div>
          </motion.div>

          {/* Self User Avatar Tile */}
          {!isCounselor && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-3xl p-6 bg-slate-900/90 border flex flex-col items-center text-center relative overflow-hidden transition ${
                !micMuted && isSpeaking
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="relative mb-3">
                <div className="size-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                  {participantName.slice(0, 2)}
                </div>
                <span className="absolute bottom-0 right-0 size-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-300">
                  YOU
                </span>
              </div>
              <h3 className="font-display font-bold text-sm text-white">{participantName}</h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Anonymous Participant
              </span>
              <div className="mt-3">
                {micMuted ? (
                  <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                    <MicOff className="size-3.5" /> Muted
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <Mic className="size-3.5" /> Mic On
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Admitted Participants Tiles */}
          {admittedUsers
            .filter((u: any) => u.anonymousName !== participantName)
            .map((u: any, idx: number) => {
              const speaking = (idx % 2 === 0) && isSpeaking;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-3xl p-6 bg-slate-900/90 border flex flex-col items-center text-center relative transition ${
                    speaking ? 'border-teal-500/80 shadow-md shadow-teal-500/10' : 'border-slate-800'
                  }`}
                >
                  <div className="relative mb-3">
                    <div className="size-20 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center shadow">
                      👤
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-sm text-white">{u.anonymousName}</h3>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Participant
                  </span>
                  <div className="mt-3">
                    {speaking ? (
                      <span className="flex items-center gap-1 text-xs text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20 font-semibold">
                        <Volume2 className="size-3.5 animate-pulse" /> Audio Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
                        <Mic className="size-3.5 text-slate-500" /> Audio Connected
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </main>

      {/* Counselor Host Waiting Room Panel (If Counselor Host and waiting users exist) */}
      {isCounselor && waitingQueue.length > 0 && (
        <div className="relative z-20 max-w-5xl mx-auto px-4 mb-4 w-full">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <UserPlus className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  Waiting Room Queue ({waitingQueue.length} User{waitingQueue.length === 1 ? '' : 's'})
                </h4>
                <p className="text-xs text-slate-400">
                  Users are requesting to enter this session. Click allow to admit them.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {waitingQueue.map((userReq: any) => (
                <div
                  key={userReq.userId}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-3 shrink-0"
                >
                  <span className="text-xs font-bold text-amber-300">{userReq.anonymousName}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      onClick={() =>
                        approveMutation.mutate({ targetUserId: userReq.userId, action: 'allow' })
                      }
                      disabled={approveMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 h-7 rounded-xl font-bold"
                    >
                      Allow Entry ✓
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        approveMutation.mutate({ targetUserId: userReq.userId, action: 'deny' })
                      }
                      disabled={approveMutation.isPending}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs px-2 py-1 h-7 rounded-xl"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Audio Control Toolbar */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/90 backdrop-blur px-6 py-4 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMicMuted(!micMuted)}
            className={`size-14 rounded-2xl flex items-center justify-center font-bold transition shadow-lg ${
              micMuted
                ? 'bg-red-600 text-white shadow-red-600/30'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30'
            }`}
          >
            {micMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>

          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 font-semibold flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-400 animate-ping" />
            <span>Mic is {micMuted ? 'Muted' : 'Live & Active'}</span>
          </div>
        </div>
      </footer>
    </div>
  );

  if (roomConfig?.token && roomConfig?.livekitUrl) {
    return (
      <LiveKitRoom
        serverUrl={roomConfig.livekitUrl}
        token={roomConfig.token}
        audio={!micMuted}
        video={false}
        connect={true}
      >
        {roomContent}
      </LiveKitRoom>
    );
  }

  return roomContent;
}
