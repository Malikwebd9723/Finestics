// context/SnackbarContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Snackbar, { SnackbarType } from 'components/Snackbar';
import { registerToastListener } from 'utils/Toast';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');

  const showSnackbar = useCallback((msg: string, t: SnackbarType = 'info') => {
    setVisible(false);
    setTimeout(() => {
      setMessage(msg);
      setType(t);
      setVisible(true);
    }, 50);
  }, []);

  // Register as the global Toast listener so Toast.success() etc. route through snackbar
  useEffect(() => {
    return registerToastListener((msg, t) => {
      showSnackbar(msg, t);
    });
  }, [showSnackbar]);

  const showSuccess = useCallback((msg: string) => showSnackbar(msg, 'success'), [showSnackbar]);
  const showError = useCallback((msg: string) => showSnackbar(msg, 'error'), [showSnackbar]);
  const showWarning = useCallback((msg: string) => showSnackbar(msg, 'warning'), [showSnackbar]);
  const showInfo = useCallback((msg: string) => showSnackbar(msg, 'info'), [showSnackbar]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Snackbar
        visible={visible}
        message={message}
        type={type}
        onDismiss={handleDismiss}
        duration={3000}
      />
    </SnackbarContext.Provider>
  );
}

export function useSnackbarContext() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbarContext must be used within a SnackbarProvider');
  }
  return context;
}
