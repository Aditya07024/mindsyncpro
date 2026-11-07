import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, DollarSign, ChevronDown, ChevronUp, Banknote } from 'lucide-react-native';
import API from '../../lib/api';
import { AppHeader } from '../../components/AppHeader';

interface SuperAdminEarningsScreenProps { navigation?: any; }

export const SuperAdminEarningsScreen: React.FC<SuperAdminEarningsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search] = useState('');

  const { data: therapistData, isLoading } = useQuery({
    queryKey: ['admin-therapist-earnings'],
    queryFn: () => API.admin.pendingTherapists(),
    retry: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-therapist-earnings'] });
    setRefreshing(false);
  };

  const therapists: any[] = (therapistData?.therapists ?? []).filter((t: any) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalGross = therapists.reduce((s: number, t: any) => s + (t.grossEarnings ?? 0), 0);
  const totalCommission = therapists.reduce((s: number, t: any) => s + (t.platformCommission ?? 0), 0);
  const totalPayout = therapists.reduce((s: number, t: any) => s + (t.totalPayout ?? 0), 0);
  const totalSessions = therapists.reduce((s: number, t: any) => s + (t.sessionsGiven ?? 0), 0);

  const handleMarkPaid = (therapistId: string, name: string, amount: number) => {
    Alert.prompt(
      'Confirm Payout',
      `Enter admin password to mark ₹${Math.round(amount * 0.70).toLocaleString('en-IN')} payout for ${name}:`,
      async (password) => {
        if (!password) return;
        try {
          await API.admin.markTherapistPaid(therapistId, { amount: Math.round(amount * 0.70), password });
          Alert.alert('✅ Done', `Payout recorded for ${name}.`);
          queryClient.invalidateQueries({ queryKey: ['admin-therapist-earnings'] });
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'Could not mark as paid.');
        }
      },
      'secure-text'
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader userFirstName="Admin" role="super_admin" navigation={navigation} />

      <ScrollView
        contentContainerClassName="p-4 pb-20 gap-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D564D" />}
      >
        <View>
          <Text className="font-sora-bold text-[22px] text-stone-900">Booking Earnings</Text>
          <Text className="font-jakarta text-xs text-stone-500 mt-0.5">Per-therapist booking revenue — tap a card to see individual bookings</Text>
        </View>

        {/* Platform-wide totals */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white rounded-2xl p-3 border border-blue-200 items-center gap-1 shadow-sm">
            <DollarSign size={18} color="#3b82f6" />
            <Text className="font-sora-bold text-[15px] text-blue-500 mt-0.5">₹{totalGross.toLocaleString('en-IN')}</Text>
            <Text className="font-jakarta-bold text-[10px] text-stone-500 text-center">Total Gross</Text>
            <Text className="font-jakarta text-[9px] text-stone-400 text-center">{totalSessions} paid sessions</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-3 border border-red-200 items-center gap-1 shadow-sm">
            <Wallet size={18} color="#ef4444" />
            <Text className="font-sora-bold text-[15px] text-red-500 mt-0.5">₹{totalCommission.toLocaleString('en-IN')}</Text>
            <Text className="font-jakarta-bold text-[10px] text-stone-500 text-center">Platform (30%)</Text>
            <Text className="font-jakarta text-[9px] text-stone-400 text-center">Commission retained</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-3 border border-emerald-200 items-center gap-1 shadow-sm">
            <TrendingUp size={18} color="#10b981" />
            <Text className="font-sora-bold text-[15px] text-emerald-500 mt-0.5">₹{totalPayout.toLocaleString('en-IN')}</Text>
            <Text className="font-jakarta-bold text-[10px] text-stone-500 text-center">Payout Due (70%)</Text>
            <Text className="font-jakarta text-[9px] text-stone-400 text-center">To therapists</Text>
          </View>
        </View>

        {/* Loading state */}
        {isLoading && <ActivityIndicator color="#0D564D" className="mt-8" />}

        {/* Per-therapist cards */}
        {!isLoading && therapists.map((t: any) => {
          const isExpanded = expandedId === String(t.id);
          const bookings: any[] = t.bookingDetails ?? [];

          return (
            <View key={String(t.id)} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              {/* Summary row */}
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : String(t.id))}
                className="flex-row items-center gap-3 p-4"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="font-sora-bold text-base text-primary">{t.name?.charAt(0) ?? 'T'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-sora-bold text-sm text-stone-900">{t.name}</Text>
                  <Text className="font-jakarta text-[11px] text-stone-500 mt-0.5">{t.email || 'No email'} · {t.sessionsGiven} paid sessions</Text>
                  <Text className="font-jakarta text-[10px] text-emerald-600 mt-0.5">
                    UPI: {t.upiId || t.upi || t.paymentDetails?.upiId || 'Not Provided'}
                  </Text>
                </View>
                {isExpanded ? <ChevronUp size={18} color="#78716C" /> : <ChevronDown size={18} color="#78716C" />}
              </TouchableOpacity>

              {/* Earnings row */}
              <View className="flex-row border-t border-stone-100 py-2.5 px-4">
                <View className="flex-1 items-center">
                  <Text className="font-jakarta text-[10px] text-stone-500">Gross</Text>
                  <Text className="font-sora-bold text-[13px] text-stone-900 mt-0.5">₹{(t.grossEarnings ?? 0).toLocaleString('en-IN')}</Text>
                </View>
                <View className="w-px bg-stone-100" />
                <View className="flex-1 items-center">
                  <Text className="font-jakarta text-[10px] text-stone-500">Fee (30%)</Text>
                  <Text className="font-sora-bold text-[13px] text-red-500 mt-0.5">-₹{(t.platformCommission ?? 0).toLocaleString('en-IN')}</Text>
                </View>
                <View className="w-px bg-stone-100" />
                <View className="flex-1 items-center">
                  <Text className="font-jakarta text-[10px] text-stone-500">Payout</Text>
                  <Text className="font-sora-bold text-[13px] text-emerald-500 mt-0.5">₹{(t.totalPayout ?? 0).toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <View className="mx-4 mb-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <Text className="font-jakarta-bold text-[10px] text-emerald-800">Payout UPI ID</Text>
                <Text className="font-sora-bold text-xs text-emerald-700 mt-0.5">
                  {t.upiId || t.upi || t.paymentDetails?.upiId || 'Not Provided'}
                </Text>
              </View>

              {/* Mark paid button */}
              {(t.totalPayout ?? 0) > 0 && (
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 mx-4 mb-3 bg-emerald-50 border border-emerald-200 py-2 px-3.5 rounded-full self-start"
                  onPress={() => handleMarkPaid(String(t.id), t.name, t.grossEarnings)}
                >
                  <Banknote size={14} color="#10b981" />
                  <Text className="font-jakarta-bold text-xs text-emerald-600">Mark Paid</Text>
                </TouchableOpacity>
              )}

              {/* Expanded booking list */}
              {isExpanded && (
                <View className="border-t border-stone-100 p-4">
                  <Text className="font-sora-bold text-xs text-stone-500 mb-2">All Bookings ({bookings.length})</Text>
                  {bookings.length === 0 ? (
                    <Text className="font-jakarta text-[13px] text-stone-400 text-center py-4">No bookings yet.</Text>
                  ) : (
                    bookings.map((b: any) => {
                      const isEarned = b.status === 'completed' || (b.status === 'confirmed' && b.paid);
                      return (
                        <View key={String(b.id)} className="flex-row items-center py-2.5 border-b border-stone-100">
                          <View className="flex-1">
                            <Text className="font-mono text-[11px] text-stone-400">#{String(b.id).slice(-6)}</Text>
                            <Text className="font-jakarta text-[11px] text-stone-500 mt-0.5">
                              {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </Text>
                          </View>
                          <View className="items-end gap-1">
                            <Text className="font-jakarta-bold text-[13px] text-stone-900">₹{(b.fee ?? 0).toLocaleString('en-IN')}</Text>
                            <View className={`px-2 py-0.5 rounded-full ${
                              b.status === 'completed' ? 'bg-blue-100' :
                              b.status === 'confirmed' ? 'bg-green-100' :
                              b.status === 'cancelled' ? 'bg-red-100' : 'bg-stone-100'
                            }`}>
                              <Text className={`font-jakarta-bold text-[9px] ${
                                b.status === 'completed' ? 'text-blue-700' :
                                b.status === 'confirmed' ? 'text-green-700' :
                                b.status === 'cancelled' ? 'text-red-600' : 'text-stone-500'
                              }`}>{b.status.toUpperCase()}</Text>
                            </View>
                            {isEarned && (
                              <Text className="font-jakarta-bold text-[11px] text-emerald-600">₹{Math.round((b.fee ?? 0) * 0.7).toLocaleString('en-IN')}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                  {/* Booking totals footer */}
                  {bookings.length > 0 && (
                    <View className="flex-row items-center justify-between mt-2.5 pt-2.5 border-t-2 border-stone-200">
                      <Text className="font-sora-bold text-xs text-stone-900 flex-1">Total ({t.sessionsGiven} paid)</Text>
                      <Text className="font-sora-bold text-[13px] text-stone-900">₹{(t.grossEarnings ?? 0).toLocaleString('en-IN')}</Text>
                      <Text className="font-sora-bold text-[13px] text-emerald-600 ml-2">→ ₹{(t.totalPayout ?? 0).toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {!isLoading && therapists.length === 0 && (
          <Text className="font-jakarta text-[13px] text-stone-400 text-center py-4">No therapists with bookings found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default SuperAdminEarningsScreen;
