// components/Snackbar.tsx
// The single global toast surface, mounted once by SnackbarProvider and fed
// through the `Toast` bus (utils/Toast). Anchored to the TOP of the screen.
//
// Deliberately NOT wrapped in an RN <Modal>: a modal window intercepts every
// touch in the app while visible — even `transparent` with pointerEvents
// "box-none" (that only lets taps through views INSIDE the modal window, they
// never reach the UI underneath). The old Modal wrapper froze the whole app
// for the toast's duration and ate Android back presses. The cost of the
// plain overlay: a toast fired while an RN Modal is open renders behind it.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from 'context/ThemeProvider';

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

const HIDDEN_Y = -140;

// Neutral surface + semantic icon. Only success/error carry color; the icon
// shape alone distinguishes warning/info so no off-palette accents are needed.
const ICONS: Record<SnackbarType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert',
  info: 'information',
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
  const { colors } = useThemeContext();
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  // Keep the overlay mounted while the exit animation runs. The parent's
  // `visible` flag drives the fade/slide; `mounted` drives unmounting after.
  const [mounted, setMounted] = useState(visible);

  const hide = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: HIDDEN_Y,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      after?.();
    });
  };

  useEffect(() => {
    if (visible) {
      drag.setValue(0);
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => hide(onDismiss), duration);
        return () => clearTimeout(timer);
      }
    } else {
      hide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = () => hide(onDismiss);

  // Swipe up to dismiss; taps on the action/close buttons still go through
  // because the responder only claims the gesture once it actually moves.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_evt, g) => {
        if (g.dy < 0) drag.setValue(g.dy);
      },
      onPanResponderRelease: (_evt, g) => {
        if (g.dy < -28 || g.vy < -0.6) {
          handleDismiss();
        } else {
          Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  const tint = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.text;

  // Absolutely-positioned overlay: only the toast card itself receives
  // touches; the rest of the screen stays fully interactive.
  return (
    <Animated.View
      pointerEvents="box-none"
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        right: 16,
        zIndex: 1000,
        transform: [{ translateY: Animated.add(translateY, drag) }],
        opacity,
      }}>
      <View
        pointerEvents="auto"
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 13,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
          elevation: 8,
        }}>
        <MaterialCommunityIcons name={ICONS[type]} size={21} color={tint} />
        <Text
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 19,
            marginLeft: 10,
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
            hitSlop={6}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 6,
            }}>
            <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>
              {action.label}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={handleDismiss} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
