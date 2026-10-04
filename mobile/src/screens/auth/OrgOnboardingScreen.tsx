import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { Building2, Mail, FileText, CheckCircle, LogOut } from 'lucide-react-native';
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Organization Onboarding</Text>
        <Text style={styles.headerSubtitle}>Register your Company, NGO, or Institution</Text>
      </View>

      <View style={styles.stepRow}>
        {[1, 2, 3, 4].map(s => (
          <View key={s} style={[styles.stepBadge, step >= s ? styles.stepBadgeActive : styles.stepBadgeInactive]}>
            <Text style={[styles.stepNumber, step >= s && styles.textWhite]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Organization Details</Text>

            <Text style={styles.label}>Organization / College Name *</Text>
            <TextInput
              value={formData.name}
              onChangeText={v => handleChange('name', v)}
              placeholder="MyMindTherapyFriend University"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Type *</Text>
            <View style={styles.chipRow}>
              {[
                { key: 'company', label: 'Company' },
                { key: 'college', label: 'College / University' },
                { key: 'ngo', label: 'NGO / Trust' },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => handleChange('type', t.key)}
                  style={[styles.chip, formData.type === t.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, formData.type === t.key && styles.textWhite]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Contact Person *</Text>
            <TextInput
              value={formData.contactPerson}
              onChangeText={v => handleChange('contactPerson', v)}
              placeholder="Jane Doe"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              value={formData.phone}
              onChangeText={v => handleChange('phone', v)}
              placeholder="+91 9876543210"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Website</Text>
            <TextInput
              value={formData.website}
              onChangeText={v => handleChange('website', v)}
              placeholder="https://xyz.edu"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Headquarters Address</Text>
            <TextInput
              value={formData.address}
              onChangeText={v => handleChange('address', v)}
              placeholder="Full address"
              multiline
              numberOfLines={2}
              style={[styles.input, { height: 60 }]}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Therapy Payment Policy</Text>
            <TouchableOpacity
              onPress={() => handleChange('coverMemberTherapyFees', true)}
              style={[styles.policyOption, formData.coverMemberTherapyFees && styles.policyOptionActive]}
            >
              <Text style={styles.policyTitle}>Cover Member Fees (Free Sessions)</Text>
              <Text style={styles.policyDesc}>Organization pays therapy costs for linked members/students.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleChange('coverMemberTherapyFees', false)}
              style={[styles.policyOption, !formData.coverMemberTherapyFees && styles.policyOptionActive]}
            >
              <Text style={styles.policyTitle}>Members Pay Standard Fees</Text>
              <Text style={styles.policyDesc}>Members pay standard session fees when booking.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!formData.name || !formData.contactPerson || !formData.phone}
              onPress={() => setStep(2)}
              style={[styles.btnPrimary, (!formData.name || !formData.contactPerson || !formData.phone) && styles.btnDisabled]}
            >
              <Text style={styles.btnPrimaryText}>Next Step →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Official Contact Email</Text>
            <Text style={styles.subText}>Use an official organization email domain. Public email providers (Gmail, Yahoo) are not accepted.</Text>

            <Text style={styles.label}>Official Email *</Text>
            <TextInput
              value={formData.officialEmail}
              onChangeText={v => handleChange('officialEmail', v)}
              placeholder="admin@yourdomain.edu"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
            />

            {isPublicEmail && formData.officialEmail ? (
              <Text style={styles.errorText}>Please use an official domain email address, not a public provider.</Text>
            ) : null}

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!formData.officialEmail || isPublicEmail}
                onPress={() => setStep(3)}
                style={[styles.btnPrimary, { flex: 1 }, (!formData.officialEmail || isPublicEmail) && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>Next Step →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Document Verification</Text>
            <Text style={styles.subText}>Provide cloud links to your organization credentials.</Text>

            <Text style={styles.label}>Registration Certificate URL *</Text>
            <TextInput
              value={formData.registrationUrl}
              onChangeText={v => handleChange('registrationUrl', v)}
              placeholder="https://drive.google.com/..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Accreditation Proof (If College)</Text>
            <TextInput
              value={formData.accreditationUrl}
              onChangeText={v => handleChange('accreditationUrl', v)}
              placeholder="https://drive.google.com/..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Representative ID URL *</Text>
            <TextInput
              value={formData.governmentIdUrl}
              onChangeText={v => handleChange('governmentIdUrl', v)}
              placeholder="https://drive.google.com/..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setStep(2)} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading || !formData.registrationUrl || !formData.governmentIdUrl}
                onPress={submitOnboarding}
                style={[styles.btnPrimary, { flex: 1 }, (loading || !formData.registrationUrl || !formData.governmentIdUrl) && styles.btnDisabled]}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrimaryText}>Submit Profile</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={[styles.card, styles.lockCard]}>
            <View style={styles.iconCircle}>
              <CheckCircle size={36} color="#2563EB" />
            </View>
            <Text style={styles.lockTitle}>Application Under Review</Text>
            <Text style={styles.lockDesc}>
              Thank you for submitting your organization details. Our admin team will verify your documents and official domain.
            </Text>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>
                You will be notified once your organization is marked as <strong>"Verified"</strong>. Dashboard access remains locked until approval.
              </Text>
            </View>

            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <LogOut size={16} color="#6F7977" style={{ marginRight: 6 }} />
              <Text style={styles.signOutText}>Sign Out</Text>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    color: '#1E3A8A',
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#6F7977',
    marginTop: 2,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#2563EB',
  },
  stepBadgeInactive: {
    backgroundColor: '#E8E8E7',
  },
  stepNumber: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: '#6F7977',
  },
  textWhite: {
    color: '#FFFFFF',
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
  cardTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: '#1A1C1C',
    marginBottom: 12,
  },
  subText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#6F7977',
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
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
    fontSize: 14,
    color: '#1A1C1C',
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#1A1C1C',
  },
  policyOption: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  policyOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  policyTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#1A1C1C',
  },
  policyDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#6F7977',
    marginTop: 2,
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  btnSecondary: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#1A1C1C',
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#DC2626',
    fontSize: 12,
    marginTop: 10,
  },
  lockCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 36,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: '#1A1C1C',
    marginBottom: 8,
  },
  lockDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#6F7977',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  lockBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  lockBadgeText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: '#6F7977',
  },
});

export default OrgOnboardingScreen;
