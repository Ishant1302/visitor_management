import { useState, useEffect, useCallback } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

let toastHandler: ((toast: ToastMessage) => void) | null = null;

export function registerToastHandler(handler: (toast: ToastMessage) => void) {
  toastHandler = handler;
}

export function toast(type: ToastMessage['type'], title: string, message?: string) {
  if (toastHandler) {
    toastHandler({ id: Date.now().toString(), type, title, message });
  }
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    registerToastHandler((t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 4000);
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, dismiss };
}
