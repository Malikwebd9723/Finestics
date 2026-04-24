// utils/Dialog.ts
// Imperative API that mirrors React Native's Alert.alert, but routes through the
// global DialogProvider so the UI uses a Material 3 dialog instead of the legacy
// native Alert (which looks dated on Android).

export interface DialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  singleAction?: boolean;
}

type DialogListener = (options: DialogOptions) => void;

let listener: DialogListener | null = null;

export function registerDialogListener(fn: DialogListener) {
  listener = fn;
  return () => {
    listener = null;
  };
}

const present = (options: DialogOptions) => {
  if (listener) {
    listener(options);
  }
};

const Dialog = {
  /** Single-button alert. Mirrors Alert.alert(title, message). */
  alert(title: string, message?: string, onPress?: () => void) {
    present({
      title,
      message,
      confirmText: 'OK',
      onConfirm: onPress,
      singleAction: true,
    });
  },

  /**
   * Two-button confirm. Returns immediately; the caller's onConfirm/onCancel fires
   * when the user taps a button.
   */
  confirm(
    title: string,
    message: string | undefined,
    options: {
      onConfirm: () => void;
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
    }
  ) {
    present({
      title,
      message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      destructive: options.destructive,
    });
  },

  /** Present raw options (for advanced cases). */
  present,
};

export default Dialog;
