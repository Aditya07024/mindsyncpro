/**
 * pushNotifications.ts — Expo Push Notification registration & listeners
 * Handles permission request, token retrieval, and foreground/background notification handling.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import API from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Show banner even when app is open
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowInForeground: true,
  }),
});

/**
 * Request push notification permissions and get the Expo push token.
 * Returns the token string or null if permissions denied / not a physical device.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Not a physical device — skipping push registration');
    return null;
  }

  try {
    // Check existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted for push notifications');
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    console.log('[Push] Registered Expo push token:', token);

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E6E65',
        sound: 'default',
      });
    }

    return token;
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
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[Push] Notification received in foreground:', notification.request.content.title);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on a notification (foreground or background)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('[Push] Notification tapped:', response.notification.request.content.title);
      onNotificationTapped?.(response);
    }
  );

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
