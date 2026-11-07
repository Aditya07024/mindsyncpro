import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { Theme } from '../theme';
import { API_URL } from '../lib/store';

interface PasswordModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  open,
  onSuccess,
  onCancel,
  title = 'Confidential Dashboard',
  description = 'Please enter the access code to view the Super Admin control panel.',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/verify-password-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPassword('');
        onSuccess();
      } else {
        Alert.alert('Access Denied', 'Invalid access code. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/75 justify-center items-center p-5">
        <View className="w-full bg-white rounded-3xl p-6 items-center shadow-2xl elevation-10">
          <View className="w-16 h-16 rounded-full bg-secondary-container/20 justify-center items-center mb-4">
            <Lock size={28} color={Theme.colors.secondary} />
          </View>
          
          <Text className="font-sora-bold text-xl text-on-surface text-center mb-2">{title}</Text>
          <Text className="font-jakarta text-sm text-text-muted text-center mb-6 leading-5">{description}</Text>

          <View className="w-full flex-row items-center border border-surface-high rounded-2xl bg-surface-low px-4 h-13 mb-6">
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Enter access code…"
              value={password}
              onChangeText={setPassword}
              className="flex-1 font-jakarta-medium text-base text-on-surface py-2"
              placeholderTextColor={Theme.colors.outline}
              autoFocus
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              className="p-2"
            >
              {showPassword ? (
                <EyeOff size={20} color={Theme.colors.outline} />
              ) : (
                <Eye size={20} color={Theme.colors.outline} />
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 h-12 justify-center items-center rounded-2xl bg-surface-low border border-surface-high"
              disabled={loading}
            >
              <Text className="font-jakarta-bold text-sm text-on-surface-variant">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={!password || loading}
              className={`flex-1 h-12 justify-center items-center rounded-2xl bg-secondary ${
                !password || loading ? 'opacity-50' : ''
              }`}
            >
              {loading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text className="font-sora-bold text-sm text-white">Submit</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PasswordModal;
