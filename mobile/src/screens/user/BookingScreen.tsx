import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, CreditCard, ChevronRight, Gift, Check } from 'lucide-react-native';
import API from '../../lib/api';
import { TherapistData } from '../../components/TherapistCard';

const formatSlotDisplay = (slot: string) => {
  if (!slot) return '';
  if (slot.includes('AM') || slot.includes('PM')) {
    return slot;
  }
  const [hourStr, minStr] = slot.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(displayHour).padStart(2, '0')}:${minStr} ${ampm}`;
};

interface BookingScreenProps {
  navigation: any;
  route: any;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ navigation, route }) => {
  const therapist: TherapistData = route.params?.therapist;

  const therapistId = therapist?.id || therapist?._id;
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralInput, setReferralInput] = useState('');

  // Fetch user profile to check free session credits & referral status
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => API.user.profile(),
    retry: false,
  });
  const dbUser = profileData?.user;

  // Apply Referral Code Mutation
  const applyRefMutation = useMutation({
    mutationFn: (code: string) => API.auth.applyReferral({ referralCode: code }),
    onSuccess: (data: any) => {
      Alert.alert('🎁 1 Free Session Unlocked!', data?.message || 'Referral applied! Your session is now completely free.');
      setReferralInput('');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['therapist', therapistId] });
    },
    onError: (err: any) => {
      Alert.alert('Referral Error', err?.message || 'Invalid referral code. Please check and try again.');
    },
  });

  const rawFee = therapist?.sessionFee ?? therapist?.hourlyRate ?? 1500;
  const hasFreeCredit =
    (dbUser?.freeSessionCredits || 0) > 0 ||
    therapist?.pricingInfo?.hasFreeSessionCredit ||
    therapist?.pricingInfo?.isOrgCovered ||
    therapist?.sessionFee === 0;

  const totalFee = hasFreeCredit ? 0 : rawFee;

  // Generate next 7 days for the calendar date picker
  const [days, setDays] = useState<{ dateStr: string; dayName: string; dayNum: number }[]>([]);

  useEffect(() => {
    const list = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayVal}`;
      list.push({
        dateStr,
        dayName: weekdays[d.getDay()],
        dayNum: d.getDate(),
      });
    }
    setDays(list);
    // Auto select first day
    if (list.length > 0) setSelectedDate(list[0].dateStr);
  }, []);

  // Fetch slot availability from backend API
  const { data: remoteSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['availability', therapistId, selectedDate],
    queryFn: () => API.therapist.availability(therapistId, { date: selectedDate }),
    enabled: !!therapistId && !!selectedDate,
    retry: false,
  });

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();
  const isToday = selectedDate === todayStr;

  const slots = (remoteSlots?.openSlots || []).filter((s: string) => {
    if (!isToday) return true;
    const [hours, minutes] = s.split(':');
    const now = new Date();
    const slotTime = new Date();
    slotTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return slotTime > now;
  });

  const handleBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Slot Required', 'Please select an hour slot to book your session.');
      return;
    }

    const [hours, minutes] = selectedSlot.split(':');
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    console.log("[Booking] Initiating booking for slot:", dateTime.toISOString(), "with therapist:", therapistId);
    setLoading(true);
    try {
      // 1. Create booking in backend
      const bookingPayload = {
        therapistId: therapistId,
        slot: dateTime.toISOString(),
      };
      console.log("[Booking] Sending booking payload:", JSON.stringify(bookingPayload));
      const bookingRes = await API.booking.create(bookingPayload);
      console.log("[Booking] Booking response received:", JSON.stringify(bookingRes, null, 2));

      const bookingId = bookingRes?.booking?.id || bookingRes?.booking?._id || bookingRes?.id || bookingRes?._id;
      console.log("[Booking] Resolved bookingId:", bookingId);

      if (!bookingId) {
        console.error("[Booking] Error: No bookingId resolved!");
        throw new Error("Could not retrieve secure booking ID.");
      }

      // Check if booking is free
      const isFreeOrPaid = bookingRes?.booking?.payment?.paid || bookingRes?.booking?.payment?.amount === 0 || bookingRes?.booking?.status === 'confirmed';
      if (isFreeOrPaid) {
        setLoading(false);
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        queryClient.invalidateQueries({ queryKey: ['userDashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['userBookings'] });
        const successMsg = bookingRes?.booking?.usedFreeReferralCredit || hasFreeCredit
          ? 'Your booking has been confirmed for free using your referral session credit! 🎉'
          : 'Your booking has been confirmed successfully under your benefits.';
        Alert.alert('Session Confirmed! 🎉', successMsg);
        navigation.replace('UserTabs', { screen: 'Bookings' });
        return;
      }

      // 2. Initiate Razorpay Payment Link
      console.log("[Booking] Initiating payment link for bookingId:", bookingId);
      const paymentRes = await API.payment.initiate({ bookingId });
      console.log("[Booking] Payment link response received:", JSON.stringify(paymentRes, null, 2));
      const shortUrl = paymentRes?.shortUrl;
      console.log("[Booking] Extracted shortUrl:", shortUrl);

      if (!shortUrl) {
        console.error("[Booking] Error: No shortUrl found in payment link response!");
        throw new Error("Could not retrieve secure payment URL from Razorpay.");
      }

      // 3. Open Razorpay hosted page
      setLoading(false);
      console.log("[Booking] Launching browser for shortUrl:", shortUrl);
      await WebBrowser.openBrowserAsync(shortUrl);

      // 4. After browser closes, verify & confirm booking
      try {
        setLoading(true);
        console.log("[Booking] Checking payment status...");
        const statusRes = await API.payment.status(bookingId);
        console.log("[Booking] Payment status response:", JSON.stringify(statusRes, null, 2));

        if (statusRes?.paid) {
          Alert.alert('Session Confirmed!', 'Your booking has been confirmed successfully.');
          navigation.replace('UserTabs', { screen: 'Bookings' });
        } else {
          Alert.alert(
            'Payment Pending',
            'We could not verify your payment. Please complete the payment to confirm your booking.',
            [{ text: 'OK', onPress: () => navigation.replace('UserTabs', { screen: 'Bookings' }) }]
          );
        }
      } catch (verifyErr) {
        console.warn("[Booking] Payment status check failed:", verifyErr);
        Alert.alert(
          'Booking Registered',
          'Your payment status is being verified. Please check the Bookings tab for updates.',
          [{ text: 'OK', onPress: () => navigation.replace('UserTabs', { screen: 'Bookings' }) }]
        );
      } finally {
        setLoading(false);
      }

    } catch (err: any) {
      console.error("[Booking] Booking flow failed with error:", err);
      Alert.alert(
        'Payment Error',
        err?.message || 'Could not initiate payment. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
      <View className="pt-10 mb-1">
        <Text className="font-sora-bold text-2xl text-primary">Book Appointment</Text>
        <Text className="font-jakarta-medium text-sm text-[#4E615D] mt-0.5">With {therapist?.name}</Text>
      </View>

      {/* Date Picker */}
      <View className="gap-2.5">
        <View className="flex-row items-center gap-1.5">
          <CalendarIcon size={16} color="#0D564D" />
          <Text className="font-sora-semibold text-[15px] text-[#191C1B]">Select Date</Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {days.map(d => {
            const active = selectedDate === d.dateStr;
            return (
              <TouchableOpacity
                key={d.dateStr}
                onPress={() => {
                  setSelectedDate(d.dateStr);
                  setSelectedSlot('');
                }}
                className={`w-[60px] h-[70px] rounded-2xl justify-center items-center mr-2 gap-1 border ${active ? 'bg-primary border-primary' : 'bg-white border-[#DFEBE7]'}`}
              >
                <Text className={`font-jakarta text-[11px] ${active ? 'text-white' : 'text-[#717875]'}`}>{d.dayName}</Text>
                <Text className={`font-sora-bold text-base ${active ? 'text-white' : 'text-[#191C1B]'}`}>{d.dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Time Slot Picker */}
      <View className="gap-2.5">
        <View className="flex-row items-center gap-1.5">
          <Clock size={16} color="#0D564D" />
          <Text className="font-sora-semibold text-[15px] text-[#191C1B]">Select Hour</Text>
        </View>

        {slotsLoading ? (
          <ActivityIndicator size="small" color="#0D564D" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {slots.map((s: string) => {
              const active = selectedSlot === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedSlot(s)}
                  className={`w-[31%] rounded-2xl py-2.5 items-center border ${active ? 'bg-primary border-primary' : 'bg-white border-[#DFEBE7]'}`}
                >
                  <Text className={`font-jakarta-medium text-xs ${active ? 'text-white' : 'text-[#191C1B]'}`}>
                    {formatSlotDisplay(s)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Referral / Promo Code Section */}
      {!hasFreeCredit && !dbUser?.referredBy && (
        <View className="bg-teal-50/70 rounded-3xl p-4 border border-teal-200 gap-2">
          <View className="flex-row items-center gap-1.5">
            <Gift size={16} color="#0D564D" />
            <Text className="font-sora-semibold text-sm text-teal-800">Have a Referral Code?</Text>
          </View>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 h-[42px] bg-white border border-teal-200 rounded-2xl px-3 font-jakarta-medium text-[13px] text-slate-900"
              placeholder="e.g. MMTP-1A2B"
              placeholderTextColor="#94A3B8"
              value={referralInput}
              onChangeText={setReferralInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              className={`bg-primary px-4 rounded-2xl justify-center items-center ${(!referralInput.trim() || applyRefMutation.isPending) ? 'opacity-50' : ''}`}
              disabled={!referralInput.trim() || applyRefMutation.isPending}
              onPress={() => applyRefMutation.mutate(referralInput.trim())}
            >
              {applyRefMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text className="text-white font-jakarta-bold text-[13px]">Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text className="font-jakarta text-[11px] text-teal-700">Enter a friend's code to make this session 100% free!</Text>
        </View>
      )}

      {/* Free Session Active Banner */}
      {hasFreeCredit && (
        <View className="bg-emerald-50 rounded-3xl p-4 border-[1.5px] border-emerald-300 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Gift size={18} color="#047857" />
            <Text className="font-sora-semibold text-[15px] text-emerald-900">Free Session Credit Active 🎉</Text>
          </View>
          <Text className="font-jakarta text-xs text-emerald-700">
            Your referral/membership credit has been applied. This session will be 100% free!
          </Text>
        </View>
      )}

      {/* Total panel */}
      <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="font-jakarta text-[13px] text-[#4E615D]">Hourly Session</Text>
          <Text className="font-jakarta-bold text-sm text-[#191C1B]">₹{rawFee}</Text>
        </View>
        {hasFreeCredit ? (
          <View className="flex-row justify-between items-center">
            <Text className="font-jakarta text-[13px] text-emerald-700 font-semibold">Free Session Credit (100% OFF)</Text>
            <Text className="font-jakarta-bold text-sm text-emerald-700 font-bold">-₹{rawFee}</Text>
          </View>
        ) : (
          <View className="flex-row justify-between items-center">
            <Text className="font-jakarta text-[13px] text-[#4E615D]">Platform Fee</Text>
            <Text className="font-jakarta-bold text-sm text-[#191C1B]">₹0</Text>
          </View>
        )}
        <View className="h-[1px] bg-slate-100 my-1" />
        <View className="flex-row justify-between items-center">
          <Text className="font-sora-semibold text-[15px] text-[#191C1B]">Total Amount</Text>
          <Text className={`font-sora-bold text-lg ${hasFreeCredit ? 'text-emerald-700' : 'text-secondary'}`}>
            {hasFreeCredit ? '₹0 (FREE)' : `₹${totalFee}`}
          </Text>
        </View>
      </View>

      {/* Proceed payment button */}
      <TouchableOpacity 
        onPress={handleBooking} 
        disabled={loading}
        className={`flex-row h-[52px] rounded-full justify-center items-center gap-2 ${hasFreeCredit ? 'bg-emerald-600' : 'bg-primary'}`}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            {hasFreeCredit ? (
              <Check size={18} color="#FFF" />
            ) : (
              <CreditCard size={18} color="#FFF" />
            )}
            <Text className="text-white font-sora-semibold text-sm">
              {hasFreeCredit ? 'Confirm Free Session' : 'Proceed to Checkout'}
            </Text>
            <ChevronRight size={16} color="#FFF" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BookingScreen;
