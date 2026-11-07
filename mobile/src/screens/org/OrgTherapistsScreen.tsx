import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  Search,
  Clock,
  Trash2,
  Award,
  Shield,
  FileText,
  ExternalLink
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

export const OrgTherapistsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'invite' | 'sent'>('active');
  const [extSearch, setExtSearch] = useState('');
  const [extTherapists, setExtTherapists] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Subscription check query
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false
  });

  const isSubscribed = subData?.subscription?.status === 'active';
  const hasAffiliationFeature = subData?.config?.enableTherapistAffiliation !== false;

  // Queries
  const { data: activeTherapistsData, isLoading: isActiveLoading, refetch: refetchActive } = useQuery({
    queryKey: ['org-active-therapists'],
    queryFn: () => API.org.therapists().catch(() => ({ therapists: [] })),
    retry: false
  });

  const { data: pendingData, isLoading: isPendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['org-pending-therapists'],
    queryFn: () => API.org.pendingTherapists(),
    retry: false
  });

  const { data: invitationsData, refetch: refetchInvitations } = useQuery({
    queryKey: ['org-invitations'],
    queryFn: () => API.org.invitations(),
    retry: false
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (therapistId: string) => API.org.inviteTherapist({ therapistId }),
    onSuccess: () => {
      Alert.alert('Success', 'Invitation sent successfully!');
      refetchInvitations();
      setExtTherapists(prev => prev.map(t => t.id === inviteMutation.variables ? { ...t, alreadyInvited: true } : t));
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to send invitation');
    }
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => API.org.cancelInvitation(id),
    onSuccess: () => {
      Alert.alert('Cancelled', 'Invitation successfully cancelled.');
      refetchInvitations();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to cancel invitation');
    }
  });

  useEffect(() => {
    if (activeTab === 'invite') {
      handleSearchExternal();
    }
  }, [activeTab, invitationsData]);

  const handleVerifyTherapist = async (id: string, verified: boolean) => {
    setActionLoading(id);
    try {
      await API.org.verifyTherapist(id, { verified });
      Alert.alert(
        verified ? 'Approved' : 'Rejected',
        `Therapist has been successfully ${verified ? 'approved' : 'rejected'}.`
      );
      refetchPending();
      refetchActive();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTherapist = async (id: string, name: string) => {
    Alert.alert(
      'Remove Therapist',
      `Are you sure you want to remove ${name} from your organization network?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(id);
            try {
              await API.org.removeTherapist(id);
              Alert.alert('Success', `${name} has been removed.`);
              refetchActive();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove therapist');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleSearchExternal = async (queryText = extSearch) => {
    setIsSearching(true);
    try {
      const res = await API.therapist.list({ 
        search: queryText.trim() || undefined,
        openToCollaboration: true 
      });
      
      const invitedIds = (invitationsData?.invitations || []).map((inv: any) => 
        typeof inv.therapistId === 'object' ? inv.therapistId?._id || inv.therapistId?.id : inv.therapistId
      );
      
      const mapped = (res.therapists || []).map((t: any) => ({
        ...t,
        alreadyInvited: invitedIds.includes(t.id || t._id)
      }));
      
      setExtTherapists(mapped);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenDoc = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open document URL'));
    } else {
      Alert.alert('Not Available', 'Document link is not set.');
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="BITS Wellness"
        role="org_admin"
        navigation={navigation}
      />

      {/* Tabs segment */}
      <View className="flex-row bg-white border-b border-[#E0E2E0] px-2">
        {(['active', 'pending', 'invite', 'sent'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 items-center border-b-2 ${
              activeTab === tab ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text className={`text-[13px] ${
              activeTab === tab ? 'font-sora text-primary' : 'font-jakarta-medium text-outline'
            }`}>
              {tab === 'active' ? 'Active' : tab === 'pending' ? 'Pending' : tab === 'invite' ? 'Invite New' : 'Sent Invites'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isSubLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : !isSubscribed || !hasAffiliationFeature ? (
        <View className="flex-1 justify-center items-center p-5">
          <View className="bg-white rounded-3xl p-6 border border-[#E0E2E0] items-center shadow-sm">
            <View className="w-12 h-12 rounded-full bg-[#FFF2F2] justify-center items-center mb-4 border border-[#FFCDD2]">
              <Shield size={24} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora text-lg text-onSurface text-center mb-2">
              {!isSubscribed ? 'Corporate Plan Required' : 'Affiliation Network Locked'}
            </Text>
            <Text className="font-jakarta text-[13px] text-[#71787D] text-center leading-[18px] px-4 mb-5">
              {!isSubscribed 
                ? 'As an organization or wellness sponsor, you need an active subscription plan to activate employee wellness seats and link network practitioners.'
                : 'Your current subscription plan tier does not include the independent therapist affiliation network feature. Upgrade to link external certified practitioners.'}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Plans', { role: 'org_admin' })}
              className="bg-primary px-5 py-3 rounded-2xl"
            >
              <Text className="font-jakarta-bold text-[13px] text-white">
                {!isSubscribed ? 'View Subscription Plans' : 'Upgrade Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-5 pb-16 gap-4">
          {activeTab === 'active' && (
            <View className="gap-1">
              <Text className="font-sora text-base text-onSurface">Active Affiliated Therapists</Text>
              <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-3">
                Certified practitioners currently linked with your organization network.
              </Text>

              {isActiveLoading ? (
                <ActivityIndicator color={Theme.colors.primary} className="mt-6" />
              ) : !activeTherapistsData?.therapists || activeTherapistsData.therapists.length === 0 ? (
                <View className="items-center justify-center py-10 bg-white rounded-3xl border border-[#E0E2E0] gap-2">
                  <Users size={40} color={Theme.colors.outline} />
                  <Text className="font-jakarta text-[13px] text-outline">No active therapists linked yet.</Text>
                </View>
              ) : (
                activeTherapistsData.therapists.map((t: any) => (
                  <View key={t.id || t._id} className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-3 gap-3">
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="font-sora text-[15px] text-onSurface">{t.fullName || t.name}</Text>
                        <Text className="font-jakarta text-xs text-outline mt-0.5">{t.email || t.qualification}</Text>
                      </View>
                      <View className="bg-[#D4EDDA] px-2 py-1 rounded">
                        <Text className="font-jakarta-bold text-[10px] text-[#155724]">ACTIVE</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      disabled={actionLoading === (t.id || t._id)}
                      onPress={() => handleRemoveTherapist(t.id || t._id, t.fullName || t.name)}
                      className="flex-row items-center justify-center bg-[#FFF5F5] border border-[#FFE3E3] rounded-2xl py-2.5 gap-1.5 mt-1"
                    >
                      <Trash2 size={14} color="#FF6B6B" />
                      <Text className="font-sora text-xs text-[#FF6B6B]">Remove Therapist</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'pending' && (
            <View className="gap-1">
              <Text className="font-sora text-base text-onSurface">Pending Affiliations</Text>
              <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-3">
                Review and approve independent therapists seeking to link with your organization.
              </Text>

              {isPendingLoading ? (
                <ActivityIndicator color={Theme.colors.primary} className="mt-6" />
              ) : !pendingData?.therapists || pendingData.therapists.length === 0 ? (
                <View className="items-center justify-center py-10 bg-white rounded-3xl border border-[#E0E2E0] gap-2">
                  <Clock size={40} color={Theme.colors.outline} />
                  <Text className="font-jakarta text-[13px] text-outline">No pending therapists at this time.</Text>
                </View>
              ) : (
                pendingData.therapists.map((t: any) => (
                  <View key={t.id} className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-3 gap-3">
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="font-sora text-[15px] text-onSurface">{t.name}</Text>
                        <Text className="font-jakarta text-xs text-outline mt-0.5">{t.email}</Text>
                      </View>
                      <View className="bg-[#FFF3CD] px-2 py-1 rounded">
                        <Text className="font-jakarta-bold text-[10px] text-[#856404]">PENDING</Text>
                      </View>
                    </View>

                    <View className="gap-1.5">
                      <View className="flex-row items-center gap-2">
                        <Award size={14} color={Theme.colors.primary} />
                        <Text className="font-jakarta text-xs text-onSurfaceVariant">
                          <Text className="font-sora">Qualification: </Text>
                          {t.qualification || 'N/A'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Award size={14} color={Theme.colors.secondary} />
                        <Text className="font-jakarta text-xs text-onSurfaceVariant">
                          <Text className="font-sora">Experience: </Text>
                          {t.experienceYears || '0'} years
                        </Text>
                      </View>
                      {t.specializations && t.specializations.length > 0 && (
                        <View className="flex-row items-center gap-2">
                          <Award size={14} color={Theme.colors.outline} />
                          <Text className="font-jakarta text-xs text-onSurfaceVariant" numberOfLines={2}>
                            <Text className="font-sora">Specialisations: </Text>
                            {t.specializations.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Documents Row */}
                    <View className="flex-row gap-2.5 mt-0.5">
                      {t.documents?.degreeUrl && (
                        <TouchableOpacity
                          className="flex-row items-center bg-[#F0F2F1] px-2 py-1.5 rounded-md gap-1.5 border border-[#E0E2E0]"
                          onPress={() => handleOpenDoc(t.documents.degreeUrl)}
                        >
                          <FileText size={12} color={Theme.colors.primary} />
                          <Text className="font-jakarta-medium text-[11px] text-primary">Degree</Text>
                          <ExternalLink size={10} color={Theme.colors.primary} />
                        </TouchableOpacity>
                      )}
                      {t.documents?.licenseUrl && (
                        <TouchableOpacity
                          className="flex-row items-center bg-[#F0F2F1] px-2 py-1.5 rounded-md gap-1.5 border border-[#E0E2E0]"
                          onPress={() => handleOpenDoc(t.documents.licenseUrl)}
                        >
                          <FileText size={12} color={Theme.colors.primary} />
                          <Text className="font-jakarta-medium text-[11px] text-primary">License</Text>
                          <ExternalLink size={10} color={Theme.colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="flex-row gap-2 border-t border-[#E0E2E0] pt-2 mt-0.5">
                      <TouchableOpacity
                        disabled={actionLoading !== null}
                        onPress={() => handleVerifyTherapist(t.id, true)}
                        className={`flex-[2] h-[38px] bg-primary rounded-2xl justify-center items-center ${
                          actionLoading === t.id ? 'opacity-70' : ''
                        }`}
                      >
                        {actionLoading === t.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text className="font-sora text-xs text-white">Verify & Approve</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={actionLoading !== null}
                        onPress={() => handleVerifyTherapist(t.id, false)}
                        className={`flex-1 h-[38px] bg-[#FFF5F5] rounded-2xl border border-[#FFE3E3] justify-center items-center ${
                          actionLoading === t.id ? 'opacity-70' : ''
                        }`}
                      >
                        <Text className="font-sora text-xs text-[#FF6B6B]">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'invite' && (
            <View className="gap-1">
              <Text className="font-sora text-base text-onSurface">Invite Independent Therapists</Text>
              <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-3">
                Search for external certified practitioners on MyMindTherapyFriend and link them to your network.
              </Text>

              <View className="flex-row gap-2 mt-1">
                <TextInput
                  placeholder="Search by name, specialisation, or degree..."
                  placeholderTextColor={Theme.colors.outline}
                  value={extSearch}
                  onChangeText={setExtSearch}
                  className="flex-1 h-12 border border-[#E0E2E0] rounded-2xl px-3 text-[13px] font-jakarta text-onSurface bg-[#F0F2F1]"
                />
                <TouchableOpacity
                  onPress={() => handleSearchExternal()}
                  disabled={isSearching}
                  className="w-12 h-12 rounded-2xl bg-primary justify-center items-center"
                >
                  {isSearching ? <ActivityIndicator color="#FFF" /> : <Search size={18} color="#FFF" />}
                </TouchableOpacity>
              </View>

              {extTherapists.length > 0 ? (
                <View className="mt-4 gap-2">
                  <Text className="font-sora text-xs text-outline uppercase tracking-wider">Search Results</Text>
                  {extTherapists.map((t: any) => {
                    const isAlreadyLinked = !!t.orgId;
                    const isInvited = t.alreadyInvited;

                    return (
                      <View key={t.id} className="flex-row justify-between items-center bg-white rounded-2xl p-4 border border-[#E0E2E0]">
                        <View className="flex-1">
                          <Text className="font-sora text-sm text-onSurface">{t.name}</Text>
                          <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">
                            {t.qualification} · {t.experienceYears} yrs exp
                          </Text>
                        </View>
                        <TouchableOpacity
                          disabled={inviteMutation.isPending || isAlreadyLinked || isInvited}
                          onPress={() => inviteMutation.mutate(t.id)}
                          className={`border rounded-lg px-3 py-1.5 ${
                            isAlreadyLinked || isInvited ? 'border-[#E0E2E0] bg-[#F0F2F1]' : 'border-primary bg-white'
                          }`}
                        >
                          <Text className="font-sora text-[11px] text-primary">
                            {isAlreadyLinked ? 'Linked' : isInvited ? 'Invited' : 'Send Invite'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ) : (
                extSearch.trim() !== '' && !isSearching && (
                  <Text className="font-jakarta text-xs text-[#71787D] text-center mt-5">No therapists found matching "{extSearch}"</Text>
                )
              )}
            </View>
          )}

          {activeTab === 'sent' && (
            <View className="gap-1">
              <Text className="font-sora text-base text-onSurface">Sent Invitations</Text>
              <Text className="font-jakarta text-xs text-[#71787D] leading-4 mb-3">
                Track pending, accepted, or rejected invitation requests dispatched to external practitioners.
              </Text>

              {!invitationsData?.invitations || invitationsData.invitations.length === 0 ? (
                <View className="items-center justify-center py-10 bg-white rounded-3xl border border-[#E0E2E0] gap-2">
                  <Clock size={40} color={Theme.colors.outline} />
                  <Text className="font-jakarta text-[13px] text-outline">No sent invitations found.</Text>
                </View>
              ) : (
                invitationsData.invitations.map((inv: any) => {
                  const status = inv.status || 'pending';
                  const therapistName = inv.therapistId?.fullName || inv.therapistId?.name || 'Therapist';

                  return (
                    <View key={inv._id} className="bg-white rounded-3xl p-4 border border-[#E0E2E0] shadow-sm mb-3 gap-3">
                      <View className="flex-row justify-between items-start">
                        <View>
                          <Text className="font-sora text-[15px] text-onSurface">{therapistName}</Text>
                          <Text className="font-jakarta text-xs text-outline mt-0.5">
                            Sent: {new Date(inv.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View
                          className={`px-2 py-1 rounded ${
                            status === 'accepted' ? 'bg-[#D4EDDA]' :
                            status === 'rejected' ? 'bg-[#F8D7DA]' : 'bg-[#FFF3CD]'
                          }`}
                        >
                          <Text
                            className={`font-jakarta-bold text-[10px] ${
                              status === 'accepted' ? 'text-[#155724]' :
                              status === 'rejected' ? 'text-[#721C24]' : 'text-[#856404]'
                            }`}
                          >
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {status === 'pending' && (
                        <TouchableOpacity
                          disabled={cancelInviteMutation.isPending}
                          onPress={() => cancelInviteMutation.mutate(inv._id)}
                          className="flex-row items-center justify-center bg-[#FFF5F5] border border-[#FFE3E3] rounded-2xl py-2.5 gap-1.5 mt-1"
                        >
                          <Trash2 size={14} color="#FF6B6B" />
                          <Text className="font-sora text-xs text-[#FF6B6B]">Cancel Invitation</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default OrgTherapistsScreen;
