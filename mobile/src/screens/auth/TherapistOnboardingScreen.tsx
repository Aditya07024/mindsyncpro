import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, LogOut } from 'lucide-react-native';
import { useClerk } from '@clerk/clerk-expo';
import API from '../../lib/api';

interface TherapistOnboardingScreenProps {
  navigation: any;
  route: any;
}

export const TherapistOnboardingScreen: React.FC<TherapistOnboardingScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const initialGate = route.params?.gate || 'not_started';

  const [step, setStep] = useState(initialGate === 'pending' ? 5 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedOrgs, setVerifiedOrgs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    qualification: '',
    experienceCategory: '',
    specializations: '',
    clinicDetails: '',
    degreeUrl: '',
    licenseUrl: '',
    governmentIdUrl: '',
    introVideoUrl: '',
    orgId: '',
    location: '',
    upiId: '',
    bankDetails: '',
  });

  useEffect(() => {
    API.org.verifiedOrgs().then(res => setVerifiedOrgs(res.organizations || [])).catch(() => setVerifiedOrgs([]));
  }, []);

  useEffect(() => {
    API.auth.me().then((me: any) => {
      const status = me?.therapistProfile?.verificationStatus;
      if (status === 'verified' || me?.therapistProfile?.verified === true) {
        navigation.reset({ index: 0, routes: [{ name: 'TherapistTabs' }] });
      } else if (status === 'pending' || (me?.therapistProfile?.qualification && me?.therapistProfile?.documents?.degreeUrl)) {
        setStep(5);
      }
    }).catch(() => {});
  }, [navigation]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      const specArray = formData.specializations.split(',').map(s => s.trim()).filter(Boolean);
      await API.auth.therapistOnboarding({
        ...formData,
        specializations: specArray,
        orgId: formData.orgId === 'independent' ? null : formData.orgId,
      });
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } catch (e) {
      // ignore
    }
  };

  return (
    <View className="flex-1 bg-[#FAFAF9]" style={{ paddingTop: Math.max(insets.top, 16) }}>
      <View className="px-5 py-4">
        <Text className="font-sora-bold text-[22px] text-primary">Counsellor Verification</Text>
        <Text className="font-jakarta-medium text-[13px] text-[#6F7977] mt-0.5">Join the MyMindTherapyFriend Network</Text>
      </View>

      {/* Step Indicator */}
      <View className="flex-row justify-center gap-2.5 mb-4">
        {[1, 2, 3, 4, 5].map(s => (
          <View
            key={s}
            className={`w-7 h-7 rounded-full justify-center items-center ${step >= s ? 'bg-primary' : 'bg-[#E8E8E7]'}`}
          >
            <Text className={`font-sora-bold text-xs ${step >= s ? 'text-white' : 'text-[#6F7977]'}`}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {step === 1 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-lg text-[#1A1C1C] mb-3">1. Professional Details</Text>
            
            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Full Name *</Text>
            <TextInput
              value={formData.fullName}
              onChangeText={v => handleChange('fullName', v)}
              placeholder="Dr. Rajesh Kumar"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Qualification *</Text>
            <TextInput
              value={formData.qualification}
              onChangeText={v => handleChange('qualification', v)}
              placeholder="M.A. Clinical Psychology"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Experience Level *</Text>
            <View className="gap-1.5">
              {[
                { key: 'less than 5 yr', label: '< 5 years' },
                { key: '5 to 10 yr', label: '5 to 10 years' },
                { key: '10 to 15 yr', label: '10 to 15 years' },
                { key: 'more than 15 yr', label: '> 15 years' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleChange('experienceCategory', opt.key)}
                  className={`border rounded-xl px-3.5 py-2.5 ${formData.experienceCategory === opt.key ? 'bg-primary border-primary' : 'bg-[#F9F9F8] border-[#E8E8E7]'}`}
                >
                  <Text className={`font-jakarta-semibold text-[13px] ${formData.experienceCategory === opt.key ? 'text-white' : 'text-[#1A1C1C]'}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Specializations *</Text>
            <TextInput
              value={formData.specializations}
              onChangeText={v => handleChange('specializations', v)}
              placeholder="Anxiety, Depression, Trauma (comma separated)"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Organization Link *</Text>
            <TouchableOpacity
              onPress={() => handleChange('orgId', 'independent')}
              className={`border rounded-xl px-3.5 py-2.5 w-full mb-2 ${formData.orgId === 'independent' ? 'bg-primary border-primary' : 'bg-[#F9F9F8] border-[#E8E8E7]'}`}
            >
              <Text className={`font-jakarta-semibold text-[13px] ${formData.orgId === 'independent' ? 'text-white' : 'text-[#1A1C1C]'}`}>
                Independent Practitioner
              </Text>
            </TouchableOpacity>
            {verifiedOrgs.map(org => (
              <TouchableOpacity
                key={org._id}
                onPress={() => handleChange('orgId', org._id)}
                className={`border rounded-xl px-3.5 py-2.5 w-full mb-2 ${formData.orgId === org._id ? 'bg-primary border-primary' : 'bg-[#F9F9F8] border-[#E8E8E7]'}`}
              >
                <Text className={`font-jakarta-semibold text-[13px] ${formData.orgId === org._id ? 'text-white' : 'text-[#1A1C1C]'}`}>
                  {org.name}
                </Text>
              </TouchableOpacity>
            ))}

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Location / City *</Text>
            <TextInput
              value={formData.location}
              onChangeText={v => handleChange('location', v)}
              placeholder="e.g. Mumbai, Maharashtra"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <TouchableOpacity
              disabled={!formData.fullName || !formData.qualification || !formData.experienceCategory || !formData.orgId || !formData.location}
              onPress={() => setStep(2)}
              className={`bg-primary rounded-2xl py-3.5 items-center justify-center mt-5 ${(!formData.fullName || !formData.qualification || !formData.experienceCategory || !formData.orgId || !formData.location) ? 'opacity-50' : ''}`}
            >
              <Text className="font-sora-semibold text-sm text-white">Next Step →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-lg text-[#1A1C1C] mb-3">2. Payment Details</Text>
            <View className="bg-[#E6F4F1] border border-[#BFE3DC] rounded-xl p-3 mb-3">
              <Text className="font-jakarta text-xs text-primary leading-4">
                Weekly Payouts: Payouts are transferred weekly for completed user sessions. Platform retains 30% service commission.
              </Text>
            </View>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">UPI ID</Text>
            <TextInput
              value={formData.upiId}
              onChangeText={v => handleChange('upiId', v)}
              placeholder="drrajesh@upi"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] text-center my-3">— OR —</Text>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Bank Details</Text>
            <TextInput
              value={formData.bankDetails}
              onChangeText={v => handleChange('bankDetails', v)}
              placeholder="Account Name, A/C No, IFSC Code"
              multiline
              numberOfLines={3}
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C] h-20"
              placeholderTextColor="#A1A1AA"
            />

            <View className="flex-row gap-2.5 mt-5">
              <TouchableOpacity onPress={() => setStep(1)} className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-2xl px-5 py-3.5 items-center">
                <Text className="font-sora-semibold text-sm text-[#1A1C1C]">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!formData.upiId && !formData.bankDetails}
                onPress={() => setStep(3)}
                className={`bg-primary rounded-2xl py-3.5 items-center justify-center flex-1 ${(!formData.upiId && !formData.bankDetails) ? 'opacity-50' : ''}`}
              >
                <Text className="font-sora-semibold text-sm text-white">Next Step →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-lg text-[#1A1C1C] mb-3">3. Document Verification</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] mb-4 leading-[18px]">
              Provide viewable Cloud / Google Drive / Dropbox URLs for your credentials.
            </Text>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Degree Certificate URL *</Text>
            <TextInput
              value={formData.degreeUrl}
              onChangeText={v => handleChange('degreeUrl', v)}
              placeholder="https://drive.google.com/..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">License / Registration URL *</Text>
            <TextInput
              value={formData.licenseUrl}
              onChangeText={v => handleChange('licenseUrl', v)}
              placeholder="https://drive.google.com/..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Government ID URL *</Text>
            <TextInput
              value={formData.governmentIdUrl}
              onChangeText={v => handleChange('governmentIdUrl', v)}
              placeholder="https://drive.google.com/..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <View className="flex-row gap-2.5 mt-5">
              <TouchableOpacity onPress={() => setStep(2)} className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-2xl px-5 py-3.5 items-center">
                <Text className="font-sora-semibold text-sm text-[#1A1C1C]">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!formData.degreeUrl || !formData.licenseUrl || !formData.governmentIdUrl}
                onPress={() => setStep(4)}
                className={`bg-primary rounded-2xl py-3.5 items-center justify-center flex-1 ${(!formData.degreeUrl || !formData.licenseUrl || !formData.governmentIdUrl) ? 'opacity-50' : ''}`}
              >
                <Text className="font-sora-semibold text-sm text-white">Next Step →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-lg text-[#1A1C1C] mb-3">4. Video Introduction</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] mb-4 leading-[18px]">
              Provide a 1-minute intro video link (YouTube, Drive, Loom, Vimeo) for potential clients.
            </Text>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Intro Video URL *</Text>
            <TextInput
              value={formData.introVideoUrl}
              onChangeText={v => handleChange('introVideoUrl', v)}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            {error ? <Text className="font-jakarta-medium text-red-600 text-xs mt-2.5">{error}</Text> : null}

            <View className="flex-row gap-2.5 mt-5">
              <TouchableOpacity onPress={() => setStep(3)} className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-2xl px-5 py-3.5 items-center">
                <Text className="font-sora-semibold text-sm text-[#1A1C1C]">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading || !formData.introVideoUrl}
                onPress={submitOnboarding}
                className={`bg-primary rounded-2xl py-3.5 items-center justify-center flex-1 ${(loading || !formData.introVideoUrl) ? 'opacity-50' : ''}`}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="font-sora-semibold text-sm text-white">Submit Profile</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 5 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm items-center text-center py-9">
            <View className="w-16 h-16 rounded-full bg-[#E6F4F1] justify-center items-center mb-4">
              <ShieldCheck size={36} color="#0D564D" />
            </View>
            <Text className="font-sora-bold text-xl text-[#1A1C1C] mb-2">Application Under Review</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] text-center leading-5 mb-4">
              Thank you for submitting your verification details. Our Super Admin team is carefully reviewing your credentials.
            </Text>
            <View className="bg-[#E6F4F1] border border-[#BFE3DC] rounded-2xl p-4 w-full mb-5">
              <Text className="font-jakarta-medium text-xs text-primary text-center leading-[18px]">
                You will be notified once your profile is marked as "Verified". Dashboard access remains locked until approval.
              </Text>
            </View>

            <TouchableOpacity onPress={handleSignOut} className="flex-row items-center py-2 px-4">
              <LogOut size={16} color="#6F7977" className="mr-1.5" />
              <Text className="font-sora-semibold text-[13px] text-[#6F7977]">Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TherapistOnboardingScreen;
