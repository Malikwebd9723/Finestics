// context/NotificationContext.tsx
//
// Registers the device for Expo push after login, keeps the notifications query
// fresh when a push arrives in the foreground, and deep-links on notification tap.
//
// Push requires a development/EAS build — Expo Go (SDK 53+) cannot receive remote
// pushes, so registration failures are swallowed and the app falls back to the
// in-app notifications list + polling.

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from './AuthContext';
import { registerDeviceToken, unregisterDeviceToken } from 'api/actions/notificationActions';
import { navigateFromNotification } from 'navigation/navigationRef';
import { routeForNotification } from 'utils/notificationRouting';

// Expo Go on Android (SDK 53+) has no push native module — ANY
// expo-notifications call there console.errors a red "removed from Expo Go"
// box, even inside try/catch. Skip the module entirely in that environment;
// the in-app notifications list + polling still works.
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const pushSupported = !(isExpoGo && Platform.OS === 'android');

// Show pushes as banners while the app is foregrounded.
if (pushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

interface NotificationContextType {
  /** Deactivate this device's token server-side (call before logout). */
  unregisterCurrentToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tokenRef = useRef<string | null>(null);
  const roleRef = useRef(user?.role);
  roleRef.current = user?.role;

  // Register this device for push whenever a user is signed in.
  useEffect(() => {
    if (!pushSupported || !user?.id) return;

    let cancelled = false;

    const register = async () => {
      try {
        if (!Device.isDevice) return; // simulators can't receive push

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        const perms = await Notifications.getPermissionsAsync();
        let status = perms.status;
        if (status !== 'granted') {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== 'granted') return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          (Constants as any).easConfig?.projectId;

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (cancelled || !token) return;

        tokenRef.current = token;
        await registerDeviceToken(token, Platform.OS);
      } catch (err) {
        // Expected in Expo Go / when push isn't configured — app works without it.
        if (__DEV__) console.log('Push registration skipped:', (err as Error)?.message);
      }
    };

    register();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Foreground pushes refresh the in-app list/badge; taps deep-link.
  useEffect(() => {
    if (!pushSupported) return;

    const received = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-customer-orders'] });
    });

    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event.notification.request.content.data as any;
      const route = routeForNotification(data, roleRef.current);
      if (route) navigateFromNotification(route.name, route.params);
    });

    return () => {
      received.remove();
      response.remove();
    };
  }, [queryClient]);

  const unregisterCurrentToken = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      await unregisterDeviceToken(token);
    } catch {
      // best-effort
    }
    tokenRef.current = null;
  }, []);

  return (
    <NotificationContext.Provider value={{ unregisterCurrentToken }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
