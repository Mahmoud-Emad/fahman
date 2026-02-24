/**
 * ToastContext - Global toast/snackbar notification system
 * Provides a way to show toast messages from anywhere in the app
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Toast, ToastVariant, ToastPosition } from '@/components/ui';

interface ToastConfig {
  message: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

interface ToastContextType {
  /** Show a toast notification */
  showToast: (config: ToastConfig | string) => void;
  /** Show a success toast */
  success: (message: string, duration?: number) => void;
  /** Show an error toast */
  error: (message: string, duration?: number) => void;
  /** Show a warning toast */
  warning: (message: string, duration?: number) => void;
  /** Show an info toast */
  info: (message: string, duration?: number) => void;
  /** Hide the current toast */
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({
    message: '',
    variant: 'default',
    position: 'top',
    duration: 3000,
  });

  const showToast = useCallback((configOrMessage: ToastConfig | string) => {
    const newConfig: ToastConfig = typeof configOrMessage === 'string'
      ? { message: configOrMessage }
      : configOrMessage;

    setConfig({
      variant: 'default',
      position: 'top',
      duration: 3000,
      ...newConfig,
    });
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'error', duration: duration || 4000 });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'warning', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'info', duration });
  }, [showToast]);

  const contextValue = useMemo(
    () => ({
      showToast,
      success,
      error,
      warning,
      info,
      hideToast,
    }),
    [showToast, success, error, warning, info, hideToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={visible}
        message={config.message}
        variant={config.variant}
        position={config.position}
        duration={config.duration}
        onHide={hideToast}
        actionText={config.actionText}
        onAction={config.onAction}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
