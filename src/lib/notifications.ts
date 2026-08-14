import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Requires an EAS project (see app.json `extra.eas.projectId`, set via `eas init`)
// to obtain a real Expo push token. Without one, this no-ops rather than crash —
// the in-app/Realtime notification center still works either way.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('No EAS projectId configured — skipping push token registration. Run `eas init` to enable push.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (e) {
    console.warn('Failed to get Expo push token', e);
    return null;
  }
}

export async function syncPushToken(userId: string) {
  const token = await registerForPushNotificationsAsync();
  if (!token) return;
  await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
}
