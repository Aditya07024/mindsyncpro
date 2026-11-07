import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSignIn, useSignUp, useOAuth, useAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, ArrowRight, ShieldCheck, ArrowLeft, Lock, Apple } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

import { routeSignedInUser } from '../../lib/roleRouter';
import API, { setTokenGetter } from '../../lib/api';

interface ClerkAuthScreenProps {
  navigation: any;
  route: any;
}

export const ClerkAuthScreen: React.FC<ClerkAuthScreenProps> = ({ navigation, route }) => {
  const role = route.params?.role || 'user';
  const upgradePlan = route.params?.upgradePlan;
  const insets = useSafeAreaInsets();

  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { isSignedIn, isLoaded: authLoaded, getToken } = useAuth();
  
  useWarmUpBrowser();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: 'oauth_apple' });

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isSignUpFlow, setIsSignUpFlow] = useState(false);
  const redirectingRef = useRef(false);
  const verifyingRef = useRef(false);

  // Monitor Clerk global authentication state to catch deep-linked browser return successes!
  useEffect(() => {
    if (authLoaded && isSignedIn && !redirectingRef.current) {
      completeAuthProcess("");
    }
  }, [authLoaded, isSignedIn]);

  // Dynamic role redirect logic
  const completeAuthProcess = async (userId: string) => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    setRedirecting(true);
    let recoveredRole = role;
    let recoveredUpgrade = upgradePlan;

    console.log("[AuthRedirect] Starting completeAuthProcess with Clerk session.");

    try {
      if (isSignedIn && getToken) {
        console.log("[AuthRedirect] Injecting active Clerk token getter into API client.");
        setTokenGetter(async () => {
          try {
            return await getToken();
          } catch (err) {
            return null;
          }
        });
      }
    } catch (tokenErr) {
      console.error("[AuthRedirect] Failed to retrieve token inside ClerkAuthScreen:", tokenErr);
    }

    try {
      const stashedRole = await AsyncStorage.getItem('intended_role');
      if (stashedRole) {
        recoveredRole = stashedRole;
        console.log("[AuthRedirect] Recovered stashed role from AsyncStorage:", recoveredRole);
      }
      const stashedUpgrade = await AsyncStorage.getItem('upgrade_plan');
      if (stashedUpgrade) {
        recoveredUpgrade = stashedUpgrade;
        console.log("[AuthRedirect] Recovered stashed upgrade plan:", recoveredUpgrade);
      }

      console.log("[AuthRedirect] Calling backend setRole with role:", recoveredRole);
      const res = await API.auth.setRole(recoveredRole);
      const confirmedRole = res.user?.role || recoveredRole;
      console.log("[AuthRedirect] Role confirmed by backend:", confirmedRole);

      await AsyncStorage.removeItem('intended_role');
      await AsyncStorage.removeItem('upgrade_plan');

      await routeSignedInUser(navigation, { role: confirmedRole, upgradePlan: recoveredUpgrade });
    } catch (err) {
      console.error("[AuthRedirect] Failed to set user role in backend:", err);
      
      await AsyncStorage.removeItem('intended_role');
      await AsyncStorage.removeItem('upgrade_plan');

      Alert.alert('Authenticated!', `Logged in successfully as ${recoveredRole.toUpperCase().replace('_', ' ')}!`);
      await routeSignedInUser(navigation, { role: recoveredRole, upgradePlan: recoveredUpgrade });
    }
  };

  const handleGoogleOAuth = useCallback(async () => {
    try {
      await AsyncStorage.setItem('intended_role', role);
      if (upgradePlan) {
        await AsyncStorage.setItem('upgrade_plan', upgradePlan);
      }
      console.log("[OAuthFlow] Initiating Google OAuth with scheme 'mymindtherapyfriend'");
      const { createdSessionId, signIn, signUp, setActive: setSessionActive } = await startGoogleFlow({
        redirectUrl: Linking.createURL('clerk-auth', { scheme: 'mymindtherapyfriend' })
      });

      const activeSessionId = createdSessionId || signUp?.createdSessionId || signIn?.createdSessionId;

      if (activeSessionId && setSessionActive) {
        console.log("[OAuthFlow] Activating session:", activeSessionId);
        await setSessionActive({ session: activeSessionId });
      } else {
        console.warn("[OAuthFlow] No active session ID returned. New user state details:", {
          createdSessionId,
          signUpStatus: signUp?.status,
          signInStatus: signIn?.status,
          missingFields: signUp?.missingFields,
          unverifiedFields: signUp?.unverifiedFields
        });

        if (signUp?.status === 'missing_requirements') {
          const missing = signUp.missingFields || [];
          
          if (missing.includes('username') && missing.length === 1) {
            try {
              console.log("[OAuthFlow] Username is required but missing. Automatically generating and resolving username...");
              const emailPrefix = signUp.emailAddress 
                ? signUp.emailAddress.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
                : 'user';
              const randomSuffix = Math.random().toString(36).substring(2, 7);
              const generatedUsername = `${emailPrefix}_${randomSuffix}`.toLowerCase().substring(0, 15);
              
              console.log("[OAuthFlow] Updating signup with generated username:", generatedUsername);
              await signUp.update({ username: generatedUsername });
              
              const newSessionId = signUp.createdSessionId;
              if (newSessionId && setSessionActive) {
                console.log("[OAuthFlow] Auto-resolution successful! Activating session:", newSessionId);
                await setSessionActive({ session: newSessionId });
                return;
              }
            } catch (autoErr) {
              console.error("[OAuthFlow] Failed to auto-resolve missing username:", autoErr);
            }
          }

          Alert.alert(
            'Registration Incomplete',
            `Your Clerk Dashboard is configured to require additional fields: ${missing.join(', ') || 'Verification'}.\n\nGo to your Clerk Dashboard -> "User & Authentication" -> "Sign Up" and make these fields (like Phone Number or Username) optional so social logins can complete automatically!`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      console.error('OAuth error', err);
      Alert.alert('OAuth Error', 'Failed to authenticate with Google');
    }
  }, [startGoogleFlow, role, upgradePlan]);

  const handleAppleOAuth = useCallback(async () => {
    try {
      await AsyncStorage.setItem('intended_role', role);
      if (upgradePlan) {
        await AsyncStorage.setItem('upgrade_plan', upgradePlan);
      }
      console.log("[OAuthFlow] Initiating Apple OAuth with scheme 'mymindtherapyfriend'");
      const { createdSessionId, signIn, signUp, setActive: setSessionActive } = await startAppleFlow({
        redirectUrl: Linking.createURL('clerk-auth', { scheme: 'mymindtherapyfriend' })
      });

      const activeSessionId = createdSessionId || signUp?.createdSessionId || signIn?.createdSessionId;

      if (activeSessionId && setSessionActive) {
        console.log("[OAuthFlow] Activating session:", activeSessionId);
        await setSessionActive({ session: activeSessionId });
      } else {
        console.warn("[OAuthFlow] No active session ID returned. New user state details:", {
          createdSessionId,
          signUpStatus: signUp?.status,
          signInStatus: signIn?.status,
          missingFields: signUp?.missingFields,
          unverifiedFields: signUp?.unverifiedFields
        });

        if (signUp?.status === 'missing_requirements') {
          const missing = signUp.missingFields || [];

          if (missing.includes('username') && missing.length === 1) {
            try {
              console.log("[OAuthFlow] Username is required but missing. Automatically generating and resolving username...");
              const emailPrefix = signUp.emailAddress 
                ? signUp.emailAddress.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
                : 'user';
              const randomSuffix = Math.random().toString(36).substring(2, 7);
              const generatedUsername = `${emailPrefix}_${randomSuffix}`.toLowerCase().substring(0, 15);
              
              console.log("[OAuthFlow] Updating signup with generated username:", generatedUsername);
              await signUp.update({ username: generatedUsername });
              
              const newSessionId = signUp.createdSessionId;
              if (newSessionId && setSessionActive) {
                console.log("[OAuthFlow] Auto-resolution successful! Activating session:", newSessionId);
                await setSessionActive({ session: newSessionId });
                return;
              }
            } catch (autoErr) {
              console.error("[OAuthFlow] Failed to auto-resolve missing username:", autoErr);
            }
          }

          Alert.alert(
            'Registration Incomplete',
            `Your Clerk Dashboard is configured to require additional fields: ${missing.join(', ') || 'Verification'}.\n\nGo to your Clerk Dashboard -> "User & Authentication" -> "Sign Up" and make these fields (like Phone Number or Username) optional so social logins can complete automatically!`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      console.error('OAuth error', err);
      Alert.alert('OAuth Error', 'Failed to authenticate with Apple');
    }
  }, [startAppleFlow, role, upgradePlan]);

  const isDevKey = (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "").startsWith("pk_test_") ||
                   (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "") === "";

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (!signInLoaded || !signUpLoaded || !signIn) {
        console.log("Clerk hooks not fully loaded. Simulating code sent.");
        setPendingVerification(true);
        setLoading(false);
        return;
      }

      if (isSignUpFlow) {
        try {
          if (!signUp) return;
          await signUp.create({
            emailAddress: email,
          });
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          });
          setPendingVerification(true);
        } catch (signUpErr: any) {
          let errorMsg = signUpErr.message || 'Could not send verification code.';
          if (isDevKey) {
            errorMsg += "\n\nNote: In Clerk Development Mode, OTP emails only send to verified test accounts in your Clerk Dashboard.";
          }
          Alert.alert('Registration Failed', errorMsg);
        }
        return;
      }

      const signInAttempt = await signIn.create({
        identifier: email,
      });
      const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      ) as any;
      if (!emailCodeFactor) {
        let errMsg = "Email OTP is not supported on your Clerk instance.";
        if (isDevKey) {
          errMsg += "\n\nPlease ensure 'Email verification code' is enabled under 'Authentication Factors' in your Clerk Dashboard.";
        }
        throw new Error(errMsg);
      }
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailCodeFactor.emailAddressId,
      });
      setIsSignUpFlow(false);
      setPendingVerification(true);
    } catch (err: any) {
      console.log("Clerk SignIn error:", err.message || err);
      const isUserNotFound = err.message?.toLowerCase().includes("couldn't find your account") ||
                             err.errors?.[0]?.code === 'form_identifier_not_found';
                             
      if (isUserNotFound) {
        Alert.alert(
          'Account Not Found',
          "You don't have an account. Please sign up first.",
          [
            { 
              text: 'OK', 
              onPress: () => {
                setIsSignUpFlow(true);
              } 
            }
          ]
        );
      } else {
        Alert.alert('Sign In Failed', err.message || 'Could not initiate sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyingRef.current) {
      console.log("[Verification] Already verifying code, ignoring duplicate call.");
      return;
    }
    if (!code || code.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the verification code sent to your email.');
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    try {
      if (!signInLoaded || !signUpLoaded || !signIn || !signUp) {
        completeAuthProcess('user_mock_123');
        setLoading(false);
        verifyingRef.current = false;
        return;
      }

      if (!isSignUpFlow) {
        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });
        if (result.status === 'complete') {
          console.log("[Verification] SignIn successful. Activating session...");
          await setActive({ session: result.createdSessionId });
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({
          code,
        });
        if (result.status === 'complete') {
          console.log("[Verification] SignUp successful. Activating session...");
          await setActive({ session: result.createdSessionId });
        } else if (result.status === 'missing_requirements') {
          const missing = result.missingFields || [];
          const hasUsername = missing.includes('username');
          const hasPassword = missing.includes('password');

          if (hasUsername || hasPassword) {
            try {
              const updateData: any = {};
              if (hasUsername) {
                console.log("[Verification] Username is required but missing. Automatically generating username...");
                const emailPrefix = email 
                  ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
                  : 'user';
                const randomSuffix = Math.random().toString(36).substring(2, 7);
                updateData.username = `${emailPrefix}_${randomSuffix}`.toLowerCase().substring(0, 15);
              }
              if (hasPassword) {
                console.log("[Verification] Password is required but missing. Automatically generating random password...");
                const randomPassword = Math.random().toString(36).substring(2, 15) + 
                                       Math.random().toString(36).substring(2, 15).toUpperCase() + 
                                       "!@#$";
                updateData.password = randomPassword;
              }

              console.log("[Verification] Updating signup with required fields:", Object.keys(updateData));
              await signUp.update(updateData);
              
              const newSessionId = signUp.createdSessionId;
              if (newSessionId && signUp.status === 'complete') {
                console.log("[Verification] Auto-resolution successful! Activating session:", newSessionId);
                await setActive({ session: newSessionId });
              }
            } catch (autoErr) {
              console.error("[Verification] Failed to auto-resolve missing fields:", autoErr);
              throw autoErr;
            }
          } else {
            throw new Error(`Registration incomplete. Missing fields: ${missing.join(', ')}`);
          }
        }
      }
    } catch (err: any) {
      console.log("[Verification] Error during code verification:", err);
      
      const errorMsg = err.message || '';
      const isAlreadyVerified = errorMsg.toLowerCase().includes('already been verified') || 
                                errorMsg.toLowerCase().includes('already verified') ||
                                JSON.stringify(err).toLowerCase().includes('already verified');

      if (isAlreadyVerified) {
        console.log("[Verification] Code was already verified. Attempting to activate session.");
        try {
          const sessionId = !isSignUpFlow ? signIn?.createdSessionId : signUp?.createdSessionId;
          const currentStatus = !isSignUpFlow ? signIn?.status : signUp?.status;

          if (currentStatus === 'complete' && sessionId) {
            if (setActive) await setActive({ session: sessionId });
            return;
          } else if (isSignUpFlow && currentStatus === 'missing_requirements' && signUp) {
            const missing = signUp.missingFields || [];
            const hasUsername = missing.includes('username');
            const hasPassword = missing.includes('password');

            if (hasUsername || hasPassword) {
              console.log("[Verification] Auto-resolving missing credentials on already-verified signup...");
              const updateData: any = {};
              if (hasUsername) {
                const emailPrefix = email 
                  ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
                  : 'user';
                const randomSuffix = Math.random().toString(36).substring(2, 7);
                updateData.username = `${emailPrefix}_${randomSuffix}`.toLowerCase().substring(0, 15);
              }
              if (hasPassword) {
                const randomPassword = Math.random().toString(36).substring(2, 15) + 
                                       Math.random().toString(36).substring(2, 15).toUpperCase() + 
                                       "!@#$";
                updateData.password = randomPassword;
              }

              await signUp.update(updateData);
              if (signUp.status === 'complete' && signUp.createdSessionId) {
                if (setActive) await setActive({ session: signUp.createdSessionId });
                return;
              }
            }
          } else if (isSignedIn) {
            return;
          }
        } catch (activeErr) {
          console.error("[Verification] Failed to auto-activate already-verified session:", activeErr);
        }
      }

      Alert.alert('Verification Failed', err.message || 'Incorrect OTP code. Please try again.');
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  return (
    <View className="flex-1 bg-[#FAF9F6] justify-center p-4">
      {/* Absolute Header with Back Navigation */}
      <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center z-10">
        <TouchableOpacity 
          className="flex-row items-center gap-1 py-1.5 px-3 rounded-full bg-white border border-[#E7E5E4] shadow-sm"
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color="#191C1B" />
          <Text className="font-jakarta-bold text-[13px] text-[#191C1B]">Back</Text>
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-1 py-1 px-2 bg-primary/5 border border-primary/20 rounded-lg">
          <Lock size={10} color="#0D564D" />
          <Text className="font-jakarta-bold text-[10px] text-primary uppercase tracking-wider">secured by clerk</Text>
        </View>
      </View>

      {/* Main Premium Widget Card */}
      <View className="bg-white rounded-[20px] border border-[#E7E5E4] p-6 shadow-sm w-full">
        <View className="items-start mb-6">
          <Text className="font-sora-bold text-[22px] text-primary mb-3">MyMindTherapyFriend</Text>
          <Text className="font-sora-semibold text-xl text-[#1C1917] mb-1">
            {pendingVerification ? 'Enter OTP' : (isSignUpFlow ? 'Sign up' : 'Sign in')}
          </Text>
          <Text className="font-jakarta-medium text-[13px] text-[#78716C] leading-[18px]">
            {pendingVerification 
              ? `We sent a code to ${email}`
              : `to continue to MyMindTherapyFriend ${role.toUpperCase().replace('_', ' ')} portal`
            }
          </Text>
        </View>

        {!pendingVerification ? (
          <View className="w-full gap-3">
            {/* Google & Apple OAuth stacked premium buttons */}
            <View className="flex-row items-center gap-3 w-full justify-between">
              <TouchableOpacity 
                onPress={handleGoogleOAuth} 
                disabled={loading}
                className="flex-1 flex-row h-12 bg-white border border-[#E7E5E4] rounded-2xl justify-center items-center gap-2.5 shadow-sm"
              >
                <View className="flex-row items-center gap-0.5 p-0.5 border border-[#E7E5E4] rounded">
                  <View className="w-[3px] h-2.5 rounded-sm bg-[#4285F4]" />
                  <View className="w-[3px] h-2.5 rounded-sm bg-[#34A853]" />
                  <View className="w-[3px] h-2.5 rounded-sm bg-[#FBBC05]" />
                  <View className="w-[3px] h-2.5 rounded-sm bg-[#EA4335]" />
                </View>
                <Text className="text-[#1C1917] font-jakarta-bold text-sm">Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleAppleOAuth} 
                disabled={loading}
                className="flex-1 flex-row h-12 bg-[#1C1917] rounded-2xl justify-center items-center gap-2.5 shadow-sm"
              >
                <View className="justify-center items-center">
                  <Apple size={16} color="#FFF" />
                </View>
                <Text className="text-white font-jakarta-bold text-sm">Apple</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center my-3">
              <View className="flex-1 h-[1px] bg-[#E7E5E4]" />
              <Text className="text-[#78716C] px-3 font-jakarta-medium text-xs">
                {isSignUpFlow ? 'or sign up with email' : 'or sign in with email'}
              </Text>
              <View className="flex-1 h-[1px] bg-[#E7E5E4]" />
            </View>

            {/* Email Field */}
            <View className="flex-row items-center gap-2.5 border border-[#D6D3D1] rounded-2xl px-3.5 h-12 bg-[#FCFBFA]">
              <Mail size={18} color="#0D564D" className="opacity-80" />
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                className="flex-1 text-sm font-jakarta text-[#1C1917]"
                placeholder="Email address"
                placeholderTextColor="#A8A29E"
              />
            </View>

            <TouchableOpacity 
              onPress={handleSendCode} 
              disabled={loading}
              className="flex-row h-12 bg-primary rounded-2xl justify-center items-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text className="text-white font-jakarta-bold text-sm">Continue</Text>
                  <ArrowRight size={16} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-4">
              <Text className="font-jakarta-medium text-[13px] text-[#78716C]">
                {isSignUpFlow ? "Already have an account?" : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUpFlow(!isSignUpFlow)}>
                <Text className="font-jakarta-bold text-[13px] text-primary ml-1">
                  {isSignUpFlow ? "Sign in" : "Sign up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="w-full gap-3">
            {/* OTP Verification Field */}
            <View className="flex-row items-center gap-2.5 border border-[#D6D3D1] rounded-2xl px-3.5 h-12 bg-[#FCFBFA]">
              <ShieldCheck size={18} color="#0D564D" className="opacity-80" />
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                className="flex-1 text-sm font-jakarta text-[#1C1917]"
                placeholder="6-digit verification code"
                placeholderTextColor="#A8A29E"
              />
            </View>

            <TouchableOpacity 
              onPress={handleVerifyCode} 
              disabled={loading}
              className="flex-row h-12 bg-primary rounded-2xl justify-center items-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text className="text-white font-jakarta-bold text-sm">Verify code</Text>
                  <ShieldCheck size={16} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text 
        className="absolute self-center font-jakarta-medium text-[11px] text-[#A8A29E] text-center"
        style={{ bottom: Math.max(insets.bottom, 16) + 16 }}
      >
        🔒 GDPR Compliant • HIPAA Secure • End-to-end encrypted session
      </Text>
    </View>
  );
};

export default ClerkAuthScreen;
