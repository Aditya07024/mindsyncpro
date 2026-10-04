import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { ArrowRight, CheckCircle, ShieldCheck, FileText, Video, CreditCard, User, LogOut } from 'lucide-react-native';
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Counsellor Verification</Text>
        <Text style={styles.headerSubtitle}>Join the MyMindTherapyFriend Network</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepRow}>
        {[1, 2, 3, 4, 5].map(s => (
          <View
            key={s}
            style={[
              styles.stepBadge,
              step >= s ? styles.stepBadgeActive : styles.stepBadgeInactive,
            ]}
          >
            <Text style={[styles.stepNumber, step >= s && styles.textWhite]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Professional Details</Text>
            
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              value={formData.fullName}
              onChangeText={v => handleChange('fullName', v)}
              placeholder="Dr. Rajesh Kumar"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Qualification *</Text>
            <TextInput
              value={formData.qualification}
              onChangeText={v => handleChange('qualification', v)}
              placeholder="M.A. Clinical Psychology"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Experience Level *</Text>
            <View style={styles.optionList}>
              {[
                { key: 'less than 5 yr', label: '< 5 years' },
                { key: '5 to 10 yr', label: '5 to 10 years' },
                { key: '10 to 15 yr', label: '10 to 15 years' },
                { key: 'more than 15 yr', label: '> 15 years' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleChange('experienceCategory', opt.key)}
                  style={[styles.chip, formData.experienceCategory === opt.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, formData.experienceCategory === opt.key && styles.textWhite]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Specializations *</Text>
            <TextInput
              value={formData.specializations}
              onChangeText={v => handleChange('specializations', v)}
              placeholder="Anxiety, Depression, Trauma (comma separated)"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Organization Link *</Text>
            <TouchableOpacity
              onPress={() => handleChange('orgId', 'independent')}
              style={[styles.chip, formData.orgId === 'independent' && styles.chipActive, { width: '100%', marginBottom: 8 }]}
            >
              <Text style={[styles.chipText, formData.orgId === 'independent' && styles.textWhite]}>Independent Practitioner</Text>
            </TouchableOpacity>
            {verifiedOrgs.map(org => (
              <TouchableOpacity
                key={org._id}
                onPress={() => handleChange('orgId', org._id)}
                style={[styles.chip, formData.orgId === org._id && styles.chipActive, { width: '100%', marginBottom: 8 }]}
              >
                <Text style={[styles.chipText, formData.orgId === org._id && styles.textWhite]}>{org.name}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>Location / City *</Text>
            <TextInput
              value={formData.location}
              onChangeText={v => handleChange('location', v)}
              placeholder="e.g. Mumbai, Maharashtra"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <TouchableOpacity
              disabled={!formData.fullName || !formData.qualification || !formData.experienceCategory || !formData.orgId || !formData.location}
              onPress={() => setStep(2)}
              style={[styles.btnPrimary, (!formData.fullName || !formData.qualification || !formData.experienceCategory || !formData.orgId || !formData.location) && styles.btnDisabled]}
            >
              <Text style={styles.btnPrimaryText}>Next Step →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Payment Details</Text>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                <strong>Weekly Payouts:</strong> Payouts are transferred weekly for completed user sessions. Platform retains 30% service commission.
              </Text>
            </View>

            <Text style={styles.label}>UPI ID</Text>
            <TextInput
              value={formData.upiId}
              onChangeText={v => handleChange('upiId', v)}
              placeholder="drrajesh@upi"
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.orText}>— OR —</Text>

            <Text style={styles.label}>Bank Details</Text>
            <TextInput
              value={formData.bankDetails}
              onChangeText={v => handleChange('bankDetails', v)}
              placeholder="Account Name, A/C No, IFSC Code"
              multiline
              numberOfLines={3}
              style={[styles.input, { height: 80 }]}
              placeholderTextColor="#A1A1AA"
            />

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!formData.upiId && !formData.bankDetails}
                onPress={() => setStep(3)}
                style={[styles.btnPrimary, { flex: 1 }, (!formData.upiId && !formData.bankDetails) && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>Next Step →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Document Verification</Text>
            <Text style={styles.subText}>Provide viewable Cloud / Google Drive / Dropbox URLs for your credentials.</Text>

            <Text style={styles.label}>Degree Certificate URL *</Text>
            <TextInput
              value={formData.degreeUrl}
              onChangeText={v => handleChange('degreeUrl', v)}
              placeholder="https://drive.google.com/..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>License / Registration URL *</Text>
            <TextInput
              value={formData.licenseUrl}
              onChangeText={v => handleChange('licenseUrl', v)}
              placeholder="https://drive.google.com/..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <Text style={styles.label}>Government ID URL *</Text>
            <TextInput
              value={formData.governmentIdUrl}
              onChangeText={v => handleChange('governmentIdUrl', v)}
              placeholder="https://drive.google.com/..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setStep(2)} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!formData.degreeUrl || !formData.licenseUrl || !formData.governmentIdUrl}
                onPress={() => setStep(4)}
                style={[styles.btnPrimary, { flex: 1 }, (!formData.degreeUrl || !formData.licenseUrl || !formData.governmentIdUrl) && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>Next Step →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>4. Video Introduction</Text>
            <Text style={styles.subText}>Provide a 1-minute intro video link (YouTube, Drive, Loom, Vimeo) for potential clients.</Text>

            <Text style={styles.label}>Intro Video URL *</Text>
            <TextInput
              value={formData.introVideoUrl}
              onChangeText={v => handleChange('introVideoUrl', v)}
              placeholder="https://youtube.com/watch?v=..."
              style={styles.input}
              placeholderTextColor="#A1A1AA"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setStep(3)} style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading || !formData.introVideoUrl}
                onPress={submitOnboarding}
                style={[styles.btnPrimary, { flex: 1 }, (loading || !formData.introVideoUrl) && styles.btnDisabled]}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrimaryText}>Submit Profile</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={[styles.card, styles.lockCard]}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={36} color={Theme.colors.primary} />
            </View>
            <Text style={styles.lockTitle}>Application Under Review</Text>
            <Text style={styles.lockDesc}>
              Thank you for submitting your verification details. Our Super Admin team is carefully reviewing your credentials.
            </Text>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>
                You will be notified once your profile is marked as <strong>"Verified"</strong>. Dashboard access remains locked until approval.
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
    color: '#0D564D',
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
    backgroundColor: '#0D564D',
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
  chip: {
    backgroundColor: '#F9F9F8',
    borderWidth: 1,
    borderColor: '#E8E8E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#0D564D',
    borderColor: '#0D564D',
  },
  chipText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#1A1C1C',
  },
  optionList: {
    gap: 6,
  },
  orText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#6F7977',
    textAlign: 'center',
    marginVertical: 12,
  },
  noticeBox: {
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#BFE3DC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#0D564D',
    lineHeight: 16,
  },
  btnPrimary: {
    backgroundColor: '#0D564D',
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
    backgroundColor: '#E6F4F1',
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
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#BFE3DC',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  lockBadgeText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#0D564D',
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

export default TherapistOnboardingScreen;
