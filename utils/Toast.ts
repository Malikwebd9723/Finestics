// utils/Toast.ts
import { SnackbarType } from 'components/Snackbar';

type ToastListener = (message: string, type: SnackbarType) => void;

let listener: ToastListener | null = null;

/**
 * Register a listener for toast events (called by SnackbarProvider)
 */
export function registerToastListener(fn: ToastListener) {
  listener = fn;
  return () => {
    listener = null;
  };
}

/**
 * Cross-platform toast utility
 * Routes through global Snackbar when available
 */
const Toast = {
  show: (message: string, type: SnackbarType = 'info') => {
    if (listener) {
      listener(message, type);
    }
  },

  success: (message: string) => {
    Toast.show(message, 'success');
  },

  error: (message: string) => {
    Toast.show(message, 'error');
  },

  info: (message: string) => {
    Toast.show(message, 'info');
  },

  warning: (message: string) => {
    Toast.show(message, 'warning');
  },
};

export default Toast;
