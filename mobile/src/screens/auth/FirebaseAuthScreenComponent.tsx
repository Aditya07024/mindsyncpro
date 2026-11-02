import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Theme } from '../../theme';
import { routeSignedInUser } from '../../lib/roleRouter';
import API, { setTokenGetter } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface FirebaseAuthScreenProps {
  navigation: any;
  route: any;
}

export const FirebaseAuthScreenComponent: React.FC<FirebaseAuthScreenProps> = ({
  navigation,
  route,
}) => {
  const role = route.params?.role || 'user';
  const upgradePlan = route.params?.upgradePlan;
  const insets = useSafeAreaInsets();

  const { isSignedIn, getToken } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const completeAuthProcess = async () => {
    let recoveredRole = role;
    let recoveredUpgrade = upgradePlan;

    try {
      setTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
    } catch (e) {}

    try {
      const stashedRole = await AsyncStorage.getItem('intended_role');
      if (stashedRole) recoveredRole = stashedRole;
      const stashedUpgrade = await AsyncStorage.getItem('upgrade_plan');
      if (stashedUpgrade) recoveredUpgrade = stashedUpgrade;

      const res = await API.auth.setRole(recoveredRole);
      const confirmedRole = res?.user?.role || recoveredRole;

      await AsyncStorage.removeItem('intended_role');
      await AsyncStorage.removeItem('upgrade_plan');

      await routeSignedInUser(navigation, { role: confirmedRole, upgradePlan: recoveredUpgrade });
    } catch (err) {
      await AsyncStorage.removeItem('intended_role');
      await AsyncStorage.removeItem('upgrade_plan');
      await routeSignedInUser(navigation, { role: recoveredRole, upgradePlan: recoveredUpgrade });
    }
  };

  React.useEffect(() => {
    if (isSignedIn) {
      completeAuthProcess();
    }
  }, [isSignedIn]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
        await completeAuthProcess();
      } else {
        // For native mobile
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        await completeAuthProcess();
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Sign In Failed', err.message || 'Could not sign in with Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Theme.colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeContainer}>
              <ShieldCheck size={16} color={Theme.colors.primary} />
              <Text style={styles.badgeText}>Confidential & Encrypted</Text>
            </View>
            <Text style={styles.title}>Welcome to Safe Space</Text>
            <Text style={styles.subtitle}>
              Sign in with your Google account to access your personalized mental wellness dashboard.
            </Text>
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={Theme.colors.primary} size="small" />
            ) : (
              <View style={styles.googleContent}>
                <View style={styles.googleIconBox}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            One-click secure login. Zero passwords. Your data remains strictly confidential.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.textPrimary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 10px 25px rgba(28, 25, 23, 0.08)' } as any)
      : {
          elevation: 3,
        }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.primary,
    marginLeft: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: Theme.fonts.headingBold,
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' } as any)
      : {
          elevation: 1,
        }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#1C1917',
    fontSize: 15,
    fontFamily: Theme.fonts.bodyBold,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#A8A29E',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 16,
  },
});

export default FirebaseAuthScreenComponent;
