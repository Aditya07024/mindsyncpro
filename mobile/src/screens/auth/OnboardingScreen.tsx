import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
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
import { Theme } from '../../theme';
import { ArrowRight, Check, GraduationCap, School, User, Upload, CheckCircle2 } from 'lucide-react-native';
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
        referralCode,
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Apna Dil Kholo</Text>
        <Text style={styles.appSubtitle}>A safe space, just for you.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>What should I call you?</Text>
            <Text style={styles.stepDesc}>Enter your name to begin personalizing your wellness journey.</Text>

            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Your first name…"
              style={styles.nameInput}
              placeholderTextColor="#A1A1AA"
              autoFocus
            />

            <TouchableOpacity
              disabled={!firstName.trim()}
              onPress={() => setStep(2)}
              style={[styles.btnPrimary, !firstName.trim() && styles.btnDisabled]}
            >
              <Text style={styles.btnPrimaryText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Select Your Category</Text>
            <Text style={styles.stepDesc}>Counseling session fees are tailored per category:</Text>

            {/* Category Cards */}
            <View style={styles.categoryGroup}>
              <TouchableOpacity
                onPress={() => setUserCategory('school_student')}
                style={[styles.catCard, userCategory === 'school_student' && styles.catCardActive]}
              >
                <View style={[styles.catIconBox, userCategory === 'school_student' && styles.catIconActive]}>
                  <School size={20} color={userCategory === 'school_student' ? '#FFF' : '#0D564D'} />
                </View>
                <View style={styles.catTextFlex}>
                  <Text style={styles.catTitle}>School Student</Text>
                  <Text style={styles.catSub}>Special student pricing & verified care</Text>
                </View>
                {userCategory === 'school_student' && <Check size={18} color="#0D564D" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUserCategory('college_student')}
                style={[styles.catCard, userCategory === 'college_student' && styles.catCardActive]}
              >
                <View style={[styles.catIconBox, userCategory === 'college_student' && styles.catIconActive]}>
                  <GraduationCap size={20} color={userCategory === 'college_student' ? '#FFF' : '#0D564D'} />
                </View>
                <View style={styles.catTextFlex}>
                  <Text style={styles.catTitle}>College Student</Text>
                  <Text style={styles.catSub}>Higher education student pricing</Text>
                </View>
                {userCategory === 'college_student' && <Check size={18} color="#0D564D" />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUserCategory('regular')}
                style={[styles.catCard, userCategory === 'regular' && styles.catCardActive]}
              >
                <View style={[styles.catIconBox, userCategory === 'regular' && styles.catIconActive]}>
                  <User size={20} color={userCategory === 'regular' ? '#FFF' : '#0D564D'} />
                </View>
                <View style={styles.catTextFlex}>
                  <Text style={styles.catTitle}>Regular Person / Adult</Text>
                  <Text style={styles.catSub}>Standard adult therapy care</Text>
                </View>
                {userCategory === 'regular' && <Check size={18} color="#0D564D" />}
              </TouchableOpacity>
            </View>

            {/* Phone & Referral */}
            <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.fieldLabel}>Referral Code (Optional)</Text>
            <TextInput
              value={referralCode}
              onChangeText={v => setReferralCode(v.toUpperCase())}
              placeholder="e.g. MMTP-A1B2C3"
              style={[styles.input, { fontFamily: 'Sora_600SemiBold' }]}
              placeholderTextColor="#A1A1AA"
              autoCapitalize="characters"
            />
            <Text style={styles.hintText}>Get 1 Free Counseling Session when using a valid referral code.</Text>

            {/* Student ID Upload Block */}
            {(userCategory === 'school_student' || userCategory === 'college_student') && (
              <View style={styles.studentBox}>
                <Text style={styles.fieldLabel}>School / College Name *</Text>
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
                  style={styles.selectBtn}
                >
                  <Text style={styles.selectBtnText}>
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
                    style={[styles.input, { marginTop: 8 }]}
                    placeholderTextColor="#A1A1AA"
                  />
                )}

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Upload Student ID Card Photo *</Text>
                <TouchableOpacity
                  onPress={handlePickStudentIdCard}
                  disabled={uploadingIdCard}
                  style={styles.uploadBtn}
                >
                  <Upload size={18} color="#0D564D" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>
                    {uploadingIdCard
                      ? 'Uploading ID Card...'
                      : studentIdCardUrl
                      ? 'Change Uploaded ID Card'
                      : 'Upload Student ID Card Photo (Mandatory)'}
                  </Text>
                </TouchableOpacity>

                {studentIdCardUrl ? (
                  <View style={styles.previewBox}>
                    <Image source={{ uri: studentIdCardUrl }} style={styles.previewImage} />
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.verifiedText}>Uploaded ✓ (Pending Admin Verification)</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              disabled={loading}
              onPress={finishOnboarding}
              style={[styles.btnPrimary, { marginTop: 24 }]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnPrimaryText}>Go to Dashboard →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  appTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 26,
    color: '#0D564D',
  },
  appSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: '#6F7977',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8E8E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  stepTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: '#1A1C1C',
    marginBottom: 6,
  },
  stepDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#6F7977',
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: '#1A1C1C',
    marginBottom: 20,
  },
  categoryGroup: {
    gap: 10,
    marginBottom: 16,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F8',
    borderWidth: 1.5,
    borderColor: '#E8E8E7',
    borderRadius: 16,
    padding: 14,
  },
  catCardActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D564D',
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8E8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catIconActive: {
    backgroundColor: '#0D564D',
  },
  catTextFlex: {
    flex: 1,
  },
  catTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#1A1C1C',
  },
  catSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#6F7977',
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#6F7977',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
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
  hintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: '#6F7977',
    marginTop: 4,
  },
  studentBox: {
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#BFE3DC',
  },
  selectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFE3DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectBtnText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#1A1C1C',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0D564D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  uploadBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#0D564D',
  },
  previewBox: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFE3DC',
  },
  previewImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  verifiedText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  btnPrimary: {
    backgroundColor: '#0D564D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});

export default OnboardingScreen;
