"use client";

import { useEffect } from 'react';
import { useToast, type Toast as ToastType } from '@/lib/hooks/useToast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

const toastStyles = {
  success: {
    bg: 'bg-green-900/90 border-green-500/40',
    text: 'text-green-100',
    icon: CheckCircle,
    iconColor: 'text-green-400',
  },
  error: {
    bg: 'bg-red-900/90 border-red-500/40',
    text: 'text-red-100',
    icon: XCircle,
    iconColor: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-900/90 border-yellow-500/40',
    text: 'text-yellow-100',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-900/90 border-blue-500/40',
    text: 'text-blue-100',
    icon: Info,
    iconColor: 'text-blue-400',
  },
};

function ToastItem({ toast: toastItem }: { toast: ToastType }) {
  const style = toastStyles[toastItem.type];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border ${style.bg} px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out animate-in slide-in-from-top-5`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${style.text}`}>{toastItem.message}</p>
      <button
        onClick={() => toast.dismiss(toastItem.id)}
        className={`flex-shrink-0 rounded p-1 transition-colors hover:bg-white/10 ${style.text}`}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, subscribe } = useToast();

  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toastItem) => (
        <div key={toastItem.id} className="pointer-events-auto">
          <ToastItem toast={toastItem} />
        </div>
      ))}
    </div>
  );
}
