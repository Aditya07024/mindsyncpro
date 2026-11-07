import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme';

interface AppHeaderProps {
  userFirstName?: string;
  role?: string;
  onUpgradePress?: () => void;
  onProfilePress?: () => void;
  userImageUrl?: string;
  navigation?: any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  role = 'user',
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const fallbackNavigation = useNavigation();
  const activeNavigation = navigation || fallbackNavigation;
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const API = require('../lib/api').default;
        const res = await API.notification.list();
        if (active && res && Array.isArray(res.notifications)) {
          const count = res.notifications.filter((n: any) => !n.read).length;
          setUnreadCount(count);
        }
      } catch (err) {
        // Silent catch for dev/unauthenticated states
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View
      className="flex-row justify-between items-center px-4 pb-2 bg-surface border-b border-surface-high"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center gap-2">
        <View className="w-9 h-9 rounded-full bg-white justify-center items-center">
          <Image source={require('../../assets/logo.png')} className="w-[26px] h-[26px]" resizeMode="contain" />
        </View>
        <View>
          <Text className="font-sora-bold text-lg text-primary tracking-tight">MyMindTherapyFriend</Text>
          {role !== 'user' && (
            <Text className="font-jakarta-bold text-[9px] text-secondary tracking-wider -mt-0.5">
              {role.toUpperCase().replace('_', ' ')}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => {
            if (activeNavigation) {
              activeNavigation.navigate('Notifications');
            }
          }}
          className="p-2 relative justify-center items-center"
        >
          <Bell size={22} color={Theme.colors.onSurfaceVariant} />
          {unreadCount > 0 && (
            <View className="absolute top-0 right-0 bg-error rounded-full min-w-[16px] h-4 justify-center items-center px-1">
              <Text className="text-white text-[9px] font-jakarta-bold leading-[10px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AppHeader;
