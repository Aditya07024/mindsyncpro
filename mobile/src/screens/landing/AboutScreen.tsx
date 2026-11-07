import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react-native';

interface AboutScreenProps {
  navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <View className="items-center mb-4 text-center">
        <Text className="pt-6 font-sora-bold text-3xl text-primary">Our Mission</Text>
        <Text className="font-jakarta-medium text-sm text-[#4E615D] text-center leading-5 mt-1">
          To make premium, evidence-based mental health support culturally fluent, warm, and accessible to every Indian.
        </Text>
      </View>

      <View className="gap-2.5 mb-6">
        {/* Core pillar 1 */}
        <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm">
          <View className="w-11 h-11 rounded-2xl justify-center items-center mb-2.5 bg-primary/10">
            <Sparkles size={22} color="#0D564D" />
          </View>
          <Text className="font-sora-semibold text-base text-[#191C1B] mb-1">Manas: The Cultural Peer AI</Text>
          <Text className="font-jakarta text-[13px] text-[#4E615D] leading-[18px]">
            Trained to comprehend complex Indian socio-cultural structures, family dynamics, and linguistical nuances. Manas understands Hindi, English, and Hinglish natively, offering warm guidance without clinical coldness.
          </Text>
        </View>

        {/* Core pillar 2 */}
        <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm">
          <View className="w-11 h-11 rounded-2xl justify-center items-center mb-2.5 bg-secondary/15">
            <Heart size={22} color="#9D4223" />
          </View>
          <Text className="font-sora-semibold text-base text-[#191C1B] mb-1">Evidence-Based CBT</Text>
          <Text className="font-jakarta text-[13px] text-[#4E615D] leading-[18px]">
            Our interactive breathing guides, dynamic thought journals, and cognitive reframing toolsets are rooted in rigorous clinical psychology to help you build resilient daily coping skills.
          </Text>
        </View>

        {/* Core pillar 3 */}
        <View className="bg-white rounded-3xl p-4 border border-[#DFEBE7] shadow-sm">
          <View className="w-11 h-11 rounded-2xl justify-center items-center mb-2.5 bg-amber-500/15">
            <ShieldCheck size={22} color="#D97706" />
          </View>
          <Text className="font-sora-semibold text-base text-[#191C1B] mb-1">Strict Ethical Shield</Text>
          <Text className="font-jakarta text-[13px] text-[#4E615D] leading-[18px]">
            Zero-sharing policy on your sensitive journal logs or chat scripts. End-to-end anonymity on corporate dashboards, and direct active monitoring for crisis keywords with instant SOS interventions.
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Plans')} 
        className="bg-primary h-[52px] rounded-full justify-center items-center"
      >
        <Text className="text-white font-sora-semibold text-[15px]">Explore Subscriptions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AboutScreen;
