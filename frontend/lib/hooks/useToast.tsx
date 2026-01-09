import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastCounter = 0;
const subscribers = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback([...toasts]));
};

const addToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
  const id = `toast-${++toastCounter}-${Date.now()}`;
  const toast: Toast = { id, message, type, duration };

  toasts = [...toasts, toast];
  notifySubscribers();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
};

const removeToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  notifySubscribers();
};

export const toast = {
  success: (message: string, duration?: number) => addToast(message, 'success', duration),
  error: (message: string, duration?: number) => addToast(message, 'error', duration),
  info: (message: string, duration?: number) => addToast(message, 'info', duration),
  warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
  dismiss: (id: string) => removeToast(id),
};

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

  const subscribe = useCallback(() => {
    const callback = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, []);

  return { toasts: currentToasts, subscribe };
}
