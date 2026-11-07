import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ChevronRight,
  TrendingUp,
  Calendar,
  BookOpen,
  X,
  ShieldAlert,
  Lock
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

export const OrgMembersScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Subscription check query
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false
  });

  const isSubscribed = subData?.subscription?.status === 'active';

  // Query org members
  const { data: membersData, isLoading: isListLoading } = useQuery({
    queryKey: ['org-members'],
    queryFn: () => API.org.members(),
    retry: false
  });

  // Query specific member detail
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['org-member-detail', selectedMember?.id],
    queryFn: () => API.org.userDataForOrg(selectedMember.id),
    enabled: !!selectedMember?.id,
    retry: false
  });

  const handleOpenMember = (member: any) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😁';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    return '😢';
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        userFirstName="BITS Wellness"
        role="org_admin"
        navigation={navigation}
      />

      {isSubLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : !isSubscribed ? (
        <View className="flex-1 justify-center items-center p-5">
          <View className="bg-white rounded-3xl p-6 border border-[#E0E2E0] items-center shadow-sm">
            <View className="w-12 h-12 rounded-full bg-[#FFF2F2] justify-center items-center mb-4 border border-[#FFCDD2]">
              <Lock size={24} color={Theme.colors.primary} />
            </View>
            <Text className="font-sora text-lg text-onSurface text-center mb-2">
              Corporate Plan Required
            </Text>
            <Text className="font-jakarta text-[13px] text-[#71787D] text-center leading-[18px] px-4 mb-5">
              As an organization or wellness sponsor, you need an active subscription plan to activate employee wellness seats, link network practitioners, and track collective health metrics.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Plans', { role: 'org_admin' })}
              className="bg-primary px-5 py-3 rounded-2xl"
            >
              <Text className="font-jakarta-bold text-[13px] text-white">
                View Subscription Plans
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-5 pb-16 gap-4">
          <View className="gap-1">
            <Text className="font-sora text-base text-onSurface">Verified Roster Directory</Text>
            <Text className="font-jakarta text-xs text-[#71787D] leading-4">
              View active subscription seats allocated. Standard data privacy restrictions filter individual journaling texts to protect anonymity.
            </Text>
          </View>

          {isListLoading ? (
            <ActivityIndicator color={Theme.colors.primary} className="mt-6" />
          ) : !membersData?.members || membersData.members.length === 0 ? (
            <View className="items-center justify-center py-10 bg-white rounded-3xl border border-[#E0E2E0] gap-2">
              <Users size={40} color={Theme.colors.outline} />
              <Text className="font-jakarta text-[13px] text-outline text-center px-5">No verified members found in your workspace.</Text>
            </View>
          ) : (
            <View className="bg-white rounded-3xl border border-[#E0E2E0] overflow-hidden">
              {membersData.members.map((m: any) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => handleOpenMember(m)}
                  className="flex-row items-center p-4 border-b border-[#E0E2E0]"
                >
                  <View className="w-[38px] h-[38px] rounded-full bg-[#E6F4F1] items-center justify-center">
                    <Text className="font-sora text-sm text-primary">
                      {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>

                  <View className="flex-1 ml-3 gap-0.5">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="font-sora text-sm text-onSurface">{m.name || 'Unnamed Member'}</Text>
                      {m.role === 'therapist' ? (
                        <View className="bg-[#E6F4F1] px-1.5 py-0.5 rounded">
                          <Text className="font-jakarta-bold text-[9px] text-primary">Therapist</Text>
                        </View>
                      ) : (
                        <View className="bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                          <Text className="font-jakarta-bold text-[9px] text-outline">Employee</Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-jakarta text-[11px] text-[#71787D]">
                      {m.email || m.phoneMasked || 'No address'} · {m.department || 'General'}
                    </Text>
                  </View>

                  <ChevronRight size={16} color={Theme.colors.outline} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Member Details Modal Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/40 justify-end">
          <View className="bg-white rounded-t-[28px] max-h-[85%] pb-6">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-[#E0E2E0]">
              <View>
                <Text className="font-sora text-lg text-onSurface">{selectedMember?.name || 'Member Details'}</Text>
                <Text className="font-jakarta text-xs text-outline mt-0.5">
                  {selectedMember?.role === 'therapist' ? 'Affiliated Provider' : 'Verified Employee'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 rounded-full bg-[#F0F2F1] items-center justify-center">
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {isDetailLoading ? (
              <View className="p-10 items-center gap-3">
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text className="font-jakarta text-[13px] text-outline">Fetching clinical engagement stats...</Text>
              </View>
            ) : detailData ? (
              <ScrollView contentContainerClassName="p-5 gap-5">
                {/* Micro Bento Grid Stats */}
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl p-3 items-center gap-1">
                    <TrendingUp size={20} color={Theme.colors.primary} />
                    <Text className="font-sora-bold text-[22px] text-onSurface mt-0.5">{detailData.wellness?.avgMood ?? '—'}</Text>
                    <Text className="font-jakarta text-[10px] text-outline text-center">Avg Mood (10)</Text>
                  </View>
                  <View className="flex-1 bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl p-3 items-center gap-1">
                    <Calendar size={20} color={Theme.colors.secondary} />
                    <Text className="font-sora-bold text-[22px] text-onSurface mt-0.5">{detailData.wellness?.sessionCount ?? 0}</Text>
                    <Text className="font-jakarta text-[10px] text-outline text-center">Clinical Sessions</Text>
                  </View>
                  <View className="flex-1 bg-[#F0F2F1] border border-[#E0E2E0] rounded-2xl p-3 items-center gap-1">
                    <BookOpen size={20} color={Theme.colors.outline} />
                    <Text className="font-sora-bold text-[22px] text-onSurface mt-0.5">{detailData.wellness?.journalCount ?? 0}</Text>
                    <Text className="font-jakarta text-[10px] text-outline text-center">Journals Logs</Text>
                  </View>
                </View>

                {/* Privacy Banner */}
                <View className="flex-row bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-3 gap-2">
                  <ShieldAlert size={14} color="#856404" />
                  <Text className="flex-1 font-jakarta text-[11px] text-[#856404] leading-[15px]">
                    Individual journal contents are fully encrypted for patient privacy. Only quantitative scores and high-level trends are visible.
                  </Text>
                </View>

                {/* Mood Check-ins */}
                <View className="gap-3">
                  <Text className="font-sora text-base text-onSurface">Recent Mood Check-ins</Text>
                  {!detailData.wellness?.moodHistory || detailData.wellness.moodHistory.length === 0 ? (
                    <Text className="font-jakarta text-xs text-[#71787D] text-center mt-2.5">No mood check-ins logged recently.</Text>
                  ) : (
                    detailData.wellness.moodHistory.slice(0, 5).map((m: any, i: number) => (
                      <View key={i} className="flex-row items-center gap-3 py-2.5 border-b border-[#E0E2E0]">
                        <View className="w-9 h-9 rounded-full bg-[#F0F2F1] items-center justify-center border border-[#E0E2E0]">
                          <Text className="text-lg">{getMoodEmoji(m.score)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-jakarta-medium text-[13px] text-onSurface">{m.note || 'No note provided'}</Text>
                          <Text className="font-jakarta text-[11px] text-[#71787D] mt-0.5">
                            {new Date(m.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        <Text className="font-sora text-sm text-primary">{m.score}/10</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            ) : (
              <View className="p-10 items-center gap-3">
                <ShieldAlert size={36} color={Theme.colors.outline} />
                <Text className="font-jakarta text-[13px] text-outline text-center">Could not load wellness logs for this member.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrgMembersScreen;
