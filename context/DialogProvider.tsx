import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { registerDialogListener, DialogOptions } from 'utils/Dialog';

// Rendered via React Native's <Modal> so it always stacks above any other open
// modal (OrderDetailModal, PaymentModal, etc.). Paper's <Portal>-based approach
// didn't — Portal content lives inside the app's view tree, which sits below
// open RN modals.

interface DialogContextValue {
  show: (opts: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeContext();
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<DialogOptions | null>(null);

  const show = useCallback((next: DialogOptions) => {
    setOpts(next);
    setVisible(true);
  }, []);

  useEffect(() => registerDialogListener(show), [show]);

  const close = () => setVisible(false);

  const handleConfirm = () => {
    close();
    setTimeout(() => opts?.onConfirm?.(), 0);
  };

  const handleCancel = () => {
    close();
    setTimeout(() => opts?.onCancel?.(), 0);
  };

  const confirmColor = opts?.destructive ? colors.error : colors.primary;

  return (
    <DialogContext.Provider value={{ show }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancel}>
        <Pressable style={styles.backdrop} onPress={handleCancel}>
          {/* Stop propagation so taps inside the card don't close the dialog */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                shadowColor: '#000',
              },
            ]}>
            {opts?.title ? (
              <Text style={[styles.title, { color: colors.text }]}>{opts.title}</Text>
            ) : null}
            {opts?.message ? (
              <Text style={[styles.message, { color: colors.muted }]}>{opts.message}</Text>
            ) : null}
            <View style={styles.actions}>
              {!opts?.singleAction && (
                <TouchableOpacity
                  onPress={handleCancel}
                  activeOpacity={0.6}
                  style={styles.actionButton}>
                  <Text style={[styles.actionLabel, { color: colors.muted }]}>
                    {opts?.cancelText ?? 'Cancel'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.6}
                style={styles.actionButton}>
                <Text style={[styles.actionLabel, { color: confirmColor, fontWeight: '700' }]}>
                  {opts?.confirmText ?? 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
