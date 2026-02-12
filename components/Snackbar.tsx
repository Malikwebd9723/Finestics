// components/Snackbar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const getSnackbarConfig = (type: SnackbarType) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: '#10b981',
        icon: 'check-circle' as const,
      };
    case 'error':
      return {
        backgroundColor: '#ef4444',
        icon: 'error' as const,
      };
    case 'warning':
      return {
        backgroundColor: '#f59e0b',
        icon: 'warning' as const,
      };
    case 'info':
    default:
      return {
        backgroundColor: '#3b82f6',
        icon: 'info' as const,
      };
  }
};

export default function Snackbar({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  action,
}: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const config = getSnackbarConfig(type);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 16,
        right: 16,
        transform: [{ translateY }],
        opacity,
        zIndex: 9999,
      }}>
      <View
        style={{
          backgroundColor: config.backgroundColor,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
        <MaterialIcons name={config.icon} size={22} color="#fff" />
        <Text
          style={{
            flex: 1,
            color: '#fff',
            fontSize: 14,
            fontWeight: '500',
            marginLeft: 12,
            marginRight: 8,
          }}
          numberOfLines={3}>
          {message}
        </Text>
        {action && (
          <Pressable
            onPress={() => {
              action.onPress();
              handleDismiss();
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 6,
              marginRight: 8,
            }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
              {action.label}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={handleDismiss} hitSlop={8}>
          <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Hook for easy snackbar management
import { useState, useCallback } from 'react';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

export function useSnackbar() {
  const [state, setState] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    setState({ visible: true, message, type });
  }, []);

  const hideSnackbar = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showSnackbar(message, 'success');
  }, [showSnackbar]);

  const showError = useCallback((message: string) => {
    showSnackbar(message, 'error');
  }, [showSnackbar]);

  const showWarning = useCallback((message: string) => {
    showSnackbar(message, 'warning');
  }, [showSnackbar]);

  const showInfo = useCallback((message: string) => {
    showSnackbar(message, 'info');
  }, [showSnackbar]);

  return {
    ...state,
    showSnackbar,
    hideSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
