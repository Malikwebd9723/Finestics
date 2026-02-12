// utils/Toast.ts

import { ToastAndroid, Platform, Alert } from 'react-native';

/**
 * Cross-platform toast utility
 * Uses ToastAndroid on Android, Alert on iOS
 */
const Toast = {
  show: (message: string, duration: 'short' | 'long' = 'short') => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, duration === 'short' ? ToastAndroid.SHORT : ToastAndroid.LONG);
    } else {
      // iOS fallback
      Alert.alert('', message);
    }
  },

  success: (message: string) => {
    Toast.show(message, 'short');
  },

  error: (message: string) => {
    Toast.show(message, 'long');
  },

  info: (message: string) => {
    Toast.show(message, 'short');
  },
};

export default Toast;
