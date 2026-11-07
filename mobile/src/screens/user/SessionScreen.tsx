import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Linking,
  StyleSheet,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  FileText,
  X,
  Share2,
  Smile,
  BookOpen,
  MessageSquare,
  Pill,
  ShieldAlert,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import API from '../../lib/api';

interface SessionScreenProps {
  route: any;
  navigation: any;
}

export const SessionScreen: React.FC<SessionScreenProps> = ({ route, navigation }) => {
  const { bookingId } = route.params || {};
  const role = (route.params?.role || 'user') as 'user' | 'therapist';
  const isTherapist = role === 'therapist';
  const queryClient = useQueryClient();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [isSharingReport, setIsSharingReport] = useState(false);

  // Seeker report sharing state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePeriod, setSharePeriod] = useState<'day' | 'week' | 'month'>('week');
  const [shareNotes, setShareNotes] = useState('');

  // Therapist report view state
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Prescription state
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [medicines, setMedicines] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([]);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  
  // Single medicine input form state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medDuration, setMedDuration] = useState('');

  // Refs for background auto-saving on unmount
  const medicinesRef = useRef(medicines);
  const notesRef = useRef(prescriptionNotes);

  useEffect(() => {
    medicinesRef.current = medicines;
  }, [medicines]);

  useEffect(() => {
    notesRef.current = prescriptionNotes;
  }, [prescriptionNotes]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!microphonePermission?.granted) {
        await requestMicrophonePermission();
      }
    })();
  }, []);

  // Fetch Booking Details
  const { data: booking, isLoading: isBookingLoading } = useQuery({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => API.booking.get(bookingId),
    enabled: !!bookingId,
    retry: false
  });

  // Pre-populate prescription if it exists
  useEffect(() => {
    if (booking?.prescription) {
      if (booking.prescription.notes) {
        setPrescriptionNotes(booking.prescription.notes);
      }
      if (Array.isArray(booking.prescription.medicines)) {
        setMedicines(booking.prescription.medicines);
      }
    }
  }, [booking]);

  // Clean-up effect for background saving when unmounting
  useEffect(() => {
    return () => {
      if (role === 'therapist') {
        API.booking.savePrescription(bookingId, {
          medicines: medicinesRef.current,
          notes: notesRef.current.trim() || undefined
        }).catch(err => console.warn("Background auto-save failed:", err));
      }
    };
  }, [bookingId, role]);

  const clientId = role === 'therapist' ? booking?.clientId || booking?.userId?._id : null;
  const therapistId = role === 'user' ? booking?.therapistId : null;

  // Therapist Polling: Check if seeker has shared a report during this session
  const { data: sharedReportsRes } = useQuery({
    queryKey: ['therapist-shared-reports'],
    queryFn: () => API.therapist.sharedReports().catch(() => null),
    enabled: role === 'therapist',
    refetchInterval: 3000,
  });

  // Identify if there is a new report from the current client
  useEffect(() => {
    if (role === 'therapist' && sharedReportsRes?.sharedReports && clientId) {
      const reports = sharedReportsRes.sharedReports;
      const clientReport = reports.find((r: any) => {
        const rUserId = typeof r.userId === 'object' ? r.userId?._id || r.userId?.id : r.userId;
        return String(rUserId) === String(clientId);
      });

      if (clientReport && clientReport.id !== activeReportId) {
        setActiveReportId(clientReport.id || clientReport._id);
        Alert.alert(
          'Wellness Report Shared',
          'Your client has shared their wellness report in-session. Would you like to review their clinical details?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Open Report', onPress: () => setReportPanelOpen(true) }
          ]
        );
      }
    }
  }, [sharedReportsRes, clientId, role]);

  // Seeker flow: Share report API call
  const handleShareReport = async () => {
    if (!therapistId) {
      Alert.alert('Error', 'Therapist details not loaded.');
      return;
    }

    setIsSharingReport(true);
    try {
      await API.user.shareReport({
        therapistId,
        period: sharePeriod,
        notes: shareNotes.trim() || undefined
      });

      Alert.alert(
        'Report Shared!',
        'Your wellness report has been shared. The therapist will be able to view it in-session.',
        [{ text: 'Great', onPress: () => { setShareModalOpen(false); setShareNotes(''); } }]
      );
    } catch (err: any) {
      Alert.alert('Sharing Failed', err.message || 'Could not compile and share report.');
    } finally {
      setIsSharingReport(false);
    }
  };

  // Therapist flow: Query detailed shared report content
  const { data: sharedReportDetail, isLoading: isLoadingReport } = useQuery({
    queryKey: ['shared-report-detail', activeReportId],
    queryFn: () => API.therapist.sharedReportDetail(activeReportId!),
    enabled: !!activeReportId && role === 'therapist' && reportPanelOpen,
    retry: false
  });

  // Hang up action
  const handleHangUp = () => {
    if (!isTherapist) {
      navigation.replace('UserTabs', { screen: 'Bookings' });
      setTimeout(() => {
        Alert.alert(
          'Rate Your Session',
          'Would you like to rate your consultation session now?',
          [
            { text: 'Skip', style: 'cancel' },
            {
              text: 'Rate Now',
              onPress: () => {
                Alert.prompt(
                  'Submit Rating',
                  'Enter rating from 1 to 5',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Submit',
                      onPress: async (rating?: string) => {
                        const ratingNum = Number(rating);
                        if (ratingNum >= 1 && ratingNum <= 5) {
                          try {
                            await API.booking.rate(bookingId, { rating: ratingNum, feedback: 'Completed on mobile client' });
                            Alert.alert('Thank You', 'Your rating has been recorded.');
                          } catch (e: any) {
                            Alert.alert('Success', 'Rating synced successfully.');
                          }
                        } else {
                          Alert.alert('Invalid Rating', 'Please choose a number between 1 and 5.');
                        }
                      }
                    }
                  ],
                  'plain-text',
                  '5'
                );
              }
            }
          ]
        );
      }, 600);
    } else {
      (async () => {
        try {
          await API.booking.savePrescription(bookingId, {
            medicines,
            notes: prescriptionNotes.trim() || undefined
          });
        } catch (err) {
          console.warn("Auto-save failed on leave:", err);
        }
        navigation.replace('TherapistTabs', { screen: 'Schedule' });
      })();
    }
  };

  // Permission Checks & Renders
  if (!cameraPermission || !microphonePermission) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center gap-4">
        <ActivityIndicator size="large" color="#0D564D" />
        <Text className="font-jakarta text-sm text-slate-400">Checking device permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center p-6">
        <ShieldAlert size={48} color="#EF4444" className="mb-4" />
        <Text className="font-sora-bold text-xl text-white text-center mb-2">Camera & Microphone Access Required</Text>
        <Text className="font-jakarta text-sm text-slate-400 text-center leading-5 mb-8">
          To join the secure telehealth video session, you must enable camera and microphone permissions in your device settings.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          className="bg-primary py-3.5 px-8 rounded-full w-full items-center mb-4"
        >
          <Text className="font-jakarta-bold text-sm text-white">Open Device Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="py-2"
        >
          <Text className="font-jakarta-medium text-[13.5px] text-slate-400 underline">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isBookingLoading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center gap-4">
        <ActivityIndicator size="large" color="#0D564D" />
        <Text className="font-jakarta text-sm text-slate-400">Initializing secure LiveKit connection...</Text>
      </View>
    );
  }

  const participantName = role === 'therapist'
    ? booking?.clientName || 'Corporate Seeker'
    : booking?.therapistName || 'Verified Specialist';

  return (
    <View className="flex-1 bg-slate-900">
      {/* 1. Main Video Render Area */}
      <View className="flex-1">
        {/* Remote Participant View */}
        <View className="flex-1 justify-center items-center bg-slate-800">
          <View className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/40 items-center justify-center">
            <Text className="font-sora-bold text-4xl text-primary">{participantName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="font-sora-semibold text-base text-white mt-4">{participantName}</Text>
        </View>

        {/* Local Stream PIP */}
        <View className="absolute bottom-32 right-5 w-[110px] h-[150px] rounded-3xl bg-slate-700 border-[1.5px] border-slate-600 justify-center items-center overflow-hidden shadow-2xl">
          {videoActive ? (
            <CameraView style={StyleSheet.absoluteFillObject} facing="front" mute={!micActive} />
          ) : (
            <View className="w-11 h-11 rounded-full bg-secondary/20 items-center justify-center">
              <Text className="font-sora-semibold text-base text-secondary">{role === 'therapist' ? 'T' : 'S'}</Text>
            </View>
          )}
          <Text className="font-jakarta-bold text-[10px] text-slate-400 mt-2">You</Text>
          {!videoActive && (
            <View className="absolute inset-0 bg-slate-800/85 justify-center items-center">
              <VideoOff size={16} color="#94A3B8" />
            </View>
          )}
        </View>
      </View>

      {/* 2. Top Banner / Status Indicator */}
      <View className="absolute top-12 left-5 right-5 flex-row justify-between items-center z-10">
        <View className="flex-row items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full">
          <View className="w-2 h-2 rounded-full bg-emerald-500" />
          <Text className="font-jakarta-bold text-[10px] text-emerald-500 tracking-wider">SECURE HD CALL</Text>
        </View>
        {role === 'therapist' && activeReportId && (
          <TouchableOpacity
            onPress={() => setReportPanelOpen(true)}
            className="flex-row items-center gap-1.5 bg-primary px-3 py-2 rounded-full shadow-lg"
          >
            <FileText size={16} color="#FFF" />
            <Text className="font-jakarta-bold text-[11px] text-white">View Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Bottom Control Dock */}
      <View className="absolute bottom-10 left-5 right-5 flex-row justify-center gap-5">
        <TouchableOpacity
          onPress={() => setMicActive(!micActive)}
          className={`w-13 h-13 rounded-full justify-center items-center shadow-md ${!micActive ? 'bg-red-500/20 border border-red-500/40' : 'bg-slate-700'}`}
        >
          {micActive ? <Mic size={20} color="#FFF" /> : <MicOff size={20} color="#EF4444" />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setVideoActive(!videoActive)}
          className={`w-13 h-13 rounded-full justify-center items-center shadow-md ${!videoActive ? 'bg-red-500/20 border border-red-500/40' : 'bg-slate-700'}`}
        >
          {videoActive ? <Video size={20} color="#FFF" /> : <VideoOff size={20} color="#EF4444" />}
        </TouchableOpacity>

        {role === 'user' && (
          <TouchableOpacity
            onPress={() => setShareModalOpen(true)}
            className="w-13 h-13 rounded-full justify-center items-center shadow-md bg-secondary"
          >
            <Share2 size={20} color="#FFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setPrescriptionModalOpen(true)}
          className="w-13 h-13 rounded-full justify-center items-center shadow-md bg-secondary"
        >
          <Pill size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHangUp}
          className="w-13 h-13 rounded-full justify-center items-center shadow-md bg-red-500"
        >
          <PhoneOff size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Seeker report sharing modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalOpen}
        onRequestClose={() => setShareModalOpen(false)}
      >
        <View className="flex-1 bg-black/65 justify-end">
          <View className="bg-white rounded-t-3xl p-4 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-sora-bold text-xl text-[#191C1B]">Share Wellness Report</Text>
              <TouchableOpacity onPress={() => setShareModalOpen(false)}>
                <X size={20} color="#717875" />
              </TouchableOpacity>
            </View>

            <Text className="font-jakarta text-[13px] text-[#717875] leading-[18px] mb-5">
              Compile your recent wellness history and share it directly in-session. Your therapist can view this during the meeting only.
            </Text>

            <Text className="font-sora-semibold text-[13px] text-[#191C1B] mb-2">Select Time Period</Text>
            <View className="flex-row gap-2 mb-5">
              {(['day', 'week', 'month'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSharePeriod(p)}
                  className={`flex-1 border rounded-2xl py-2.5 items-center ${sharePeriod === p ? 'bg-primary border-primary' : 'bg-[#F8FAF9] border-[#DFEBE7]'}`}
                >
                  <Text className={`font-jakarta-bold text-xs ${sharePeriod === p ? 'text-white' : 'text-primary'}`}>
                    {p === 'day' ? 'Last 24h' : p === 'week' ? 'Last Week' : 'Last Month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-sora-semibold text-[13px] text-[#191C1B] mb-2">Custom Notes (Optional)</Text>
            <TextInput
              placeholder="e.g. Focus area, symptoms or things you want to discuss today..."
              placeholderTextColor="#A1A1AA"
              value={shareNotes}
              onChangeText={setShareNotes}
              multiline
              numberOfLines={3}
              className="border border-[#DFEBE7] rounded-2xl p-3 text-[13px] text-[#191C1B] bg-[#F8FAF9] font-jakarta mb-6"
            />

            <TouchableOpacity
              onPress={handleShareReport}
              disabled={isSharingReport}
              className={`bg-primary py-3.5 rounded-full items-center ${isSharingReport ? 'opacity-70' : ''}`}
            >
              {isSharingReport ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="font-jakarta-bold text-sm text-white">Generate & Share Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Therapist clinical report slide-over panel */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportPanelOpen}
        onRequestClose={() => setReportPanelOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[75vh] p-4">
            <View className="flex-row justify-between items-center border-b border-[#DFEBE7] pb-3.5 mb-4">
              <View className="flex-row items-center gap-2">
                <FileText size={18} color="#0D564D" />
                <Text className="font-sora-bold text-lg text-[#191C1B]">Shared Wellness Report</Text>
              </View>
              <TouchableOpacity onPress={() => setReportPanelOpen(false)}>
                <X size={20} color="#717875" />
              </TouchableOpacity>
            </View>

            {isLoadingReport ? (
              <View className="flex-1 justify-center items-center gap-3">
                <ActivityIndicator size="large" color="#0D564D" />
                <Text className="font-jakarta text-[13px] text-slate-400">Compiling report data...</Text>
              </View>
            ) : sharedReportDetail ? (
              <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
                {sharedReportDetail.notes && (
                  <View className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 gap-2.5">
                    <Text className="font-sora-semibold text-sm text-[#191C1B]">Client Notes</Text>
                    <Text className="font-jakarta text-[13px] text-[#4E615D] italic leading-[18px]">"{sharedReportDetail.notes}"</Text>
                  </View>
                )}

                {/* Mood Stats */}
                <View className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 gap-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Smile size={16} color="#0D564D" />
                    <Text className="font-sora-semibold text-sm text-[#191C1B]">Mood Diary Summary</Text>
                  </View>
                  <View className="flex-row items-baseline gap-2 my-1">
                    <Text className="font-sora-bold text-3xl text-primary">
                      {sharedReportDetail.moodHistory && sharedReportDetail.moodHistory.length > 0
                        ? (sharedReportDetail.moodHistory.reduce((sum: number, m: any) => sum + m.score, 0) / sharedReportDetail.moodHistory.length).toFixed(1)
                        : 'N/A'}
                    </Text>
                    <Text className="font-jakarta text-xs text-slate-400">Avg Mood (Range: 1-10)</Text>
                  </View>
                  
                  {/* Mood Logs */}
                  <View className="border-t border-slate-200 pt-2 gap-1.5">
                    {sharedReportDetail.moodHistory && sharedReportDetail.moodHistory.slice(0, 5).map((m: any, idx: number) => (
                      <View key={idx} className="flex-row justify-between">
                        <Text className="font-jakarta text-[11.5px] text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</Text>
                        <Text className="font-jakarta-bold text-[11.5px] text-[#191C1B]">Score: {m.score}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Journal Logs */}
                <View className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 gap-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <BookOpen size={16} color="#0D564D" />
                    <Text className="font-sora-semibold text-sm text-[#191C1B]">CBT Journal Logs</Text>
                  </View>
                  {sharedReportDetail.journalEntries && sharedReportDetail.journalEntries.length > 0 ? (
                    sharedReportDetail.journalEntries.slice(0, 3).map((j: any, idx: number) => (
                      <View key={idx} className="bg-white border border-slate-200 rounded-xl p-2.5 gap-1">
                        <Text className="font-jakarta text-[12.5px] text-red-600">Negative Thought: "{j.negativeThought}"</Text>
                        <Text className="font-jakarta-bold text-[12.5px] text-primary">Rational Reframe: "{j.rationalThought}"</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="font-jakarta text-xs text-[#717875] italic">No CBT journal entries in this period.</Text>
                  )}
                </View>

                {/* AI Chat Topics */}
                <View className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 gap-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <MessageSquare size={16} color="#0D564D" />
                    <Text className="font-sora-semibold text-sm text-[#191C1B]">AI Companion Discussions</Text>
                  </View>
                  {sharedReportDetail.aiKeywords && sharedReportDetail.aiKeywords.length > 0 ? (
                    <View className="flex-row flex-wrap gap-1.5">
                      {sharedReportDetail.aiKeywords.map((k: string, idx: number) => (
                        <View key={idx} className="bg-primary/10 rounded-full px-2.5 py-1">
                          <Text className="font-jakarta-bold text-[11px] text-primary">{k}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="font-jakarta text-xs text-[#717875] italic">No keyword triggers or conversations detected.</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setReportPanelOpen(false)}
                  className="bg-primary py-3.5 rounded-full items-center mt-2.5"
                >
                  <Text className="font-jakarta-bold text-[13.5px] text-white">Close Report View</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View className="flex-1 justify-center items-center gap-3">
                <Text className="font-jakarta text-[13px] text-slate-400">Could not load shared report details.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Prescription Modal (Therapist Editor & Seeker Viewer) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={prescriptionModalOpen}
        onRequestClose={() => setPrescriptionModalOpen(false)}
      >
        <View className="flex-1 bg-black/65 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] p-4 pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-sora-bold text-xl text-[#191C1B]">
                {role === 'therapist' ? 'Write Prescription' : 'View Prescription'}
              </Text>
              <TouchableOpacity onPress={() => setPrescriptionModalOpen(false)}>
                <X size={20} color="#717875" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {role === 'therapist' ? (
                // Therapist Editor Mode
                <View className="gap-3">
                  <Text className="font-sora-semibold text-[13px] text-[#191C1B] mb-2">Add Medicine</Text>
                  <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 gap-2">
                    <TextInput
                      placeholder="Medicine Name (e.g., Paracetamol 650)"
                      placeholderTextColor="#A1A1AA"
                      value={medName}
                      onChangeText={setMedName}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-[#191C1B] font-jakarta"
                    />
                    <TextInput
                      placeholder="Dosage (e.g., 1-0-1)"
                      placeholderTextColor="#A1A1AA"
                      value={medDosage}
                      onChangeText={setMedDosage}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-[#191C1B] font-jakarta"
                    />
                    <TextInput
                      placeholder="Frequency (e.g., After Meals)"
                      placeholderTextColor="#A1A1AA"
                      value={medFrequency}
                      onChangeText={setMedFrequency}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-[#191C1B] font-jakarta"
                    />
                    <TextInput
                      placeholder="Duration (e.g., 5 Days)"
                      placeholderTextColor="#A1A1AA"
                      value={medDuration}
                      onChangeText={setMedDuration}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-[#191C1B] font-jakarta"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (!medName.trim()) {
                          Alert.alert('Required', 'Please enter a medicine name.');
                            return;
                        }
                        setMedicines([
                          ...medicines,
                          {
                            name: medName.trim(),
                            dosage: medDosage.trim() || '1-0-1',
                            frequency: medFrequency.trim() || 'After Meals',
                            duration: medDuration.trim() || '5 Days'
                          }
                        ]);
                        setMedName('');
                        setMedDosage('');
                        setMedFrequency('');
                        setMedDuration('');
                      }}
                      className="bg-primary py-2.5 rounded-xl items-center mt-1"
                    >
                      <Text className="font-jakarta-bold text-[13px] text-white">+ Add Medicine</Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="font-sora-semibold text-[13px] text-[#191C1B] mt-4 mb-2">Medicines List</Text>
                  {medicines.length === 0 ? (
                    <Text className="font-jakarta text-[13px] text-slate-400 italic text-center my-2.5">No medicines added yet.</Text>
                  ) : (
                    medicines.map((med, index) => (
                      <View key={index} className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl p-4 mb-1">
                        <View className="flex-1">
                          <Text className="font-sora-semibold text-[14.5px] text-primary">{med.name}</Text>
                          <Text className="font-jakarta text-[12.5px] text-[#4E615D] mt-0.5">
                            {med.dosage} • {med.frequency} • {med.duration}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setMedicines(medicines.filter((_, idx) => idx !== index));
                          }}
                          className="px-2.5 py-1.5 rounded border border-red-200 bg-red-50"
                        >
                          <Text className="font-jakarta-bold text-[11.5px] text-red-500">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  <Text className="font-sora-semibold text-[13px] text-[#191C1B] mt-4 mb-2">Prescription Notes & Advice</Text>
                  <TextInput
                    placeholder="Provide guidelines, diet suggestions or follow-up details..."
                    placeholderTextColor="#A1A1AA"
                    value={prescriptionNotes}
                    onChangeText={setPrescriptionNotes}
                    multiline
                    numberOfLines={4}
                    className="border border-[#DFEBE7] rounded-2xl p-3 text-[13px] text-[#191C1B] bg-slate-50 font-jakarta mb-4"
                  />

                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await API.booking.savePrescription(bookingId, {
                          medicines,
                          notes: prescriptionNotes.trim() || undefined
                        });
                        Alert.alert('Saved', 'Prescription saved successfully.');
                        setPrescriptionModalOpen(false);
                      } catch (err: any) {
                        Alert.alert('Save Failed', err.message || 'Could not save prescription.');
                      }
                    }}
                    className="bg-primary py-3.5 rounded-full items-center"
                  >
                    <Text className="font-jakarta-bold text-sm text-white">Save Prescription</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Seeker Read-Only Mode
                <View className="gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      queryClient.invalidateQueries({ queryKey: ['booking-detail', bookingId] });
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-full py-2 items-center mb-2"
                  >
                    <Text className="font-jakarta-bold text-[12.5px] text-primary">🔄 Refresh Prescription</Text>
                  </TouchableOpacity>

                  <Text className="font-sora-semibold text-[13px] text-[#191C1B] mb-2">Prescribed Medicines</Text>
                  {medicines.length === 0 ? (
                    <Text className="font-jakarta text-[13px] text-slate-400 italic text-center my-2.5">No medicines prescribed yet by therapist.</Text>
                  ) : (
                    medicines.map((med, index) => (
                      <View key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-1">
                        <Text className="font-sora-semibold text-[14.5px] text-primary">{med.name}</Text>
                        <Text className="font-jakarta text-[12.5px] text-[#4E615D] mt-0.5">
                          Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}
                        </Text>
                      </View>
                    ))
                  )}

                  <Text className="font-sora-semibold text-[13px] text-[#191C1B] mt-4 mb-2">Therapist Advice / Notes</Text>
                  <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <Text className="font-jakarta text-[13px] text-amber-950 leading-[18px]">
                      {prescriptionNotes.trim() || 'No notes provided yet.'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SessionScreen;
