import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../../lib/store';
import { Check, GraduationCap, School, User, Upload, CheckCircle2 } from 'lucide-react-native';
import API from '../../lib/api';

interface OnboardingScreenProps {
  navigation: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useStore(state => state.completeOnboarding);

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');

  // Category & Student Verification
  const [userCategory, setUserCategory] = useState<'school_student' | 'college_student' | 'regular'>('regular');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [schoolCollegeName, setSchoolCollegeName] = useState('');
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [selectedSchoolOption, setSelectedSchoolOption] = useState<string>('');
  const [studentIdCardUrl, setStudentIdCardUrl] = useState('');
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [orgs, setOrgs] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.org.verifiedOrgs()
      .then((res: any) => setOrgs(res?.organizations || []))
      .catch(() => setOrgs([]));
  }, []);

  const handlePickStudentIdCard = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setUploadingIdCard(true);
        const uploadRes = await API.auth.uploadStudentIdCard(asset.uri, asset.name || 'student-id.jpg');
        if (uploadRes.success && uploadRes.imageUrl) {
          setStudentIdCardUrl(uploadRes.imageUrl);
          Alert.alert('ID Uploaded ✓', 'Student ID card image uploaded successfully.');
        }
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload student ID card.');
    } finally {
      setUploadingIdCard(false);
    }
  };

  const finishOnboarding = async () => {
    if (userCategory === 'school_student' || userCategory === 'college_student') {
      const finalSchoolName = selectedSchoolOption === 'other' ? customSchoolName : schoolCollegeName;
      if (!finalSchoolName.trim()) {
        Alert.alert('School/College Name Required', 'School / College Name is mandatory for students.');
        return;
      }
      if (!studentIdCardUrl) {
        Alert.alert('Student ID Card Required', 'Upload Student ID Card Photo is mandatory for students.');
        return;
      }
    }

    setLoading(true);
    try {
      const finalSchoolName = selectedSchoolOption === 'other' ? customSchoolName : schoolCollegeName;
      
      await API.auth.updateOnboarding({
        moodScore: 5,
        concerns: [],
        primaryNeed: 'talk',
        completed: true,
        userType: userCategory,
        studentIdCardUrl,
        schoolCollegeName: finalSchoolName,
        phone,
        referralCode: referralCode.trim().toUpperCase() || undefined,
      });

      if (firstName.trim()) {
        await API.auth.updateProfile({ "Full name": firstName.trim() });
      }

      completeOnboarding({
        firstName: firstName.trim() || 'friend',
        mood: 5,
        concerns: [],
        need: 'talk',
      });

      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTabs', params: { screen: 'Home' } }],
      });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Onboarding Error', err.message || 'Failed to complete onboarding.');
    }
  };

  return (
    <View className="flex-1 bg-[#FAFAF9]" style={{ paddingTop: Math.max(insets.top, 20) }}>
      <View className="px-5 mb-2.5">
        <Text className="font-sora-bold text-[26px] text-primary">Apna Dil Kholo</Text>
        <Text className="font-jakarta-medium text-sm text-[#6F7977] mt-0.5">A safe space, just for you.</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {step === 1 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-xl text-[#1A1C1C] mb-1.5">What should I call you?</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] mb-4">Enter your name to begin personalizing your wellness journey.</Text>

            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Your first name…"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-2xl px-4 py-3.5 font-jakarta text-base text-[#1A1C1C] mb-5"
              placeholderTextColor="#A1A1AA"
              autoFocus
            />

            <TouchableOpacity
              disabled={!firstName.trim()}
              onPress={() => setStep(2)}
              className={`bg-primary rounded-2xl py-3.5 items-center justify-center ${!firstName.trim() ? 'opacity-50' : ''}`}
            >
              <Text className="font-sora-semibold text-[15px] text-white">Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-xl text-[#1A1C1C] mb-1.5">Select Your Category</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] mb-4">Counseling session fees are tailored per category:</Text>

            {/* Category Cards */}
            <View className="gap-2.5 mb-4">
              <TouchableOpacity
                onPress={() => setUserCategory('school_student')}
                className={`flex-row items-center bg-[#F9F9F8] border-[1.5px] rounded-2xl p-3.5 ${userCategory === 'school_student' ? 'bg-[#E6F4F1] border-primary' : 'border-[#E8E8E7]'}`}
              >
                <View className={`w-[38px] h-[38px] rounded-xl justify-center items-center mr-3 ${userCategory === 'school_student' ? 'bg-primary' : 'bg-[#E8E8E7]'}`}>
                  <School size={20} color={userCategory === 'school_student' ? '#FFF' : '#0D564D'} />
                </View>
                <View className="flex-1">
                  <Text className="font-sora-semibold text-sm text-[#1A1C1C]">School Student</Text>
                  <Text className="font-jakarta text-[11px] text-[#6F7977] mt-0.5">Special student pricing & verified care</Text>
                </View>
                {userCategory === 'school_student' && <Check size={18} color="#0D564D" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUserCategory('college_student')}
                className={`flex-row items-center bg-[#F9F9F8] border-[1.5px] rounded-2xl p-3.5 ${userCategory === 'college_student' ? 'bg-[#E6F4F1] border-primary' : 'border-[#E8E8E7]'}`}
              >
                <View className={`w-[38px] h-[38px] rounded-xl justify-center items-center mr-3 ${userCategory === 'college_student' ? 'bg-primary' : 'bg-[#E8E8E7]'}`}>
                  <GraduationCap size={20} color={userCategory === 'college_student' ? '#FFF' : '#0D564D'} />
                </View>
                <View className="flex-1">
                  <Text className="font-sora-semibold text-sm text-[#1A1C1C]">College Student</Text>
                  <Text className="font-jakarta text-[11px] text-[#6F7977] mt-0.5">Higher education student pricing</Text>
                </View>
                {userCategory === 'college_student' && <Check size={18} color="#0D564D" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUserCategory('regular')}
                className={`flex-row items-center bg-[#F9F9F8] border-[1.5px] rounded-2xl p-3.5 ${userCategory === 'regular' ? 'bg-[#E6F4F1] border-primary' : 'border-[#E8E8E7]'}`}
              >
                <View className={`w-[38px] h-[38px] rounded-xl justify-center items-center mr-3 ${userCategory === 'regular' ? 'bg-primary' : 'bg-[#E8E8E7]'}`}>
                  <User size={20} color={userCategory === 'regular' ? '#FFF' : '#0D564D'} />
                </View>
                <View className="flex-1">
                  <Text className="font-sora-semibold text-sm text-[#1A1C1C]">Regular Person / Adult</Text>
                  <Text className="font-jakarta text-[11px] text-[#6F7977] mt-0.5">Standard adult therapy care</Text>
                </View>
                {userCategory === 'regular' && <Check size={18} color="#0D564D" />}
              </TouchableOpacity>
            </View>

            {/* Phone & Referral */}
            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Phone Number (Optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-[13px] text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Referral Code (Optional)</Text>
            <TextInput
              value={referralCode}
              onChangeText={v => setReferralCode(v.toUpperCase())}
              placeholder="e.g. MMTP-A1B2C3"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-sora-semibold text-[13px] text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
              autoCapitalize="characters"
            />
            <Text className="font-jakarta text-[10px] text-[#6F7977] mt-1">Get 1 Free Counseling Session when using a valid referral code.</Text>

            {/* Student ID Upload Block */}
            {(userCategory === 'school_student' || userCategory === 'college_student') && (
              <View className="bg-[#E6F4F1] rounded-2xl p-3.5 mt-3.5 border border-[#BFE3DC]">
                <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mb-1.5">School / College Name *</Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Select Institution',
                      'Choose your institution:',
                      [
                        ...orgs.map(org => ({
                          text: org.name,
                          onPress: () => {
                            setSelectedSchoolOption(org.name);
                            setSchoolCollegeName(org.name);
                          },
                        })),
                        {
                          text: '➕ Other (Not in list)',
                          onPress: () => {
                            setSelectedSchoolOption('other');
                            setSchoolCollegeName(customSchoolName);
                          },
                        },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                  className="bg-white border border-[#BFE3DC] rounded-xl px-3.5 py-3"
                >
                  <Text className="font-jakarta-medium text-[13px] text-[#1A1C1C]">
                    {selectedSchoolOption
                      ? selectedSchoolOption === 'other'
                        ? '➕ Other (Custom)'
                        : selectedSchoolOption
                      : '-- Select Onboarded Institution --'}
                  </Text>
                </TouchableOpacity>

                {selectedSchoolOption === 'other' && (
                  <TextInput
                    value={customSchoolName}
                    onChangeText={v => {
                      setCustomSchoolName(v);
                      setSchoolCollegeName(v);
                    }}
                    placeholder="Enter your School / College Name..."
                    className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-[13px] text-[#1A1C1C] mt-2"
                    placeholderTextColor="#A1A1AA"
                  />
                )}

                <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Upload Student ID Card Photo *</Text>
                <TouchableOpacity
                  onPress={handlePickStudentIdCard}
                  disabled={uploadingIdCard}
                  className="flex-row items-center justify-center bg-white border border-dashed border-primary rounded-xl py-3 px-3.5"
                >
                  <Upload size={18} color="#0D564D" className="mr-1.5" />
                  <Text className="font-sora-semibold text-xs text-primary">
                    {uploadingIdCard
                      ? 'Uploading ID Card...'
                      : studentIdCardUrl
                      ? 'Change Uploaded ID Card'
                      : 'Upload Student ID Card Photo (Mandatory)'}
                  </Text>
                </TouchableOpacity>

                {studentIdCardUrl ? (
                  <View className="mt-2.5 rounded-xl overflow-hidden border border-[#BFE3DC] relative">
                    <Image source={{ uri: studentIdCardUrl }} className="w-full h-[140px]" resizeMode="cover" />
                    <View className="absolute bottom-2 right-2 bg-emerald-600 flex-row items-center px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} color="#FFF" className="mr-1" />
                      <Text className="font-sora-bold text-[9px] text-white">Uploaded ✓ (Pending Admin Verification)</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              disabled={loading}
              onPress={finishOnboarding}
              className="bg-primary rounded-2xl py-3.5 items-center justify-center mt-6"
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="font-sora-semibold text-[15px] text-white">Go to Dashboard →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OnboardingScreen;
