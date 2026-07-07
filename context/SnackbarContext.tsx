// context/SnackbarContext.tsx
// Mounts the single global Snackbar and wires it to the Toast bus.
// There is exactly one feedback API in the app: `Toast` from utils/Toast.
import React, { useCallback, useEffect, useState } from 'react';
import Snackbar, { SnackbarType } from 'components/Snackbar';
import { registerToastListener } from 'utils/Toast';

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');

  const showSnackbar = useCallback((msg: string, t: SnackbarType = 'info') => {
    // Restart the toast when one is already showing so the new message animates in.
    setVisible(false);
    setTimeout(() => {
      setMessage(msg);
      setType(t);
      setVisible(true);
    }, 50);
  }, []);

  useEffect(() => registerToastListener(showSnackbar), [showSnackbar]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      {children}
      <Snackbar
        visible={visible}
        message={message}
        type={type}
        onDismiss={handleDismiss}
        duration={type === 'error' ? 4500 : 3000}
      />
    </>
  );
}
