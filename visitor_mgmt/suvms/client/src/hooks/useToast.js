import { useState, useCallback } from 'react';

/**
 * useToast — simple toast notification manager.
 * Returns { toasts, showToast, removeToast }
 * showToast(message, type='success'|'error'|'warning', duration=4000)
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return { toasts, showToast, removeToast };
}
