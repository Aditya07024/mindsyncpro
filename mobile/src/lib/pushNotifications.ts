/**
 * pushNotifications.ts — Expo Push Notification registration & listeners
 * Handles permission request, token retrieval, and foreground/background notification handling.
 * Safeguarded for Expo Go (SDK 53+ disabled remote push in Expo Go app client).
 */

import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';

/**
 * Check if the app is currently running inside the Expo Go app client.
 * Expo Go SDK 53+ has removed support for Android remote push notifications.
 * Apps running in Expo Go must skip loading `expo-notifications` to avoid immediate runtime errors.
 */
export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.executionEnvironment === 'storeClient';

// Safely lazy-load `expo-notifications` ONLY when NOT running in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('[Push] expo-notifications module could not be required:', e);
  }
}

/**
 * Request push notification permissions and get the Expo push token.
 * Returns the token string or null if permissions denied / not a physical device / running in Expo Go.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Push] Web platform detected — skipping push registration');
    return null;
  }

  if (isExpoGo || !Notifications) {
    console.log('[Push] Running inside Expo Go — remote notifications require a Development Build (SDK 53+)');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Push] Not a physical device — skipping push registration');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MyMindTherapyFriend',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E6E65',
        sound: 'default',
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted for push notifications');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      'faba91e4-7ec7-4b6e-9c72-4a56e7ab6ac2';

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
    } catch (tokenErr) {
      console.warn('[Push] Could not retrieve Expo push token (FCM/Expo Go limitation):', tokenErr);
      return null;
    }

    const token = tokenData?.data;
    if (token) {
      console.log('[Push] Registered Expo push token:', token);
    }

    return token || null;
  } catch (err) {
    console.error('[Push] Failed to register for push notifications:', err);
    return null;
  }
}

/**
 * Send the push token to the backend so it can send notifications to this device.
 */
export async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await API.auth.registerPushToken(token);
    console.log('[Push] Token sent to backend successfully');
  } catch (err) {
    console.error('[Push] Failed to send token to backend:', err);
  }
}

/**
 * Set up notification listeners for foreground and tap-to-open events.
 * Returns a cleanup function to remove the listeners.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationTapped?: (response: any) => void
): () => void {
  if (isExpoGo || !Notifications || Platform.OS === 'web') {
    return () => {};
  }

  try {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        console.log('[Push] Notification received in foreground:', notification.request.content.title);
        onNotificationReceived?.(notification);
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        console.log('[Push] Notification tapped:', response.notification.request.content.title);
        onNotificationTapped?.(response);
      }
    );

    return () => {
      receivedSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  } catch (err) {
    console.warn('[Push] Unable to setup notification listeners:', err);
    return () => {};
  }
}

/**
 * Check if the system has granted notifications permission.
 */
export async function checkNotificationPermissionStatus(): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGo || !Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('[Push] Error checking permissions status:', err);
    return false;
  }
}

/**
 * Synchronize and get the notification preference status (combines storage and system permission)
 */
export async function getNotificationsPreference(): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGo || !Notifications) return false;
  try {
    const storageVal = await AsyncStorage.getItem('notifications_enabled');
    const isStorageEnabled = storageVal === 'true';
    const hasSystemPermission = await checkNotificationPermissionStatus();
    
    if (isStorageEnabled && !hasSystemPermission) {
      await AsyncStorage.setItem('notifications_enabled', 'false');
      return false;
    }
    return isStorageEnabled && hasSystemPermission;
  } catch (err) {
    console.error('[Push] Error getting notifications preference:', err);
    return false;
  }
}

/**
 * Handle toggling the notification settings.
 * If enabling and permission is denied in system settings, it redirects the user to system settings.
 */
export async function handleNotificationToggle(
  enable: boolean,
  setNotificationsEnabledState: (val: boolean) => void
): Promise<void> {
  if (Platform.OS === 'web') {
    Alert.alert('Not Supported', 'Push notifications are not supported on web.');
    setNotificationsEnabledState(false);
    return;
  }

  if (isExpoGo || !Notifications) {
    Alert.alert(
      'Expo Go Notice',
      'Remote Push Notifications were removed from Expo Go in SDK 53.\n\nTo test real Android/iOS push notifications, use a Development Build (`npx expo run:android`).'
    );
    setNotificationsEnabledState(false);
    return;
  }

  if (enable) {
    try {
      const { status: currentStatus } = await Notifications.getPermissionsAsync();

      if (currentStatus === 'denied') {
        Alert.alert(
          'Notifications Off',
          'You have disabled notifications in system settings. Please enable them in settings first.',
          [
            { 
              text: 'Cancel', 
              style: 'cancel', 
              onPress: () => setNotificationsEnabledState(false) 
            },
            { 
              text: 'Go to Settings', 
              onPress: () => {
                Linking.openSettings();
                setNotificationsEnabledState(false);
              } 
            }
          ]
        );
        return;
      }

      let finalStatus: any = currentStatus;
      if (currentStatus === 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Notifications permission was not granted.');
        setNotificationsEnabledState(false);
        return;
      }

      setNotificationsEnabledState(true);
      await AsyncStorage.setItem('notifications_enabled', 'true');
      
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await sendTokenToBackend(token);
      }
      Alert.alert('Notifications Enabled', 'You will now receive push notification alerts.');
    } catch (err) {
      console.error('[Push] Error enabling notifications:', err);
      setNotificationsEnabledState(false);
    }
  } else {
    try {
      setNotificationsEnabledState(false);
      await AsyncStorage.setItem('notifications_enabled', 'false');
      Alert.alert('Notifications Disabled', 'Push notifications have been disabled.');
    } catch (err) {
      console.error('[Push] Error disabling notifications:', err);
    }
  }
}
