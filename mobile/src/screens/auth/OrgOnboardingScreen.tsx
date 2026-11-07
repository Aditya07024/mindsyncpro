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
import { CheckCircle, LogOut } from 'lucide-react-native';
import { useClerk, useUser } from '@clerk/clerk-expo';
import API from '../../lib/api';

interface OrgOnboardingScreenProps {
  navigation: any;
  route: any;
}

export const OrgOnboardingScreen: React.FC<OrgOnboardingScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const { user } = useUser();
  const initialGate = route.params?.gate || 'not_started';

  const [step, setStep] = useState(initialGate === 'pending' ? 4 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'company',
    officialEmail: user?.emailAddresses?.[0]?.emailAddress || '',
    contactPerson: '',
    phone: '',
    address: '',
    website: '',
    registrationUrl: '',
    accreditationUrl: '',
    governmentIdUrl: '',
    coverMemberTherapyFees: false,
  });

  useEffect(() => {
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (userEmail) {
      setFormData(prev => ({ ...prev, officialEmail: userEmail }));
    }
  }, [user]);

  useEffect(() => {
    API.org.me().then((res: any) => {
      const status = res?.organization?.verificationStatus;
      if (status === 'verified') {
        navigation.reset({ index: 0, routes: [{ name: 'OrgTabs' }] });
      } else if (status === 'pending') {
        setStep(4);
      }
    }).catch(() => {});
  }, [navigation]);

  const publicEmailDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'icloud.com', 'aol.com', 'proton.me', 'protonmail.com', 'live.com',
  ];
  const emailDomain = (formData.officialEmail || '').split('@')[1]?.toLowerCase() || '';
  const isPublicEmail = publicEmailDomains.includes(emailDomain);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      await API.org.onboarding(formData);
      setStep(4);
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
    } catch (e) {}
  };

  return (
    <View className="flex-1 bg-[#FAFAF9]" style={{ paddingTop: Math.max(insets.top, 16) }}>
      <View className="px-5 py-4">
        <Text className="font-sora-bold text-[22px] text-blue-900">Organization Onboarding</Text>
        <Text className="font-jakarta-medium text-[13px] text-[#6F7977] mt-0.5">Register your Company, NGO, or Institution</Text>
      </View>

      <View className="flex-row justify-center gap-2.5 mb-4">
        {[1, 2, 3, 4].map(s => (
          <View key={s} className={`w-7 h-7 rounded-full justify-center items-center ${step >= s ? 'bg-blue-600' : 'bg-[#E8E8E7]'}`}>
            <Text className={`font-sora-bold text-xs ${step >= s ? 'text-white' : 'text-[#6F7977]'}`}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {step === 1 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-lg text-[#1A1C1C] mb-3">1. Organization Details</Text>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Organization / College Name *</Text>
            <TextInput
              value={formData.name}
              onChangeText={v => handleChange('name', v)}
              placeholder="MyMindTherapyFriend University"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Type *</Text>
            <View className="gap-2">
              {[
                { key: 'company', label: 'Company' },
                { key: 'college', label: 'College / University' },
                { key: 'ngo', label: 'NGO / Trust' },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => handleChange('type', t.key)}
                  className={`border rounded-xl px-3.5 py-2.5 ${formData.type === t.key ? 'bg-blue-600 border-blue-600' : 'bg-[#F9F9F8] border-[#E8E8E7]'}`}
                >
                  <Text className={`font-jakarta-semibold text-[13px] ${formData.type === t.key ? 'text-white' : 'text-[#1A1C1C]'}`}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Contact Person *</Text>
            <TextInput
              value={formData.contactPerson}
              onChangeText={v => handleChange('contactPerson', v)}
              placeholder="Jane Doe"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Phone Number *</Text>
            <TextInput
              value={formData.phone}
              onChangeText={v => handleChange('phone', v)}
              placeholder="+91 9876543210"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Website</Text>
            <TextInput
              value={formData.website}
              onChangeText={v => handleChange('website', v)}
              placeholder="https://xyz.edu"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Headquarters Address</Text>
            <TextInput
              value={formData.address}
              onChangeText={v => handleChange('address', v)}
              placeholder="Full address"
              multiline
              numberOfLines={2}
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C] h-16"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Therapy Payment Policy</Text>
            <TouchableOpacity
              onPress={() => handleChange('coverMemberTherapyFees', true)}
              className={`border rounded-2xl p-3.5 mb-2 ${formData.coverMemberTherapyFees ? 'bg-blue-50 border-blue-600' : 'bg-[#F9F9F8] border-[#E8E8E7]'}`}
            >
              <Text className="font-sora-semibold text-[13px] text-[#1A1C1C]">Cover Member Fees (Free Sessions)</Text>
              <Text className="font-jakarta text-[11px] text-[#6F7977] mt-0.5">Organization pays therapy costs for linked members/students.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleChange('coverMemberTherapyFees', false)}
              className={`border rounded-2xl p-3.5 mb-2 ${!formData.coverMemberTherapyFees ? 'bg-blue-50 border-blue-600' : 'bg-[#F9F9F8] border-[#E8E8E7]'}`}
            >
              <Text className="font-sora-semibold text-[13px] text-[#1A1C1C]">Members Pay Standard Fees</Text>
              <Text className="font-jakarta text-[11px] text-[#6F7977] mt-0.5">Members pay standard session fees when booking.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!formData.name || !formData.contactPerson || !formData.phone}
              onPress={() => setStep(2)}
              className={`bg-blue-600 rounded-2xl py-3.5 items-center justify-center mt-5 ${(!formData.name || !formData.contactPerson || !formData.phone) ? 'opacity-50' : ''}`}
            >
              <Text className="font-sora-semibold text-sm text-white">Next Step →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm">
            <Text className="font-sora-bold text-lg text-[#1A1C1C] mb-3">2. Official Contact Email</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] mb-4 leading-[18px]">
              Use an official organization email domain. Public email providers (Gmail, Yahoo) are not accepted.
            </Text>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Official Email *</Text>
            <TextInput
              value={formData.officialEmail}
              onChangeText={v => handleChange('officialEmail', v)}
              placeholder="admin@yourdomain.edu"
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
            />

            {isPublicEmail && formData.officialEmail ? (
              <Text className="font-jakarta-medium text-red-600 text-xs mt-2.5">
                Please use an official domain email address, not a public provider.
              </Text>
            ) : null}

            <View className="flex-row gap-2.5 mt-5">
              <TouchableOpacity onPress={() => setStep(1)} className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-2xl px-5 py-3.5 items-center">
                <Text className="font-sora-semibold text-sm text-[#1A1C1C]">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!formData.officialEmail || isPublicEmail}
                onPress={() => setStep(3)}
                className={`bg-blue-600 rounded-2xl py-3.5 items-center justify-center flex-1 ${(!formData.officialEmail || isPublicEmail) ? 'opacity-50' : ''}`}
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
              Provide cloud links to your organization credentials.
            </Text>

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Registration Certificate URL *</Text>
            <TextInput
              value={formData.registrationUrl}
              onChangeText={v => handleChange('registrationUrl', v)}
              placeholder="https://drive.google.com/..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Accreditation Proof (If College)</Text>
            <TextInput
              value={formData.accreditationUrl}
              onChangeText={v => handleChange('accreditationUrl', v)}
              placeholder="https://drive.google.com/..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            <Text className="font-sora-semibold text-[11px] text-[#6F7977] uppercase mt-3 mb-1.5">Representative ID URL *</Text>
            <TextInput
              value={formData.governmentIdUrl}
              onChangeText={v => handleChange('governmentIdUrl', v)}
              placeholder="https://drive.google.com/..."
              className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-xl px-3.5 py-2.5 font-jakarta text-sm text-[#1A1C1C]"
              placeholderTextColor="#A1A1AA"
            />

            {error ? <Text className="font-jakarta-medium text-red-600 text-xs mt-2.5">{error}</Text> : null}

            <View className="flex-row gap-2.5 mt-5">
              <TouchableOpacity onPress={() => setStep(2)} className="bg-[#F9F9F8] border border-[#E8E8E7] rounded-2xl px-5 py-3.5 items-center">
                <Text className="font-sora-semibold text-sm text-[#1A1C1C]">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading || !formData.registrationUrl || !formData.governmentIdUrl}
                onPress={submitOnboarding}
                className={`bg-blue-600 rounded-2xl py-3.5 items-center justify-center flex-1 ${(loading || !formData.registrationUrl || !formData.governmentIdUrl) ? 'opacity-50' : ''}`}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="font-sora-semibold text-sm text-white">Submit Profile</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View className="bg-white rounded-3xl p-6 border border-[#E8E8E7] shadow-sm items-center text-center py-9">
            <View className="w-16 h-16 rounded-full bg-blue-50 justify-center items-center mb-4">
              <CheckCircle size={36} color="#2563EB" />
            </View>
            <Text className="font-sora-bold text-xl text-[#1A1C1C] mb-2">Application Under Review</Text>
            <Text className="font-jakarta text-[13px] text-[#6F7977] text-center leading-5 mb-4">
              Thank you for submitting your organization details. Our admin team will verify your documents and official domain.
            </Text>
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 w-full mb-5">
              <Text className="font-jakarta-medium text-xs text-blue-900 text-center leading-[18px]">
                You will be notified once your organization is marked as "Verified". Dashboard access remains locked until approval.
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

export default OrgOnboardingScreen;
