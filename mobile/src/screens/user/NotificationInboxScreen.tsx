import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react-native';
import API from '../../lib/api';
import { Theme } from '../../theme';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: 'booking' | 'approval' | 'crisis_alert' | 'system' | 'general';
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export const NotificationInboxScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await API.notification.list();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      await API.notification.markRead(id);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await API.notification.markAllRead();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getIcon = (type: string, read: boolean) => {
    const size = 20;

    switch (type) {
      case 'booking':
        return (
          <View className="w-11 h-11 rounded-2xl justify-center items-center bg-primary/15">
            <Calendar size={size} color={Theme.colors.primary} />
          </View>
        );
      case 'approval':
        return (
          <View className="w-11 h-11 rounded-2xl justify-center items-center bg-secondary/15">
            <CheckCircle size={size} color={Theme.colors.secondary} />
          </View>
        );
      case 'crisis_alert':
        return (
          <View className="w-11 h-11 rounded-2xl justify-center items-center bg-crisis/15">
            <AlertTriangle size={size} color={Theme.colors.error} />
          </View>
        );
      default:
        return (
          <View className="w-11 h-11 rounded-2xl justify-center items-center bg-[#E0E2E0]">
            <Info size={size} color={Theme.colors.onSurfaceVariant} />
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const timeFormatted = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!item.read) {
            handleMarkAsRead(item._id);
          }
        }}
        className={`rounded-3xl p-4 border shadow-sm ${
          !item.read ? 'border-primary/30 bg-primary/5' : 'bg-white border-[#E0E2E0]'
        }`}
      >
        <View className="flex-row gap-4">
          {getIcon(item.type, item.read)}
          <View className="flex-1 justify-center">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className={`text-[15px] flex-1 ${
                  !item.read ? 'text-onSurface font-sora-bold' : 'text-onSurfaceVariant font-sora'
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && <View className="w-2 h-2 rounded-full bg-primary ml-2" />}
            </View>
            <Text className="text-[13px] font-jakarta text-onSurfaceVariant leading-[18px] mb-1">{item.body}</Text>
            <Text className="text-[11px] font-jakarta text-[#71787D]">{timeFormatted}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const totalUnread = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#E0E2E0] bg-white">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-[#F0F2F1] justify-center items-center"
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color={Theme.colors.onSurface} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-sora-bold text-onSurface">Notifications</Text>
            {totalUnread > 0 && (
              <Text className="text-xs font-jakarta-bold text-primary -mt-0.5">{totalUnread} new alert{totalUnread > 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>

        {totalUnread > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            className="flex-row items-center gap-1 py-1.5 px-3 rounded-full bg-primary/10"
          >
            <Check size={16} color={Theme.colors.primary} />
            <Text className="text-xs font-jakarta-bold text-primary">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List Area */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text className="mt-3 font-jakarta text-[#71787D] text-sm">Gathering your inbox alerts...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="w-20 h-20 rounded-full bg-primary/10 justify-center items-center mb-4">
            <Bell size={40} color={Theme.colors.primary} style={{ opacity: 0.6 }} />
          </View>
          <Text className="text-lg font-sora-bold text-onSurface mb-2">Your MyMindTherapyFriend is quiet</Text>
          <Text className="text-[13px] font-jakarta text-[#71787D] text-center leading-5">
            All caught up! Dynamic alerts related to therapists, booking confirmations, subscription payments, and clinical updates will display here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchNotifications();
          }}
          contentContainerClassName="p-5 gap-3"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationInboxScreen;
