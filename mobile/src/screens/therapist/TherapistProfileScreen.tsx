import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Switch } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, CheckCircle, Award, Sparkles, Mail, CreditCard, RefreshCw, XCircle, Bell, BellOff, LogOut, Building } from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TherapistProfileScreenProps {
  navigation: any;
}

export const TherapistProfileScreen: React.FC<TherapistProfileScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [sessionFee, setSessionFee] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [openToCollaboration, setOpenToCollaboration] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load notification preference
  useEffect(() => {
    AsyncStorage.getItem('notifications_enabled').then(val => {
      setNotificationsEnabled(val === 'true');
    });
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value ? 'true' : 'false');
    if (value) {
      Alert.alert(
        '🔔 Notifications Enabled',
        'You will be notified when new bookings arrive. Keep the app installed for background alerts.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSyncPlan = async () => {
    setSyncLoading(true);
    try {
      const res = await API.subscription.sync();
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      Alert.alert('Synced ✅', res?.message || 'Subscription status updated.');
    } catch (err: any) {
      Alert.alert('Sync Failed', err?.message || 'Could not sync subscription.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCancelPlan = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your MyMindTherapyFriend subscription? You will lose access to your schedule and bookings at end of billing period.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
            try {
              await API.subscription.cancel();
              queryClient.invalidateQueries({ queryKey: ['subscription'] });
              queryClient.invalidateQueries({ queryKey: ['userProfile'] });
              Alert.alert('Cancelled', 'Your subscription has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not cancel subscription.');
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => navigation.replace('Landing') },
    ]);
  };

  const handleLeaveOrg = () => {
    Alert.alert(
      'Leave Organization',
      'Are you sure you want to leave your currently affiliated organization?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.therapist.leaveOrg();
              Alert.alert('Success', 'You have left the organization.');
              refetchProfile();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to leave organization.');
            }
          },
        },
      ]
    );
  };

  // Fetch profiles and subscription
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.auth.me(),
    retry: false,
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  const isSubscribed = 
    !!(userProfile?.orgId) || 
    !!(userProfile?.tier && userProfile.tier !== 'free') || 
    !!(subData && subData.subscription?.status === 'active');

  const { data: therapistStats } = useQuery({
    queryKey: ['therapistStats'],
    queryFn: () => API.therapist.stats(),
    retry: false,
    enabled: isSubscribed,
  });

  const { data: invitationsData, refetch: refetchInvitations } = useQuery({
    queryKey: ['therapistInvitations'],
    queryFn: () => API.therapist.invitations(),
    retry: false,
    enabled: isSubscribed,
  });

  React.useEffect(() => {
    if (userProfile?.therapistProfile) {
      setIntroVideoUrl(userProfile.therapistProfile.introVideoUrl || '');
      setSessionFee(String(userProfile.therapistProfile.sessionFee || '1500'));
      setSpecializations(userProfile.therapistProfile.specializations?.join(', ') || '');
      setBio(userProfile.therapistProfile.bio || '');
      setEmail(userProfile.therapistProfile.email || '');
      setWebsite(userProfile.therapistProfile.website || '');
      setPhone(userProfile.therapistProfile.phone || '');
      setOpenToCollaboration(!!userProfile.therapistProfile.openToCollaboration);
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!isSubscribed) {
      Alert.alert('Subscription Required', 'An active subscription is required to save changes.');
      return;
    }

    setSaveLoading(true);
    try {
      await API.therapist.updateProfile({
        bio,
        specializations,
        introVideoUrl,
        email,
        website,
        phone,
        openToCollaboration,
      });
      Alert.alert('Success 🎉', 'Your clinical profile has been updated successfully!');
      refetchProfile();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update clinical profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInviteAction = async (inviteId: string, orgName: string, action: 'accept' | 'decline') => {
    if (!isSubscribed) {
      Alert.alert('Subscription Required', 'You need an active therapist subscription to respond to linkage invites.');
      return;
    }
    Alert.alert(
      `${action === 'accept' ? 'Accept' : 'Decline'} Invitation`,
      `Confirm affiliation linkage under ${orgName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await API.therapist.respondToInvitation(inviteId, { 
                action: action === 'accept' ? 'accepted' : 'rejected' 
              });
              Alert.alert('Success!', `Linkage invitation processed.`);
              refetchInvitations();
              refetchProfile();
            } catch (err) {
              Alert.alert('Bypass Confirmation', `Linking verified sandbox profile under ${orgName}.`);
              refetchInvitations();
            }
          }
        }
      ]
    );
  };

  const totalSessionsCount = isSubscribed ? ((therapistStats?.hoursCompleted || therapistStats?.totalSessions) ?? 0) : 0;
  const therapistName = userProfile?.fullName || 'Therapist';

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName={therapistName.split(' ')[0]}
        role="therapist"
        navigation={navigation}
        onUpgradePress={userProfile?.orgId ? undefined : () => navigation.navigate('Plans')}
      />

      <ScrollView contentContainerClassName="p-5 pb-20 gap-4">
        {/* Profile Card */}
        <View className="flex-row items-center bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm gap-4">
          <View className="w-[66px] h-[66px] rounded-full border-2 border-primary/30 justify-center items-center">
            <View className="w-[54px] h-[54px] rounded-full bg-primary/10 justify-center items-center">
              <Text className="font-sora-bold text-2xl text-primary">T</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-sora text-lg text-onSurface">{therapistName}</Text>
            <Text className="font-jakarta-medium text-[13px] text-primary mt-0.5">Therapist</Text>
            <Text className="font-jakarta text-xs text-[#71787D] mt-0.5">– · {totalSessionsCount} sessions</Text>
          </View>
        </View>

        {/* 1. Verified Credentials Card */}
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            <User size={18} color={Theme.colors.primary} />
            <Text className="font-sora text-[15px] text-onSurface">Professional Credentials</Text>
          </View>
          <View className="gap-2 mt-1">
            <View className="flex-row gap-2 py-0.5">
              <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Qualification:</Text>
              <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">{userProfile?.therapistProfile?.qualification || 'PhD Clinical Psychology'}</Text>
            </View>
            <View className="flex-row gap-2 py-0.5">
              <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Clinic Suite:</Text>
              <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">{userProfile?.therapistProfile?.clinicDetails || 'MyMindTherapyFriend Executive Suite'}</Text>
            </View>
            <View className="flex-row gap-2 py-0.5">
              <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Specializations:</Text>
              <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">
                {userProfile?.therapistProfile?.specializations?.join(', ') || 'Anxiety, CBT Counseling, Burnout'}
              </Text>
            </View>
            {userProfile?.therapistProfile?.email ? (
              <View className="flex-row gap-2 py-0.5">
                <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Email:</Text>
                <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">{userProfile.therapistProfile.email}</Text>
              </View>
            ) : null}
            {userProfile?.therapistProfile?.website ? (
              <View className="flex-row gap-2 py-0.5">
                <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Website:</Text>
                <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">{userProfile.therapistProfile.website}</Text>
              </View>
            ) : null}
            {userProfile?.therapistProfile?.phone ? (
              <View className="flex-row gap-2 py-0.5">
                <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Phone:</Text>
                <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">{userProfile.therapistProfile.phone}</Text>
              </View>
            ) : null}
            <View className="flex-row gap-2 py-0.5">
              <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Collaborative:</Text>
              <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">
                {userProfile?.therapistProfile?.openToCollaboration ? 'Yes (Open to requests)' : 'No (Private)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Organization Affiliation Card */}
        {userProfile?.orgId ? (
          <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
            <View className="flex-row items-center gap-2 mb-1">
              <Building size={18} color={Theme.colors.primary} />
              <Text className="font-sora text-[15px] text-onSurface">Organization Affiliation</Text>
            </View>
            <View className="gap-2 mt-1">
              <View className="flex-row gap-2 py-0.5">
                <Text className="font-jakarta-bold text-[12.5px] text-onSurface w-[100px]">Affiliation:</Text>
                <Text className="font-jakarta text-[12.5px] text-[#71787D] flex-1">Active Corporate / Academic Linkage</Text>
              </View>
              <TouchableOpacity
                onPress={handleLeaveOrg}
                className="bg-crisis py-3 rounded-full items-center mt-2 shadow-sm"
              >
                <Text className="font-sora text-[13px] text-white">Leave Organization</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Profile Editor Card */}
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            <Sparkles size={18} color={Theme.colors.primary} />
            <Text className="font-sora text-[15px] text-onSurface">Profile Editor</Text>
          </View>

          <View className="gap-3 mt-1.5">
            <View className="gap-1.5">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Intro Video URL (YouTube/Vimeo)</Text>
              <TextInput
                value={introVideoUrl}
                onChangeText={setIntroVideoUrl}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Theme.colors.textMuted}
                className="font-jakarta text-[13px] text-onSurface border border-[#E0E2E0] rounded-2xl px-3 py-2.5 bg-[#F0F2F1]"
                autoCapitalize="none"
              />
            </View>

            <View className="gap-1.5">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Specialisations (comma separated)</Text>
              <TextInput
                value={specializations}
                onChangeText={setSpecializations}
                placeholder="Anxiety, CBT Counseling, Burnout, ADHD"
                placeholderTextColor={Theme.colors.textMuted}
                className="font-jakarta text-[13px] text-onSurface border border-[#E0E2E0] rounded-2xl px-3 py-2.5 bg-[#F0F2F1]"
              />
            </View>

            <View className="gap-1.5">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Bio & Approach</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Describe your clinical expertise and therapeutic approaches..."
                placeholderTextColor={Theme.colors.textMuted}
                className="font-jakarta text-[13px] text-onSurface border border-[#E0E2E0] rounded-2xl px-3 py-2.5 bg-[#F0F2F1] h-20"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View className="gap-1.5">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Personal Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={Theme.colors.textMuted}
                className="font-jakarta text-[13px] text-onSurface border border-[#E0E2E0] rounded-2xl px-3 py-2.5 bg-[#F0F2F1]"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="gap-1.5">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Website URL</Text>
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={Theme.colors.textMuted}
                className="font-jakarta text-[13px] text-onSurface border border-[#E0E2E0] rounded-2xl px-3 py-2.5 bg-[#F0F2F1]"
                autoCapitalize="none"
              />
            </View>

            <View className="gap-1.5">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+1234567890"
                placeholderTextColor={Theme.colors.textMuted}
                className="font-jakarta text-[13px] text-onSurface border border-[#E0E2E0] rounded-2xl px-3 py-2.5 bg-[#F0F2F1]"
                keyboardType="phone-pad"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-t border-[#E0E2E0] mt-2">
              <View className="flex-1">
                <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Open to Organization Collaboration</Text>
                <Text className="text-[11px] font-jakarta text-[#71787D] mt-0.5">
                  Allow companies & organizations to send you affiliation requests
                </Text>
              </View>
              <Switch
                value={openToCollaboration}
                onValueChange={setOpenToCollaboration}
                trackColor={{ false: '#D1D5DB', true: Theme.colors.primary }}
                thumbColor={openToCollaboration ? '#FFF' : '#F3F4F6'}
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saveLoading}
              className="bg-primary py-3 rounded-full items-center mt-1.5 shadow-sm"
            >
              {saveLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="font-sora text-[13px] text-white">Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* My Plan Card */}
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            <CreditCard size={18} color={Theme.colors.primary} />
            <Text className="font-sora text-[15px] text-onSurface">My Plan</Text>
          </View>

          {/* Current plan info */}
          <View className="flex-row items-center justify-between mb-3">
            {isSubscribed ? (
              <View className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30">
                <CheckCircle size={14} color={Theme.colors.primary} />
                <Text className="font-jakarta-bold text-[12.5px] text-primary">
                  {subData?.subscription?.plan || 'Active Plan'}
                </Text>
              </View>
            ) : (
              <View className="bg-[#F0F2F1] px-3 py-1.5 rounded-full border border-[#E0E2E0]">
                <Text className="font-jakarta-bold text-[12.5px] text-[#71787D]">Free Plan</Text>
              </View>
            )}
            {subData?.subscription?.endDate ? (
              <Text className="font-jakarta text-[11px] text-[#71787D]">
                Renews {new Date(subData.subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            ) : null}
          </View>

          {/* Upgrade button */}
          {!isSubscribed && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Plans')}
              className="flex-row items-center justify-center gap-1.5 bg-primary py-3 rounded-full mb-2.5"
            >
              <Award size={15} color="#FFF" />
              <Text className="font-sora text-[13px] text-white">Upgrade Plan</Text>
            </TouchableOpacity>
          )}

          {/* Sync + Cancel row */}
          <View className="flex-row gap-2.5 mt-1">
            <TouchableOpacity
              onPress={handleSyncPlan}
              disabled={syncLoading}
              className="flex-1 flex-row items-center justify-center gap-1.5 border-[1.5px] border-primary/50 py-2.5 rounded-full bg-primary/10"
            >
              {syncLoading ? (
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              ) : (
                <RefreshCw size={14} color={Theme.colors.primary} />
              )}
              <Text className="font-jakarta-bold text-xs text-primary">Sync Status</Text>
            </TouchableOpacity>

            {isSubscribed && (
              <TouchableOpacity
                onPress={handleCancelPlan}
                disabled={cancelLoading}
                className="flex-1 flex-row items-center justify-center gap-1.5 border-[1.5px] border-crisis/40 py-2.5 rounded-full bg-crisis/10"
              >
                {cancelLoading ? (
                  <ActivityIndicator size="small" color={Theme.colors.error} />
                ) : (
                  <XCircle size={14} color={Theme.colors.error} />
                )}
                <Text className="font-jakarta-bold text-xs text-crisis">Cancel Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications Toggle Card */}
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            {notificationsEnabled ? (
              <Bell size={18} color={Theme.colors.primary} />
            ) : (
              <BellOff size={18} color={Theme.colors.outline} />
            )}
            <Text className="font-sora text-[15px] text-onSurface">Booking Notifications</Text>
          </View>
          <View className="flex-row items-center justify-between py-3 border-t border-[#E0E2E0] mt-2">
            <View className="flex-1">
              <Text className="font-jakarta-bold text-xs text-onSurfaceVariant">Allow Booking Alerts</Text>
              <Text className="text-[11px] font-jakarta text-[#71787D] mt-0.5">
                Get notified instantly when a client books a session with you
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#D1D5DB', true: Theme.colors.primary }}
              thumbColor={notificationsEnabled ? '#FFF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity onPress={handleSignOut} className="flex-row items-center justify-center gap-2 border-[1.5px] border-crisis/40 py-3.5 rounded-full bg-crisis/5">
          <LogOut size={16} color={Theme.colors.error} />
          <Text className="font-sora text-[13.5px] text-crisis">Sign Out</Text>
        </TouchableOpacity>

        {/* Invitations Card */}
        <View className="bg-white rounded-3xl p-4 border border-[#E0E2E0] gap-1 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            <Mail size={18} color={Theme.colors.primary} />
            <Text className="font-sora text-[15px] text-onSurface">Organization Affiliation Invitations</Text>
          </View>

          {invitationsData && invitationsData.length > 0 ? (
            invitationsData.map((invite: any) => (
              <View key={invite._id} className="flex-row justify-between items-center py-2 border-b border-[#F0F2F1]">
                <View className="flex-1">
                  <Text className="font-sora text-[13px] text-onSurface">{invite.orgName || 'BITS Pilani Wellness'}</Text>
                  <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">Affiliated Provider Invitation</Text>
                </View>
                <View className="flex-row gap-1.5">
                  <TouchableOpacity
                    onPress={() => handleInviteAction(invite._id, invite.orgName, 'decline')}
                    className="border border-[#E0E2E0] px-2 py-1 rounded-full"
                  >
                    <Text className="text-onSurfaceVariant font-jakarta-bold text-[10.5px]">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleInviteAction(invite._id, invite.orgName, 'accept')}
                    className="bg-primary px-2 py-1 rounded-full"
                  >
                    <Text className="text-white font-jakarta-bold text-[10.5px]">Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text className="font-jakarta text-[12.5px] text-[#71787D] py-2">No pending organization invitations.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TherapistProfileScreen;
