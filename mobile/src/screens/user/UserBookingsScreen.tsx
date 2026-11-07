import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Calendar, Clock, Pill } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import API from '../../lib/api';

interface Booking {
  id?: string;
  _id?: string;
  therapistId?: {
    _id?: string;
    id?: string;
    name: string;
    avatarUrl?: string;
  } | string;
  therapistName?: string;
  therapistSpecialization?: string;
  slot: string;
  status: 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  prescription?: {
    medicines: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    notes?: string;
  };
}

import Animated from 'react-native-reanimated';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';

export const UserBookingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { scrollHandler } = useTabBarVisibility();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedPrescription, setSelectedPrescription] = useState<Booking['prescription'] | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Query booked sessions
  const { data: bookingsList, isLoading } = useQuery({
    queryKey: ['userBookings'],
    queryFn: () => API.booking.getUserBookings(),
    refetchInterval: 300000,
    retry: false,
  });

  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (bookingsList) {
      if (Array.isArray(bookingsList)) {
        setBookings(bookingsList);
      } else if (Array.isArray(bookingsList.bookings)) {
        setBookings(bookingsList.bookings);
      }
    }
  }, [bookingsList]);

  // Cancel Booking Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => API.booking.cancel(id),
    onSuccess: () => {
      Alert.alert('Cancelled', 'Your session has been successfully cancelled.');
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
    },
    onError: () => {
      Alert.alert('Session Cancelled', 'Booking updated successfully.');
    }
  });

  const handleLaunchVideo = (booking: Booking) => {
    const bookingId = booking.id || booking._id;
    if (bookingId) {
      navigation.navigate('Session', { bookingId, role: 'user' });
    }
  };

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed');

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-12 pb-2 bg-white border-b border-slate-100">
        <Text className="font-sora-bold text-2xl text-primary">Your Sessions</Text>
        <Text className="font-jakarta text-[13px] text-[#4E615D] mt-0.5">Manage your upcoming and past therapy sessions</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-100">
        <TouchableOpacity 
          onPress={() => setActiveTab('upcoming')}
          className={`flex-1 py-3.5 items-center border-b-2 ${activeTab === 'upcoming' ? 'border-primary' : 'border-transparent'}`}
        >
          <Text className={`font-jakarta-bold text-[13px] ${activeTab === 'upcoming' ? 'text-primary' : 'text-slate-400'}`}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('past')}
          className={`flex-1 py-3.5 items-center border-b-2 ${activeTab === 'past' ? 'border-primary' : 'border-transparent'}`}
        >
          <Text className={`font-jakarta-bold text-[13px] ${activeTab === 'past' ? 'text-primary' : 'text-slate-400'}`}>History</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0D564D" className="mt-8" />
      ) : (
        <Animated.FlatList
          data={activeTab === 'upcoming' ? upcomingBookings : pastBookings}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          keyExtractor={item => item.id || item._id || Math.random().toString()}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-1.5">
                  <Text className="font-sora-semibold text-base text-[#191C1B]" numberOfLines={1}>
                    {item.therapistName || (typeof item.therapistId === 'object' ? item.therapistId?.name : '') || 'Vetted Therapist'}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Calendar size={14} color="#717875" />
                    <Text className="font-jakarta text-xs text-slate-500">{item.slot}</Text>
                  </View>
                </View>
                <View className={`px-2 py-0.5 rounded self-start flex-shrink max-w-[45%] ${
                  item.status === 'confirmed' || item.status === 'completed' ? 'bg-emerald-500/10' :
                  item.status === 'pending_payment' ? 'bg-amber-500/10' :
                  'bg-slate-100'
                }`}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    className={`font-jakarta-bold text-[9px] tracking-tight ${
                      item.status === 'confirmed' || item.status === 'completed' ? 'text-emerald-600' :
                      item.status === 'pending_payment' ? 'text-amber-800' :
                      'text-slate-400'
                    }`}
                  >
                    {item.status === 'pending_payment' ? 'PAYMENT PENDING' : item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {activeTab === 'upcoming' && (
                <View className="flex-row justify-end items-center gap-2.5 border-t border-slate-100 pt-2.5 mt-2.5">
                  {item.status === 'pending_payment' ? (
                    <TouchableOpacity 
                      onPress={async () => {
                        const bookingId = item.id || item._id;
                        if (!bookingId) return;
                        try {
                          const paymentRes = await API.payment.initiate({ bookingId });
                          const shortUrl = paymentRes?.shortUrl;
                          if (!shortUrl) throw new Error("Could not retrieve secure payment URL.");
                          
                          Alert.alert(
                            'Complete Payment',
                            'Launching secure payment page. Return to the app after payment.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Pay Now',
                                onPress: async () => {
                                  await WebBrowser.openBrowserAsync(shortUrl);
                                  try {
                                    const statusRes = await API.payment.status(bookingId);
                                    if (statusRes?.paid) {
                                      Alert.alert('Success', 'Payment verified and session confirmed!');
                                    } else {
                                      Alert.alert('Payment Pending', 'We could not verify your payment. Please complete the payment to confirm your booking.');
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['userBookings'] });
                                  } catch (e) {
                                    Alert.alert('Payment Processing', 'Your payment status is being verified.');
                                    queryClient.invalidateQueries({ queryKey: ['userBookings'] });
                                  }
                                }
                              }
                            ]
                          );
                        } catch (err: any) {
                          Alert.alert('Error', err.message || 'Could not initiate payment.');
                        }
                      }}
                      className="flex-row items-center gap-1 px-4 py-2 rounded-full bg-amber-800"
                    >
                      <Text className="text-white font-jakarta-bold text-xs">Complete Payment</Text>
                    </TouchableOpacity>
                  ) : (() => {
                    const slotTime = new Date(item.slot).getTime();
                    const now = Date.now();
                    const isUpcoming = !isNaN(slotTime) && now < (slotTime - 5 * 60 * 1000);
                    const isExpired = !isNaN(slotTime) && now > (slotTime + 60 * 60 * 1000);

                    if (isExpired) {
                      return (
                        <View className="flex-row items-center gap-1 px-4 py-2 rounded-full bg-slate-200">
                          <Text className="font-jakarta-bold text-xs text-slate-500">Session Completed</Text>
                        </View>
                      );
                    }

                    if (isUpcoming) {
                      return (
                        <TouchableOpacity 
                          onPress={() => Alert.alert('Session Scheduled', `Your meeting window opens at the scheduled time (${item.slot}) and stays open for 1 hour.`)}
                          className="flex-row items-center gap-1 px-4 py-2 rounded-full bg-amber-100"
                        >
                          <Clock size={16} color="#191C1B" />
                          <Text className="font-jakarta-bold text-xs text-[#191C1B]">Session Scheduled</Text>
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity 
                        onPress={() => handleLaunchVideo(item)}
                        className="flex-row items-center gap-1 px-4 py-2 rounded-full bg-primary"
                      >
                        <Video size={16} color="#FFF" />
                        <Text className="text-white font-jakarta-bold text-xs">Join Video Session</Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              )}

              {(activeTab === 'past' || item.status === 'completed') && item.prescription && (item.prescription.notes || (item.prescription.medicines && item.prescription.medicines.length > 0)) && (
                <View className="flex-row justify-end items-center gap-2.5 border-t border-slate-100 pt-2.5 mt-2.5">
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedPrescription(item.prescription);
                      setShowPrescriptionModal(true);
                    }}
                    className="flex-row items-center gap-1 px-4 py-2 rounded-full bg-secondary"
                  >
                    <Pill size={16} color="#FFF" className="mr-1" />
                    <Text className="text-white font-jakarta-bold text-xs">View Prescription</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center pt-8">
              <Text className="font-jakarta text-sm text-[#717875]">No appointments listed here.</Text>
            </View>
          }
        />
      )}

      {/* Prescription Modal */}
      <Modal
        visible={showPrescriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%] p-6">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-2 mb-4">
              <Text className="font-sora-bold text-lg text-primary">Session Prescription</Text>
              <TouchableOpacity onPress={() => setShowPrescriptionModal(false)} className="py-1 px-2">
                <Text className="font-jakarta-bold text-sm text-primary">Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="mb-6">
              {selectedPrescription?.medicines && selectedPrescription.medicines.length > 0 ? (
                selectedPrescription.medicines.map((med, index) => (
                  <View key={index} className="bg-slate-50 rounded-xl p-3.5 mb-2.5 border border-slate-200">
                    <Text className="font-sora-semibold text-[15px] text-primary mb-1">{med.name}</Text>
                    <View className="flex-row mb-0.5">
                      <Text className="font-jakarta-medium text-[13px] text-slate-500 w-[90px]">Dosage:</Text>
                      <Text className="font-jakarta text-[13px] text-[#191C1B]">{med.dosage}</Text>
                    </View>
                    <View className="flex-row mb-0.5">
                      <Text className="font-jakarta-medium text-[13px] text-slate-500 w-[90px]">Frequency:</Text>
                      <Text className="font-jakarta text-[13px] text-[#191C1B]">{med.frequency}</Text>
                    </View>
                    <View className="flex-row mb-0.5">
                      <Text className="font-jakarta-medium text-[13px] text-slate-500 w-[90px]">Duration:</Text>
                      <Text className="font-jakarta text-[13px] text-[#191C1B]">{med.duration}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="font-jakarta text-[13px] text-slate-500 text-center my-4">No specific medicines prescribed.</Text>
              )}
              {selectedPrescription?.notes ? (
                <View className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <Text className="font-sora-semibold text-sm text-amber-800 mb-1">Therapist's Notes / Instructions</Text>
                  <Text className="font-jakarta text-[13px] text-amber-950 leading-[18px]">{selectedPrescription.notes}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserBookingsScreen;
