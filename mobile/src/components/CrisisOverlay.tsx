import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { X, Phone, Heart } from 'lucide-react-native';
import { Theme } from '../theme';
import { CRISIS_HELPLINES } from '../lib/crisis';

interface CrisisOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const CrisisOverlay: React.FC<CrisisOverlayProps> = ({ open, onClose }) => {
  const handleCall = (phone: string) => {
    const cleanNumber = phone.split('/')[0].trim();
    Linking.openURL(`tel:${cleanNumber}`);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={open}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 justify-center items-center p-5">
        <View className="w-full max-h-[80%] bg-white rounded-3xl overflow-hidden border-t-[6px] border-t-crisis shadow-2xl">
          <View className="flex-row justify-between items-center p-5 border-b border-surface-high">
            <View className="flex-row items-center gap-2">
              <Heart size={20} color={Theme.colors.crisis} />
              <Text className="font-sora-semibold text-xl text-crisis">You are not alone</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-surface-high justify-center items-center">
              <X size={20} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text className="font-jakarta text-[15px] text-on-surface-variant leading-6 mb-5">
              Please reach out. There are professionals waiting to support you right now. These helplines in India are completely free, confidential, and run 24/7.
            </Text>

            <View className="gap-3 mb-5">
              {CRISIS_HELPLINES.map((hl, i) => (
                <View key={i} className="flex-row justify-between items-center bg-surface-low p-4 rounded-2xl border border-surface-high">
                  <View className="flex-1 mr-3">
                    <Text className="font-sora-bold text-base text-on-surface mb-0.5">{hl.name}</Text>
                    <Text className="font-jakarta text-xs text-text-muted mb-1">Available: {hl.hours}</Text>
                    <Text className="font-sora-semibold text-sm text-primary">{hl.phone}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleCall(hl.phone)} 
                    className="flex-row items-center gap-1.5 bg-crisis px-4 py-2.5 rounded-full shadow-sm shadow-crisis/30"
                  >
                    <Phone size={16} color="#FFF" />
                    <Text className="font-sora-bold text-xs text-white">Call</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="bg-red-50 p-4 rounded-xl border border-red-200">
              <Text className="font-jakarta-medium text-xs text-red-900 leading-relaxed text-center">
                If you are in immediate physical danger, please visit the nearest hospital or contact emergency services (112).
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CrisisOverlay;
