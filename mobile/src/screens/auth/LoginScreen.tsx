import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { User, Briefcase, Award, ChevronRight } from 'lucide-react-native';
import { PasswordModal } from '../../components/PasswordModal';

interface LoginScreenProps {
  navigation: any;
  route: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route }) => {
  const [gateOpen, setGateOpen] = useState(false);
  const selectedUpgrade = route.params?.upgradePlan;
  const hideUser = route.params?.hideUser;

  const handleRoleSelect = (role: string) => {
    if (role === 'super_admin') {
      setGateOpen(true);
    } else {
      navigation.navigate('ClerkAuth', { role, upgradePlan: selectedUpgrade });
    }
  };

  const handleAdminSuccess = () => {
    setGateOpen(false);
    navigation.navigate('ClerkAuth', { role: 'super_admin' });
  };

  return (
    <ScrollView 
      className="flex-1 bg-surface" 
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingTop: 42, paddingBottom: 52 }}
    >
      <View className="items-center mb-4 text-center">
        <Text className="font-sora-bold text-2xl text-primary text-center mb-1">Designed For Every Mind</Text>
        <Text className="font-sora text-lg text-[#191C1B] text-center mb-2 leading-6">{"One Platform.\nMultiple Wellness Experiences."}</Text>
        <Text className="font-jakarta text-[13px] text-[#4E615D] text-center leading-[18px] px-1">
          Whether you need emotional support, therapy tools, organisation wellness insights, or platform administration — MyMindTherapyFriend adapts to your role beautifully.
        </Text>
      </View>

      <View className="gap-2.5 mt-1">
        {/* User Card */}
        {!hideUser && (
          <TouchableOpacity 
            onPress={() => handleRoleSelect('user')} 
            className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm"
            activeOpacity={0.9}
          >
            <View className="flex-row items-center gap-2.5 mb-1.5">
              <View className="w-10 h-10 rounded-2xl justify-center items-center bg-primary/10">
                <User size={22} color="#0D564D" />
              </View>
              <Text className="font-sora-semibold text-base text-[#191C1B] flex-1">For Patient/User</Text>
            </View>
            <Text className="font-jakarta text-[12.5px] text-[#717875] leading-[17px] pl-1">
              For people: Chat with AI, use mood tools, and book real therapists
            </Text>
            <View className="flex-row items-center gap-1 bg-primary/10 py-1.5 px-3 rounded-full self-end mt-1">
              <Text className="font-sora-semibold text-xs text-primary">Enter Portal</Text>
              <ChevronRight size={14} color="#0D564D" />
            </View>
          </TouchableOpacity>
        )}

        {/* Therapist Card */}
        <TouchableOpacity 
          onPress={() => handleRoleSelect('therapist')} 
          className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm"
          activeOpacity={0.9}
        >
          <View className="flex-row items-center gap-2.5 mb-1.5">
            <View className="w-10 h-10 rounded-2xl justify-center items-center bg-secondary/15">
              <Briefcase size={22} color="#9D4223" />
            </View>
            <Text className="font-sora-semibold text-base text-[#191C1B] flex-1">Sign in for Therapist</Text>
          </View>
          <Text className="font-jakarta text-[12.5px] text-[#717875] leading-[17px] pl-1">
            Sign in for therapists: Manage client bookings, read notes, and do video calls
          </Text>
          <View className="flex-row items-center gap-1 bg-secondary/15 py-1.5 px-3 rounded-full self-end mt-1">
            <Text className="font-sora-semibold text-xs text-secondary">Enter Portal</Text>
            <ChevronRight size={14} color="#9D4223" />
          </View>
        </TouchableOpacity>

        {/* Org Admin Card */}
        <TouchableOpacity 
          onPress={() => handleRoleSelect('org_admin')} 
          className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm"
          activeOpacity={0.9}
        >
          <View className="flex-row items-center gap-2.5 mb-1.5">
            <View className="w-10 h-10 rounded-2xl justify-center items-center bg-amber-500/15">
              <Award size={22} color="#D97706" />
            </View>
            <Text className="font-sora-semibold text-base text-[#191C1B] flex-1">Organisation Admin</Text>
          </View>
          <Text className="font-jakarta text-[12.5px] text-[#717875] leading-[17px] pl-1">
            Anonymous team wellness analytics, seat management
          </Text>
          <View className="flex-row items-center gap-1 bg-amber-500/15 py-1.5 px-3 rounded-full self-end mt-1">
            <Text className="font-sora-semibold text-xs text-amber-700">Enter Portal</Text>
            <ChevronRight size={14} color="#D97706" />
          </View>
        </TouchableOpacity>
      </View>

      <PasswordModal
        open={gateOpen}
        onSuccess={handleAdminSuccess}
        onCancel={() => setGateOpen(false)}
      />
    </ScrollView>
  );
};

export default LoginScreen;
